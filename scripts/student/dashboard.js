// Student Dashboard Script

const API_BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = {
    MATERIALS: `${API_BASE_URL}/materials`,
    EVENTS: `${API_BASE_URL}/events`,
    CHANGE_PASSCODE: `${API_BASE_URL}/change-password`
};

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const materialsBody = document.getElementById('materialsBody');
const materialsError = document.getElementById('materialsError');
const eventsList = document.getElementById('eventsList');
const eventsError = document.getElementById('eventsError');
const passcodeForm = document.getElementById('passcodeForm');
const passcodeFormMessage = document.getElementById('passcodeFormMessage');
const logoutBtn = document.getElementById('logoutBtn');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');
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
function showFormMessage(message, type = 'success') {
    if (passcodeFormMessage) {
        passcodeFormMessage.textContent = message;
        passcodeFormMessage.className = `form-message ${type}`;
    }
}

// Utility: Clear form message
function clearFormMessage() {
    if (passcodeFormMessage) {
        passcodeFormMessage.textContent = '';
        passcodeFormMessage.className = 'form-message';
    }
}

// Fetch and display course materials
async function loadMaterials() {
    materialsError.style.display = 'none';
    materialsBody.innerHTML = `<tr><td colspan="4" class="loading">Loading materials...</td></tr>`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.MATERIALS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch materials');
        const materials = await res.json();
        if (!materials.length) {
            materialsBody.innerHTML = `<tr><td colspan="4">No materials available.</td></tr>`;
            return;
        }
        materialsBody.innerHTML = materials.map(mat => `
            <tr>
                <td>${mat.courseTitle}</td>
                <td>${mat.type.toUpperCase()}</td>
                <td>${mat.fileName}</td>
                <td>
                    <a href="${mat.filePath || `/uploads/${mat.fileName}`}" class="download-link" target="_blank" rel="noopener" aria-label="Download ${mat.fileName}">
                        <i class="fas fa-download"></i> Download
                    </a>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        materialsBody.innerHTML = '';
        materialsError.textContent = 'Unable to load materials. Please try again later.';
        materialsError.style.display = 'block';
    }
}

// Fetch and display events/news
async function loadEvents() {
    eventsError.style.display = 'none';
    eventsList.innerHTML = `<div class="loading">Loading events...</div>`;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.EVENTS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch events');
        const events = await res.json();
        if (!events.length) {
            eventsList.innerHTML = `<div>No upcoming events at the moment.</div>`;
            return;
        }
        eventsList.innerHTML = events.map(ev => `
            <div class="event-card" tabindex="0" aria-label="${ev.title}">
                <div class="event-title">${ev.title}</div>
                <div class="event-date"><i class="fas fa-calendar-alt"></i> ${formatDate(ev.eventDate)}</div>
                <div class="event-desc">${ev.description || ''}</div>
            </div>
        `).join('');
    } catch (err) {
        eventsList.innerHTML = '';
        eventsError.textContent = 'Unable to load events. Please try again later.';
        eventsError.style.display = 'block';
    }
}

// Handle passcode change
async function handlePasscodeChange(e) {
    e.preventDefault();
    clearFormMessage();
    // Clear errors
    ['currentPasscodeError', 'newPasscodeError', 'confirmPasscodeError'].forEach(id => clearError(document.getElementById(id)));

    const currentPasscode = passcodeForm.currentPasscode.value.trim();
    const newPasscode = passcodeForm.newPasscode.value.trim();
    const confirmPasscode = passcodeForm.confirmPasscode.value.trim();

    let valid = true;

    if (!currentPasscode) {
        showError(document.getElementById('currentPasscodeError'), 'Current passcode is required.');
        valid = false;
    }
    if (!newPasscode) {
        showError(document.getElementById('newPasscodeError'), 'New passcode is required.');
        valid = false;
    } else if (newPasscode.length < 6) {
        showError(document.getElementById('newPasscodeError'), 'Passcode must be at least 6 characters.');
        valid = false;
    }
    if (!confirmPasscode) {
        showError(document.getElementById('confirmPasscodeError'), 'Please confirm your new passcode.');
        valid = false;
    } else if (newPasscode !== confirmPasscode) {
        showError(document.getElementById('confirmPasscodeError'), 'Passcodes do not match.');
        valid = false;
    }
    if (!valid) return;

    // Submit to backend
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(ENDPOINTS.CHANGE_PASSCODE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPasscode,
                newPasscode
            })
        });
        const result = await res.json();
        if (res.ok) {
            showFormMessage('Passcode changed successfully!', 'success');
            passcodeForm.reset();
        } else {
            showFormMessage(result.message || 'Failed to change passcode.', 'error');
        }
    } catch (err) {
        showFormMessage('An error occurred. Please try again.', 'error');
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

// Toggle password visibility
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.closest('.input-group').querySelector('input');
        if (input) {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        }
    });
});

// On DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = getCurrentUser();
    if (!user || !localStorage.getItem('token')) {
        window.location.href = '/pages/login.html';
        return;
    }
    // Set welcome message
    welcomeMessage.textContent = `Welcome, ${user.name || 'Student'}`;

    // Load data
    loadMaterials();
    loadEvents();

    // Passcode form
    passcodeForm?.addEventListener('submit', handlePasscodeChange);

    // Logout
    logoutBtn?.addEventListener('click', handleLogout);
});