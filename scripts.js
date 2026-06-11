

const API_BASE = '/api';
const API_URL = "https://dashboard-management-1.onrender.com";

const storageKeys = {
  token: 'rrventures_token',
  user: 'rrventures_user',
  customization: 'rrventures_customization'
};

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const dummyServices = [
  { id: 1, name: 'Website Development', description: 'Modern landing pages and custom e-commerce solutions.', price: '$2,500', location: 'Remote', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=120&q=80', status: 'Active', dateCreated: '2026-04-09' },
  { id: 2, name: 'SEO Strategy', description: 'Keyword audits, content planning, and backlink management.', price: '$1,200', location: 'Remote', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=120&q=80', status: 'Active', dateCreated: '2026-05-14' },
  { id: 3, name: 'Social Campaign', description: 'Creative ads and performance tracking for your social spend.', price: '$1,800', location: 'Hybrid', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=120&q=80', status: 'Paused', dateCreated: '2026-03-22' },
  { id: 4, name: 'Analytics Audit', description: 'Improve conversions with data-backed product insights.', price: '$950', location: 'On-site', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80', status: 'Draft', dateCreated: '2026-06-01' }
];

const dummyAds = [
  { title: 'Summer Launch', description: 'Capture new leads with our all-in-one launch campaign.', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80' },
  { title: 'Brand Refresh', description: 'Upgrade your identity with fresh design and messaging.', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80' },
  { title: 'Lead Magnet', description: 'Drive signups with high-performing paid creative.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' }
];

const appState = {
  services: [...dummyServices],
  ads: [...dummyAds]
};

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

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || response.statusText || 'Request failed');
    }

    return payload;
  } catch (error) {
    throw new Error(error.message || 'Network request failed');
  }
}

async function loginUser(payload) {
  try {
    return await apiFetch(`/${API_URL}auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      return {
        token: 'rrventures-demo-token',
        user: { name: 'RRventures Admin', email: payload.email }
      };
    }
    throw error;
  }
}

async function signupUser(payload) {
  try {
    return await apiFetch(`/${API_URL}auth/signup`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      return {
        token: 'rrventures-demo-token',
        user: { name: payload.name, email: payload.email }
      };
    }
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

function setStatusMessage(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.className = `form-status ${type}`;
}

function clearStatusMessage(element) {
  if (!element) return;
  element.textContent = '';
  element.className = 'form-status';
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
    const formData = new FormData(form);
    const payload = type === 'login'
      ? {
        email: formData.get('loginEmail'),
        password: formData.get('loginPassword')
      }
      : {
        name: formData.get('signupName'),
        email: formData.get('signupEmail'),
        password: formData.get('signupPassword')
      };

    submitButton.disabled = true;
    submitButton.textContent = type === 'login' ? 'Signing in…' : 'Creating account…';

    try {
      const response = type === 'login' ? await loginUser(payload) : await signupUser(payload);
      const token = response.token || response.accessToken || response.data?.token || 'rrventures-demo-token';
      setToken(token);
      localStorage.setItem(storageKeys.user, JSON.stringify(response.user || { name: payload.name || 'Administrator', email: payload.email }));
      showNotification(type === 'login' ? 'Welcome back! Redirecting…' : 'Account created successfully. Redirecting…');
      window.location.href = 'dashboard.html';
    } catch (error) {
      setStatusMessage(status, error.message || 'Unable to authenticate. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = type === 'login' ? 'Log In' : 'Create Account';
    }
  });
}

function initDashboardPage() {
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

  if (totalServicesCount) totalServicesCount.textContent = String(appState.services.length);
  if (totalAdsCount) totalAdsCount.textContent = String(appState.ads.length);
  if (activeAdsCount) totalAdsCount.textContent = String(appState.ads.length);
  if (teamSize) teamSize.textContent = '1';
}

function initServicesPage() {
  redirectIfNotAuthenticated();

  const searchInput = document.getElementById('serviceSearch');
  const statusFilter = document.getElementById('statusFilter');
  const addButton = document.getElementById('openServiceModal');
  const modal = document.getElementById('serviceModal');
  const closeModal = document.getElementById('closeServiceModal');
  const serviceForm = document.getElementById('newServiceForm');
  const serviceIdInput = document.getElementById('serviceId');
  const serviceModalTitle = document.getElementById('serviceModalTitle');

  const updateList = () => {
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const filtered = appState.services.filter((service) => {
      const matchesSearch = service.name.toLowerCase().includes(query) || service.description.toLowerCase().includes(query);
      const matchesStatus = status === 'All' || service.status === status;
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

  serviceForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const id = Number(serviceIdInput.value);
    const name = document.getElementById('serviceName').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const price = document.getElementById('servicePrice').value.trim();
    const location = document.getElementById('serviceLocation').value.trim();
    const image = document.getElementById('serviceImage').value.trim();
    const status = document.getElementById('serviceStatus').value;
    if (!name || !description) return;

    if (id) {
      const service = appState.services.find((item) => item.id === id);
      if (service) {
        service.name = name;
        service.description = description;
        service.price = price;
        service.location = location;
        service.image = image;
        service.status = status;
      }
    } else {
      appState.services.unshift({
        id: Date.now(),
        name,
        description,
        price,
        location,
        image,
        status,
        dateCreated: new Date().toISOString().slice(0, 10)
      });
    }

    renderServiceRows(appState.services);
    closeServiceModal();
    serviceForm.reset();
    serviceIdInput.value = '';
    statusFilter.value = 'All';
    searchInput.value = '';
  });

  function openServiceModal(serviceId = null) {
    if (serviceId) {
      const service = appState.services.find((item) => item.id === serviceId);
      if (!service) return;
      serviceIdInput.value = String(service.id);
      document.getElementById('serviceName').value = service.name;
      document.getElementById('serviceDescription').value = service.description;
      document.getElementById('servicePrice').value = service.price || '';
      document.getElementById('serviceLocation').value = service.location || '';
      document.getElementById('serviceImage').value = service.image || '';
      document.getElementById('serviceStatus').value = service.status;
      if (serviceModalTitle) serviceModalTitle.textContent = 'Edit service';
    } else {
      serviceIdInput.value = '';
      serviceForm.reset();
      if (serviceModalTitle) serviceModalTitle.textContent = 'Add new service';
    }
    modal?.classList.add('active');
  }

  function closeServiceModal() {
    modal?.classList.remove('active');
    if (serviceModalTitle) serviceModalTitle.textContent = 'Add new service';
  }

  renderServiceRows(appState.services);
  window.editService = openServiceModal;
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
          <h3>No services found</h3>
          <p>Create your first service to get started managing your offerings.</p>
          <button class="btn btn-primary icon-btn" onclick="document.getElementById('openServiceModal')?.click()">
            <i data-lucide="plus"></i>Add Service
          </button>
        </div>
      </td></tr>
    `;
    return;
  }

  services.forEach((service) => {
    const row = document.createElement('tr');
    const imageUrl = service.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=120&q=80';
    row.innerHTML = `
      <td>
        <div class="name-cell" style="display: flex; align-items: center; gap: 0.85rem;">
          <img src="${imageUrl}" alt="${service.name}" style="width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1.5px solid var(--border);" />
          <strong style="color: var(--text);">${service.name}</strong>
        </div>
      </td>
      <td>${service.description}</td>
      <td><strong style="color: var(--primary);">${service.price || '-'}</strong></td>
      <td><span style="color: var(--text); font-weight: 500;">${service.location || '-'}</span></td>
      <td><span class="status-pill ${service.status === 'Active' ? 'status-active' : service.status === 'Paused' ? 'status-paused' : 'status-draft'}">${service.status}</span></td>
      <td>${service.dateCreated || '-'}</td>
      <td class="table-actions">
        <button class="btn btn-secondary action-btn" type="button" onclick="editService(${service.id})">Edit</button>
        <button class="btn btn-tertiary action-btn" type="button" onclick="removeService(${service.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function removeService(id) {
  appState.services = appState.services.filter((service) => service.id !== id);
  renderServiceRows(appState.services);
}

function initAdsPage() {
  redirectIfNotAuthenticated();

  const searchInput = document.getElementById('adSearch');
  const form = document.getElementById('newAdForm');
  const titleInput = document.getElementById('adTitle');
  const imageInput = document.getElementById('adImage');
  const descriptionInput = document.getElementById('adDescription');
  const indexField = document.getElementById('currentAdIndex');
  const preview = document.getElementById('imagePreview');
  const submitButton = form?.querySelector('button[type="submit"]');

  const updatePreview = () => {
    const url = imageInput.value.trim();
    preview.style.backgroundImage = url ? `url('${url}')` : 'none';
    preview.textContent = url ? '' : 'Image preview';
  };

  const filterAds = () => {
    const query = searchInput.value.toLowerCase();
    const filtered = appState.ads.filter((ad) => {
      return ad.title.toLowerCase().includes(query) || ad.description.toLowerCase().includes(query);
    });
    renderAdCards(filtered);
  };

  imageInput?.addEventListener('input', updatePreview);
  searchInput?.addEventListener('input', filterAds);

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const image = imageInput.value.trim();
    const title = titleInput.value.trim().substring(0, 30);
    const description = descriptionInput.value.trim();
    if (!image || !title || !description) return;

    const editIndex = Number(indexField.value);
    if (!Number.isNaN(editIndex) && editIndex >= 0 && editIndex < appState.ads.length) {
      appState.ads[editIndex] = { title, description, image };
      submitButton.textContent = 'Create Advertisement';
    } else {
      appState.ads.unshift({ title, description, image });
    }

    renderAdCards(appState.ads);
    form.reset();
    indexField.value = '';
    updatePreview();
  });

  renderAdCards(appState.ads);
  window.editAd = (index) => {
    const ad = appState.ads[index];
    if (!ad) return;
    titleInput.value = ad.title;
    imageInput.value = ad.image;
    descriptionInput.value = ad.description;
    indexField.value = String(index);
    updatePreview();
    if (submitButton) submitButton.textContent = 'Update Advertisement';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
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

  ads.forEach((ad, index) => {
    const card = document.createElement('article');
    card.className = 'ad-card';
    card.innerHTML = `
      <div class="ad-media" style="background-image: url('${ad.image}'); background-size: cover; background-position: center;">
        ${ad.image ? '' : 'Image preview'}
      </div>
      <div class="ad-content">
        <h3>${ad.title}</h3>
        <p>${ad.description}</p>
        <div class="ad-actions">
          <button class="btn btn-secondary" type="button" onclick="editAd(${index})">Edit</button>
          <button class="btn btn-tertiary" type="button" onclick="removeAd(${index})">Delete</button>
        </div>
      </div>
    `;
    adGrid.appendChild(card);
  });
}

function removeAd(index) {
  appState.ads.splice(index, 1);
  renderAdCards(appState.ads);
}

function initCustomizationPage() {
  redirectIfNotAuthenticated();

  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const notification = document.getElementById('notification');
  const descriptionInput = document.getElementById('companyDescription');
  const descriptionCount = document.getElementById('descriptionCount');

  const storedSettings = safeParseJSON(localStorage.getItem(storageKeys.customization), {});
  if (storedSettings.companyName) document.getElementById('companyName').value = storedSettings.companyName;
  if (storedSettings.companyEmail) document.getElementById('companyEmail').value = storedSettings.companyEmail;
  if (storedSettings.companyDescription) descriptionInput.value = storedSettings.companyDescription;
  if (storedSettings.contactPhone) document.getElementById('contactPhone').value = storedSettings.contactPhone;
  if (storedSettings.contactAddress) document.getElementById('contactAddress').value = storedSettings.contactAddress;
  if (storedSettings.footerText) document.getElementById('footerText').value = storedSettings.footerText;

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

  saveBtn?.addEventListener('click', (event) => {
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
      localStorage.setItem(storageKeys.customization, JSON.stringify(settings));
      showPageNotification('Content settings saved locally. Ready for backend sync.');
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
