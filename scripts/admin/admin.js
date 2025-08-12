// Admin Dashboard Script

const API_BASE_URL = '/api'; // Changed from http://localhost:3000/api
const ENDPOINTS = {
    PENDING: `${API_BASE_URL}/pending-registrations`,
    CONFIRM: `${API_BASE_URL}/confirm-registration`,
    MATERIALS: `${API_BASE_URL}/materials`,
    EVENTS: `${API_BASE_URL}/events`
};

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const pendingBody = document.getElementById('pendingBody');
const pendingError = document.getElementById('pendingError');
const materialForm = document.getElementById('materialForm');
const materialFormMessage = document.getElementById('materialFormMessage');
const materialsBody = document.getElementById('materialsBody');
const materialsError = document.getElementById('materialsError');
const eventForm = document.getElementById('eventForm');
const eventFormMessage = document.getElementById('eventFormMessage');
const eventsBody = document.getElementById('eventsBody');
const eventsError = document.getElementById('eventsError');
const logoutBtn = document.getElementById('logoutBtn');
const mainNav = document.querySelector('.main-nav');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

// Utility: Get current user from localStorage
function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user;
    } catch {
        return null;
    }
}

// Utility: Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Utility: Show error message
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('error');
        element.style.display = 'block';
    }
}

// Utility: Clear error message
function clearError(element) {
    if (element) {
        element.textContent = '';
        element.classList.remove('error');
        element.style.display = '';
    }
}

// Utility: Show form message
function showFormMessage(element, message, type = 'success') {
    if (element) {
        element.textContent = message;
        element.className = `form-message ${type}`;
    }
}

// Utility: Clear form message
function clearFormMessage(element) {
    if (element) {
        element.textContent = '';
        element.className = 'form-message';
    }
}

// Fetch and display pending registrations
async function loadPendingRegistrations() {
    pendingError.style.display = 'none';
    pendingBody.innerHTML = `<tr><td colspan="4" class="loading">Loading pending registrations...</td></tr>`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.PENDING, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch pending registrations');
        const pending = await res.json();
        if (!pending.length) {
            pendingBody.innerHTML = `<tr><td colspan="4">No pending registrations.</td></tr>`;
            return;
        }
        pendingBody.innerHTML = pending.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.regNumber}</td>
                <td>${user.email}</td>
                <td>
                    <button class="action-btn btn-confirm" data-userid="${user.id}" aria-label="Confirm registration for ${user.name}">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                </td>
            </tr>
        `).join('');
        // Attach event listeners for confirm buttons
        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', handleConfirmRegistration);
        });
    } catch (err) {
        pendingBody.innerHTML = '';
        pendingError.textContent = 'Unable to load pending registrations. Please try again later.';
        pendingError.style.display = 'block';
    }
}

// Confirm registration
async function handleConfirmRegistration(e) {
    const userId = e.currentTarget.getAttribute('data-userid');
    if (!userId) return;
    e.currentTarget.disabled = true;
    e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Confirming...`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.CONFIRM, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });
        const result = await res.json();
        if (res.ok) {
            alert(`Registration confirmed. Passcode sent to student email.`);
            loadPendingRegistrations();
        } else {
            alert(result.message || 'Failed to confirm registration.');
        }
    } catch (err) {
        alert('An error occurred. Please try again.');
    }
}

// Fetch and display uploaded materials
async function loadMaterials() {
    materialsError.style.display = 'none';
    materialsBody.innerHTML = `<tr><td colspan="5" class="loading">Loading materials...</td></tr>`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.MATERIALS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch materials');
        const materials = await res.json();
        if (!materials.length) {
            materialsBody.innerHTML = `<tr><td colspan="5">No materials uploaded.</td></tr>`;
            return;
        }
        materialsBody.innerHTML = materials.map(mat => `
            <tr>
                <td>${mat.courseTitle}</td>
                <td>${mat.type.toUpperCase()}</td>
                <td>${mat.fileName}</td>
                <td>${formatDate(mat.createdAt)}</td>
                <td>
                    <button class="action-btn btn-delete" data-materialid="${mat.id}" aria-label="Delete material ${mat.fileName}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
        // Attach event listeners for delete buttons
        document.querySelectorAll('.btn-delete[data-materialid]').forEach(btn => {
            btn.addEventListener('click', handleDeleteMaterial);
        });
    } catch (err) {
        materialsBody.innerHTML = '';
        materialsError.textContent = 'Unable to load materials. Please try again later.';
        materialsError.style.display = 'block';
    }
}

// Delete material
async function handleDeleteMaterial(e) {
    const materialId = e.currentTarget.getAttribute('data-materialid');
    if (!materialId) return;
    if (!confirm('Are you sure you want to delete this material?')) return;
    e.currentTarget.disabled = true;
    e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${ENDPOINTS.MATERIALS}/${materialId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            loadMaterials();
        } else {
            alert(result.message || 'Failed to delete material.');
        }
    } catch (err) {
        alert('An error occurred. Please try again.');
    }
}

// Fetch and display events
async function loadEvents() {
    eventsError.style.display = 'none';
    eventsBody.innerHTML = `<tr><td colspan="5" class="loading">Loading events...</td></tr>`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.EVENTS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch events');
        const events = await res.json();
        if (!events.length) {
            eventsBody.innerHTML = `<tr><td colspan="5">No events posted.</td></tr>`;
            return;
        }
        eventsBody.innerHTML = events.map(ev => `
            <tr>
                <td>${ev.title}</td>
                <td>${formatDate(ev.eventDate)}</td>
                <td>${ev.description || ''}</td>
                <td>
                    ${ev.imageUrl ? `<img src="${ev.imageUrl}" alt="Event image" style="max-width:60px;max-height:40px;border-radius:4px;">` : ''}
                </td>
                <td>
                    <button class="action-btn btn-delete" data-eventid="${ev.id}" aria-label="Delete event ${ev.title}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
        // Attach event listeners for delete buttons
        document.querySelectorAll('.btn-delete[data-eventid]').forEach(btn => {
            btn.addEventListener('click', handleDeleteEvent);
        });
    } catch (err) {
        eventsBody.innerHTML = '';
        eventsError.textContent = 'Unable to load events. Please try again later.';
        eventsError.style.display = 'block';
    }
}

