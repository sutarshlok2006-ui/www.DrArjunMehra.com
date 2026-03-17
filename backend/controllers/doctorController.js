const { readDb, writeDb } = require('../utils/db');

async function getDoctor(req, res) {
  const db = await readDb();
  return res.json(db.doctorProfile);
}

async function updateDoctor(req, res) {
  const db = await readDb();
  db.doctorProfile = { ...db.doctorProfile, ...req.body };
  await writeDb(db);
  return res.json(db.doctorProfile);
}

module.exports = { getDoctor, updateDoctor };
