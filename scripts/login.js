// Student Login and Registration Script

// Configuration
const API_BASE_URL = '/api';
const ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/login`,
    SIGNUP: `${API_BASE_URL}/signup`
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const showLoginLink = document.getElementById('showLogin');
const forgotPasswordLink = document.getElementById('forgotPassword');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');

// State
let currentTab = 'login';

// Utility Functions
const showError = (id, message) => {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
};

const clearErrors = (formId) => {
    const form = document.getElementById(formId);
    if (form) {
        const errors = form.querySelectorAll('.error');
        errors.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        const errorMessage = form.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    }
};

// Validation Functions
const validateRegNumber = (regNumber) => {
    if (!regNumber || typeof regNumber !== 'string') return false;
    
    // Updated pattern to be more flexible with departments and codes
    const regex = /^\d{2}\/[A-Z]{2}\/[A-Z]{2}\/\d{3}$/i;
    return regex.test(regNumber.trim());
};

// Updated email validation - now accepts all valid email formats
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    // Standard email validation regex
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
};

// Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formId = form.id;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Clear previous errors
    clearErrors(formId);
    
    // Client-side validation
    let isValid = true;
    
    if (formId === 'loginForm') {
        if (!data.regNumber.trim()) {
            showError('loginRegNumberError', 'Registration number is required');
            isValid = false;
        } else if (!validateRegNumber(data.regNumber)) {
            showError('loginRegNumberError', 'Invalid format. Use: YY/SC/CO/XXX');
            isValid = false;
        }
        
        if (!data.passcode.trim()) {
            showError('loginPasscodeError', 'Passcode is required');
            isValid = false;
        } else if (data.passcode.length < 6) {
            showError('loginPasscodeError', 'Passcode must be at least 6 characters');
            isValid = false;
        }
        
        if (isValid) {
            try {
                const response = await fetch(ENDPOINTS.LOGIN, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        regNumber: data.regNumber.toLowerCase(),
                        passcode: data.passcode
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Store user data and redirect
                    localStorage.setItem('user', JSON.stringify(result.user));
                    localStorage.setItem('token', result.token || 'student-session');
                    
                    // Redirect based on user role
                    if (result.user.role === 'admin') {
                        window.location.href = '/pages/admin/dashboard.html';
                    } else {
                        window.location.href = '/pages/student/dashboard.html';
                    }
                } else {
                    const errorMessage = result.message || result.error || 'Login failed. Please check your credentials.';
                    const errorElement = document.getElementById('loginError');
                    if (errorElement) {
                        errorElement.textContent = errorMessage;
                        errorElement.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                const errorElement = document.getElementById('loginError');
                if (errorElement) {
                    errorElement.textContent = 'Network error. Please try again.';
                    errorElement.style.display = 'block';
                }
            }
        }
    } 
    else if (formId === 'signupForm') {
        if (!data.fullName.trim()) {
            showError('fullNameError', 'Full name is required');
            isValid = false;
        } else if (data.fullName.trim().length < 2) {
            showError('fullNameError', 'Name must be at least 2 characters');
            isValid = false;
        }
        
        if (!data.regNumber.trim()) {
            showError('regNumberError', 'Registration number is required');
            isValid = false;
        } else if (!validateRegNumber(data.regNumber)) {
            showError('regNumberError', 'Invalid format. Use: YY/SC/CO/XXX');
            isValid = false;
        }
        
        if (!data.email.trim()) {
            showError('emailError', 'Email address is required');
            isValid = false;
        } else if (!validateEmail(data.email)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (isValid) {
            try {
                const response = await fetch(ENDPOINTS.SIGNUP, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: data.fullName.trim(),
                        regNumber: data.regNumber.toLowerCase(),
                        email: data.email.toLowerCase()
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Show success message and switch to login
                    alert('Registration successful! Please wait for admin approval. You will receive a passcode via email once approved.');
                    toggleForms(true);
                    signupForm.reset();
                } else {
                    const errorMessage = result.message || result.error || 'Registration failed. Please try again.';
                    const errorElement = document.getElementById('signupError');
                    if (errorElement) {
                        errorElement.textContent = errorMessage;
                        errorElement.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                const errorElement = document.getElementById('signupError');
                if (errorElement) {
                    errorElement.textContent = 'Network error. Please try again.';
                    errorElement.style.display = 'block';
                }
            }
        }
    }
};

// Tab switching functionality
const switchTab = (tabName) => {
    currentTab = tabName;
    
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update forms
    authForms.forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}Form`);
    });
    
    // Clear any existing errors
    clearErrors(`${tabName}Form`);
};

// Toggle between login and signup forms
const toggleForms = (showLogin = true) => {
    switchTab(showLogin ? 'login' : 'signup');
};

// Toggle password visibility
const togglePasswordVisibility = (btn) => {
    const input = btn.closest('.input-group').querySelector('input');
    const icon = btn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        btn.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        btn.setAttribute('aria-label', 'Show password');
    }
};

// Mobile menu toggle
const toggleMobileMenu = () => {
    mainNav.classList.toggle('active');
    const isActive = mainNav.classList.contains('active');
    mobileMenuBtn.setAttribute('aria-expanded', isActive);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isActive ? 'hidden' : '';
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
        try {
            const userData = JSON.parse(existingUser);
            if (userData.role === 'admin') {
                window.location.href = '/pages/admin/dashboard.html';
            } else {
                window.location.href = '/pages/student/dashboard.html';
            }
            return;
        } catch (error) {
            // Clear invalid session data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', handleSubmit);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSubmit);
    }

    // Show login link
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms(true);
        });
    }

    // Forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Please contact the admin for passcode reset: info@informationsystems.edu.org');
        });
    }

    // Password visibility toggles
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            togglePasswordVisibility(btn);
        });
    });

    // Mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.main-nav') && !e.target.closest('.mobile-menu-btn')) {
            mainNav.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.focus();
            document.body.style.overflow = '';
        }
    });

    // Real-time validation
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const formId = input.closest('form').id;
            clearErrors(formId);
        });
    });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateRegNumber,
        validateEmail,
        handleSubmit,
        toggleForms
    };
}