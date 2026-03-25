// =============================================
// InternHub - Core JS
// =============================================


const API_BASE = '/api';

// ---- Auth State ----
let currentUser = null;
let authToken = localStorage.getItem('is_token');

// ---- Toast ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- API Helper ----
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(API_BASE + endpoint, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, message: 'Network error. Please try again.' };
  }
}

// ---- Auth Functions ----
async function checkAuth() {
  if (!authToken) return null;
  const res = await apiCall('/auth/me');
  if (res.ok) {
    currentUser = res.user;
    updateNavForUser();
    return res.user;
  } else {
    logout(false);
    return null;
  }
}

function updateNavForUser() {
  const guestActions = document.getElementById('guest-actions');
  const userActions = document.getElementById('user-actions');
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar-text');

  if (currentUser) {
    if (guestActions) guestActions.classList.add('hidden');
    if (userActions) userActions.classList.remove('hidden');
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userAvatarEl) userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();

    // Show/hide employer links
    const employerLinks = document.querySelectorAll('.employer-only');
    const studentLinks = document.querySelectorAll('.student-only');
    employerLinks.forEach(el => {
      el.style.display = (currentUser.role === 'employer' || currentUser.role === 'admin') ? '' : 'none';
    });
    studentLinks.forEach(el => {
      el.style.display = currentUser.role === 'student' ? '' : 'none';
    });
  } else {
    if (guestActions) guestActions.classList.remove('hidden');
    if (userActions) userActions.classList.add('hidden');
  }
}

function logout(redirect = true) {
  localStorage.removeItem('is_token');
  authToken = null;
  currentUser = null;
  updateNavForUser();
  if (redirect) {
    showToast('Logged out successfully', 'success');
    navigateTo('home');
  }
}

// ---- Modal ----
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ---- Navigation ----
function navigateTo(page, params = {}) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Load page data
  if (page === 'home') loadHomePage();
  else if (page === 'internships') loadInternshipsPage(params);
  else if (page === 'jobs') loadJobsPage(params);
  else if (page === 'dashboard') loadDashboard();
  else if (page === 'post') loadPostPage();
}

// ---- Format Helpers ----
function formatStipend(min, max) {
  if (!min && !max) return 'Unpaid';
  if (min === max) return `₹${(min / 1000).toFixed(0)}K/month`;
  return `₹${(min / 1000).toFixed(0)}K - ₹${(max / 1000).toFixed(0)}K/month`;
}

