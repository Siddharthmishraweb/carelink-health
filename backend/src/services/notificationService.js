const { Notification } = require('../models/Supporting');

async function notify({ hospitalId, userId, patientId, category, title, body, metadata }) {
  const doc = await Notification.create({
    hospitalId,
    userId,
    patientId,
    category,
    title,
    body,
    channel: 'in-app',
    metadata,
  });
  return doc;
}

async function notifyMany(items) {
  if (!items.length) return [];
  return Notification.insertMany(items);
}

module.exports = { notify, notifyMany };
