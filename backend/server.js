const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const dbPath = path.join(__dirname, 'data', 'db.json');
const publicDir = path.join(__dirname, '..', 'dr website file');

const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
const makeToken = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
};
const verifyToken = (token) => {
  const [body, signature] = (token || '').split('.');
  if (!body || !signature || sign(body) !== signature) return null;
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
};
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};
const comparePassword = (password, stored) => {
  const [salt] = stored.split(':');
  return hashPassword(password, salt) === stored;
};

const readDb = async () => JSON.parse(await fsp.readFile(dbPath, 'utf8'));
const writeDb = async (db) => fsp.writeFile(dbPath, JSON.stringify(db, null, 2));

const send = (res, code, data, headers = {}) => {
  res.writeHead(code, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(data));
};

const parseBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => resolve(body ? JSON.parse(body) : {}));
});

const getAuthUser = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return verifyToken(token);
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    if (pathname.startsWith('/api/')) {
      const db = await readDb();

      if (pathname === '/api/register' && req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.email || !body.password) return send(res, 400, { message: 'name, email and password are required' });
        if (db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase())) return send(res, 409, { message: 'Email already exists' });
        const user = { id: crypto.randomUUID(), name: body.name, email: body.email, password: hashPassword(body.password), role: 'patient', phone: body.phone || '' };
        db.users.push(user); await writeDb(db);
        return send(res, 201, { token: makeToken({ id: user.id, role: user.role, email: user.email }), user: { id: user.id, name: user.name, role: user.role } });
      }

      if (pathname === '/api/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const user = db.users.find((u) => u.email.toLowerCase() === String(body.email).toLowerCase());
        if (!user || !comparePassword(body.password || '', user.password)) return send(res, 401, { message: 'Invalid credentials' });
        return send(res, 200, { token: makeToken({ id: user.id, role: user.role, email: user.email }), user: { id: user.id, name: user.name, role: user.role } });
      }

      if (pathname === '/api/doctor' && req.method === 'GET') return send(res, 200, db.doctorProfile);
      if (pathname === '/api/doctor/update' && req.method === 'PUT') {
        const user = getAuthUser(req); if (!user || !['doctor', 'admin'].includes(user.role)) return send(res, 403, { message: 'Forbidden' });
        db.doctorProfile = { ...db.doctorProfile, ...(await parseBody(req)) }; await writeDb(db); return send(res, 200, db.doctorProfile);
      }

      if (pathname === '/api/appointments' && req.method === 'POST') {
        const user = getAuthUser(req); if (!user) return send(res, 401, { message: 'Unauthorized' });
        const body = await parseBody(req); if (!body.date || !body.time || !body.type) return send(res, 400, { message: 'date, time, type required' });
        const appointment = { id: crypto.randomUUID(), patient_id: user.id, doctor_id: db.doctorProfile.id, date: body.date, time: body.time, type: body.type, status: 'pending' };
        db.appointments.push(appointment); await writeDb(db); return send(res, 201, appointment);
      }
      if (pathname === '/api/appointments/user' && req.method === 'GET') {
        const user = getAuthUser(req); if (!user) return send(res, 401, { message: 'Unauthorized' });
        const rows = ['doctor', 'admin'].includes(user.role) ? db.appointments : db.appointments.filter((a) => a.patient_id === user.id);
        return send(res, 200, rows);
      }
      if (pathname === '/api/appointments/status' && req.method === 'PUT') {
        const user = getAuthUser(req); if (!user || !['doctor', 'admin'].includes(user.role)) return send(res, 403, { message: 'Forbidden' });
        const body = await parseBody(req); const row = db.appointments.find((a) => a.id === body.id); if (!row) return send(res, 404, { message: 'Appointment not found' });
        row.status = body.status; await writeDb(db); return send(res, 200, row);
      }
      if (pathname === '/api/appointments' && req.method === 'DELETE') {
        const user = getAuthUser(req); if (!user) return send(res, 401, { message: 'Unauthorized' });
        const body = await parseBody(req); db.appointments = db.appointments.filter((a) => a.id !== body.id); await writeDb(db); return send(res, 200, { message: 'Appointment deleted' });
      }

      if (pathname === '/api/consultation' && req.method === 'POST') {
        const user = getAuthUser(req); if (!user || !['doctor', 'admin'].includes(user.role)) return send(res, 403, { message: 'Forbidden' });
        const body = await parseBody(req);
        const consultation = { id: crypto.randomUUID(), appointment_id: body.appointment_id, meeting_link: body.meeting_link, notes: body.notes || '', status: 'scheduled' };
        db.consultations.push(consultation); await writeDb(db); return send(res, 201, consultation);
      }
      if (pathname.startsWith('/api/consultation/') && req.method === 'GET') {
        const user = getAuthUser(req); if (!user) return send(res, 401, { message: 'Unauthorized' });
        const id = pathname.split('/').pop(); const row = db.consultations.find((c) => c.id === id); return row ? send(res, 200, row) : send(res, 404, { message: 'Consultation not found' });
      }

      if (pathname === '/api/reviews' && req.method === 'POST') {
        const user = getAuthUser(req); if (!user) return send(res, 401, { message: 'Unauthorized' });
        const body = await parseBody(req); const review = { id: crypto.randomUUID(), patient_id: user.id, doctor_id: body.doctor_id, rating: Number(body.rating), comment: body.comment, createdAt: new Date().toISOString() };
        db.reviews.push(review); await writeDb(db); return send(res, 201, review);
      }
      if (pathname.startsWith('/api/reviews/') && req.method === 'GET') {
        const doctorId = pathname.split('/').pop();
        const page = Number(url.searchParams.get('page') || 1); const limit = Number(url.searchParams.get('limit') || 6);
        const all = db.reviews.filter((r) => r.doctor_id === doctorId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return send(res, 200, { total: all.length, page, limit, data: all.slice((page - 1) * limit, page * limit) });
      }

      if (pathname === '/api/upload' && req.method === 'POST') {
        const user = getAuthUser(req); if (!user || !['doctor', 'admin'].includes(user.role)) return send(res, 403, { message: 'Forbidden' });
        const body = await parseBody(req);
        if (!/^https?:\/\//.test(body.image_url || '')) return send(res, 400, { message: 'Provide valid image_url' });
        const image = { id: crypto.randomUUID(), doctor_id: body.doctor_id, image_url: body.image_url, description: body.description || '' };
        db.images.push(image); await writeDb(db); return send(res, 201, image);
      }
      if (pathname.startsWith('/api/images/') && req.method === 'GET') {
        const doctorId = pathname.split('/').pop();
        return send(res, 200, db.images.filter((i) => i.doctor_id === doctorId));
      }

      return send(res, 404, { message: 'Not found' });
    }

    const filePath = pathname === '/' ? path.join(publicDir, 'index.html') : path.join(publicDir, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res); return;
    }
    const fallback = path.join(publicDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(fallback).pipe(res);
  } catch (error) {
    send(res, 500, { message: 'Server error', error: error.message });
  }
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