function formatSalary(min, max) {
  if (!min && !max) return 'Not disclosed';
  if (min === max) return `₹${(min / 100000).toFixed(1)} LPA`;
  return `₹${(min / 100000).toFixed(1)} - ₹${(max / 100000).toFixed(1)} LPA`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function getCompanyInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function daysLeft(dateStr) {
  if (!dateStr) return '';
  const diff = new Date(dateStr) - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Last day';
  return `${days} days left`;
}

// ---- Build Internship Card ----
function buildInternshipCard(item) {
  const isNew = (Date.now() - new Date(item.created_at)) < 3 * 86400000;
  return `
    <div class="card" onclick="viewDetail('internship', ${item.id})">
      ${isNew ? '<span class="badge-new">New</span>' : ''}
      <div class="card-top">
        <div class="company-logo">${getCompanyInitial(item.company_name)}</div>
        <button class="card-save-btn" onclick="event.stopPropagation(); toggleSave('internship', ${item.id}, this)" title="Save">
          ♡
        </button>
      </div>
      <div class="card-company">${item.company_name}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-tags">
        <span class="tag tag-primary">${item.type === 'work-from-home' ? '🏠 Remote' : item.type === 'hybrid' ? '🔀 Hybrid' : '🏢 In-office'}</span>
        ${item.location ? `<span class="tag">📍 ${item.location}</span>` : ''}
        <span class="tag">⏱ ${item.duration || 'N/A'}</span>
      </div>
      <div class="card-stipend">${formatStipend(item.stipend_min, item.stipend_max)}</div>
      <div class="card-footer">
        <span class="card-date">${timeAgo(item.created_at)}</span>
        <span class="tag tag-orange" style="font-size:11px">${daysLeft(item.apply_by)}</span>
      </div>
    </div>
  `;
}

// ---- Build Job Card ----
function buildJobCard(item) {
  const isNew = (Date.now() - new Date(item.created_at)) < 3 * 86400000;
  return `
    <div class="card" onclick="viewDetail('job', ${item.id})">
      ${isNew ? '<span class="badge-new">New</span>' : ''}
      <div class="card-top">
        <div class="company-logo">${getCompanyInitial(item.company_name)}</div>
        <button class="card-save-btn" onclick="event.stopPropagation(); toggleSave('job', ${item.id}, this)" title="Save">
          ♡
        </button>
      </div>
      <div class="card-company">${item.company_name}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-tags">
        <span class="tag tag-primary">${item.work_mode === 'work-from-home' ? '🏠 Remote' : item.work_mode === 'hybrid' ? '🔀 Hybrid' : '🏢 In-office'}</span>
        ${item.location ? `<span class="tag">📍 ${item.location}</span>` : ''}
        <span class="tag tag-purple">💼 ${item.type}</span>
      </div>
      <div class="card-stipend">${formatSalary(item.salary_min, item.salary_max)}</div>
      <div class="card-footer">
        <span class="card-date">${timeAgo(item.created_at)}</span>
        <span class="tag tag-green" style="font-size:11px">${item.openings} opening${item.openings > 1 ? 's' : ''}</span>
      </div>
    </div>
  `;
}

// ---- Save Toggle ----
async function toggleSave(type, id, btn) {
  if (!currentUser) {
    openModal('modal-login');
    return;
  }

  if (btn.classList.contains('saved')) {
    const res = await apiCall(`/saved/${type}/${id}`, 'DELETE');
    if (res.ok) {
      btn.classList.remove('saved');
      btn.innerHTML = '♡';
      showToast('Removed from saved', 'info');
    }
  } else {
    const res = await apiCall('/saved', 'POST', { listing_type: type, listing_id: id });
    if (res.ok) {
      btn.classList.add('saved');
      btn.innerHTML = '♥';
      showToast('Saved!', 'success');
    }
  }
}

// ---- Login Form ----
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await apiCall('/auth/login', 'POST', { email, password });

  if (res.ok) {
    authToken = res.token;
    localStorage.setItem('is_token', authToken);
    currentUser = res.user;
    updateNavForUser();
    closeModal('modal-login');
    showToast(`Welcome back, ${res.user.name}! 🎉`, 'success');
    if (res.user.role === 'employer') {
      navigateTo('dashboard');
    }
  } else {
    document.getElementById('login-error').textContent = res.message;
    document.getElementById('login-error').style.display = 'block';
  }

  btn.disabled = false;
  btn.textContent = 'Login';
});

// ---- Register Form ----
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const college = document.getElementById('reg-college').value;

  const res = await apiCall('/auth/register', 'POST', { name, email, password, role, college });

  if (res.ok) {
    authToken = res.token;
    localStorage.setItem('is_token', authToken);
    currentUser = res.user;
    updateNavForUser();
    closeModal('modal-register');
    showToast(`Account created! Welcome, ${res.user.name}! 🎉`, 'success');
    if (res.user.role === 'employer') navigateTo('dashboard');
  } else {
    document.getElementById('reg-error').textContent = res.message;
    document.getElementById('reg-error').style.display = 'block';
  }

  btn.disabled = false;
  btn.textContent = 'Create Account';
});

// ---- Home Page Loader ----
async function loadHomePage() {
  // Stats
  const statsRes = await apiCall('/stats');
  if (statsRes.ok) {
    const s = statsRes.data;
    document.getElementById('stat-internships').textContent = `${s.internships}+`;
    document.getElementById('stat-jobs').textContent = `${s.jobs}+`;
    document.getElementById('stat-companies').textContent = `${s.companies}+`;
    document.getElementById('stat-students').textContent = `${s.students}+`;
  }

  // Load featured internships
  const intRes = await apiCall('/internships?limit=6');
  const intGrid = document.getElementById('featured-internships');
  if (intRes.ok && intGrid) {
    intGrid.innerHTML = intRes.data.length
      ? intRes.data.map(buildInternshipCard).join('')
      : '<div class="empty-state"><p>No internships available yet.</p></div>';
  }

  // Load featured jobs
  const jobRes = await apiCall('/jobs?limit=6');
  const jobGrid = document.getElementById('featured-jobs');
  if (jobRes.ok && jobGrid) {
    jobGrid.innerHTML = jobRes.data.length
      ? jobRes.data.map(buildJobCard).join('')
      : '<div class="empty-state"><p>No jobs available yet.</p></div>';
  }

  // Load categories
  const catRes = await apiCall('/categories');
  const catGrid = document.getElementById('categories-grid');
  if (catRes.ok && catGrid) {
    catGrid.innerHTML = catRes.data.map(cat => `
      <div class="category-card" onclick="filterByCategory('${cat.name}')">
        <div class="category-icon">${cat.icon || '📋'}</div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">Explore →</div>
      </div>
    `).join('');
  }
}

