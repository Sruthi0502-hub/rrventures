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

  const fetchOptions = { ...options };

  if (options.body instanceof FormData) {
    // don't set Content-Type, don't stringify
    fetchOptions.body = options.body;
  } else {
    headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body !== 'string') {
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  fetchOptions.headers = headers;

  try {
    const bodyPreview = options.body instanceof FormData ? '[FormData]' : options.body;
    console.log(`[API] ${options.method || 'GET'} ${API_BASE_URL}${path}`, bodyPreview);

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
            name: decoded.name
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
    return await apiFetch('/properties/create-property', {
      method: 'POST',
      body: formData,
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

async function createAd(formData) {
  try {
    return await apiFetch('/properties/create-properties', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  } catch (error) {
    console.error('[ADS CREATE ERROR]', error.message);
    throw error;
  }
}

async function updateAd(id, formData) {
  try {
    return await apiFetch(`/ads/${id}`, {
      method: 'PATCH',
      body: formData,
      isFormData: true,
    });
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

function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one alphabet letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/\\~`%]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function setupFormValidation(type) {
  const form = document.getElementById(type === 'login' ? 'loginForm' : 'signupForm');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const emailInput = document.getElementById(type === 'login' ? 'loginEmail' : 'signupEmail');
  const passwordInput = document.getElementById(type === 'login' ? 'loginPassword' : 'signupPassword');
  const nameInput = type === 'signup' ? document.getElementById('signupName') : null;

  const emailFeedback = document.getElementById(type === 'login' ? 'loginEmailFeedback' : 'signupEmailFeedback');
  const passwordFeedback = document.getElementById(type === 'login' ? 'loginPasswordFeedback' : 'signupPasswordFeedback');
  const nameFeedback = type === 'signup' ? document.getElementById('signupNameFeedback') : null;

  let isEmailValid = false;
  let isPasswordValid = false;
  let isNameValid = type === 'login';

  function checkFormValidity() {
    if (isEmailValid && isPasswordValid && isNameValid) {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  }

  submitButton.disabled = true;

  function validateEmailField(showError = true) {
    const value = emailInput.value.trim();
    if (!value) {
      isEmailValid = false;
      emailInput.classList.remove('valid', 'invalid');
      if (emailFeedback) {
        emailFeedback.textContent = 'Email is required.';
        if (showError) emailFeedback.classList.add('visible');
        else emailFeedback.classList.remove('visible');
      }
    } else if (!validateEmail(value)) {
      isEmailValid = false;
      emailInput.classList.add('invalid');
      emailInput.classList.remove('valid');
      if (emailFeedback) {
        emailFeedback.textContent = 'Invalid email format. Please enter a valid email (e.g., user@example.com)';
        if (showError) emailFeedback.classList.add('visible');
        else emailFeedback.classList.remove('visible');
      }
    } else {
      isEmailValid = true;
      emailInput.classList.add('valid');
      emailInput.classList.remove('invalid');
      if (emailFeedback) {
        emailFeedback.textContent = '';
        emailFeedback.classList.remove('visible');
      }
    }
    checkFormValidity();
  }

  function validatePasswordField(showError = true) {
    const value = passwordInput.value;
    if (!value) {
      isPasswordValid = false;
      passwordInput.classList.remove('valid', 'invalid');
      if (passwordFeedback) {
        passwordFeedback.textContent = 'Password is required.';
        if (showError) passwordFeedback.classList.add('visible');
        else passwordFeedback.classList.remove('visible');
      }
    } else {
      const res = validatePassword(value);
      if (!res.isValid) {
        isPasswordValid = false;
        passwordInput.classList.add('invalid');
        passwordInput.classList.remove('valid');
        if (passwordFeedback) {
          passwordFeedback.innerHTML = res.errors.join('<br>');
          if (showError) passwordFeedback.classList.add('visible');
          else passwordFeedback.classList.remove('visible');
        }
      } else {
        isPasswordValid = true;
        passwordInput.classList.add('valid');
        passwordInput.classList.remove('invalid');
        if (passwordFeedback) {
          passwordFeedback.textContent = '';
          passwordFeedback.classList.remove('visible');
        }
      }
    }
    checkFormValidity();
  }

  function validateNameField(showError = true) {
    if (!nameInput) return;
    const value = nameInput.value.trim();
    if (!value) {
      isNameValid = false;
      nameInput.classList.remove('valid', 'invalid');
      if (nameFeedback) {
        nameFeedback.textContent = 'Full name is required.';
        if (showError) nameFeedback.classList.add('visible');
        else nameFeedback.classList.remove('visible');
      }
    } else if (value.length < 2) {
      isNameValid = false;
      nameInput.classList.add('invalid');
      nameInput.classList.remove('valid');
      if (nameFeedback) {
        nameFeedback.textContent = 'Name must be at least 2 characters.';
        if (showError) nameFeedback.classList.add('visible');
        else nameFeedback.classList.remove('visible');
      }
    } else {
      isNameValid = true;
      nameInput.classList.add('valid');
      nameInput.classList.remove('invalid');
      if (nameFeedback) {
        nameFeedback.textContent = '';
        nameFeedback.classList.remove('visible');
      }
    }
    checkFormValidity();
  }

  emailInput.addEventListener('input', () => validateEmailField(true));
  emailInput.addEventListener('blur', () => validateEmailField(true));

  passwordInput.addEventListener('input', () => validatePasswordField(true));
  passwordInput.addEventListener('blur', () => validatePasswordField(true));

  if (nameInput) {
    nameInput.addEventListener('input', () => validateNameField(true));
    nameInput.addEventListener('blur', () => validateNameField(true));
  }

  validateEmailField(false);
  validatePasswordField(false);
  if (nameInput) {
    validateNameField(false);
  }
}

function attachAuthListeners(type) {
  const form = document.getElementById(type === 'login' ? 'loginForm' : 'signupForm');
  const status = document.getElementById(`${type}Status`);
  if (!form) return;

  redirectIfAuthenticated();
  setupFormValidation(type);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatusMessage(status);

    const submitButton = form.querySelector('button[type="submit"]');
    let payload;

    if (type === 'login') {
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password || !validateEmail(email) || !validatePassword(password).isValid) {
        setStatusMessage(status, 'Please enter a valid email and password matching requirements');
        return;
      }
      payload = { email, password };
    } else {
      const name = document.getElementById('signupName')?.value.trim();
      const email = document.getElementById('signupEmail')?.value.trim();
      const password = document.getElementById('signupPassword')?.value;

      if (!name || name.length < 2 || !email || !password || !validateEmail(email) || !validatePassword(password).isValid) {
        setStatusMessage(status, 'Please fill in all fields correctly matching requirements');
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

async function fetchAdminName() {
  try {
    const response = await apiFetch('/admins/find-Admin', { method: 'GET' });
    const admins = Array.isArray(response) ? response : response.data || [];
    const user = getCurrentUser();
    const adminData = admins.find(a => a.email === user.email);

    if (adminData && adminData.name) {
      user.name = adminData.name;
      localStorage.setItem(storageKeys.user, JSON.stringify(user));
      return adminData.name;
    }
  } catch (error) {
    console.error('[FETCH ADMIN NAME ERROR]', error);
  }
  return null;
}

// ==========================================
// CORE PAGES LOGIC
// ==========================================
async function initDashboardPage() {
  const totalServicesCount = document.getElementById('totalServicesCount');
  const totalAdsCount = document.getElementById('totalAdsCount');
  const activeAdsCount = document.getElementById('activeAdsCount');

  try {
    const [servicesRes, adsRes] = await Promise.all([
      fetchServices(),
      fetchAds()
    ]);

    const services = Array.isArray(servicesRes)
      ? servicesRes
      : Array.isArray(servicesRes.property)
        ? servicesRes.property
        : Array.isArray(servicesRes.data)
          ? servicesRes.data
          : [];

    const ads = Array.isArray(adsRes)
      ? adsRes
      : Array.isArray(adsRes.data)
        ? adsRes.data
        : [];

    if (totalServicesCount) totalServicesCount.textContent = String(services.length);
    if (totalAdsCount) totalAdsCount.textContent = String(ads.length);
    if (activeAdsCount) activeAdsCount.textContent = String(Math.max(0, ads.length - 1));
  } catch (error) {
    console.error('[DASHBOARD ERROR]', error);
  }
}

async function initServicesPage() {
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
    const imageInput = document.getElementById('serviceImage');
    if (serviceId) {
      const service = servicesData.find((item) => item.id === serviceId || item._id === serviceId);
      if (!service) return;
      serviceIdInput.value = service._id || service.id;
      document.getElementById('serviceName').value = service.title || service.name || '';
      document.getElementById('serviceDescription').value = service.description || '';
      document.getElementById('servicePrice').value = service.price || '';
      document.getElementById('serviceLocation').value = service.location || '';
      document.getElementById('serviceStatus').value = service.status || 'Active';
      if (imageInput) imageInput.removeAttribute('required');
      if (serviceModalTitle) serviceModalTitle.textContent = 'Edit property';
    } else {
      serviceForm.reset();
      serviceIdInput.value = '';
      if (imageInput) imageInput.setAttribute('required', 'required');
      if (serviceModalTitle) serviceModalTitle.textContent = 'Add property';
    }
    modal?.classList.add('active');
  }

  function closeServiceModal() { modal?.classList.remove('active'); }

  window.editProperty = openServiceModal;
  window.removeProperty = async (propertyId) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteProperty(propertyId);
        await loadServices();
        renderServiceRows(servicesData);
        showNotification('Property deleted successfully');
      } catch (error) {
        showNotification(error.message || 'Failed to delete property', 'error');
      }
    }
  };

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

  if (services.length === 0) {
    tableBody.innerHTML = `
      <tr><td colspan="8" class="table-empty">
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No properties found</h3>
          <p>Create your first property to get started managing your listings.</p>
          <button class="btn btn-primary icon-btn" onclick="document.getElementById('openServiceModal')?.click()">
            <i data-lucide="plus"></i>Add Property
          </button>
        </div>
      </td></tr>
    `;
    return;
  }

  services.forEach((service) => {
    const row = document.createElement('tr');
    const imageUrl = service.image
      ? (service.image.startsWith('http') ? service.image : `${API_BASE_URL}/uploads/${service.image}`)
      : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80';
    const serviceId = service._id || service.id;
    const title = service.title || service.name || 'Untitled';
    row.innerHTML = `
      <td>
        <div class="name-cell" style="display: flex; align-items: center; gap: 0.85rem;">
          <img src="${imageUrl}" alt="${title}" style="width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1.5px solid var(--border);" />
          <strong style="color: var(--text);">${title}</strong>
        </div>
      </td>
      <td>${service.description || '-'}</td>
      <td><strong style="color: var(--primary);">${service.price || '-'}</strong></td>
      <td><span style="color: var(--text); font-weight: 500;">${service.location || '-'}</span></td>
      <td><span class="status-pill ${service.status === 'Active' ? 'status-active' : service.status === 'Paused' ? 'status-paused' : 'status-draft'}">${service.status || 'Draft'}</span></td>
      <td>${service.createdAt || service.updatedAt || '-'}</td>
      <td class="created-by-col">${service.createdBy?.name || service.createdBy?.email || 'Unknown'}</td>
      <td class="table-actions">
        <button class="btn btn-secondary action-btn" type="button" onclick="editProperty('${serviceId}')">Edit</button>
        <button class="btn btn-tertiary action-btn" type="button" onclick="removeProperty('${serviceId}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function initAdsPage() {
  const searchInput = document.getElementById('adSearch');
  const form = document.getElementById('newAdForm');
  const titleInput = document.getElementById('adTitle');
  const priceInput = document.getElementById('adPrice');
  const descriptionInput = document.getElementById('adDescription');
  const imageInput = document.getElementById('adImage');
  const indexField = document.getElementById('currentAdIndex');
  const preview = document.getElementById('imagePreview');
  const submitButton = form?.querySelector('button[type="submit"]');

  await loadAds();

  const updatePreview = () => {
    const file = imageInput?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.style.backgroundImage = `url('${e.target.result}')`;
        preview.textContent = '';
      };
      reader.readAsDataURL(file);
    } else {
      preview.style.backgroundImage = 'none';
      preview.textContent = 'Image preview';
    }
  };

  const filterAds = () => {
    const query = searchInput.value.toLowerCase();
    const filtered = adsData.filter((ad) => {
      return (ad.title || '').toLowerCase().includes(query) || (ad.description || '').toLowerCase().includes(query);
    });
    renderAdCards(filtered);
  };

  imageInput?.addEventListener('change', updatePreview);
  searchInput?.addEventListener('input', filterAds);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const price = priceInput.value.trim();
    const imageFile = imageInput?.files?.[0];
    const adId = indexField.value.trim();

    if (!title || !description || (!adId && !imageFile)) {
      showNotification('Please fill in required fields', 'error');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = adId ? 'Updating...' : 'Creating...';
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (price) formData.append('price', price);
      if (imageFile) formData.append('image', imageFile);

      if (adId) {
        await updateAd(adId, formData);
        showNotification('Ad updated successfully');
      } else {
        await createAd(formData);
        showNotification('Ad created successfully');
      }

      await loadAds();
      renderAdCards(adsData);
      form.reset();
      indexField.value = '';
      updatePreview();
      if (submitButton) submitButton.textContent = 'Create Advertisement';
    } catch (error) {
      showNotification(error.message || 'Failed to save ad', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (!submitButton.textContent.includes('Create') && !submitButton.textContent.includes('Update')) {
          submitButton.textContent = 'Create Advertisement';
        }
      }
    }
  });

  renderAdCards(adsData);
  window.editAd = (adId) => {
    const ad = adsData.find(a => a.id === adId || a._id === adId);
    if (!ad) return;
    titleInput.value = ad.title || '';
    descriptionInput.value = ad.description || '';
    priceInput.value = ad.price || '';
    imageInput.value = '';
    indexField.value = ad._id || ad.id;
    updatePreview();
    if (submitButton) submitButton.textContent = 'Update Advertisement';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.removeAd = async (adId) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      try {
        await deleteAd(adId);
        await loadAds();
        renderAdCards(adsData);
        showNotification('Ad deleted successfully');
      } catch (error) {
        showNotification(error.message || 'Failed to delete ad', 'error');
      }
    }
  };
}

async function loadAds() {
  try {
    const response = await fetchAds();
    adsData = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('[LOAD ADS ERROR]', error);
    adsData = [];
  }
}

function renderAdCards(ads) {
  const adGrid = document.getElementById('adGrid');
  if (!adGrid) return;
  adGrid.innerHTML = '';

  if (ads.length === 0) {
    adGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; min-height: 300px;">
        <div class="empty-state-icon">📢</div>
        <h3>No advertisements yet</h3>
        <p>Create your first advertisement campaign to get started.</p>
      </div>
    `;
    return;
  }

  ads.forEach((ad) => {
    const card = document.createElement('article');
    card.className = 'ad-card';
    const adId = ad._id || ad.id;
    const priceDisplay = ad.price ? `<p class="ad-price" style="color: var(--primary); font-weight: bold; margin-top: 0.5rem;">$${ad.price}</p>` : '';
    const adImageUrl = ad.image
      ? (ad.image.startsWith('http') ? ad.image : `${API_BASE_URL}/uploads/${ad.image}`)
      : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80';
    card.innerHTML = `
      <div class="ad-media" style="background-image: url('${adImageUrl}'); background-size: cover; background-position: center;">
        ${ad.image ? '' : 'Image preview'}
      </div>
      <div class="ad-content">
        <h3>${ad.title || 'Untitled'}</h3>
        <p>${ad.description || '-'}</p>
        ${priceDisplay}
        <div class="ad-actions">
          <button class="btn btn-secondary" type="button" onclick="editAd('${adId}')">Edit</button>
          <button class="btn btn-tertiary" type="button" onclick="removeAd('${adId}')">Delete</button>
        </div>
      </div>
    `;
    adGrid.appendChild(card);
  });
}

async function initCustomizationPage() {
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const notification = document.getElementById('notification');
  const descriptionInput = document.getElementById('companyDescription');
  const descriptionCount = document.getElementById('descriptionCount');

  let customizationData = {};
  try {
    const response = await fetchCustomization();
    customizationData = response.data || response || {};

    if (customizationData.companyName) document.getElementById('companyName').value = customizationData.companyName;
    if (customizationData.companyEmail) document.getElementById('companyEmail').value = customizationData.companyEmail;
    if (customizationData.companyDescription) descriptionInput.value = customizationData.companyDescription;
    if (customizationData.contactPhone) document.getElementById('contactPhone').value = customizationData.contactPhone;
    if (customizationData.contactAddress) document.getElementById('contactAddress').value = customizationData.contactAddress;
    if (customizationData.footerText) document.getElementById('footerText').value = customizationData.footerText;
  } catch (error) {
    console.error('[LOAD CUSTOMIZATION ERROR]', error);
  }

  const initialValues = {
    companyName: document.getElementById('companyName')?.value || '',
    companyEmail: document.getElementById('companyEmail')?.value || '',
    companyDescription: descriptionInput?.value || '',
    contactPhone: document.getElementById('contactPhone')?.value || '',
    contactAddress: document.getElementById('contactAddress')?.value || '',
    footerText: document.getElementById('footerText')?.value || ''
  };

  const updateCharCount = () => {
    if (descriptionCount) descriptionCount.textContent = descriptionInput.value.length;
  };
  updateCharCount();
  descriptionInput?.addEventListener('input', updateCharCount);

  const showPageNotification = (message, type = 'success') => {
    if (notification) {
      notification.className = `notification active notification-${type}`;
      const icon = type === 'success' ? 'check-circle' : 'alert-circle';
      notification.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
      if (window.lucide) lucide.replace({ width: 18, height: 18 });
      setTimeout(() => notification.classList.remove('active'), 4000);
    }
  };

  saveBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    const settings = {
      companyName: document.getElementById('companyName')?.value || '',
      companyEmail: document.getElementById('companyEmail')?.value || '',
      companyDescription: document.getElementById('companyDescription')?.value || '',
      contactPhone: document.getElementById('contactPhone')?.value || '',
      contactAddress: document.getElementById('contactAddress')?.value || '',
      footerText: document.getElementById('footerText')?.value || ''
    };

    try {
      await saveCustomization(settings);
      showPageNotification('Content settings saved successfully!');
    } catch (error) {
      showPageNotification(error.message || 'Failed to save settings', 'error');
    }
  });

  resetBtn?.addEventListener('click', () => {
    Object.keys(initialValues).forEach(key => {
      const elem = document.getElementById(key.replace(/([A-Z])/g, c => '-' + c.toLowerCase()).substring(1)) || document.getElementById(key);
      if (elem) elem.value = initialValues[key];
    });
    updateCharCount();
    showPageNotification('Form reset to last saved values.');
  });
}

// ==========================================
// SINGLE INTERACTIVE INITIALIZATION LIFECYCLE
// ==========================================
async function initPage() {
  const page = document.body.dataset.page;
  console.log("[LIFECYCLE] Current page identified as:", page);

  if (page === 'login') attachAuthListeners('login');
  else if (page === 'signup') attachAuthListeners('signup');
  else {
    // Protected pages
    redirectIfNotAuthenticated();

    // Update profile elements immediately from cached data
    const updateProfileUI = () => {
      const user = getCurrentUser();
      const profileName = document.getElementById('profileName');
      const profileRole = document.getElementById('profileRole');
      const profileLetter = document.getElementById('profileLetter');

      if (profileName) profileName.textContent = user.name || user.email
      if (profileRole) profileRole.textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Administrator';
      if (profileLetter) profileLetter.textContent = (user.name || user.email || 'R').charAt(0).toUpperCase();
    };

    updateProfileUI();

    // Fetch current admin name dynamically in the background to avoid blocking other page logic
    fetchAdminName().then((newName) => {
      if (newName) {
        updateProfileUI();
      }
    });

    if (page === 'dashboard') {
      initDashboardPage();
      initAdminManagement();
    }
    else if (page === 'services') initServicesPage();
    else if (page === 'ads') initAdsPage();
    else if (page === 'customization') initCustomizationPage();
  }
}

window.addEventListener('DOMContentLoaded', initPage);