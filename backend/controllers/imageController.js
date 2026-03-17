const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

async function uploadImage(req, res) {
  const { doctor_id, description } = req.body;
  if (!doctor_id || !req.file) {
    return res.status(400).json({ message: 'doctor_id and image file are required' });
  }

  const db = await readDb();
  const image = {
    id: uuidv4(),
    doctor_id,
    image_url: `/uploads/${path.basename(req.file.path)}`,
    description: description || ''
  };

  db.images.push(image);
  await writeDb(db);
  return res.status(201).json(image);
}

async function getImagesByDoctor(req, res) {
  const db = await readDb();
  return res.json(db.images.filter((item) => item.doctor_id === req.params.doctorId));
}

module.exports = { uploadImage, getImagesByDoctor };