function filterByCategory(name) {
  navigateTo('internships', { category: name });
  const catFilter = document.getElementById('filter-category');
  if (catFilter) catFilter.value = name;
}

// ---- Internships Page ----
let internshipPage = 1;
let internshipFilters = {};

async function loadInternshipsPage(params = {}) {
  if (params.category) {
    internshipFilters.category = params.category;
  }
  internshipPage = 1;
  fetchInternships();
}

async function fetchInternships() {
  const grid = document.getElementById('internships-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  const query = new URLSearchParams({
    ...internshipFilters,
    page: internshipPage,
    limit: 12
  }).toString();

  const res = await apiCall(`/internships?${query}`);

  if (res.ok) {
    grid.innerHTML = res.data.length
      ? res.data.map(buildInternshipCard).join('')
      : `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <h3>No internships found</h3>
          <p>Try adjusting your filters</p>
        </div>`;

    renderPagination('internship-pagination', res.pagination, (p) => {
      internshipPage = p;
      fetchInternships();
    });
  }
}

// ---- Jobs Page ----
let jobPage = 1;
let jobFilters = {};

async function loadJobsPage(params = {}) {
  if (params.category) jobFilters.category = params.category;
  jobPage = 1;
  fetchJobs();
}

async function fetchJobs() {
  const grid = document.getElementById('jobs-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  const query = new URLSearchParams({
    ...jobFilters,
    page: jobPage,
    limit: 12
  }).toString();

  const res = await apiCall(`/jobs?${query}`);

  if (res.ok) {
    grid.innerHTML = res.data.length
      ? res.data.map(buildJobCard).join('')
      : `<div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <h3>No jobs found</h3>
          <p>Try adjusting your filters</p>
        </div>`;

    renderPagination('job-pagination', res.pagination, (p) => {
      jobPage = p;
      fetchJobs();
    });
  }
}

// ---- Pagination ----
function renderPagination(containerId, pagination, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container || !pagination) return;

  const { page, pages } = pagination;
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="(${onPageChange.toString()})(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹</button>`;

  for (let i = 1; i <= Math.min(pages, 7); i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" onclick="(${onPageChange.toString()})(${page + 1})" ${page === pages ? 'disabled' : ''}>›</button>`;
  container.innerHTML = html;
}

