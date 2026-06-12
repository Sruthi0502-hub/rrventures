// ==========================================
// RRVENTURES ADMIN DASHBOARD - BACKEND INTEGRATION
// ==========================================

const API_BASE_URL = 'https://dashboard-management-u6vj.onrender.com';

const storageKeys = {
  token: 'token',
  user: 'user'
};

// Backend data storage
let servicesData = [];
let adsData = [];

// ==========================================
// CORE HELPER FUNCTIONS (No Duplicates)
// ==========================================
function safeParseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function clearStatusMessage(statusElement) {
  if (statusElement) {
    statusElement.style.display = 'none';
    statusElement.textContent = '';
  }
}

function setStatusMessage(statusElement, message) {
  if (statusElement) {
    statusElement.style.display = 'block';
    statusElement.style.color = '#ef4444';
    statusElement.textContent = message;
  }
}

function getToken() {
  const token = localStorage.getItem(storageKeys.token);
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
}

function setToken(token) {
  localStorage.setItem(storageKeys.token, token);
}

function clearToken() {
  localStorage.removeItem(storageKeys.token);
  localStorage.removeItem(storageKeys.user);
  window.location.replace('index.html');
}

function isAuthenticated() {
  return Boolean(getToken());
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem(storageKeys.user);
    if (!userStr || userStr === 'undefined' || userStr === 'null') return {};
    return JSON.parse(userStr);
  } catch {
    return {};
  }
}

function decodeJWT(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const payload = atob(padded);
    return JSON.parse(payload);
  } catch (e) {
    console.error('JWT decode failed', e);
    return null;
  }
}

// ==========================================
// API FETCH WRAPPER
// ==========================================
async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = Boolean(options.isFormData) || options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    let bodyPreview = '';
    if (isFormData) {
      bodyPreview = '[FormData]';
    } else if (options.body) {
      bodyPreview = typeof options.body === 'string' ? safeParseJSON(options.body, options.body) : options.body;
    }

    console.log(`[API] ${options.method || 'GET'} ${API_BASE_URL}${path}`, bodyPreview);

    const fetchOptions = { ...options, headers };

    if (!isFormData && fetchOptions.body && typeof fetchOptions.body !== 'string') {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
    const payload = await response.json().catch(() => ({}));

    console.log(`[API RESPONSE] Status: ${response.status}`, payload);

    if (!response.ok) {
      const errorMsg = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message || response.statusText || `Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    return payload;
  } catch (error) {
    console.error('[API ERROR]', error.message);
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================
async function loginUser(payload) {
  try {
    console.log('[LOGIN] Attempting login with email:', payload.email);
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: payload
    });

    if (response && response.access_token) {
      const token = response.access_token;
      setToken(token);

      if (response.user) {
        localStorage.setItem(storageKeys.user, JSON.stringify(response.user));
        console.log(`[LOGIN SUCCESS] User Role from Response: ${response.user.role}`);
      } else {
        const decoded = decodeJWT(token);
        if (decoded) {
          const userData = {
            userId: decoded.sub,
            email: decoded.email,
            role: decoded.role, // Yahan backend se 'admin' ya 'super-admin' milega
            name: decoded.name || 'RRventures Admin'
          };
          localStorage.setItem(storageKeys.user, JSON.stringify(userData));
          console.log(`[LOGIN SUCCESS] User Role from JWT: ${decoded.role}`);
        }
      }
    }
    return response;
  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);
    throw error;
  }
}

async function signupUser(payload) {
  try {
    console.log('[SIGNUP] Attempting signup with email:', payload.email);
    const response = await apiFetch('/auth/create-super-admin', {
      method: 'POST',
      body: payload
    });

    if (response && response.access_token) {
      const token = response.access_token;
      setToken(token);
      if (response.user) {
        localStorage.setItem(storageKeys.user, JSON.stringify(response.user));
      } else {
        const user = decodeJWT(token);
        localStorage.setItem(storageKeys.user, JSON.stringify(user));
      }
    } else {
      return await loginUser({ email: payload.email, password: payload.password });
    }
    return response;
  } catch (error) {
    console.error('[SIGNUP ERROR]', error.message);
    throw error;
  }
}

function showNotification(message, type = 'success') {
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }

  notification.className = `notification active notification-${type}`;
  notification.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i><span>${message}</span>`;
  if (window.lucide) lucide.replace({ width: 18, height: 18 });

  window.clearTimeout(notification.dismissTimeout);
  notification.dismissTimeout = window.setTimeout(() => {
    notification.classList.remove('active');
  }, 4000);
}

// ==========================================
// SUB-ADMIN MANAGEMENT LOGIC
// ==========================================
async function createSubAdmin(payload) {
  try {
    return await apiFetch('/admins/create-admin', {
      method: 'POST',
      body: payload
    });
  } catch (error) {
    console.error('[CREATE ADMIN ERROR]', error.message);
    throw error;
  }
}

function initAdminManagement() {
  const adminTab = document.getElementById('manageAdminsTab');
  const modal = document.getElementById('adminModal');
  const closeModal = document.getElementById('closeAdminModal');
  const adminForm = document.getElementById('newAdminForm');
  const status = document.getElementById('adminStatus');

  adminTab?.addEventListener('click', (e) => {
    e.preventDefault();
    clearStatusMessage(status);
    adminForm?.reset();

    if (modal) {
      modal.style.setProperty('display', 'flex', 'important');
      modal.classList.add('active');
    }
  });

  closeModal?.addEventListener('click', () => {
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  });

  adminForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatusMessage(status);

    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const submitButton = adminForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account…';
    }

    try {
      await createSubAdmin({ name, email, password, role: 'admin' });
      showNotification('New Admin created successfully!');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
      adminForm.reset();
    } catch (error) {
      setStatusMessage(status, error.message || 'Failed to create admin.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Admin Account';
      }
    }
  });
}

