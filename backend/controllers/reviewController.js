const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

async function createReview(req, res) {
  const { doctor_id, rating, comment } = req.body;
  if (!doctor_id || !rating || !comment) {
    return res.status(400).json({ message: 'doctor_id, rating and comment are required' });
  }

  const db = await readDb();
  const review = {
    id: uuidv4(),
    patient_id: req.user.id,
    doctor_id,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  db.reviews.push(review);
  await writeDb(db);
  return res.status(201).json(review);
}

async function getReviewsByDoctor(req, res) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 6);
  const db = await readDb();

  const allReviews = db.reviews.filter((item) => item.doctor_id === req.params.doctorId).sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const start = (page - 1) * limit;
  const data = allReviews.slice(start, start + limit);
  return res.json({
    total: allReviews.length,
    page,
    limit,
    data
  });
}

module.exports = { createReview, getReviewsByDoctor };
