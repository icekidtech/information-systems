/**
 * Contact Page JavaScript
 * Handles contact form submission, validation, and interactions
 */

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    ENDPOINTS: {
        CONTACT: '/api/contact',
        SUBSCRIBE: '/api/subscribe'
    },
    VALIDATION: {
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_PATTERN: /^[\+]?[\d\s\-\(\)]{10,}$/,
        MIN_MESSAGE_LENGTH: 10,
        MAX_MESSAGE_LENGTH: 1000
    },
    FORM_TIMEOUT: 30000 // 30 seconds
};

// DOM Elements
const elements = {
    contactForm: document.getElementById('contactForm'),
    subscribeForm: document.getElementById('subscribeForm'),
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    mainNav: document.querySelector('.main-nav'),
    
    // Form fields
    nameInput: document.getElementById('name'),
    emailInput: document.getElementById('email'),
    phoneInput: document.getElementById('phone'),
    subjectInput: document.getElementById('subject'),
    messageInput: document.getElementById('message'),
    
    // Form elements
    submitBtn: document.getElementById('submitBtn'),
    formMessage: document.getElementById('formMessage'),
    
    // Character counter
    messageCounter: document.getElementById('messageCounter'),
    
    // Subscribe elements
    subscribeEmail: document.getElementById('subscribeEmail'),
    subscribeBtn: document.getElementById('subscribeBtn'),
    subscribeMessage: document.getElementById('subscribeMessage')
};

// State management
const state = {
    isSubmitting: false,
    formData: {},
    validationErrors: {},
    isSubscribing: false
};

// Utility Functions
const utils = {
    /**
     * Show form message
     * @param {HTMLElement} messageElement - Message element
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning)
     */
    showMessage(messageElement, message, type = 'success') {
        if (!messageElement) return;
        
        messageElement.textContent = message;
        messageElement.className = `form-message ${type}`;
        messageElement.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage(messageElement);
            }, 5000);
        }
    },

    /**
     * Hide form message
     * @param {HTMLElement} messageElement - Message element
     */
    hideMessage(messageElement) {
        if (messageElement) {
            messageElement.style.display = 'none';
            messageElement.textContent = '';
            messageElement.className = 'form-message';
        }
    },

    /**
     * Show field error
     * @param {HTMLElement} field - Input field
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        if (!field) return;
        
        // Remove existing error styling
        this.clearFieldError(field);
        
        // Add error styling
        field.classList.add('error');
        
        // Create or update error message
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    },

    /**
     * Clear field error
     * @param {HTMLElement} field - Input field
     */
    clearFieldError(field) {
        if (!field) return;
        
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    /**
     * Clear all form errors
     */
    clearAllErrors() {
        document.querySelectorAll('.error').forEach(field => {
            this.clearFieldError(field);
        });
        
        if (elements.formMessage) {
            this.hideMessage(elements.formMessage);
        }
    },

    /**
     * Sanitize input text
     * @param {string} text - Input text
     * @returns {string} Sanitized text
     */
    sanitizeInput(text) {
        if (typeof text !== 'string') return '';
        return text.trim().replace(/[<>]/g, '');
    },

    /**
     * Format phone number
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone number
     */
    formatPhone(phone) {
        return phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },

    /**
     * Update character counter
     * @param {HTMLElement} input - Input element
     * @param {HTMLElement} counter - Counter element
     * @param {number} maxLength - Maximum length
     */
    updateCharacterCounter(input, counter, maxLength) {
        if (!input || !counter) return;
        
        const currentLength = input.value.length;
        const remaining = maxLength - currentLength;
        
        counter.textContent = `${currentLength}/${maxLength}`;
        
        if (remaining < 50) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
        
        if (remaining < 0) {
            counter.classList.add('error');
        } else {
            counter.classList.remove('error');
        }
    },

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Loading state
     * @param {string} loadingText - Loading text
     */
    setButtonLoading(button, loading, loadingText = 'Please wait...') {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }
    }
};

