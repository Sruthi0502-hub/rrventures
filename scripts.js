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
  ads: [...dummyAds],
};

function initPage() {
  const page = document.body.dataset.page;
  if (page === 'login') attachAuthListeners('login');
  if (page === 'signup') attachAuthListeners('signup');
  if (page === 'services') initServicesPage();
  if (page === 'ads') initAdsPage();
  if (page === 'customization') initCustomizationPage();
}

function attachAuthListeners(type) {
  const form = document.getElementById(type === 'login' ? 'loginForm' : 'signupForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const targetUrl = type === 'login' ? 'dashboard.html' : 'dashboard.html';
    window.location.href = targetUrl;
  });
}

function initServicesPage() {
  renderServiceRows(appState.services);
  const searchInput = document.getElementById('serviceSearch');
  const statusFilter = document.getElementById('statusFilter');
  const addButton = document.getElementById('openServiceModal');
  const modal = document.getElementById('serviceModal');
  const closeModal = document.getElementById('closeServiceModal');
  const serviceForm = document.getElementById('newServiceForm');

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

  addButton?.addEventListener('click', () => modal.classList.add('active'));
  closeModal?.addEventListener('click', () => modal.classList.remove('active'));
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.remove('active');
  });

  serviceForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('serviceName').value.trim();
    const description = document.getElementById('serviceDescription').value.trim();
    const status = document.getElementById('serviceStatus').value;
    if (!name || !description) return;
    const created = new Date().toISOString().slice(0, 10);
    appState.services.unshift({ id: Date.now(), name, description, status, dateCreated: created });
    renderServiceRows(appState.services);
    modal.classList.remove('active');
    serviceForm.reset();
    searchInput.value = '';
    statusFilter.value = 'All';
  });
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
        <button class="btn btn-secondary action-btn" type="button" onclick="alert('Edit placeholder for ${service.name}')">Edit</button>
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
  renderAdCards(appState.ads);
  const form = document.getElementById('newAdForm');
  const titleInput = document.getElementById('adTitle');
  const imageInput = document.getElementById('adImage');
  const preview = document.getElementById('imagePreview');

  imageInput?.addEventListener('input', () => {
    const url = imageInput.value.trim();
    preview.style.backgroundImage = url ? `url('${url}')` : 'none';
    preview.textContent = url ? '' : 'Image preview';
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const image = imageInput.value.trim();
    const title = titleInput.value.trim().substring(0, 30);
    const description = document.getElementById('adDescription').value.trim();
    if (!image || !title || !description) return;
    appState.ads.unshift({ title, description, image });
    renderAdCards(appState.ads);
    form.reset();
    preview.style.backgroundImage = 'none';
    preview.textContent = 'Image preview';
  });
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
          <button class="btn btn-secondary" type="button" onclick="alert('Edit placeholder for ${ad.title}')">Edit</button>
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
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const notification = document.getElementById('notification');
  const descriptionInput = document.getElementById('companyDescription');
  const descriptionCount = document.getElementById('descriptionCount');

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

  const showNotification = (message, type = 'success') => {
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
      showNotification('Company name is required.', 'error');
      return false;
    }
    if (!companyEmail) {
      showNotification('Company email is required.', 'error');
      return false;
    }
    if (!emailRegex.test(companyEmail)) {
      showNotification('Please enter a valid email address.', 'error');
      return false;
    }
    return true;
  };

  saveBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    if (validateForm()) {
      initialValues.companyName = document.getElementById('companyName').value;
      initialValues.companyEmail = document.getElementById('companyEmail').value;
      initialValues.companyDescription = document.getElementById('companyDescription').value;
      initialValues.contactPhone = document.getElementById('contactPhone').value;
      initialValues.contactAddress = document.getElementById('contactAddress').value;
      initialValues.footerText = document.getElementById('footerText').value;
      showNotification('Content settings saved successfully! Backend sync pending.');
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
    showNotification('Form reset to last saved values.');
  });
}

window.addEventListener('DOMContentLoaded', initPage);