// ---- Detail View ----
async function viewDetail(type, id) {
  const res = await apiCall(`/${type === 'internship' ? 'internships' : 'jobs'}/${id}`);
  if (!res.ok) { showToast('Failed to load details', 'error'); return; }

  const item = res.data;
  const overlay = document.getElementById('detail-modal');
  const content = document.getElementById('detail-content');

  const isInternship = type === 'internship';
  const compensation = isInternship
    ? formatStipend(item.stipend_min, item.stipend_max)
    : formatSalary(item.salary_min, item.salary_max);

  const skills = (item.skills_required || '').split(',').filter(Boolean);

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-logo">${getCompanyInitial(item.company_name)}</div>
      <div>
        <div class="detail-title">${item.title}</div>
        <div class="detail-company">${item.company_name}</div>
        <div class="card-tags" style="margin-top:10px">
          <span class="tag tag-primary">${isInternship ? item.type : item.work_mode}</span>
          ${item.location ? `<span class="tag">📍 ${item.location}</span>` : ''}
          ${isInternship ? `<span class="tag tag-orange">${item.category}</span>` : `<span class="tag tag-purple">${item.type}</span>`}
        </div>
      </div>
    </div>

    <div class="detail-meta">
      <div class="meta-item">
        <div class="meta-icon">💰</div>
        <div>
          <div style="font-weight:600;font-size:15px">${compensation}</div>
          <div style="font-size:12px;color:var(--text-muted)">${isInternship ? 'Stipend' : 'CTC'}</div>
        </div>
      </div>
      ${isInternship ? `
      <div class="meta-item">
        <div class="meta-icon">⏱</div>
        <div>
          <div style="font-weight:600;font-size:15px">${item.duration || 'N/A'}</div>
          <div style="font-size:12px;color:var(--text-muted)">Duration</div>
        </div>
      </div>` : `
      <div class="meta-item">
        <div class="meta-icon">💼</div>
        <div>
          <div style="font-weight:600;font-size:15px">${item.experience || 'Freshers welcome'}</div>
          <div style="font-size:12px;color:var(--text-muted)">Experience</div>
        </div>
      </div>`}
      <div class="meta-item">
        <div class="meta-icon">👥</div>
        <div>
          <div style="font-weight:600;font-size:15px">${item.openings} opening${item.openings > 1 ? 's' : ''}</div>
          <div style="font-size:12px;color:var(--text-muted)">Positions</div>
        </div>
      </div>
      <div class="meta-item">
        <div class="meta-icon">📅</div>
        <div>
          <div style="font-weight:600;font-size:15px">${item.apply_by ? new Date(item.apply_by).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : 'Open'}</div>
          <div style="font-size:12px;color:var(--text-muted)">Apply by</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>About the ${isInternship ? 'Internship' : 'Job'}</h3>
      <p>${item.description}</p>
    </div>

    ${skills.length ? `
    <div class="detail-section">
      <h3>Skills Required</h3>
      <div class="skills-list">
        ${skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('')}
      </div>
    </div>` : ''}

    ${item.perks || item.qualifications ? `
    <div class="detail-section">
      <h3>${isInternship ? 'Perks & Benefits' : 'Qualifications'}</h3>
      <p>${item.perks || item.qualifications}</p>
    </div>` : ''}

    <div class="detail-section" style="padding:20px;background:var(--border-light);border-radius:var(--radius)">
      <h3 style="margin-bottom:8px">About ${item.company_name}</h3>
      <p>${item.company_description || 'A growing company offering great opportunities.'}</p>
      ${item.company_website ? `<a href="${item.company_website}" target="_blank" style="color:var(--primary);font-size:14px;margin-top:8px;display:inline-block">Visit website →</a>` : ''}
    </div>
  `;

  // Apply button
  const applyBtn = document.getElementById('detail-apply-btn');
  applyBtn.onclick = () => applyToListing(type, id);
  applyBtn.textContent = 'Apply Now';
  applyBtn.disabled = false;

  // Check if already applied
  if (currentUser && currentUser.role === 'student') {
    const checkRes = await apiCall(`/applications/check/${type}/${id}`);
    if (checkRes.ok && checkRes.applied) {
      applyBtn.textContent = '✓ Already Applied';
      applyBtn.disabled = true;
    }
  }

  openModal('detail-modal');
}

async function applyToListing(type, id) {
  if (!currentUser) {
    closeModal('detail-modal');
    openModal('modal-login');
    return;
  }

  if (currentUser.role === 'employer') {
    showToast('Employers cannot apply to listings', 'error');
    return;
  }

  // Show apply modal
  document.getElementById('apply-type').value = type;
  document.getElementById('apply-id').value = id;
  closeModal('detail-modal');
  openModal('modal-apply');
}

// Apply form submit
document.getElementById('apply-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  const listing_type = document.getElementById('apply-type').value;
  const listing_id = document.getElementById('apply-id').value;
  const cover_letter = document.getElementById('apply-cover').value;
  const availability = document.getElementById('apply-availability').value;

  const res = await apiCall('/applications', 'POST', { listing_type, listing_id, cover_letter, availability });

  if (res.ok) {
    closeModal('modal-apply');
    showToast('Application submitted successfully! 🎉', 'success');
    e.target.reset();
  } else {
    showToast(res.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Submit Application';
});

// ---- Dashboard ----
async function loadDashboard() {
  if (!currentUser) {
    openModal('modal-login');
    return;
  }

  if (currentUser.role === 'student') {
    loadStudentDashboard();
  } else if (currentUser.role === 'employer') {
    loadEmployerDashboard();
  }
}

async function loadStudentDashboard() {
  const studentDash = document.getElementById('student-dashboard');
  const employerDash = document.getElementById('employer-dashboard');
  if (studentDash) studentDash.classList.remove('hidden');
  if (employerDash) employerDash.classList.add('hidden');

  // Load applications
  const res = await apiCall('/applications/my');
  const container = document.getElementById('my-applications');
  if (res.ok && container) {
    if (res.data.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📄</div><h3>No applications yet</h3><p>Apply to internships and jobs to see them here</p></div>`;
    } else {
      container.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Company</th>
                <th>Type</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${res.data.map(app => `
                <tr>
                  <td><strong>${app.title}</strong></td>
                  <td>${app.company_name}</td>
                  <td><span class="tag tag-primary">${app.listing_type}</span></td>
                  <td>${new Date(app.applied_at).toLocaleDateString('en-IN')}</td>
                  <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Load saved
  const savedRes = await apiCall('/saved/my');
  const savedContainer = document.getElementById('my-saved');
  if (savedRes.ok && savedContainer) {
    if (savedRes.data.length === 0) {
      savedContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔖</div><h3>Nothing saved yet</h3><p>Save internships and jobs to view them here</p></div>`;
    } else {
      savedContainer.innerHTML = `<div class="cards-grid">${savedRes.data.map(item =>
        item.listing_type === 'internship' ? buildInternshipCard(item) : buildJobCard(item)
      ).join('')}</div>`;
    }
  }
}

