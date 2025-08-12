/**
 * Admin Authentication Script for Information Systems Department
 * Handles admin login functionality with validation and API integration
 */

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    ADMIN_DASHBOARD_URL: '/pages/admin/dashboard.html',
    LOGIN_ENDPOINT: '/api/login',
    VALIDATION: {
        ADMIN_REG_PATTERN: /^\d{2}\/is\/ad\/\d{3}$/i,
        MIN_PASSCODE_LENGTH: 6,
        MAX_PASSCODE_LENGTH: 50
    }
};

// DOM Elements
const elements = {
    form: document.getElementById('adminLoginForm'),
    regNumberInput: document.getElementById('regNumber'),
    passcodeInput: document.getElementById('passcode'),
    loginBtn: document.getElementById('loginBtn'),
    formMessage: document.getElementById('formMessage'),
    togglePasswordBtn: document.querySelector('.toggle-password'),
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    mainNav: document.querySelector('.main-nav'),
    
    // Error elements
    regNumberError: document.getElementById('regNumberError'),
    passcodeError: document.getElementById('passcodeError')
};

// State management
const state = {
    isLoading: false,
    isPasswordVisible: false
};

/**
 * Utility Functions
 */
const utils = {
    /**
     * Validate registration number format for admin
     * @param {string} regNumber - Registration number to validate
     * @returns {boolean} - True if valid format
     */
    validateAdminRegNumber(regNumber) {
        if (!regNumber || typeof regNumber !== 'string') return false;
        
        // Normalize the input
        const normalized = regNumber.trim().toLowerCase();
        
        // Check pattern: YY/is/ad/XXX (e.g., 24/is/ad/001)
        return CONFIG.VALIDATION.ADMIN_REG_PATTERN.test(normalized);
    },

    /**
     * Validate passcode
     * @param {string} passcode - Passcode to validate
     * @returns {object} - Validation result with isValid and message
     */
    validatePasscode(passcode) {
        if (!passcode || typeof passcode !== 'string') {
            return { isValid: false, message: 'Passcode is required' };
        }

        const trimmed = passcode.trim();
        
        if (trimmed.length < CONFIG.VALIDATION.MIN_PASSCODE_LENGTH) {
            return { 
                isValid: false, 
                message: `Passcode must be at least ${CONFIG.VALIDATION.MIN_PASSCODE_LENGTH} characters long` 
            };
        }

        if (trimmed.length > CONFIG.VALIDATION.MAX_PASSCODE_LENGTH) {
            return { 
                isValid: false, 
                message: `Passcode must not exceed ${CONFIG.VALIDATION.MAX_PASSCODE_LENGTH} characters` 
            };
        }

        return { isValid: true, message: '' };
    },

    /**
     * Display error message for a specific field
     * @param {HTMLElement} errorElement - Error display element
     * @param {HTMLElement} inputElement - Input element
     * @param {string} message - Error message
     */
    showFieldError(errorElement, inputElement, message) {
        if (errorElement && inputElement && message) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            inputElement.classList.add('error');
            
            // Set ARIA attributes for accessibility
            inputElement.setAttribute('aria-invalid', 'true');
            inputElement.setAttribute('aria-describedby', errorElement.id);
        }
    },

    /**
     * Clear error message for a specific field
     * @param {HTMLElement} errorElement - Error display element
     * @param {HTMLElement} inputElement - Input element
     */
    clearFieldError(errorElement, inputElement) {
        if (errorElement && inputElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
            inputElement.classList.remove('error');
            
            // Remove ARIA attributes
            inputElement.removeAttribute('aria-invalid');
            inputElement.removeAttribute('aria-describedby');
        }
    },

    /**
     * Display form-level message
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success' or 'error')
     */
    showFormMessage(message, type = 'error') {
        if (elements.formMessage && message) {
            elements.formMessage.textContent = message;
            elements.formMessage.className = `form-message show ${type}`;
            
            // Scroll message into view if needed
            elements.formMessage.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    },

    /**
     * Clear form message
     */
    clearFormMessage() {
        if (elements.formMessage) {
            elements.formMessage.textContent = '';
            elements.formMessage.className = 'form-message';
        }
    },

    /**
     * Set loading state for form
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        state.isLoading = loading;
        
        if (elements.loginBtn) {
            elements.loginBtn.disabled = loading;
            elements.loginBtn.classList.toggle('loading', loading);
        }

        // Disable/enable form inputs
        if (elements.regNumberInput) elements.regNumberInput.disabled = loading;
        if (elements.passcodeInput) elements.passcodeInput.disabled = loading;
    },

    /**
     * Sanitize input string
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>'"&]/g, '');
    },

    /**
     * Store user session data
     * @param {object} userData - User data to store
     */
    storeUserSession(userData) {
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', userData.token || 'admin-session');
            localStorage.setItem('loginTime', new Date().toISOString());
        } catch (error) {
            console.error('Failed to store user session:', error);
        }
    }
};

