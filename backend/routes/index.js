const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { register, login } = require('../controllers/authController');
const { getDoctor, updateDoctor } = require('../controllers/doctorController');
const {
  createAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  deleteAppointment
} = require('../controllers/appointmentController');
const { createConsultation, getConsultationById } = require('../controllers/consultationController');
const { createReview, getReviewsByDoctor } = require('../controllers/reviewController');
const { uploadImage, getImagesByDoctor } = require('../controllers/imageController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({ storage });

router.post('/register', register);
router.post('/login', login);

router.get('/doctor', getDoctor);
router.put('/doctor/update', auth, requireRole('doctor', 'admin'), updateDoctor);

router.post('/appointments', auth, createAppointment);
router.get('/appointments/user', auth, getUserAppointments);
router.put('/appointments/status', auth, requireRole('doctor', 'admin'), updateAppointmentStatus);
router.delete('/appointments', auth, deleteAppointment);

router.post('/consultation', auth, requireRole('doctor', 'admin'), createConsultation);
router.get('/consultation/:id', auth, getConsultationById);

router.post('/reviews', auth, createReview);
router.get('/reviews/:doctorId', getReviewsByDoctor);

router.post('/upload', auth, requireRole('doctor', 'admin'), upload.single('image'), uploadImage);
router.get('/images/:doctorId', getImagesByDoctor);

module.exports = router;