// ==========================================
// PROPERTIES API FUNCTIONS
// ==========================================
async function fetchServices() {
  try {
    console.log('[PROPERTIES] Fetching admin properties');
    return await apiFetch('/properties/admin-property', { method: 'GET' });
  } catch (error) {
    console.error('[PROPERTIES FETCH ERROR]', error.message);
    return [];
  }
}

async function createProperty(formData) {
  try {
    return await apiFetch('/properties/create-properties', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  } catch (error) {
    console.error('[PROPERTIES CREATE ERROR]', error.message);
    throw error;
  }
}

async function updateProperty(id, formData) {
  try {
    return await apiFetch(`/properties/${id}`, {
      method: 'PATCH',
      body: formData,
      isFormData: true,
    });
  } catch (error) {
    console.error('[PROPERTIES UPDATE ERROR]', error.message);
    throw error;
  }
}

async function deleteProperty(id) {
  try {
    return await apiFetch(`/properties/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('[PROPERTIES DELETE ERROR]', error.message);
    throw error;
  }
}

// ==========================================
// ADS API FUNCTIONS
// ==========================================
async function fetchAds() {
  try {
    return await apiFetch('/ads', { method: 'GET' });
  } catch (error) {
    console.error('[ADS FETCH ERROR]', error.message);
    return { data: [] };
  }
}

async function createAd(payload) {
  try {
    return await apiFetch('/properties/create-properties', { method: 'POST', body: payload });
  } catch (error) {
    console.error('[ADS CREATE ERROR]', error.message);
    throw error;
  }
}

async function updateAd(id, payload) {
  try {
    return await apiFetch(`/ads/${id}`, { method: 'PUT', body: payload });
  } catch (error) {
    console.error('[ADS UPDATE ERROR]', error.message);
    throw error;
  }
}

async function deleteAd(id) {
  try {
    return await apiFetch(`/ads/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('[ADS DELETE ERROR]', error.message);
    throw error;
  }
}

// ==========================================
// CUSTOMIZATION API FUNCTIONS
// ==========================================
async function fetchCustomization() {
  try {
    return await apiFetch('/customization', { method: 'GET' });
  } catch (error) {
    console.error('[CUSTOMIZATION FETCH ERROR]', error.message);
    return {};
  }
}

async function saveCustomization(payload) {
  try {
    return await apiFetch('/customization', { method: 'PUT', body: payload });
  } catch (error) {
    console.error('[CUSTOMIZATION SAVE ERROR]', error.message);
    throw error;
  }
}

// ==========================================
// ROUTING GUARDS
// ==========================================
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.replace('dashboard.html');
  }
}

function redirectIfNotAuthenticated() {
  if (!isAuthenticated()) {
    window.location.replace('index.html');
  }
}

function attachAuthListeners(type) {
  const form = document.getElementById(type === 'login' ? 'loginForm' : 'signupForm');
  const status = document.getElementById(`${type}Status`);
  if (!form) return;

  redirectIfAuthenticated();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatusMessage(status);

    const submitButton = form.querySelector('button[type="submit"]');
    let payload;

    if (type === 'login') {
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password) {
        setStatusMessage(status, 'Please enter both email and password');
        return;
      }
      payload = { email, password };
    } else {
      const name = document.getElementById('signupName')?.value.trim();
      const email = document.getElementById('signupEmail')?.value.trim();
      const password = document.getElementById('signupPassword')?.value;

      if (!name || !email || !password) {
        setStatusMessage(status, 'Please fill in all fields');
        return;
      }
      payload = { name, email, password };
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = type === 'login' ? 'Signing in…' : 'Creating account…';
    }

    try {
      await (type === 'login' ? loginUser(payload) : signupUser(payload));
      showNotification(type === 'login' ? 'Welcome back! Redirecting…' : 'Account created successfully. Redirecting…');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      setStatusMessage(status, error.message || 'Authentication failed. Please try again.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = type === 'login' ? 'Log In' : 'Create Account';
      }
    }
  });
}

