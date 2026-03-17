const API_BASE = '/api';
let authToken = localStorage.getItem('token') || '';

const messageEl = document.getElementById('message');
const showMessage = (text) => {
  messageEl.textContent = text;
  messageEl.style.display = 'block';
  setTimeout(() => (messageEl.style.display = 'none'), 2200);
};

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function loadReviews() {
  const reviews = await request('/reviews/d-001?limit=6');
  const reviewsList = document.getElementById('reviewsList');
  reviewsList.innerHTML = reviews.data.map((item) => `<article><strong>${'★'.repeat(item.rating)}</strong><p>${item.comment}</p></article>`).join('');
}

async function loadImages() {
  const images = await request('/images/d-001');
  const gallery = document.getElementById('galleryList');
  gallery.innerHTML = images.map((img) => `<article><img src="${img.image_url}" alt="${img.description}" style="width:100%;border-radius:8px"><p>${img.description}</p></article>`).join('');
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  try {
    const payload = Object.fromEntries(form.entries());
    const data = await request('/register', { method: 'POST', body: JSON.stringify(payload) });
    authToken = data.token;
    localStorage.setItem('token', authToken);
    showMessage('Registered successfully');
  } catch (error) { showMessage(error.message); }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  try {
    const data = await request('/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(form.entries())) });
    authToken = data.token;
    localStorage.setItem('token', authToken);
    showMessage(`Welcome ${data.user.name}`);
  } catch (error) { showMessage(error.message); }
});

document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await request('/appointments', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) });
    showMessage('Appointment booked');
  } catch (error) { showMessage(error.message); }
});

document.getElementById('consultationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await request('/consultation', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) });
    showMessage('Consultation created');
  } catch (error) { showMessage(error.message); }
});

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await request('/reviews', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) });
    showMessage('Review added');
    loadReviews();
  } catch (error) { showMessage(error.message); }
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await request('/upload', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target).entries())) });
    showMessage('Image uploaded');
    loadImages();
  } catch (error) { showMessage(error.message); }
});

loadReviews().catch((err) => showMessage(err.message));
loadImages().catch((err) => showMessage(err.message));