async function loadEmployerDashboard() {
  const studentDash = document.getElementById('student-dashboard');
  const employerDash = document.getElementById('employer-dashboard');
  if (studentDash) studentDash.classList.add('hidden');
  if (employerDash) employerDash.classList.remove('hidden');

  const res = await apiCall('/employer/dashboard');
  if (!res.ok) return;

  const d = res.data;
  const el = (id) => document.getElementById(id);

  if (el('emp-stat-internships')) el('emp-stat-internships').textContent = d.active_internships;
  if (el('emp-stat-jobs')) el('emp-stat-jobs').textContent = d.active_jobs;
  if (el('emp-stat-applications')) el('emp-stat-applications').textContent = d.total_applications;

  const listingsContainer = document.getElementById('my-listings');
  if (listingsContainer) {
    const allListings = [
      ...d.recent_internships.map(i => ({ ...i, ltype: 'internship' })),
      ...d.recent_jobs.map(j => ({ ...j, ltype: 'job' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (allListings.length === 0) {
      listingsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No listings yet</h3><p>Post an internship or job to get started</p></div>`;
    } else {
      listingsContainer.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Title</th><th>Type</th><th>Posted</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${allListings.map(item => `
                <tr>
                  <td><strong>${item.title}</strong></td>
                  <td><span class="tag tag-primary">${item.ltype}</span></td>
                  <td>${new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                  <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                  <td>
                    <button class="btn btn-sm btn-ghost" onclick="viewApplications('${item.ltype}', ${item.id})">Applications</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}

async function viewApplications(type, id) {
  const res = await apiCall(`/applications/employer/${type}/${id}`);
  if (!res.ok) { showToast('Failed to load applications', 'error'); return; }

  const container = document.getElementById('applications-list');
  if (!container) return;

  if (res.data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No applications yet</h3></div>`;
  } else {
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Applicant</th><th>Email</th><th>College</th><th>Applied</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${res.data.map(app => `
              <tr>
                <td><strong>${app.applicant_name}</strong></td>
                <td>${app.applicant_email}</td>
                <td>${app.college || 'N/A'}</td>
                <td>${new Date(app.applied_at).toLocaleDateString('en-IN')}</td>
                <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                <td>
                  <select onchange="updateAppStatus(${app.id}, this.value)" class="filter-select" style="min-width:120px;padding:5px 8px;font-size:12px">
                    <option value="pending" ${app.status==='pending'?'selected':''}>Pending</option>
                    <option value="reviewed" ${app.status==='reviewed'?'selected':''}>Reviewed</option>
                    <option value="shortlisted" ${app.status==='shortlisted'?'selected':''}>Shortlisted</option>
                    <option value="rejected" ${app.status==='rejected'?'selected':''}>Rejected</option>
                    <option value="hired" ${app.status==='hired'?'selected':''}>Hired</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Switch to applications tab
  document.querySelectorAll('#employer-dashboard .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#employer-dashboard .tab-content').forEach(c => c.classList.add('hidden'));
  const appsTab = document.getElementById('tab-applications');
  if (appsTab) { appsTab.classList.remove('hidden'); }
}

async function updateAppStatus(id, status) {
  const res = await apiCall(`/applications/${id}/status`, 'PUT', { status });
  if (res.ok) {
    showToast('Status updated', 'success');
  } else {
    showToast('Failed to update status', 'error');
  }
}

// ---- Post Listing ----
function loadPostPage() {
  if (!currentUser) {
    openModal('modal-login');
    navigateTo('home');
    return;
  }
  if (currentUser.role !== 'employer') {
    showToast('Only employers can post listings', 'error');
    navigateTo('home');
  }
}

document.getElementById('post-internship-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  const data = {};
  new FormData(e.target).forEach((val, key) => { data[key] = val; });

  const res = await apiCall('/internships', 'POST', data);
  if (res.ok) {
    showToast('Internship posted successfully! 🎉', 'success');
    e.target.reset();
    navigateTo('dashboard');
  } else {
    showToast(res.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Post Internship';
});

document.getElementById('post-job-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  const data = {};
  new FormData(e.target).forEach((val, key) => { data[key] = val; });

  const res = await apiCall('/jobs', 'POST', data);
  if (res.ok) {
    showToast('Job posted successfully! 🎉', 'success');
    e.target.reset();
    navigateTo('dashboard');
  } else {
    showToast(res.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Post Job';
});

// ---- Filter Event Listeners ----
function setupFilters() {
  // Internship filters
  ['filter-category', 'filter-type', 'filter-location', 'filter-stipend'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      internshipFilters = {
        category: document.getElementById('filter-category')?.value || '',
        type: document.getElementById('filter-type')?.value || '',
        location: document.getElementById('filter-location')?.value || '',
        stipend_min: document.getElementById('filter-stipend')?.value || '',
        keyword: document.getElementById('filter-keyword')?.value || ''
      };
      Object.keys(internshipFilters).forEach(k => !internshipFilters[k] && delete internshipFilters[k]);
      internshipPage = 1;
      fetchInternships();
    });
  });

  document.getElementById('filter-search-btn')?.addEventListener('click', () => {
    internshipFilters.keyword = document.getElementById('filter-keyword')?.value || '';
    if (!internshipFilters.keyword) delete internshipFilters.keyword;
    internshipPage = 1;
    fetchInternships();
  });

  // Job filters
  ['job-filter-category', 'job-filter-type', 'job-filter-mode', 'job-filter-salary'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      jobFilters = {
        category: document.getElementById('job-filter-category')?.value || '',
        type: document.getElementById('job-filter-type')?.value || '',
        work_mode: document.getElementById('job-filter-mode')?.value || '',
        salary_min: document.getElementById('job-filter-salary')?.value || '',
        keyword: document.getElementById('job-filter-keyword')?.value || ''
      };
      Object.keys(jobFilters).forEach(k => !jobFilters[k] && delete jobFilters[k]);
      jobPage = 1;
      fetchJobs();
    });
  });

  document.getElementById('job-search-btn')?.addEventListener('click', () => {
    jobFilters.keyword = document.getElementById('job-filter-keyword')?.value || '';
    if (!jobFilters.keyword) delete jobFilters.keyword;
    jobPage = 1;
    fetchJobs();
  });
}

// ---- Hero Search ----
document.getElementById('hero-search-btn')?.addEventListener('click', () => {
  const keyword = document.getElementById('hero-search').value;
  const activeTab = document.querySelector('.hero-tab.active')?.dataset.type || 'internships';
  if (activeTab === 'internships') {
    internshipFilters = { keyword };
    navigateTo('internships');
  } else {
    jobFilters = { keyword };
    navigateTo('jobs');
  }
});

document.getElementById('hero-search')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('hero-search-btn').click();
});

// Hero tabs
document.querySelectorAll('.hero-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.hero-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// User dropdown
document.getElementById('user-avatar')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('user-dropdown')?.classList.toggle('open');
});

document.addEventListener('click', () => {
  document.getElementById('user-dropdown')?.classList.remove('open');
});

// Dashboard tab switching
function switchTab(tabGroup, tabId, contentId) {
  document.querySelectorAll(`#${tabGroup} .tab-btn`).forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`#${tabGroup} .tab-content`).forEach(c => c.classList.add('hidden'));
  document.getElementById(tabId)?.classList.add('active');
  const content = document.getElementById(contentId);
  if (content) content.classList.remove('hidden');
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupFilters();
  navigateTo('home');
});
