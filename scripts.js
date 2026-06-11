
const API_URL = "https://dashboard-management-u6vj.onrender.com"

const storageKeys = {
  token: 'token',
  user: 'user'
};


const dummyServices = [
  { id: 1, name: 'Website Development', description: 'Modern landing pages and custom e-commerce solutions.', status: 'Active', dateCreated: '2026-04-09' },
  { id: 2, name: 'SEO Strategy', description: 'Keyword audits, content planning, and backlink management.', status: 'Active', dateCreated: '2026-05-14' },
  { id: 3, name: 'Social Campaign', description: 'Creative ads and performance tracking for your social spend.', status: 'Paused', dateCreated: '2026-03-22' },
  { id: 4, name: 'Analytics Audit', description: 'Improve conversions with data-backed product insights.', status: 'Draft', dateCreated: '2026-06-01' }
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

// 3. Axios Interceptor Fix (Agar tum Axios use kar rahe ho toh)
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
    // URL ekdum perfect clean banega bina kisi mix-up ke
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    // Response parse karne ki koshish karo
    const payload = await response.json().catch(() => ({}));

    // Agar status code 200-299 ke beech nahi hai (e.g., 400, 401, 404, 500)
    if (!response.ok) {
      // Backend agar NestJS hai toh wo error message 'message' field me bhejta hai
      const errorMsg = Array.isArray(payload.message)
        ? payload.message.join(', ') // Validation errors ke liye
        : payload.message || response.statusText || 'Kuch gadbad ho gayi!';
      throw new Error(errorMsg);
    }

    return payload;
  } catch (error) {
    // Agar internet band ho ya server crash ho gaya ho
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Server se connect nahi ho pa rha hai. Kripya thoda intezar karein.');
    }
    throw error; // Jo error aayi hai use aage pass karo
  }
}

async function loginUser(payload) {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Agar backend se token aur user data sahi aaya toh save karo
    if (data && data.token) {
      setToken(data.token);
      if (data.user) {
        localStorage.setItem(storageKeys.user, JSON.stringify(data.user));
      }
    }
    return data;
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error; // Isko form submit handler pakdega aur UI par alert dikhayega
  }
}

// --- 1. Signup API Core Function ---
async function signupUser(payload) {
  try {
    // apiFetch ko bilkul sahi clean path bhej rahe hain
    return await apiFetch('/auth/create-super-admin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Signup Error in Method:", error.message);
    throw error; // Is error ko neeche wala event listener pakdega aur UI par dikhayega
  }
}

// --- 2. Signup Form Submit Handler (DOM Connection) ---
// HTML ke form id 'signupForm' ko target kiya
const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Page ko automatic reload hone se rokne ke liye

    // Tumhaare HTML ke exact IDs ko pakda
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const statusDiv = document.getElementById('signupStatus');

    // UI par loading state dikhane ke liye (Blue Color)
    if (statusDiv) {
      statusDiv.style.color = '#3182ce';
      statusDiv.style.display = 'block';
      statusDiv.textContent = 'Account create ho rha hai, kripya intezar karein...';
    }

    // Data payload taiyar kiya
    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    try {
      // API call kiya
      const response = await signupUser(payload);

      // Success State (Green Color)
      if (statusDiv) {
        statusDiv.style.color = '#38a169';
        statusDiv.textContent = 'Signup Successful! Log in page par bheja ja rha hai...';
      }

      // Input fields ko saaf (clear) kar diya
      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';

      // 2 second ka delay dekar user ko login page (index.html) par bhej diya
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);

    } catch (error) {
      // Error State (Red Color)
      // Jo bhi error backend (NestJS) se aayegi ya network crash hoga, wo yahan dikhega
      if (statusDiv) {
        statusDiv.style.color = '#e53e3e';
        statusDiv.textContent = error.message;
      }
    }
  });
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
    const status = document.getElementById('serviceStatus').value;
    if (!name || !description) return;

    if (id) {
      const service = appState.services.find((item) => item.id === id);
      if (service) {
        service.name = name;
        service.description = description;
        service.status = status;
      }
    } else {
      appState.services.unshift({
        id: Date.now(),
        name,
        description,
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
      <tr><td colspan="5" class="table-empty">
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
    row.innerHTML = `
      <td>
        <div class="name-cell">
          <strong>${service.name}</strong>
        </div>
      </td>
      <td>${service.description}</td>
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
