
// ==========================================
// RRVENTURES ADMIN DASHBOARD - BACKEND INTEGRATION
// ==========================================

const localHosts = ['localhost', '127.0.0.1', ''];
const API_BASE_URL = localHosts.includes(window.location.hostname) || window.location.protocol === 'file:'
  ? 'http://localhost:3000'
  : 'https://dashboard-management-1.onrender.com';

const storageKeys = {
  token: 'token',
  user: 'user'
};

// Backend data storage
let servicesData = [];
let adsData = [];

function getToken() {
  return localStorage.getItem(storageKeys.token);
}

function setToken(token) {
  localStorage.setItem(storageKeys.token, token);
}

function clearToken() {
  localStorage.removeItem(storageKeys.token);
  localStorage.removeItem(storageKeys.user);
}

function isAuthenticated() {
  return Boolean(getToken());
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.user) || '{}');
  } catch {
    return {};
  }
}

function decodeJWT(token) {
  try {
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
// AXIOS INTERCEPTOR (if axios is loaded)
// ==========================================

if (typeof axios !== 'undefined') {
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

// ==========================================
// API FETCH WRAPPER
// ==========================================

async function apiFetch(path, options = {}) {
  const headers = {
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = Boolean(options.isFormData) || options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const bodyPreview = isFormData
      ? '[FormData]'
      : options.body
        ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body)
        : '';
    console.log(`[API] ${options.method || 'GET'} ${API_BASE_URL}${path}`, bodyPreview);

    const fetchOptions = {
      ...options,
      headers,
    };

    // If body is an object and not FormData, ensure it's stringified
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
      body: JSON.stringify(payload)
    });

    if (response && response.access_token) {
        const token = response.access_token;
        setToken(token);
        if (response.user) {
          localStorage.setItem(storageKeys.user, JSON.stringify(response.user));
        } else {
          const decoded = decodeJWT(response.access_token);
          if (decoded) {
            localStorage.setItem(storageKeys.user, JSON.stringify({
              userId: decoded.sub,
              email: decoded.email,
              role: decoded.role
            }));
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
    const response = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Backend creates a new admin and returns a JWT payload on signup.
    // If the endpoint does not return a token, retry login with the same credentials.
    if (response && !response.access_token) {
      await loginUser({ email: payload.email, password: payload.password });
    }

    if (response && response.access_token) {
      const token = response.access_token;
      setToken(token);
      if (response.user) {
        localStorage.setItem(storageKeys.user, JSON.stringify(response.user));
      } else {
        const user = decodeJWT(token);
        localStorage.setItem(storageKeys.user, JSON.stringify(user));
      }
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
// PROPERTIES API FUNCTIONS (remapped from Services)
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
    console.log('[PROPERTIES] Creating new property (FormData)');
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
    console.log(`[PROPERTIES] Updating property ${id} (FormData)`);
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
    console.log(`[PROPERTIES] Deleting property ${id}`);
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
    console.log('[ADS] Fetching all ads');
    return await apiFetch('/ads', { method: 'GET' });
  } catch (error) {
    console.error('[ADS FETCH ERROR]', error.message);
    return { data: [] };
  }
}

async function createAd(payload) {
  try {
    console.log('[ADS] Creating new ad');
    return await apiFetch('/ads', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('[ADS CREATE ERROR]', error.message);
    throw error;
  }
}

async function updateAd(id, payload) {
  try {
    console.log(`[ADS] Updating ad ${id}`);
    return await apiFetch(`/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('[ADS UPDATE ERROR]', error.message);
    throw error;
  }
}

async function deleteAd(id) {
  try {
    console.log(`[ADS] Deleting ad ${id}`);
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
    console.log('[CUSTOMIZATION] Fetching customization');
    return await apiFetch('/customization', { method: 'GET' });
  } catch (error) {
    console.error('[CUSTOMIZATION FETCH ERROR]', error.message);
    return {};
  }
}

async function saveCustomization(payload) {
  try {
    console.log('[CUSTOMIZATION] Saving customization');
    return await apiFetch('/customization', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('[CUSTOMIZATION SAVE ERROR]', error.message);
    throw error;
  }
}

function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
  }
}

function redirectIfNotAuthenticated() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
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

    // Collect form data using direct element access
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

    submitButton.disabled = true;
    submitButton.textContent = type === 'login' ? 'Signing in…' : 'Creating account…';

    try {
      const response = type === 'login' ? await loginUser(payload) : await signupUser(payload);
      showNotification(type === 'login' ? 'Welcome back! Redirecting…' : 'Account created successfully. Redirecting…');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      setStatusMessage(status, error.message || 'Authentication failed. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = type === 'login' ? 'Log In' : 'Create Account';
    }
  });
}

// ==========================================
// DASHBOARD PAGE
// ==========================================

async function initDashboardPage() {
  redirectIfNotAuthenticated();

  const user = getCurrentUser();
  const profileName = document.querySelector('.profile-pill span');
  const profileSmall = document.querySelector('.profile-pill small');
  const profileLetter = document.querySelector('.profile-ring');
  
  if (profileName) profileName.textContent = user.name || 'RRventures';
  if (profileSmall) profileSmall.textContent = 'Administrator';
  if (profileLetter) profileLetter.textContent = (user.name || 'R').charAt(0).toUpperCase();

  const totalServicesCount = document.getElementById('totalServicesCount');
  const totalAdsCount = document.getElementById('totalAdsCount');
  const activeAdsCount = document.getElementById('activeAdsCount');
  const teamSize = document.getElementById('teamSize');

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
    if (totalAdsCount) totalAdsCount.textContent = '0';
    if (activeAdsCount) activeAdsCount.textContent = '0';
    if (teamSize) teamSize.textContent = '1';
  } catch (error) {
    console.error('[DASHBOARD ERROR]', error);
    if (totalServicesCount) totalServicesCount.textContent = '0';
    if (totalAdsCount) totalAdsCount.textContent = '0';
    if (activeAdsCount) activeAdsCount.textContent = '0';
  }
}

// ==========================================
// SERVICES PAGE
// ==========================================

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

  // Load services from API
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
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeServiceModal();
  });

  serviceForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = serviceIdInput.value.trim();
    const title = document.getElementById('serviceName').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const price = document.getElementById('servicePrice').value.trim();
    const imageInput = document.getElementById('serviceImage');
    const image = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
    const status = document.getElementById('serviceStatus').value;

    if (!title || !description || !price || !image) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const submitButton = serviceForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('location', document.getElementById('serviceLocation').value.trim());
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
      serviceForm.reset();
      serviceIdInput.value = '';
      statusFilter.value = 'All';
      searchInput.value = '';
    } catch (error) {
      showNotification(error.message || 'Failed to save property', 'error');
    } finally {
      submitButton.disabled = false;
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
      document.getElementById('serviceImage').value = '';
      document.getElementById('serviceStatus').value = service.status || 'Active';
      if (serviceModalTitle) serviceModalTitle.textContent = 'Edit property';
    } else {
      serviceIdInput.value = '';
      serviceForm.reset();
      if (serviceModalTitle) serviceModalTitle.textContent = 'Add new property';
    }
    modal?.classList.add('active');
  }

  function closeServiceModal() {
    modal?.classList.remove('active');
    if (serviceModalTitle) serviceModalTitle.textContent = 'Add new property';
  }

  renderServiceRows(servicesData);
  window.editProperty = openServiceModal;
  window.removeProperty = async (id) => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteProperty(id);
        await loadServices();
        renderServiceRows(servicesData);
        showNotification('Property deleted successfully');
      } catch (error) {
        showNotification(error.message || 'Failed to delete property', 'error');
      }
    }
  };
}

async function loadServices() {
  try {
    const response = await fetchServices();
    servicesData = Array.isArray(response)
      ? response
      : Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.property)
          ? response.property
          : [];
  } catch (error) {
    console.error('[LOAD SERVICES ERROR]', error);
    servicesData = [];
  }
}

function renderServiceRows(services) {
  const tableBody = document.getElementById('serviceRows');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (services.length === 0) {
    tableBody.innerHTML = `
      <tr><td colspan="7" class="table-empty">
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
    const imageUrl = service.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80';
    const serviceId = service._id || service.id;
    const title = service.title || service.name || 'Untitled';
    row.innerHTML = `
      <td>
        <div class="name-cell" style="display: flex; align-items: center; gap: 0.85rem;">
          <img src="${imageUrl}" alt="${title}" style="width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1.5px solid var(--border);" />
          <strong style="color: var(--text);">${title}</strong>
        </div>
      </td>
      <td>${service.description}</td>
      <td><strong style="color: var(--primary);">${service.price || '-'}</strong></td>
      <td><span style="color: var(--text); font-weight: 500;">${service.location || '-'}</span></td>
      <td><span class="status-pill ${service.status === 'Active' ? 'status-active' : service.status === 'Paused' ? 'status-paused' : 'status-draft'}">${service.status || 'Draft'}</span></td>
      <td>${service.createdAt || service.updatedAt || '-'}</td>
      <td class="table-actions">
        <button class="btn btn-secondary action-btn" type="button" onclick="editProperty('${serviceId}')">Edit</button>
        <button class="btn btn-tertiary action-btn" type="button" onclick="removeProperty('${serviceId}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ==========================================
// ADS PAGE
// ==========================================

async function initAdsPage() {
  redirectIfNotAuthenticated();

  const searchInput = document.getElementById('adSearch');
  const form = document.getElementById('newAdForm');
  const titleInput = document.getElementById('adTitle');
  const imageInput = document.getElementById('adImage');
  const descriptionInput = document.getElementById('adDescription');
  const indexField = document.getElementById('currentAdIndex');
  const preview = document.getElementById('imagePreview');
  const submitButton = form?.querySelector('button[type="submit"]');

  // Load ads from API
  await loadAds();

  const updatePreview = () => {
    const url = imageInput.value.trim();
    preview.style.backgroundImage = url ? `url('${url}')` : 'none';
    preview.textContent = url ? '' : 'Image preview';
  };

  const filterAds = () => {
    const query = searchInput.value.toLowerCase();
    const filtered = adsData.filter((ad) => {
      return ad.title.toLowerCase().includes(query) || ad.description.toLowerCase().includes(query);
    });
    renderAdCards(filtered);
  };

  imageInput?.addEventListener('input', updatePreview);
  searchInput?.addEventListener('input', filterAds);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const image = imageInput.value.trim();
    const title = titleInput.value.trim().substring(0, 30);
    const description = descriptionInput.value.trim();
    
    if (!image || !title || !description) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    const adId = indexField.value.trim();
    submitButton.disabled = true;

    try {
      const payload = { title, description, image };
      
      if (adId) {
        await updateAd(adId, payload);
        showNotification('Ad updated successfully');
      } else {
        await createAd(payload);
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
      submitButton.disabled = false;
    }
  });

  renderAdCards(adsData);
  window.editAd = (adId) => {
    const ad = adsData.find(a => a.id === adId || a._id === adId);
    if (!ad) return;
    titleInput.value = ad.title;
    imageInput.value = ad.image;
    descriptionInput.value = ad.description;
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
    adsData = response.data || response || [];
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
        <button class="btn btn-primary icon-btn" onclick="document.getElementById('newAdForm')?.scrollIntoView({behavior: 'smooth'})">
          <i data-lucide="plus"></i>Create Ad
        </button>
      </div>
    `;
    return;
  }

  ads.forEach((ad) => {
    const card = document.createElement('article');
    card.className = 'ad-card';
    const adId = ad._id || ad.id;
    card.innerHTML = `
      <div class="ad-media" style="background-image: url('${ad.image}'); background-size: cover; background-position: center;">
        ${ad.image ? '' : 'Image preview'}
      </div>
      <div class="ad-content">
        <h3>${ad.title}</h3>
        <p>${ad.description}</p>
        <div class="ad-actions">
          <button class="btn btn-secondary" type="button" onclick="editAd('${adId}')">Edit</button>
          <button class="btn btn-tertiary" type="button" onclick="removeAd('${adId}')">Delete</button>
        </div>
      </div>
    `;
    adGrid.appendChild(card);
  });
}

// ==========================================
// CUSTOMIZATION PAGE
// ==========================================

async function initCustomizationPage() {
  redirectIfNotAuthenticated();

  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const notification = document.getElementById('notification');
  const descriptionInput = document.getElementById('companyDescription');
  const descriptionCount = document.getElementById('descriptionCount');

  // Load customization from API
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
    companyName: document.getElementById('companyName').value,
    companyEmail: document.getElementById('companyEmail').value,
    companyDescription: descriptionInput.value,
    contactPhone: document.getElementById('contactPhone').value,
    contactAddress: document.getElementById('contactAddress').value,
    footerText: document.getElementById('footerText').value
  };

  const updateCharCount = () => {
    descriptionCount.textContent = descriptionInput.value.length;
  };
  updateCharCount();
  descriptionInput?.addEventListener('input', updateCharCount);

  const showPageNotification = (message, type = 'success') => {
    notification.className = `notification active notification-${type}`;
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    notification.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
    if (window.lucide) lucide.replace({ width: 18, height: 18 });
    setTimeout(() => {
      notification.classList.remove('active');
    }, 4000);
  };

  const validateForm = () => {
    const companyName = document.getElementById('companyName').value.trim();
    const companyEmail = document.getElementById('companyEmail').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!companyName) {
      showPageNotification('Company name is required.', 'error');
      return false;
    }
    if (!companyEmail) {
      showPageNotification('Company email is required.', 'error');
      return false;
    }
    if (!emailRegex.test(companyEmail)) {
      showPageNotification('Please enter a valid email address.', 'error');
      return false;
    }
    return true;
  };

  saveBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    if (validateForm()) {
      const settings = {
        companyName: document.getElementById('companyName').value,
        companyEmail: document.getElementById('companyEmail').value,
        companyDescription: document.getElementById('companyDescription').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactAddress: document.getElementById('contactAddress').value,
        footerText: document.getElementById('footerText').value
      };
      
      try {
        await saveCustomization(settings);
        showPageNotification('Content settings saved successfully!');
      } catch (error) {
        showPageNotification(error.message || 'Failed to save settings', 'error');
      }
    }
  });

  resetBtn?.addEventListener('click', () => {
    document.getElementById('companyName').value = initialValues.companyName;
    document.getElementById('companyEmail').value = initialValues.companyEmail;
    document.getElementById('companyDescription').value = initialValues.companyDescription;
    document.getElementById('contactPhone').value = initialValues.contactPhone;
    document.getElementById('contactAddress').value = initialValues.contactAddress;
    document.getElementById('footerText').value = initialValues.footerText;
    updateCharCount();
    showPageNotification('Form reset to last saved values.');
  });
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function initPage() {
  const page = document.body.dataset.page;
  if (page === 'login') attachAuthListeners('login');
  else if (page === 'signup') attachAuthListeners('signup');
  else if (page === 'dashboard') initDashboardPage();
  else if (page === 'services') initServicesPage();
  else if (page === 'ads') initAdsPage();
  else if (page === 'customization') initCustomizationPage();
}

window.addEventListener('DOMContentLoaded', initPage);
