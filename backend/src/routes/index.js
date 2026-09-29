const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const auth = require('../controllers/authController');
const core = require('../controllers/coreController');
const modules = require('../controllers/modulesController');

const uploadDir = path.join(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 15 * 1024 * 1024 } });

const router = express.Router();

router.post('/auth/register', auth.registerPatient);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.me);
router.patch('/auth/preferences', authenticate, modules.updatePrefs);

router.get('/hospitals', core.listHospitals);
router.get('/hospitals/:id', core.getHospital);
router.post('/hospitals', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), core.upsertHospital);
router.put('/hospitals/:id', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), core.upsertHospital);
router.post('/hospitals/:id/status', authenticate, authorize('SUPER_ADMIN'), core.approveHospital);

router.get('/doctors', core.listDoctors);
router.get('/doctors/:doctorId/slots', authenticate, core.slots);
router.get('/departments', authenticate, modules.departments.list);
router.post('/departments', authenticate, authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN'), modules.departments.create);

router.get('/patients', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'), core.listPatients);
router.get('/patients/:id', authenticate, core.getPatient);
router.patch('/patients/:id', authenticate, modules.updatePatient);
router.post('/patients/walk-in', authenticate, authorize('RECEPTIONIST', 'HOSPITAL_ADMIN'), core.createWalkIn);
router.get('/patients/:patientId/timeline', authenticate, core.timeline);
router.get('/family', authenticate, authorize('PATIENT'), core.familyMembers.list);
router.post('/family', authenticate, authorize('PATIENT'), core.familyMembers.create);

router.get('/appointments', authenticate, core.listAppointments);
router.post('/appointments', authenticate, core.createAppointment);
router.patch('/appointments/:id', authenticate, core.updateAppointment);
router.post('/appointments/:id/queue', authenticate, core.joinQueue);

router.get('/queues/display/:hospitalId', core.displayQueue);
router.get('/queues/:doctorId', authenticate, core.getQueue);
router.post('/queues/:id/next', authenticate, authorize('DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'), core.advanceQueue);

router.post('/consultations/start/:appointmentId', authenticate, authorize('DOCTOR', 'NURSE'), core.startConsultation);
router.patch('/consultations/:id', authenticate, authorize('DOCTOR', 'NURSE'), core.updateConsultation);
router.post('/consultations/:id/ai-draft', authenticate, authorize('DOCTOR'), core.aiDraft);
router.post('/consultations/:id/approve', authenticate, authorize('DOCTOR'), core.approveConsultation);
router.post('/consultations/vitals/:appointmentId', authenticate, authorize('NURSE', 'DOCTOR'), modules.vitals);

router.get('/prescriptions', authenticate, modules.prescriptions);

router.get('/labs/tests', authenticate, modules.labs.catalog.list);
router.post('/labs/tests', authenticate, authorize('HOSPITAL_ADMIN', 'LAB_TECHNICIAN'), modules.labs.catalog.create);
router.get('/labs/orders', authenticate, modules.labs.orders.list);
router.post('/labs/orders', authenticate, authorize('DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST'), modules.labs.orders.create);
router.post('/labs/orders/:id/collect', authenticate, authorize('LAB_TECHNICIAN'), modules.labs.collect);
router.post('/labs/orders/:id/result', authenticate, authorize('LAB_TECHNICIAN'), modules.labs.enterResult);
router.post('/labs/orders/:id/approve', authenticate, authorize('DOCTOR', 'LAB_TECHNICIAN'), modules.labs.approve);
router.get('/labs/reports', authenticate, modules.labs.reports);
router.get('/labs/compare', authenticate, modules.labs.compare);

router.get('/pharmacy/medicines', authenticate, modules.pharmacy.medicines.list);
router.post('/pharmacy/medicines', authenticate, authorize('PHARMACIST', 'HOSPITAL_ADMIN'), modules.pharmacy.medicines.create);
router.get('/pharmacy/orders', authenticate, modules.pharmacy.orders.list);
router.post('/pharmacy/orders/:id/dispense', authenticate, authorize('PHARMACIST'), modules.pharmacy.dispense);

router.get('/billing/invoices', authenticate, modules.billing.invoices);
router.post('/billing/invoices/:id/pay', authenticate, modules.billing.pay);

router.get('/health-camps', modules.camps.list);
router.get('/health-camps/mine', authenticate, modules.camps.mine);
router.post('/health-camps', authenticate, authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN'), modules.camps.create);
router.post('/health-camps/:id/register', authenticate, modules.camps.register);

router.get('/beds', authenticate, modules.facility.beds.list);
router.post('/beds', authenticate, authorize('HOSPITAL_ADMIN'), modules.facility.beds.create);
router.patch('/beds/:id', authenticate, authorize('HOSPITAL_ADMIN', 'NURSE'), modules.facility.beds.update);
router.get('/wards', authenticate, modules.facility.wards.list);
router.post('/wards', authenticate, authorize('HOSPITAL_ADMIN'), modules.facility.wards.create);

router.get('/inventory', authenticate, modules.inventory.list);
router.post('/inventory', authenticate, authorize('HOSPITAL_ADMIN', 'PHARMACIST'), modules.inventory.create);

router.get('/notifications', authenticate, modules.notifications.list);
router.post('/notifications/:id/read', authenticate, modules.notifications.read);

router.get('/documents', authenticate, modules.documents.list);
router.post('/documents', authenticate, upload.single('file'), modules.documents.upload);

router.get('/referrals', authenticate, modules.referrals.list);
router.post('/referrals', authenticate, authorize('DOCTOR'), modules.referrals.create);

router.get('/feedback', authenticate, authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN', 'DOCTOR'), modules.feedback.list);
router.post('/feedback', authenticate, modules.feedback.create);

router.get('/announcements', authenticate, modules.announcements.list);
router.post('/announcements', authenticate, authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN'), modules.announcements.create);

router.get('/tickets', authenticate, authorize('SUPER_ADMIN'), modules.tickets.list);
router.post('/tickets', authenticate, modules.tickets.create);

router.get('/plans', authenticate, modules.plans.list);
router.post('/plans', authenticate, authorize('SUPER_ADMIN'), modules.plans.create);
router.patch('/plans/:id', authenticate, authorize('SUPER_ADMIN'), modules.plans.update);

router.get('/second-opinions', authenticate, modules.secondOpinion.list);
router.post('/second-opinions', authenticate, authorize('PATIENT'), modules.secondOpinion.create);

router.get('/staff', authenticate, authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN'), modules.staff.list);
router.post('/staff', authenticate, authorize('HOSPITAL_ADMIN'), modules.staff.create);
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), modules.users);

router.get('/analytics/hospital', authenticate, authorize('HOSPITAL_ADMIN', 'SUPER_ADMIN'), core.analyticsHospital);
router.get('/analytics/platform', authenticate, authorize('SUPER_ADMIN'), core.analyticsPlatform);
router.get('/analytics/doctor', authenticate, authorize('DOCTOR'), core.analyticsDoctor);

router.get('/search', authenticate, core.search);
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), modules.auditLogs);
router.get('/emergency/:healthId', modules.emergencyCard);
router.get('/health-id/:patientId?', authenticate, modules.healthIdCard);

module.exports = router;