// Delete event
async function handleDeleteEvent(e) {
    const eventId = e.currentTarget.getAttribute('data-eventid');
    if (!eventId) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    e.currentTarget.disabled = true;
    e.currentTarget.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${ENDPOINTS.EVENTS}/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            loadEvents();
        } else {
            alert(result.message || 'Failed to delete event.');
        }
    } catch (err) {
        alert('An error occurred. Please try again.');
    }
}

// Handle material upload
async function handleMaterialForm(e) {
    e.preventDefault();
    clearFormMessage(materialFormMessage);
    // Clear errors
    ['courseTitleError', 'materialTypeError', 'materialFileError'].forEach(id => clearError(document.getElementById(id)));

    const courseTitle = materialForm.courseTitle.value.trim();
    const materialType = materialForm.materialType.value;
    const fileInput = materialForm.materialFile;
    const file = fileInput.files[0];

    let valid = true;
    if (!courseTitle) {
        showError(document.getElementById('courseTitleError'), 'Course title is required.');
        valid = false;
    }
    if (!materialType) {
        showError(document.getElementById('materialTypeError'), 'Material type is required.');
        valid = false;
    }
    if (!file) {
        showError(document.getElementById('materialFileError'), 'Please select a file.');
        valid = false;
    } else {
        const allowedTypes = {
            pdf: ['application/pdf'],
            pptx: [
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-powerpoint'
            ],
            docx: [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword'
            ],
            video: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
        };
        const fileType = file.type;
        if (!Object.values(allowedTypes).flat().includes(fileType)) {
            showError(document.getElementById('materialFileError'), 'Invalid file type.');
            valid = false;
        }
    }
    if (!valid) return;

    // Prepare form data
    const formData = new FormData();
    formData.append('courseTitle', courseTitle);
    formData.append('type', materialType);
    formData.append('materialFile', file);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.MATERIALS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const result = await res.json();
        if (res.ok) {
            showFormMessage(materialFormMessage, 'Material uploaded successfully!', 'success');
            materialForm.reset();
            loadMaterials();
        } else {
            showFormMessage(materialFormMessage, result.message || 'Failed to upload material.', 'error');
        }
    } catch (err) {
        showFormMessage(materialFormMessage, 'An error occurred. Please try again.', 'error');
    }
}

// Handle event post
async function handleEventForm(e) {
    e.preventDefault();
    clearFormMessage(eventFormMessage);
    // Clear errors
    ['eventTitleError', 'eventDateError', 'eventDescError', 'eventImageError'].forEach(id => clearError(document.getElementById(id)));

    const eventTitle = eventForm.eventTitle.value.trim();
    const eventDate = eventForm.eventDate.value;
    const eventDesc = eventForm.eventDesc.value.trim();
    const imageInput = eventForm.eventImage;
    const imageFile = imageInput.files[0];

    let valid = true;
    if (!eventTitle) {
        showError(document.getElementById('eventTitleError'), 'Event title is required.');
        valid = false;
    }
    if (!eventDate) {
        showError(document.getElementById('eventDateError'), 'Event date is required.');
        valid = false;
    }
    if (!eventDesc) {
        showError(document.getElementById('eventDescError'), 'Description is required.');
        valid = false;
    }
    if (imageFile && !imageFile.type.startsWith('image/')) {
        showError(document.getElementById('eventImageError'), 'Invalid image file.');
        valid = false;
    }
    if (!valid) return;

    // Prepare form data
    const formData = new FormData();
    formData.append('title', eventTitle);
    formData.append('eventDate', eventDate);
    formData.append('description', eventDesc);
    if (imageFile) formData.append('image', imageFile);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.EVENTS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const result = await res.json();
        if (res.ok) {
            showFormMessage(eventFormMessage, 'Event posted successfully!', 'success');
            eventForm.reset();
            loadEvents();
        } else {
            showFormMessage(eventFormMessage, result.message || 'Failed to post event.', 'error');
        }
    } catch (err) {
        showFormMessage(eventFormMessage, 'An error occurred. Please try again.', 'error');
    }
}

// Logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
}

// Toggle mobile menu
mobileMenuBtn?.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (mainNav?.classList.contains('active') &&
        !e.target.closest('.main-nav') &&
        !e.target.closest('.mobile-menu-btn')) {
        mainNav.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// On DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and role
    const user = getCurrentUser();
    if (!user || !localStorage.getItem('token') || user.role !== 'admin') {
        window.location.href = '/pages/login.html';
        return;
    }
    // Set welcome message
    welcomeMessage.textContent = `Welcome, ${user.name || 'Admin'}`;

    // Load data
    loadPendingRegistrations();
    loadMaterials();
    loadEvents();
});