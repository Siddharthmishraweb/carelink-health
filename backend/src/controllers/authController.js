const { body } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const { signToken } = require('../utils/tokens');
const { generateHealthId } = require('../utils/healthId');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');

const registerValidators = [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').trim().notEmpty(),
  body('password').isLength({ min: 8 }),
];

const registerPatient = [
  ...registerValidators,
  validate,
  asyncHandler(async (req, res) => {
    const exists = await User.findOne({ email: req.body.email.toLowerCase() });
    if (exists) throw new ApiError(409, 'An account with this email already exists');
    const passwordHash = await User.hashPassword(req.body.password);
    const user = await User.create({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      phone: req.body.phone,
      passwordHash,
      role: 'PATIENT',
    });
    const patient = await Patient.create({
      userId: user._id,
      healthId: generateHealthId(),
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      bloodGroup: req.body.bloodGroup,
      address: req.body.address,
      emergencyContact: req.body.emergencyContact,
      medical: { allergies: [], conditions: [], currentMedications: [], immunizations: [] },
    });
    const token = signToken({ id: user._id, role: user.role });
    res.status(201).json({ success: true, token, user: sanitize(user), patient });
  }),
];

const login = [
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user || !(await user.comparePassword(req.body.password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    if (user.status !== 'active') throw new ApiError(403, 'Account is not active');
    user.lastLoginAt = new Date();
    await user.save();

    const extras = {};
    if (user.role === 'PATIENT') extras.patient = await Patient.findOne({ userId: user._id });
    if (user.role === 'DOCTOR') extras.doctor = await Doctor.findOne({ userId: user._id }).populate('departmentId');
    if (['RECEPTIONIST', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      extras.staff = await Staff.findOne({ userId: user._id });
    }

    const token = signToken({ id: user._id, role: user.role, hospitalId: user.hospitalId });
    res.json({ success: true, token, user: sanitize(user), ...extras });
  }),
];

const me = asyncHandler(async (req, res) => {
  const extras = {};
  if (req.user.role === 'PATIENT') extras.patient = await Patient.findOne({ userId: req.user._id });
  if (req.user.role === 'DOCTOR') extras.doctor = await Doctor.findOne({ userId: req.user._id }).populate('departmentId');
  res.json({ success: true, user: req.user, ...extras });
});

function sanitize(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
}

module.exports = { registerPatient, login, me };
