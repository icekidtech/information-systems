/**
 * Courses Page JavaScript
 * Handles course data fetching, filtering, and display
 */

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    ENDPOINTS: {
        MATERIALS: '/api/materials',
        COURSES: '/api/courses'
    },
    COURSE_LEVELS: ['100', '200', '300', '400'],
    COURSE_TYPES: ['all', 'core', 'elective', 'gst']
};

// DOM Elements
const elements = {
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    mainNav: document.querySelector('.main-nav'),
    coursesGrid: document.querySelector('#coursesGrid'),
    coursesLoading: document.querySelector('#coursesLoading'),
    coursesError: document.querySelector('#coursesError'),
    noResults: document.querySelector('#noResults'),
    retryBtn: document.querySelector('#retryCoursesBtn'),
    levelFilter: document.querySelector('#levelFilter'),
    typeFilter: document.querySelector('#typeFilter'),
    clearFiltersBtn: document.querySelector('#clearFiltersBtn'),
    totalCourses: document.querySelector('#totalCourses'),
    totalMaterials: document.querySelector('#totalMaterials'),
    loginLink: document.querySelector('#loginLink'),
    logoutBtn: document.querySelector('#logoutBtn')
};

// State management
const state = {
    isLoading: false,
    allCourses: [],
    filteredCourses: [],
    currentFilter: { level: '', type: '' },
    coursesData: null
};

// Utility Functions
const utils = {
    /**
     * Create loading spinner element
     */
    createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        return spinner;
    },

    /**
     * Show loading state
     */
    showLoading() {
        elements.coursesLoading.style.display = 'block';
        elements.coursesGrid.style.display = 'none';
        elements.coursesError.style.display = 'none';
        elements.noResults.style.display = 'none';
    },

    /**
     * Show error state
     */
    showError() {
        elements.coursesLoading.style.display = 'none';
        elements.coursesGrid.style.display = 'none';
        elements.coursesError.style.display = 'block';
        elements.noResults.style.display = 'none';
    },

    /**
     * Show courses grid
     */
    showCourses() {
        elements.coursesLoading.style.display = 'none';
        elements.coursesGrid.style.display = 'grid';
        elements.coursesError.style.display = 'none';
        elements.noResults.style.display = 'none';
    },

    /**
     * Show no results state
     */
    showNoResults() {
        elements.coursesLoading.style.display = 'none';
        elements.coursesGrid.style.display = 'none';
        elements.coursesError.style.display = 'none';
        elements.noResults.style.display = 'block';
    },

    /**
     * Format course level for display
     */
    formatLevel(level) {
        return `${level} Level`;
    },

    /**
     * Get level badge class
     */
    getLevelBadgeClass(level) {
        return `level-badge level-${level}`;
    },

    /**
     * Get type badge class
     */
    getTypeBadgeClass(type) {
        return `type-badge type-${type}`;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// API Functions
const api = {
    /**
     * Fetch courses data from backend
     */
    async fetchCourses() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/courses`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching courses:', error);
            throw new Error('Failed to fetch courses data');
        }
    },

    /**
     * Fetch materials data from backend
     */
    async fetchMaterials() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/materials`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching materials:', error);
            return [];
        }
    }
};

