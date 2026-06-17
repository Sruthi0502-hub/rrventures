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

// Pass 'isLogin' parameter to skip strict checks during login
function validatePassword(password, isLogin = false) {
  const errors = [];

  if (!password) {
    errors.push('Password is required.');
    return { isValid: false, errors };
  }

  // Agar login chal raha h toh bas requirements skip karke valid return kar do
  if (isLogin) {
    return {
      isValid: true,
      errors: []
    };
  }

  // ---- SIGNUP COMPLEXITY CHECKS ----
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
  const isLoginMode = (type === 'login');
  const form = document.getElementById(isLoginMode ? 'loginForm' : 'signupForm');
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const emailInput = document.getElementById(isLoginMode ? 'loginEmail' : 'signupEmail');
  const passwordInput = document.getElementById(isLoginMode ? 'loginPassword' : 'signupPassword');
  const nameInput = !isLoginMode ? document.getElementById('signupName') : null;

  const emailFeedback = document.getElementById(isLoginMode ? 'loginEmailFeedback' : 'signupEmailFeedback');
  const passwordFeedback = document.getElementById(isLoginMode ? 'loginPasswordFeedback' : 'signupPasswordFeedback');
  const nameFeedback = !isLoginMode ? document.getElementById('signupNameFeedback') : null;

  let isEmailValid = false;
  let isPasswordValid = false;
  let isNameValid = isLoginMode;

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
      // Pass type === 'login' status dynamically
      const res = validatePassword(value, isLoginMode);
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
  const isLoginMode = (type === 'login');
  const form = document.getElementById(isLoginMode ? 'loginForm' : 'signupForm');
  const status = document.getElementById(`${type}Status`);
  if (!form) return;

  // Make sure these global hooks exist elsewhere in your codebase
  if (typeof redirectIfAuthenticated === 'function') redirectIfAuthenticated();
  setupFormValidation(type);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (typeof clearStatusMessage === 'function') clearStatusMessage(status);

    const submitButton = form.querySelector('button[type="submit"]');
    let payload;

    if (isLoginMode) {
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      if (!email || !password || !validateEmail(email) || !validatePassword(password, true).isValid) {
        if (typeof setStatusMessage === 'function') setStatusMessage(status, 'Please enter a valid email and password');
        return;
      }
      payload = { email, password };
    } else {
      const name = document.getElementById('signupName')?.value.trim();
      const email = document.getElementById('signupEmail')?.value.trim();
      const password = document.getElementById('signupPassword')?.value;

      if (!name || name.length < 2 || !email || !password || !validateEmail(email) || !validatePassword(password, false).isValid) {
        if (typeof setStatusMessage === 'function') setStatusMessage(status, 'Please fill in all fields correctly matching requirements');
        return;
      }
      payload = { name, email, password };
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = isLoginMode ? 'Signing in…' : 'Creating account…';
    }

    try {
      // API call hooks check
      if (isLoginMode && typeof loginUser === 'function') {
        await loginUser(payload);
      } else if (!isLoginMode && typeof signupUser === 'function') {
        await signupUser(payload);
      }

      if (typeof showNotification === 'function') {
        showNotification(isLoginMode ? 'Welcome back! Redirecting…' : 'Account created successfully. Redirecting…');
      }

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      if (typeof setStatusMessage === 'function') {
        setStatusMessage(status, error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = isLoginMode ? 'Log In' : 'Create Account';
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
    const title = service.title || service.name;
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
      ${(service.createdAt || service.updatedAt)}
      <td class="created-by-col">${service.createdBy?.name || service.createdBy?.email}</td>
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

      if (profileName) profileName.textContent = user.name || user.email;
      if (profileRole) {
        let displayRole = 'Administrator';
        if (user.role) {
          if (user.role === 'superAdmin') {
            displayRole = 'Super Admin';
          } else if (user.role === 'Admin') {
            displayRole = 'Admin';
          } else {
            displayRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
          }
        }
        profileRole.textContent = displayRole;
      }
      if (profileLetter) profileLetter.textContent = (user.name || user.email || 'R').charAt(0).toUpperCase();

      // Remove/hide the Create Admins category tab for regular Admins, but show it for Super Admins
      const manageAdminsTab = document.getElementById('manageAdminsTab');
      if (manageAdminsTab) {
        const isSuperAdmin = user && user.role && (
          user.role === 'superAdmin' ||
          user.role.toLowerCase() === 'superadmin' ||
          user.role.toLowerCase() === 'super-admin'
        );
        if (isSuperAdmin) {
          manageAdminsTab.style.display = '';
        } else {
          manageAdminsTab.style.display = 'none';
        }
      }
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
    else if (page === 'properties') initServicesPage();
    else if (page === 'ads') initAdsPage();
    else if (page === 'customization') initCustomizationPage();
  }
}

window.addEventListener('DOMContentLoaded', initPage);

// ==========================================
// SERVICES MANAGEMENT APIS INTEGRATION
// ==========================================
(function () {
  // const API_BASE = '';
  const IMAGE_BASE = `${API_BASE_URL}/uploads/`;

  // State Variables
  let servicesList = [];
  let editMode = false;
  let editingId = null;
  let serviceModalInstance = null;

  // DOM Elements
  let servicesTableBody, alertContainer, serviceForm, serviceModalEl, serviceModalLabel;
  let btnSubmitService, btnAddService, btnSignOut;
  let serviceIdInput, serviceTitleInput, serviceCategoryInput, serviceDescriptionInput;
  let serviceImageInput, labelServiceImage, feedbackServiceImage, serviceImagePreviewContainer, serviceImagePreview;

  document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the services.html page
    if (!document.getElementById('servicesTable')) return;

    servicesTableBody = document.getElementById('servicesTableBody');
    alertContainer = document.getElementById('alertContainer');
    serviceForm = document.getElementById('serviceForm');
    serviceModalEl = document.getElementById('serviceModal');
    serviceModalLabel = document.getElementById('serviceModalLabel');
    btnSubmitService = document.getElementById('btnSubmitService');
    btnAddService = document.getElementById('btnAddService');
    btnSignOut = document.getElementById('btnSignOut');

    serviceIdInput = document.getElementById('serviceId');
    serviceTitleInput = document.getElementById('serviceTitle');
    serviceCategoryInput = document.getElementById('serviceCategory');
    serviceDescriptionInput = document.getElementById('serviceDescription');
    serviceImageInput = document.getElementById('serviceImage');
    labelServiceImage = document.getElementById('labelServiceImage');
    feedbackServiceImage = document.getElementById('feedbackServiceImage');
    serviceImagePreviewContainer = document.getElementById('serviceImagePreviewContainer');
    serviceImagePreview = document.getElementById('serviceImagePreview');

    serviceModalInstance = new bootstrap.Modal(serviceModalEl);

    // Check Token
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('No authentication token found in localStorage. Operations might fail. Please log in first.', 'danger');
    }

    // Fetch Services List
    fetchServicesListLocal();

    // Event Listeners
    btnAddService.addEventListener('click', openCreateModal);
    serviceForm.addEventListener('submit', handleFormSubmit);
    btnSignOut.addEventListener('click', handleSignOut);

    const inputs = serviceForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
      });
    });
    serviceImageInput.addEventListener('change', handleImageFileChange);
  });

  async function fetchServicesListLocal() {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/provideservices/fetchAllServices`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error(`Server returned code ${response.status}`);
      const data = await response.json();
      servicesList = data.data || data || [];
      renderTable(servicesList);
    } catch (err) {
      console.error('Fetch error:', err);
      showAlert('Failed to load services from the server. Check your connection or API status.', 'danger');
      renderTable([]);
    }
  }

  function renderTable(list) {
    if (!list || list.length === 0) {
      servicesTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            No services found. Click "Add New Service" to insert one.
          </td>
        </tr>`;
      return;
    }
    servicesTableBody.innerHTML = '';
    list.forEach(s => {
      const tr = document.createElement('tr');
      const imageSrc = s.images ? `${IMAGE_BASE}${s.images}` : (s.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80');
      const title = s.title || s.name || 'Untitled Service';
      const category = s.category || 'Fabrication';
      const description = s.description || s.desc || '';
      const id = s._id || s.id;

      tr.innerHTML = `
        <td class="ps-4">
          <div class="service-thumbnail-container">
            <img src="${imageSrc}" alt="${title}" class="service-thumbnail" onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'">
          </div>
        </td>
        <td class="fw-semibold text-steel font-display" style="font-size: 15px;">${title}</td>
        <td>
          <span class="admin-badge">${category}</span>
        </td>
        <td>
          <div class="table-desc-cell">${description}</div>
        </td>
        <td class="text-end pe-4">
          <button class="btn btn-action btn-action-edit me-1" onclick="openEditModal('${id}')">
            Edit
          </button>
          <button class="btn btn-action btn-action-delete" onclick="handleDeleteClick('${id}')">
            Delete
          </button>
        </td>
      `;
      servicesTableBody.appendChild(tr);
    });
  }

  function showAlert(message, type = 'success') {
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type === 'danger' ? 'danger' : 'success'} alert-dismissible fade show`;
    alertEl.role = 'alert';
    alertEl.innerHTML = `
      <span>${message}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alertEl);
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getInstance(alertEl);
      if (bsAlert) bsAlert.close();
    }, 4000);
  }

  function openCreateModal() {
    editMode = false;
    editingId = null;
    serviceForm.reset();
    serviceForm.classList.remove('was-validated');
    const invalidFields = serviceForm.querySelectorAll('.is-invalid');
    invalidFields.forEach(f => f.classList.remove('is-invalid'));
    serviceModalLabel.textContent = 'Add New Service';
    btnSubmitService.textContent = 'Create Service';
    serviceImageInput.setAttribute('required', 'required');
    labelServiceImage.textContent = 'Service Image File *';
    feedbackServiceImage.textContent = 'Please select an image file.';
    serviceImagePreviewContainer.classList.add('d-none');
    serviceImagePreview.src = '';
    serviceModalInstance.show();
  }

  function openEditModal(id) {
    editMode = true;
    editingId = id;
    serviceForm.reset();
    serviceForm.classList.remove('was-validated');
    const invalidFields = serviceForm.querySelectorAll('.is-invalid');
    invalidFields.forEach(f => f.classList.remove('is-invalid'));

    const item = servicesList.find(s => String(s._id || s.id) === String(id));
    if (!item) {
      showAlert('Error: Service not found locally.', 'danger');
      return;
    }

    serviceTitleInput.value = item.title || item.name || '';
    serviceCategoryInput.value = item.category || '';
    serviceDescriptionInput.value = item.description || item.desc || '';
    serviceModalLabel.textContent = 'Edit Service';
    btnSubmitService.textContent = 'Save Changes';
    serviceImageInput.removeAttribute('required');
    labelServiceImage.textContent = 'Change Service Image (Optional)';
    feedbackServiceImage.textContent = 'Please choose a valid file.';

    const imageSrc = item.images ? `${IMAGE_BASE}${item.images}` : (item.image || '');
    if (imageSrc) {
      serviceImagePreviewContainer.classList.remove('d-none');
      serviceImagePreview.src = imageSrc;
    } else {
      serviceImagePreviewContainer.classList.add('d-none');
      serviceImagePreview.src = '';
    }
    serviceModalInstance.show();
  }

  function handleImageFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        serviceImagePreviewContainer.classList.remove('d-none');
        serviceImagePreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    let isValid = true;
    if (!serviceTitleInput.value.trim()) {
      serviceTitleInput.classList.add('is-invalid');
      isValid = false;
    }
    if (!serviceCategoryInput.value.trim()) {
      serviceCategoryInput.classList.add('is-invalid');
      isValid = false;
    }
    if (!serviceDescriptionInput.value.trim()) {
      serviceDescriptionInput.classList.add('is-invalid');
      isValid = false;
    }
    if (!editMode && !serviceImageInput.files[0]) {
      serviceImageInput.classList.add('is-invalid');
      isValid = false;
    }
    if (!isValid) {
      serviceForm.classList.add('was-validated');
      return;
    }

    const formData = new FormData();
    formData.append('title', serviceTitleInput.value.trim());
    formData.append('category', serviceCategoryInput.value.trim());
    formData.append('description', serviceDescriptionInput.value.trim());

    const file = serviceImageInput.files[0];
    if (file) formData.append('images', file);

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    btnSubmitService.disabled = true;
    btnSubmitService.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;

    try {
      let url = editMode
        ? `${API_BASE_URL}/provideservices/updateServices/${editingId}`
        : `${API_BASE_URL}/provideservices/create-Service`;
      let method = editMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: formData
      });
      const resJson = await response.json();
      if (!response.ok) throw new Error(resJson.message || 'Operation failed');

      showAlert(editMode ? 'Service updated successfully!' : 'Service created successfully!', 'success');
      serviceModalInstance.hide();
      fetchServicesListLocal();
    } catch (err) {
      console.error('Save error:', err);
      showAlert(`Error: ${err.message || 'Failed to save service details.'}`, 'danger');
    } finally {
      btnSubmitService.disabled = false;
      btnSubmitService.textContent = editMode ? 'Save Changes' : 'Create Service';
    }
  }

  async function handleDeleteClick(id) {
    // 1. Find the item safely
    const item = servicesList.find(s => String(s._id || s.id) === String(id));
    const title = item ? (item.title || item.name || 'this service') : 'this service';

    const confirmDelete = confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');

    // Set up headers dynamically
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/provideservices/deletdServices/${id}`, {
        method: 'DELETE',
        headers: headers
      });

      // 2. Handle potentially empty responses (like 204 No Content) Safely
      let resJson = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        resJson = await response.json();
      }

      // 3. Throw error if response is not OK
      if (!response.ok) {
        throw new Error(resJson.message || `Deletion failed with status ${response.status}`);
      }

      showAlert('Service deleted successfully!', 'success');
      fetchServicesListLocal();
    } catch (err) {
      console.error('Delete error detailed logging:', err);
      showAlert(`Error: ${err.message || 'Failed to delete service.'}`, 'danger');
    }
  }

  function handleSignOut() {
    localStorage.removeItem('token');
    showAlert('Signed out successfully. Token cleared.', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  // Export handlers to global scope for HTML inline events
  window.openEditModal = openEditModal;
  window.handleDeleteClick = handleDeleteClick;
})();