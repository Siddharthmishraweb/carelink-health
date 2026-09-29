const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { generateTokenNumber } = require('../utils/healthId');
const { getRedis } = require('../config/redis');

const PRIORITY_WEIGHTS = {
  emergency: 100,
  pregnant: 50,
  disabled: 45,
  senior: 40,
  child: 35,
  scheduled: 20,
  normal: 10,
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function sortItems(items, policies = {}) {
  const weights = { ...PRIORITY_WEIGHTS, ...policies };
  return [...items].sort((a, b) => {
    const wa = weights[a.priority] || 0;
    const wb = weights[b.priority] || 0;
    if (wb !== wa) return wb - wa;
    return new Date(a.arrivedAt || 0) - new Date(b.arrivedAt || 0);
  });
}

function estimateWait(items, currentToken, avgMinutes) {
  const waiting = items.filter((item) => item.status === 'waiting');
  const ahead = waiting.findIndex((item) => item.token === currentToken);
  const position = ahead === -1 ? waiting.length : ahead;
  return {
    patientsAhead: Math.max(position, 0),
    estimatedWaitMinutes: Math.max(position, 0) * (avgMinutes || 12),
  };
}

async function getOrCreateQueue({ hospitalId, doctorId, departmentId, roomNumber, date }) {
  const key = date || todayKey();
  let queue = await Queue.findOne({ hospitalId, doctorId, date: key });
  if (!queue) {
    const doctor = await Doctor.findById(doctorId);
    queue = await Queue.create({
      hospitalId,
      doctorId,
      departmentId: departmentId || doctor?.departmentId,
      date: key,
      roomNumber: roomNumber || doctor?.roomNumber,
      avgMinutes: doctor?.avgConsultationMinutes || 12,
      items: [],
    });
  }
  return queue;
}

async function enqueueAppointment(appointment, priority = 'scheduled') {
  const hospital = await Hospital.findById(appointment.hospitalId);
  const queue = await getOrCreateQueue({
    hospitalId: appointment.hospitalId,
    doctorId: appointment.doctorId,
    departmentId: appointment.departmentId,
    roomNumber: appointment.roomNumber,
  });

  const existing = queue.items.find((item) => String(item.appointmentId) === String(appointment._id));
  if (existing) return { queue, item: existing };

  const prefix = (appointment.token && appointment.token.split('-')[0]) || 'A';
  const sequence = queue.items.length + 1;
  const token = appointment.token || generateTokenNumber(prefix, sequence);
  const item = {
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    token,
    priority,
    status: 'waiting',
    arrivedAt: new Date(),
  };
  queue.items.push(item);
  const policies = hospital?.settings?.queuePolicies || {};
  queue.items = sortItems(queue.items, policies);
  if (!queue.currentToken && queue.items.length) {
    queue.currentToken = queue.items[0].token;
    queue.nextToken = queue.items[1]?.token;
  }
  await queue.save();

  appointment.token = token;
  appointment.status = 'in_queue';
  await appointment.save();

  await cacheQueue(queue);
  return { queue, item: queue.items.find((row) => row.token === token) };
}

async function cacheQueue(queue) {
  const redis = getRedis();
  const payload = JSON.stringify({
    currentToken: queue.currentToken,
    nextToken: queue.nextToken,
    doctorStatus: queue.doctorStatus,
    roomNumber: queue.roomNumber,
    waiting: queue.items.filter((item) => item.status === 'waiting').length,
  });
  await redis.set(`queue:${queue._id}`, payload, 'EX', 120);
}

function decorateQueue(queue, patientToken) {
  const waiting = queue.items.filter((item) => ['waiting', 'called'].includes(item.status));
  const serving = queue.items.find((item) => item.status === 'serving');
  const mine = queue.items.find((item) => item.token === patientToken);
  const ahead = mine
    ? waiting.findIndex((item) => String(item._id) === String(mine._id))
    : waiting.length;
  return {
    queue,
    currentToken: serving?.token || queue.currentToken,
    nextToken: queue.nextToken,
    patientsAhead: Math.max(ahead, 0),
    estimatedWaitMinutes: Math.max(ahead, 0) * (queue.avgMinutes || 12),
    roomNumber: queue.roomNumber,
    doctorStatus: queue.doctorStatus,
    waitingCount: waiting.length,
  };
}

async function callNext(queueId) {
  const queue = await Queue.findById(queueId);
  if (!queue) return null;
  const current = queue.items.find((item) => item.status === 'serving');
  if (current) {
    current.status = 'completed';
    current.completedAt = new Date();
  }
  const next = queue.items.find((item) => item.status === 'waiting' || item.status === 'called');
  if (next) {
    next.status = 'serving';
    next.startedAt = new Date();
    queue.currentToken = next.token;
    queue.servingItemId = next._id;
    const upcoming = queue.items.find((item) => item.status === 'waiting' && item.token !== next.token);
    queue.nextToken = upcoming?.token;
    if (next.appointmentId) {
      await Appointment.findByIdAndUpdate(next.appointmentId, { status: 'in_consult' });
    }
  }
  await queue.save();
  await cacheQueue(queue);
  return queue;
}

async function updateItemStatus(queueId, itemId, status) {
  const queue = await Queue.findById(queueId);
  if (!queue) return null;
  const item = queue.items.id(itemId);
  if (!item) return null;
  item.status = status;
  if (status === 'called') item.calledAt = new Date();
  if (status === 'no_show' && item.appointmentId) {
    await Appointment.findByIdAndUpdate(item.appointmentId, { status: 'no_show' });
  }
  await queue.save();
  await cacheQueue(queue);
  return queue;
}

module.exports = {
  todayKey,
  estimateWait,
  getOrCreateQueue,
  enqueueAppointment,
  decorateQueue,
  callNext,
  updateItemStatus,
  sortItems,
};