// Course Management Functions
const courseManager = {
    /**
     * Process and normalize course data
     */
    processCourseData(coursesData) {
        const allCourses = [];
        
        // Process undergraduate courses
        if (coursesData.curriculum && coursesData.curriculum.undergraduate) {
            const undergradCourses = coursesData.curriculum.undergraduate.courses;
            
            Object.entries(undergradCourses).forEach(([level, courses]) => {
                courses.forEach(course => {
                    allCourses.push({
                        id: `${course.code}-${level}`,
                        courseCode: course.code,
                        courseTitle: course.title,
                        credits: course.units || 3,
                        level: level,
                        type: course.type || 'core',
                        description: course.description || `${course.title} - A comprehensive course in ${course.title.toLowerCase()}.`,
                        prerequisites: coursesData.prerequisites ? coursesData.prerequisites[level] : '',
                        materials: []
                    });
                });
            });
        }
        
        return allCourses;
    },

    /**
     * Filter courses based on current filters
     */
    filterCourses() {
        let filtered = [...state.allCourses];
        
        // Filter by level
        if (state.currentFilter.level) {
            filtered = filtered.filter(course => course.level === state.currentFilter.level);
        }
        
        // Filter by type
        if (state.currentFilter.type) {
            filtered = filtered.filter(course => course.type === state.currentFilter.type);
        }
        
        state.filteredCourses = filtered;
        return filtered;
    },

    /**
     * Render courses grid
     */
    renderCourses() {
        const filtered = this.filterCourses();
        
        if (filtered.length === 0) {
            utils.showNoResults();
            return;
        }
        
        const coursesHTML = filtered.map(course => this.createCourseCard(course)).join('');
        elements.coursesGrid.innerHTML = coursesHTML;
        utils.showCourses();
        
        // Update course count
        if (elements.totalCourses) {
            elements.totalCourses.textContent = filtered.length;
        }
    },

    /**
     * Create individual course card HTML
     */
    createCourseCard(course) {
        const levelBadge = `<span class="${utils.getLevelBadgeClass(course.level)}">${utils.formatLevel(course.level)}</span>`;
        const typeBadge = `<span class="${utils.getTypeBadgeClass(course.type)}">${utils.capitalize(course.type)}</span>`;
        
        return `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-header">
                    <div class="course-code">${course.courseCode}</div>
                    <h3 class="course-title">${course.courseTitle}</h3>
                    <div class="course-meta">
                        ${levelBadge}
                        ${typeBadge}
                    </div>
                </div>
                <div class="course-body">
                    <p class="course-description">${course.description}</p>
                    <div class="course-details">
                        <div class="course-detail">
                            <div class="course-detail-label">Credits</div>
                            <div class="course-detail-value">${course.credits}</div>
                        </div>
                        <div class="course-detail">
                            <div class="course-detail-label">Materials</div>
                            <div class="course-detail-value">${course.materials.length}</div>
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="btn btn-primary" onclick="viewCourseDetails('${course.id}')" aria-label="View details for ${course.courseTitle}">
                            <i class="fas fa-info-circle" aria-hidden="true"></i> Details
                        </button>
                        <button class="btn btn-outline" onclick="viewCourseMaterials('${course.id}')" aria-label="View materials for ${course.courseTitle}">
                            <i class="fas fa-book" aria-hidden="true"></i> Materials
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Update statistics
     */
    updateStats(coursesData) {
        // Update total courses
        if (elements.totalCourses && state.allCourses.length > 0) {
            elements.totalCourses.textContent = state.allCourses.length;
        }
        
        // Update materials count if available
        if (elements.totalMaterials && coursesData.materialsAvailable !== undefined) {
            elements.totalMaterials.textContent = coursesData.materialsAvailable;
        }
    }
};

// Event Handlers
const eventHandlers = {
    /**
     * Handle filter changes
     */
    handleFilterChange() {
        state.currentFilter.level = elements.levelFilter.value;
        state.currentFilter.type = elements.typeFilter.value;
        courseManager.renderCourses();
    },

    /**
     * Handle clear filters
     */
    handleClearFilters() {
        elements.levelFilter.value = '';
        elements.typeFilter.value = '';
        state.currentFilter = { level: '', type: '' };
        courseManager.renderCourses();
    },

    /**
     * Handle retry button click
     */
    async handleRetry() {
        await loadCourses();
    },

    /**
     * Handle mobile menu toggle
     */
    handleMobileMenuToggle() {
        if (elements.mainNav) {
            const isExpanded = elements.mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            elements.mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            elements.mainNav.style.display = isExpanded ? 'none' : 'block';
        }
    }
};

// Authentication Functions
const auth = {
    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return localStorage.getItem('userToken') !== null;
    },

    /**
     * Get current user info
     */
    getCurrentUser() {
        const token = localStorage.getItem('userToken');
        if (!token) return null;
        
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    },

    /**
     * Update auth UI
     */
    updateAuthUI() {
        const isLoggedIn = this.isLoggedIn();
        const user = this.getCurrentUser();
        
        if (elements.loginLink && elements.logoutBtn) {
            if (isLoggedIn && user) {
                elements.loginLink.style.display = 'none';
                elements.logoutBtn.style.display = 'inline-block';
                elements.logoutBtn.textContent = `Logout (${user.name || user.email})`;
            } else {
                elements.loginLink.style.display = 'inline-block';
                elements.logoutBtn.style.display = 'none';
            }
        }
    },

    /**
     * Handle logout
     */
    logout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        this.updateAuthUI();
        
        // Show logout message
        alert('You have been logged out successfully.');
    }
};

// Global functions for course actions (called from HTML)
window.viewCourseDetails = function(courseId) {
    const course = state.allCourses.find(c => c.id === courseId);
    if (course) {
        alert(`Course Details:\n\nCode: ${course.courseCode}\nTitle: ${course.courseTitle}\nCredits: ${course.credits}\nLevel: ${course.level}\nType: ${course.type}\n\nDescription: ${course.description}`);
    }
};

window.viewCourseMaterials = function(courseId) {
    const course = state.allCourses.find(c => c.id === courseId);
    if (course && course.materials.length > 0) {
        // Redirect to student login for material access
        if (confirm('You need to login to access course materials. Would you like to go to the login page?')) {
            window.location.href = '/pages/login.html';
        }
    } else {
        alert('No materials available for this course.');
    }
};

// Main initialization function
async function init() {
    try {
        // Update authentication UI
        auth.updateAuthUI();
        
        // Load courses data
        await loadCourses();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        utils.showError();
    }
}

// Load courses data
async function loadCourses() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    utils.showLoading();
    
    try {
        // Fetch courses data
        const coursesData = await api.fetchCourses();
        state.coursesData = coursesData;
        
        // Process course data
        state.allCourses = courseManager.processCourseData(coursesData);
        
        // Fetch materials data to update course materials
        try {
            const materials = await api.fetchMaterials();
            // Associate materials with courses
            state.allCourses.forEach(course => {
                course.materials = materials.filter(material => 
                    material.courseCode === course.courseCode
                );
            });
        } catch (materialsError) {
            console.warn('Could not load materials data:', materialsError);
        }
        
        // Update statistics
        courseManager.updateStats(coursesData);
        
        // Render courses
        courseManager.renderCourses();
        
    } catch (error) {
        console.error('Error loading courses:', error);
        utils.showError();
    } finally {
        state.isLoading = false;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Filter event listeners
    if (elements.levelFilter) {
        elements.levelFilter.addEventListener('change', eventHandlers.handleFilterChange);
    }
    
    if (elements.typeFilter) {
        elements.typeFilter.addEventListener('change', eventHandlers.handleFilterChange);
    }
    
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', eventHandlers.handleClearFilters);
    }
    
    // Retry button
    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', eventHandlers.handleRetry);
    }
    
    // Mobile menu
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', eventHandlers.handleMobileMenuToggle);
    }
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
    
    // Window resize handler
    window.addEventListener('resize', utils.debounce(() => {
        // Handle responsive layout adjustments if needed
        if (window.innerWidth > 768 && elements.mainNav) {
            elements.mainNav.style.display = '';
            elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }, 250));
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        state,
        utils,
        api,
        courseManager,
        auth
    };
}