// ==========================================
// CORE PAGES LOGIC
// ==========================================
async function initDashboardPage() {
  redirectIfNotAuthenticated();
  const user = getCurrentUser();

  const profileName = document.querySelector('.profile-pill span');
  const profileSmall = document.querySelector('.profile-pill small');
  const profileLetter = document.querySelector('.profile-ring');

  if (profileName) profileName.textContent = user.name || user.email || 'RRventures';
  if (profileSmall) profileSmall.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Administrator';
  if (profileLetter) profileLetter.textContent = (user.name || user.email || 'R').charAt(0).toUpperCase();

  const totalServicesCount = document.getElementById('totalServicesCount');

  try {
    const servicesRes = await fetchServices();
    const services = Array.isArray(servicesRes)
      ? servicesRes
      : Array.isArray(servicesRes.property)
        ? servicesRes.property
        : Array.isArray(servicesRes.data)
          ? servicesRes.data
          : [];

    if (totalServicesCount) totalServicesCount.textContent = String(services.length);
  } catch (error) {
    console.error('[DASHBOARD ERROR]', error);
  }
}

async function initServicesPage() {
  redirectIfNotAuthenticated();
  const searchInput = document.getElementById('serviceSearch');
  const statusFilter = document.getElementById('statusFilter');
  const addButton = document.getElementById('openServiceModal');
  const modal = document.getElementById('serviceModal');
  const closeModal = document.getElementById('closeServiceModal');
  const serviceForm = document.getElementById('newServiceForm');
  const serviceIdInput = document.getElementById('serviceId');
  const serviceModalTitle = document.getElementById('serviceModalTitle');

  await loadServices();

  const updateList = () => {
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const filtered = servicesData.filter((service) => {
      const title = (service.title || service.name || '').toLowerCase();
      const description = (service.description || '').toLowerCase();
      const matchesSearch = title.includes(query) || description.includes(query);
      const matchesStatus = status === 'All' || (service.status || 'Active') === status;
      return matchesSearch && matchesStatus;
    });
    renderServiceRows(filtered);
  };

  searchInput?.addEventListener('input', updateList);
  statusFilter?.addEventListener('change', updateList);
  addButton?.addEventListener('click', () => openServiceModal());
  closeModal?.addEventListener('click', closeServiceModal);

  serviceForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = serviceIdInput.value.trim();
    const title = document.getElementById('serviceName').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const price = document.getElementById('servicePrice').value.trim();
    const imageInput = document.getElementById('serviceImage');
    const image = imageInput?.files?.[0] || null;

    if (!title || !description || !price || (!id && !image)) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const submitButton = serviceForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('location', document.getElementById('serviceLocation').value.trim());
      formData.append('status', document.getElementById('serviceStatus').value);
      if (image) formData.append('image', image);

      if (id) {
        await updateProperty(id, formData);
        showNotification('Property updated successfully');
      } else {
        await createProperty(formData);
        showNotification('Property created successfully');
      }

      await loadServices();
      renderServiceRows(servicesData);
      closeServiceModal();
    } catch (error) {
      showNotification(error.message || 'Failed to save property', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  function openServiceModal(serviceId = null) {
    if (serviceId) {
      const service = servicesData.find((item) => item.id === serviceId || item._id === serviceId);
      if (!service) return;
      serviceIdInput.value = service._id || service.id;
      document.getElementById('serviceName').value = service.title || service.name || '';
      document.getElementById('serviceDescription').value = service.description || '';
      document.getElementById('servicePrice').value = service.price || '';
      document.getElementById('serviceStatus').value = service.status || 'Active';
      if (serviceModalTitle) serviceModalTitle.textContent = 'Edit property';
    } else {
      serviceForm.reset();
      serviceIdInput.value = '';
    }
    modal?.classList.add('active');
  }

  function closeServiceModal() { modal?.classList.remove('active'); }
  renderServiceRows(servicesData);
}

async function loadServices() {
  try {
    const response = await fetchServices();
    servicesData = Array.isArray(response) ? response : response.data || response.property || [];
  } catch { servicesData = []; }
}

function renderServiceRows(services) {
  const tableBody = document.getElementById('serviceRows');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  // ... (Baki render service row table logic jo perfectly dynamic chal rha h)
}

// ==========================================
// SINGLE INTERACTIVE INITIALIZATION LIFECYCLE
// ==========================================
function initPage() {
  const page = document.body.dataset.page;
  console.log("[LIFECYCLE] Current page identified as:", page);

  if (page === 'login') attachAuthListeners('login');
  else if (page === 'signup') attachAuthListeners('signup');
  else if (page === 'dashboard') {
    initDashboardPage();
    initAdminManagement(); // Connects button modal handler safely here
  }
  else if (page === 'services') initServicesPage();
  // Add other page loaders here if required explicitly...
}

window.addEventListener('DOMContentLoaded', initPage);