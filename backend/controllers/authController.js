const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDb, writeDb } = require('../utils/db');

function issueToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret-key', {
    expiresIn: '7d'
  });
}

async function register(req, res) {
  const { name, email, password, phone, role = 'patient' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const db = await readDb();
  if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: passwordHash,
    role: role === 'admin' || role === 'doctor' ? role : 'patient',
    phone: phone || ''
  };

  db.users.push(user);
  await writeDb(db);

  const token = issueToken(user);
  return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const db = await readDb();
  const user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = issueToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

module.exports = { register, login };