/**
 * Validation Functions
 */
const validation = {
    /**
     * Validate registration number field
     * @returns {boolean} - True if valid
     */
    validateRegNumberField() {
        const regNumber = elements.regNumberInput?.value?.trim() || '';
        
        utils.clearFieldError(elements.regNumberError, elements.regNumberInput);

        if (!regNumber) {
            utils.showFieldError(
                elements.regNumberError, 
                elements.regNumberInput, 
                'Registration number is required'
            );
            return false;
        }

        if (!utils.validateAdminRegNumber(regNumber)) {
            utils.showFieldError(
                elements.regNumberError, 
                elements.regNumberInput, 
                'Invalid admin registration number format (e.g., 24/is/ad/001)'
            );
            return false;
        }

        return true;
    },

    /**
     * Validate passcode field
     * @returns {boolean} - True if valid
     */
    validatePasscodeField() {
        const passcode = elements.passcodeInput?.value || '';
        
        utils.clearFieldError(elements.passcodeError, elements.passcodeInput);

        const validation = utils.validatePasscode(passcode);
        
        if (!validation.isValid) {
            utils.showFieldError(
                elements.passcodeError, 
                elements.passcodeInput, 
                validation.message
            );
            return false;
        }

        return true;
    },

    /**
     * Validate entire form
     * @returns {boolean} - True if form is valid
     */
    validateForm() {
        const isRegNumberValid = this.validateRegNumberField();
        const isPasscodeValid = this.validatePasscodeField();
        
        return isRegNumberValid && isPasscodeValid;
    }
};

/**
 * API Functions
 */
const api = {
    /**
     * Login admin user
     * @param {string} regNumber - Registration number
     * @param {string} passcode - Passcode
     * @returns {Promise<object>} - Login response
     */
    async login(regNumber, passcode) {
        const requestData = {
            regNumber: regNumber.toLowerCase().trim(),
            passcode: passcode.trim()
        };

        try {
            const response = await fetch(CONFIG.LOGIN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Login failed');
            }

            // Validate that user is admin
            if (data.user && data.user.role !== 'admin') {
                throw new Error('Access denied. Admin credentials required.');
            }

            return data;

        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your connection and try again.');
            }
            
            throw error;
        }
    }
};

/**
 * Event Handlers
 */
