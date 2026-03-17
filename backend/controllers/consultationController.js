const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

async function createConsultation(req, res) {
  const { appointment_id, meeting_link, notes } = req.body;
  if (!appointment_id || !meeting_link) {
    return res.status(400).json({ message: 'appointment_id and meeting_link are required' });
  }

  const db = await readDb();
  const appointment = db.appointments.find((item) => item.id === appointment_id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  const consultation = {
    id: uuidv4(),
    appointment_id,
    meeting_link,
    notes: notes || '',
    status: 'scheduled'
  };

  db.consultations.push(consultation);
  await writeDb(db);
  return res.status(201).json(consultation);
}

async function getConsultationById(req, res) {
  const db = await readDb();
  const consultation = db.consultations.find((item) => item.id === req.params.id);
  if (!consultation) {
    return res.status(404).json({ message: 'Consultation not found' });
  }

  return res.json(consultation);
}

module.exports = { createConsultation, getConsultationById };