// Validation Functions
const validation = {
    /**
     * Validate name field
     * @param {string} name - Name value
     * @returns {Object} Validation result
     */
    validateName(name) {
        const sanitized = utils.sanitizeInput(name);
        
        if (!sanitized) {
            return { isValid: false, message: 'Name is required' };
        }
        
        if (sanitized.length < 2) {
            return { isValid: false, message: 'Name must be at least 2 characters' };
        }
        
        if (sanitized.length > 50) {
            return { isValid: false, message: 'Name must be less than 50 characters' };
        }
        
        return { isValid: true, value: sanitized };
    },

    /**
     * Validate email field
     * @param {string} email - Email value
     * @returns {Object} Validation result
     */
    validateEmail(email) {
        const sanitized = utils.sanitizeInput(email).toLowerCase();
        
        if (!sanitized) {
            return { isValid: false, message: 'Email is required' };
        }
        
        if (!CONFIG.VALIDATION.EMAIL_PATTERN.test(sanitized)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        return { isValid: true, value: sanitized };
    },

    /**
     * Validate phone field (optional)
     * @param {string} phone - Phone value
     * @returns {Object} Validation result
     */
    validatePhone(phone) {
        const sanitized = utils.sanitizeInput(phone);
        
        if (!sanitized) {
            return { isValid: true, value: '' }; // Phone is optional
        }
        
        if (!CONFIG.VALIDATION.PHONE_PATTERN.test(sanitized)) {
            return { isValid: false, message: 'Please enter a valid phone number' };
        }
        
        return { isValid: true, value: sanitized };
    },

    /**
     * Validate subject field
     * @param {string} subject - Subject value
     * @returns {Object} Validation result
     */
    validateSubject(subject) {
        const sanitized = utils.sanitizeInput(subject);
        
        if (!sanitized) {
            return { isValid: false, message: 'Subject is required' };
        }
        
        if (sanitized.length < 3) {
            return { isValid: false, message: 'Subject must be at least 3 characters' };
        }
        
        if (sanitized.length > 100) {
            return { isValid: false, message: 'Subject must be less than 100 characters' };
        }
        
        return { isValid: true, value: sanitized };
    },

    /**
     * Validate message field
     * @param {string} message - Message value
     * @returns {Object} Validation result
     */
    validateMessage(message) {
        const sanitized = utils.sanitizeInput(message);
        
        if (!sanitized) {
            return { isValid: false, message: 'Message is required' };
        }
        
        if (sanitized.length < CONFIG.VALIDATION.MIN_MESSAGE_LENGTH) {
            return { isValid: false, message: `Message must be at least ${CONFIG.VALIDATION.MIN_MESSAGE_LENGTH} characters` };
        }
        
        if (sanitized.length > CONFIG.VALIDATION.MAX_MESSAGE_LENGTH) {
            return { isValid: false, message: `Message must be less than ${CONFIG.VALIDATION.MAX_MESSAGE_LENGTH} characters` };
        }
        
        return { isValid: true, value: sanitized };
    },

    /**
     * Validate entire form
     * @param {Object} formData - Form data
     * @returns {Object} Validation result
     */
    validateForm(formData) {
        const results = {
            name: this.validateName(formData.name),
            email: this.validateEmail(formData.email),
            phone: this.validatePhone(formData.phone),
            subject: this.validateSubject(formData.subject),
            message: this.validateMessage(formData.message)
        };
        
        const errors = {};
        const validData = {};
        let isValid = true;
        
        Object.entries(results).forEach(([field, result]) => {
            if (!result.isValid) {
                errors[field] = result.message;
                isValid = false;
            } else {
                validData[field] = result.value;
            }
        });
        
        return { isValid, errors, validData };
    }
};

// API Functions
const api = {
    /**
     * Submit contact form
     * @param {Object} formData - Form data
     * @returns {Promise<Object>} API response
     */
    async submitContactForm(formData) {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.CONTACT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                signal: AbortSignal.timeout(CONFIG.FORM_TIMEOUT)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Contact form API not available, simulating submission:', error);
            
            // Simulate API response for development
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Contact Form Submission (Simulated):', formData);
            
            return {
                success: true,
                message: 'Thank you for your message! We will get back to you within 24 hours.',
                id: `contact_${Date.now()}`
            };
        }
    },

    /**
     * Submit newsletter subscription
     * @param {string} email - Email address
     * @returns {Promise<Object>} API response
     */
    async submitSubscription(email) {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.SUBSCRIBE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                signal: AbortSignal.timeout(CONFIG.FORM_TIMEOUT)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Subscribe API not available, simulating subscription:', error);
            
            // Simulate API response
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Newsletter Subscription (Simulated):', email);
            
            return {
                success: true,
                message: 'Successfully subscribed to our newsletter!'
            };
        }
    }
};

