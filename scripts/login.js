// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginTab = document.querySelector('[data-tab="login"]');
const signupTab = document.querySelector('[data-tab="signup"]');
const showLoginLink = document.getElementById('showLogin');
const forgotPasswordLink = document.getElementById('forgotPassword');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');

// API Endpoints
const API_BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/login`,
    SIGNUP: `${API_BASE_URL}/signup`,
    FORGOT_PASSWORD: `${API_BASE_URL}/forgot-password`
};

// Toggle between login and signup forms
const toggleForms = (showLogin) => {
    if (showLogin) {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
    }
};

// Toggle password visibility
const togglePasswordVisibility = (input, button) => {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    const icon = button.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

// Show error message
const showError = (elementId, message) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
};

// Clear error messages
const clearErrors = (formId) => {
    const form = document.getElementById(formId);
    if (form) {
        const errors = form.querySelectorAll('.error');
        errors.forEach(error => {
            error.textContent = '';
        });
        const errorMessage = form.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
};

// Validate registration number format (YY/SC/CO/XXX)
const validateRegNumber = (regNumber) => {
    const regex = /^\d{2}\/[A-Z]{2}\/[A-Z]{2}\/\d{3}$/;
    return regex.test(regNumber);
};

// Validate email format
const validateEmail = (email) => {
    const regex = /^[a-z0-9._%+-]+@uniuyo\.edu\.ng$/i;
    return regex.test(email);
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
        }
        
        if (isValid) {
            try {
                const response = await fetch(ENDPOINTS.LOGIN, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Store the token and redirect based on role
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    
                    if (result.user.role === 'admin') {
                        window.location.href = '/pages/admin/dashboard.html';
                    } else {
                        window.location.href = '/pages/student/dashboard.html';
                    }
                } else {
                    const errorMessage = result.message || 'Login failed. Please try again.';
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
                    errorElement.textContent = 'An error occurred. Please try again later.';
                    errorElement.style.display = 'block';
                }
            }
        }
    } else if (formId === 'signupForm') {
        // Validate full name
        if (!data.fullName.trim()) {
            showError('fullNameError', 'Full name is required');
            isValid = false;
        }
        
        // Validate registration number
        if (!data.regNumber.trim()) {
            showError('regNumberError', 'Registration number is required');
            isValid = false;
        } else if (!validateRegNumber(data.regNumber)) {
            showError('regNumberError', 'Invalid format. Use: YY/SC/CO/XXX');
            isValid = false;
        }
        
        // Validate email
        if (!data.email.trim()) {
            showError('emailError', 'Email is required');
            isValid = false;
        } else if (!validateEmail(data.email)) {
            showError('emailError', 'Please use your University of Uyo email');
            isValid = false;
        }
        
        if (isValid) {
            try {
                const response = await fetch(ENDPOINTS.SIGNUP, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Show success message and switch to login
                    alert('Registration successful! Please wait for admin approval. You will receive a passcode via email once approved.');
                    toggleForms(true);
                    signupForm.reset();
                } else {
                    const errorMessage = result.message || 'Registration failed. Please try again.';
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
                    errorElement.textContent = 'An error occurred. Please try again later.';
                    errorElement.style.display = 'block';
                }
            }
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Toggle between login and signup forms
    loginTab?.addEventListener('click', () => toggleForms(true));
    signupTab?.addEventListener('click', () => toggleForms(false));
    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleForms(true);
    });
    
    // Toggle password visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.closest('.input-group').querySelector('input');
            togglePasswordVisibility(input, btn);
        });
    });
    
    // Form submissions
    loginForm?.addEventListener('submit', handleSubmit);
    signupForm?.addEventListener('submit', handleSubmit);
    
    // Forgot password
    forgotPasswordLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        const regNumber = prompt('Please enter your registration number:');
        
        if (regNumber && validateRegNumber(regNumber)) {
            try {
                const response = await fetch(ENDPOINTS.FORGOT_PASSWORD, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ regNumber })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('If your account exists, a password reset link has been sent to your registered email.');
                } else {
                    alert(result.message || 'An error occurred. Please try again later.');
                }
            } catch (error) {
                console.error('Forgot password error:', error);
                alert('An error occurred. Please try again later.');
            }
        } else if (regNumber !== null) {
            alert('Please enter a valid registration number (format: YY/SC/CO/XXX).');
        }
        
    });
});