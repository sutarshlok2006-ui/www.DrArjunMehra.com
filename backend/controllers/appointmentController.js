const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

async function createAppointment(req, res) {
  const { date, time, type } = req.body;
  if (!date || !time || !type) {
    return res.status(400).json({ message: 'date, time and type are required' });
  }

  const db = await readDb();
  const appointment = {
    id: uuidv4(),
    patient_id: req.user.id,
    doctor_id: db.doctorProfile.id,
    date,
    time,
    type,
    status: 'pending'
  };

  db.appointments.push(appointment);
  await writeDb(db);
  return res.status(201).json(appointment);
}

async function getUserAppointments(req, res) {
  const db = await readDb();
  const appointments = req.user.role === 'doctor' || req.user.role === 'admin'
    ? db.appointments
    : db.appointments.filter((item) => item.patient_id === req.user.id);

  return res.json(appointments);
}

async function updateAppointmentStatus(req, res) {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ message: 'id and status are required' });
  }

  const db = await readDb();
  const appointment = db.appointments.find((item) => item.id === id);
  if (!appointment) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  appointment.status = status;
  await writeDb(db);
  return res.json(appointment);
}

async function deleteAppointment(req, res) {
  const { id } = req.body;
  const db = await readDb();
  const before = db.appointments.length;
  db.appointments = db.appointments.filter((item) => item.id !== id);

  if (db.appointments.length === before) {
    return res.status(404).json({ message: 'Appointment not found' });
  }

  await writeDb(db);
  return res.json({ message: 'Appointment deleted' });
}

module.exports = {
  createAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  deleteAppointment
};