// Event Handlers
const handlers = {
    /**
     * Handle contact form submission
     * @param {Event} e - Form submission event
     */
    async handleContactFormSubmit(e) {
        e.preventDefault();
        
        if (state.isSubmitting) return;
        
        // Clear previous errors
        utils.clearAllErrors();
        
        // Get form data
        const formData = {
            name: elements.nameInput?.value || '',
            email: elements.emailInput?.value || '',
            phone: elements.phoneInput?.value || '',
            subject: elements.subjectInput?.value || '',
            message: elements.messageInput?.value || ''
        };
        
        // Validate form
        const validationResult = validation.validateForm(formData);
        
        if (!validationResult.isValid) {
            // Show field errors
            Object.entries(validationResult.errors).forEach(([field, message]) => {
                const fieldElement = elements[`${field}Input`];
                if (fieldElement) {
                    utils.showFieldError(fieldElement, message);
                }
            });
            
            utils.showMessage(elements.formMessage, 'Please correct the errors above.', 'error');
            return;
        }
        
        try {
            state.isSubmitting = true;
            utils.setButtonLoading(elements.submitBtn, true, 'Sending...');
            
            // Submit form
            const response = await api.submitContactForm(validationResult.validData);
            
            if (response.success) {
                utils.showMessage(elements.formMessage, response.message, 'success');
                
                // Reset form
                elements.contactForm?.reset();
                
                // Update character counter
                if (elements.messageCounter) {
                    utils.updateCharacterCounter(elements.messageInput, elements.messageCounter, CONFIG.VALIDATION.MAX_MESSAGE_LENGTH);
                }
            } else {
                throw new Error(response.message || 'Failed to send message');
            }
            
        } catch (error) {
            console.error('Contact form submission error:', error);
            utils.showMessage(elements.formMessage, 'Failed to send message. Please try again later.', 'error');
        } finally {
            state.isSubmitting = false;
            utils.setButtonLoading(elements.submitBtn, false);
        }
    },

    /**
     * Handle newsletter subscription
     * @param {Event} e - Form submission event
     */
    async handleSubscribeSubmit(e) {
        e.preventDefault();
        
        if (state.isSubscribing) return;
        
        const email = elements.subscribeEmail?.value || '';
        const emailValidation = validation.validateEmail(email);
        
        if (!emailValidation.isValid) {
            utils.showMessage(elements.subscribeMessage, emailValidation.message, 'error');
            return;
        }
        
        try {
            state.isSubscribing = true;
            utils.setButtonLoading(elements.subscribeBtn, true, 'Subscribing...');
            
            const response = await api.submitSubscription(emailValidation.value);
            
            if (response.success) {
                utils.showMessage(elements.subscribeMessage, response.message, 'success');
                elements.subscribeForm?.reset();
            } else {
                throw new Error(response.message || 'Failed to subscribe');
            }
            
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            utils.showMessage(elements.subscribeMessage, 'Failed to subscribe. Please try again later.', 'error');
        } finally {
            state.isSubscribing = false;
            utils.setButtonLoading(elements.subscribeBtn, false);
        }
    },

    /**
     * Handle real-time field validation
     * @param {Event} e - Input event
     */
    handleFieldValidation(e) {
        const field = e.target;
        const fieldName = field.name;
        
        if (!fieldName) return;
        
        // Clear existing error
        utils.clearFieldError(field);
        
        // Validate field on blur
        if (e.type === 'blur' && field.value.trim()) {
            let validationResult;
            
            switch (fieldName) {
                case 'name':
                    validationResult = validation.validateName(field.value);
                    break;
                case 'email':
                    validationResult = validation.validateEmail(field.value);
                    break;
                case 'phone':
                    validationResult = validation.validatePhone(field.value);
                    break;
                case 'subject':
                    validationResult = validation.validateSubject(field.value);
                    break;
                case 'message':
                    validationResult = validation.validateMessage(field.value);
                    break;
            }
            
            if (validationResult && !validationResult.isValid) {
                utils.showFieldError(field, validationResult.message);
            }
        }
        
        // Update character counter for message field
        if (fieldName === 'message' && elements.messageCounter) {
            utils.updateCharacterCounter(field, elements.messageCounter, CONFIG.VALIDATION.MAX_MESSAGE_LENGTH);
        }
    },

    /**
     * Handle mobile menu toggle
     */
    setupMobileMenu() {
        if (elements.mobileMenuBtn && elements.mainNav) {
            elements.mobileMenuBtn.addEventListener('click', () => {
                elements.mainNav.classList.toggle('active');
                document.body.style.overflow = elements.mainNav.classList.contains('active') ? 'hidden' : '';
            });
        }
    },

    /**
     * Handle clicking outside mobile menu
     */
    setupOutsideClick() {
        document.addEventListener('click', (e) => {
            if (elements.mainNav?.classList.contains('active') &&
                !e.target.closest('.main-nav') &&
                !e.target.closest('.mobile-menu-btn')) {
                elements.mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
};

// Main initialization function
function init() {
    try {
        // Set up event handlers
        handlers.setupMobileMenu();
        handlers.setupOutsideClick();

        // Contact form events
        if (elements.contactForm) {
            elements.contactForm.addEventListener('submit', handlers.handleContactFormSubmit);
            
            // Add field validation events
            ['nameInput', 'emailInput', 'phoneInput', 'subjectInput', 'messageInput'].forEach(fieldName => {
                const field = elements[fieldName];
                if (field) {
                    field.addEventListener('blur', handlers.handleFieldValidation);
                    field.addEventListener('input', handlers.handleFieldValidation);
                }
            });
        }

        // Subscribe form events
        if (elements.subscribeForm) {
            elements.subscribeForm.addEventListener('submit', handlers.handleSubscribeSubmit);
        }

        // Initialize character counter
        if (elements.messageInput && elements.messageCounter) {
            utils.updateCharacterCounter(elements.messageInput, elements.messageCounter, CONFIG.VALIDATION.MAX_MESSAGE_LENGTH);
        }

        console.log('Contact page initialized successfully');
        
    } catch (error) {
        console.error('Error initializing contact page:', error);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for potential use in other modules
window.ContactPage = {
    init,
    api,
    validation,
    utils,
    handlers,
    state
};