const handlers = {
    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Clear previous messages
        utils.clearFormMessage();
        
        // Validate form
        if (!validation.validateForm()) {
            utils.showFormMessage('Please correct the errors above and try again.');
            return;
        }

        // Get form data
        const regNumber = utils.sanitizeInput(elements.regNumberInput.value);
        const passcode = elements.passcodeInput.value;

        // Set loading state
        utils.setLoadingState(true);

        try {
            // Attempt login
            const loginResponse = await api.login(regNumber, passcode);
            
            // Store user session
            utils.storeUserSession(loginResponse.user);
            
            // Show success message briefly
            utils.showFormMessage('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = CONFIG.ADMIN_DASHBOARD_URL;
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            utils.showFormMessage(error.message);
        } finally {
            utils.setLoadingState(false);
        }
    },

    /**
     * Handle input changes for real-time validation
     * @param {Event} event - Input event
     */
    handleInputChange(event) {
        const field = event.target;
        
        // Clear error state when user starts typing
        if (field === elements.regNumberInput) {
            utils.clearFieldError(elements.regNumberError, elements.regNumberInput);
        } else if (field === elements.passcodeInput) {
            utils.clearFieldError(elements.passcodeError, elements.passcodeInput);
        }
        
        // Clear form message
        utils.clearFormMessage();
    },

    /**
     * Handle input blur for validation
     * @param {Event} event - Blur event
     */
    handleInputBlur(event) {
        const field = event.target;
        
        if (field === elements.regNumberInput) {
            validation.validateRegNumberField();
        } else if (field === elements.passcodeInput) {
            validation.validatePasscodeField();
        }
    },

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        if (!elements.passcodeInput || !elements.togglePasswordBtn) return;
        
        state.isPasswordVisible = !state.isPasswordVisible;
        
        const inputType = state.isPasswordVisible ? 'text' : 'password';
        const iconClass = state.isPasswordVisible ? 'fa-eye-slash' : 'fa-eye';
        const ariaLabel = state.isPasswordVisible ? 'Hide passcode' : 'Show passcode';
        
        elements.passcodeInput.type = inputType;
        
        const icon = elements.togglePasswordBtn.querySelector('i');
        if (icon) {
            icon.className = `fas ${iconClass}`;
        }
        
        elements.togglePasswordBtn.setAttribute('aria-label', ariaLabel);
    },

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (!elements.mainNav || !elements.mobileMenuBtn) return;
        
        const isActive = elements.mainNav.classList.contains('active');
        
        elements.mainNav.classList.toggle('active');
        elements.mobileMenuBtn.setAttribute('aria-expanded', (!isActive).toString());
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isActive ? '' : 'hidden';
    },

    /**
     * Handle clicks outside mobile menu
     * @param {Event} event - Click event
     */
    handleDocumentClick(event) {
        if (!elements.mainNav?.classList.contains('active')) return;
        
        const clickedInsideNav = event.target.closest('.main-nav');
        const clickedMenuBtn = event.target.closest('.mobile-menu-btn');
        
        if (!clickedInsideNav && !clickedMenuBtn) {
            elements.mainNav.classList.remove('active');
            elements.mobileMenuBtn?.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    },

    /**
     * Handle keyboard navigation
     * @param {Event} event - Keydown event
     */
    handleKeyDown(event) {
        // Close mobile menu on Escape
        if (event.key === 'Escape' && elements.mainNav?.classList.contains('active')) {
            elements.mainNav.classList.remove('active');
            elements.mobileMenuBtn?.setAttribute('aria-expanded', 'false');
            elements.mobileMenuBtn?.focus();
            document.body.style.overflow = '';
        }
    }
};

/**
 * Initialize Application
 */
function initializeApp() {
    // Check if user is already logged in
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
        try {
            const userData = JSON.parse(existingUser);
            if (userData.role === 'admin') {
                window.location.href = CONFIG.ADMIN_DASHBOARD_URL;
                return;
            }
        } catch (error) {
            // Clear invalid session data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }

    // Set up event listeners
    if (elements.form) {
        elements.form.addEventListener('submit', handlers.handleFormSubmit);
    }

    if (elements.regNumberInput) {
        elements.regNumberInput.addEventListener('input', handlers.handleInputChange);
        elements.regNumberInput.addEventListener('blur', handlers.handleInputBlur);
    }

    if (elements.passcodeInput) {
        elements.passcodeInput.addEventListener('input', handlers.handleInputChange);
        elements.passcodeInput.addEventListener('blur', handlers.handleInputBlur);
    }

    if (elements.togglePasswordBtn) {
        elements.togglePasswordBtn.addEventListener('click', handlers.togglePasswordVisibility);
    }

    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', handlers.toggleMobileMenu);
    }

    // Global event listeners
    document.addEventListener('click', handlers.handleDocumentClick);
    document.addEventListener('keydown', handlers.handleKeyDown);

    // Focus management for better accessibility
    if (elements.regNumberInput) {
        elements.regNumberInput.focus();
    }

    console.log('Admin authentication initialized');
}

/**
 * Cleanup function for page unload
 */
function cleanup() {
    document.removeEventListener('click', handlers.handleDocumentClick);
    document.removeEventListener('keydown', handlers.handleKeyDown);
    document.body.style.overflow = '';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Export for testing (if in module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        utils,
        validation,
        api,
        handlers,
        CONFIG
    };
}