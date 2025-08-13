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
    coursesGrid: document.querySelector('.courses-grid'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    statsCards: document.querySelectorAll('.stat-card'),
    programStructure: document.querySelector('.program-structure'),
    loadingSpinner: null
};

// State management
const state = {
    isLoading: false,
    allCourses: [],
    filteredCourses: [],
    currentFilter: 'all',
    coursesData: null
};

// Utility Functions
const utils = {
    /**
     * Create loading spinner element
     * @returns {HTMLElement} Loading spinner
     */
    createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-container';
        spinner.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading courses...</p>
            </div>
        `;
        return spinner;
    },

    /**
     * Show loading state
     * @param {HTMLElement} container - Container to show loading in
     */
    showLoading(container) {
        if (container) {
            elements.loadingSpinner = this.createLoadingSpinner();
            container.appendChild(elements.loadingSpinner);
        }
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.remove();
            elements.loadingSpinner = null;
        }
    },

    /**
     * Show error message
     * @param {HTMLElement} container - Container to show error in
     * @param {string} message - Error message
     */
    showError(container, message) {
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Unable to Load Courses</h3>
                        <p>${message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            <i class="fas fa-refresh"></i> Try Again
                        </button>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Extract course level from course code
     * @param {string} courseCode - Course code (e.g., "CIT 101")
     * @returns {string} Course level
     */
    extractCourseLevel(courseCode) {
        const match = courseCode.match(/(\d)\d{2}/);
        return match ? `${match[1]}00` : '100';
    },

    /**
     * Format prerequisites array to string
     * @param {Array} prerequisites - Prerequisites array
     * @returns {string} Formatted prerequisites
     */
    formatPrerequisites(prerequisites) {
        if (!prerequisites || prerequisites.length === 0) {
            return 'None';
        }
        return prerequisites.join(', ');
    },

    /**
     * Generate course type badge color
     * @param {string} type - Course type
     * @returns {string} CSS class for type
     */
    getTypeClass(type) {
        const typeMap = {
            'core': 'type-core',
            'elective': 'type-elective',
            'gst': 'type-gst',
            'required': 'type-core'
        };
        return typeMap[type?.toLowerCase()] || 'type-default';
    }
};

// API Functions
const api = {
    /**
     * Fetch courses data from backend
     * @returns {Promise<Array>} Courses data
     */
    async fetchCourses() {
        try {
            // Try materials endpoint first (as per existing backend)
            let response = await fetch(CONFIG.ENDPOINTS.MATERIALS);
            if (!response.ok) {
                // Fallback to courses endpoint
                response = await fetch(CONFIG.ENDPOINTS.COURSES);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return this.processCourseData(data);
        } catch (error) {
            console.warn('Failed to fetch courses from API, using fallback:', error);
            return this.getFallbackCourses();
        }
    },

    /**
     * Process and normalize course data from API
     * @param {Array} rawData - Raw data from API
     * @returns {Array} Processed course data
     */
    processCourseData(rawData) {
        const courseMap = new Map();
        
        rawData.forEach(item => {
            const courseCode = item.courseCode || this.extractCourseCode(item.courseTitle);
            
            if (!courseMap.has(courseCode)) {
                courseMap.set(courseCode, {
                    id: item.id || courseCode,
                    courseCode: courseCode,
                    courseTitle: item.courseTitle || item.title,
                    description: item.description || this.generateDescription(item.courseTitle),
                    credits: item.credits || 3,
                    level: utils.extractCourseLevel(courseCode),
                    type: item.type || 'core',
                    prerequisites: item.prerequisites || [],
                    materials: []
                });
            }
            
            // Add material info if available
            if (item.fileName) {
                courseMap.get(courseCode).materials.push({
                    type: item.type,
                    fileName: item.fileName,
                    filePath: item.filePath
                });
            }
        });
        
        return Array.from(courseMap.values());
    },

    /**
     * Extract course code from title
     * @param {string} title - Course title
     * @returns {string} Course code
     */
    extractCourseCode(title) {
        const match = title.match(/([A-Z]{2,4}\s?\d{3})/i);
        return match ? match[1].replace(/\s/g, ' ') : 'GEN 001';
    },

    /**
     * Generate description for course
     * @param {string} title - Course title
     * @returns {string} Generated description
     */
    generateDescription(title) {
        return `This course covers fundamental concepts and practical applications in ${title.toLowerCase()}, providing students with essential knowledge and skills for their academic and professional development.`;
    },

    /**
     * Fallback courses data when API is unavailable
     * @returns {Array} Static courses data
     */
    getFallbackCourses() {
        return [
            {
                id: 'cit101',
                courseCode: 'CIT 101',
                courseTitle: 'Introduction to Computing',
                description: 'Introduction to computer systems, hardware, software, and basic programming concepts.',
                credits: 3,
                level: '100',
                type: 'core',
                prerequisites: [],
                materials: []
            },
            {
                id: 'cit102',
                courseCode: 'CIT 102',
                courseTitle: 'Computer Programming I',
                description: 'Basic programming concepts using a high-level programming language.',
                credits: 3,
                level: '100',
                type: 'core',
                prerequisites: ['CIT 101'],
                materials: []
            },
            {
                id: 'cit201',
                courseCode: 'CIT 201',
                courseTitle: 'Data Structures and Algorithms',
                description: 'Study of data structures, algorithm design, and complexity analysis.',
                credits: 3,
                level: '200',
                type: 'core',
                prerequisites: ['CIT 102'],
                materials: []
            },
            {
                id: 'cit202',
                courseCode: 'CIT 202',
                courseTitle: 'Database Management Systems',
                description: 'Database design, SQL, and database management concepts.',
                credits: 3,
                level: '200',
                type: 'core',
                prerequisites: ['CIT 101'],
                materials: []
            },
            {
                id: 'cit301',
                courseCode: 'CIT 301',
                courseTitle: 'Web Development',
                description: 'Frontend and backend web development technologies and frameworks.',
                credits: 3,
                level: '300',
                type: 'elective',
                prerequisites: ['CIT 201', 'CIT 202'],
                materials: []
            },
            {
                id: 'cit401',
                courseCode: 'CIT 401',
                courseTitle: 'Project Management',
                description: 'IT project management methodologies, tools, and best practices.',
                credits: 3,
                level: '400',
                type: 'core',
                prerequisites: ['CIT 301'],
                materials: []
            }
        ];
    }
};

// Filtering Functions
const filters = {
    /**
     * Filter courses by level
     * @param {Array} courses - All courses
     * @param {string} level - Level to filter by
     * @returns {Array} Filtered courses
     */
    byLevel(courses, level) {
        return courses.filter(course => course.level === level);
    },

    /**
     * Filter courses by type
     * @param {Array} courses - All courses
     * @param {string} type - Type to filter by
     * @returns {Array} Filtered courses
     */
    byType(courses, type) {
        if (type === 'all') return courses;
        return courses.filter(course => course.type.toLowerCase() === type.toLowerCase());
    },

    /**
     * Apply current filter to courses
     * @param {Array} courses - All courses
     * @param {string} filter - Current filter
     * @returns {Array} Filtered courses
     */
    apply(courses, filter) {
        if (CONFIG.COURSE_LEVELS.includes(filter)) {
            return this.byLevel(courses, filter);
        }
        return this.byType(courses, filter);
    }
};

// Rendering Functions
const renderer = {
    /**
     * Render course cards
     * @param {Array} courses - Courses to render
     */
    renderCourses(courses) {
        if (!elements.coursesGrid) return;

        if (courses.length === 0) {
            elements.coursesGrid.innerHTML = `
                <div class="no-courses">
                    <i class="fas fa-search"></i>
                    <h3>No Courses Found</h3>
                    <p>No courses match the current filter. Try selecting a different option.</p>
                </div>
            `;
            return;
        }

        const coursesHTML = courses.map(course => `
            <div class="course-card level-${course.level}" data-level="${course.level}" data-type="${course.type}">
                <div class="course-header">
                    <div class="course-code">${course.courseCode}</div>
                    <div class="course-level">${course.level} Level</div>
                    <h3 class="course-title">${course.courseTitle}</h3>
                </div>
                <div class="course-content">
                    <p class="course-description">${course.description}</p>
                    <div class="course-details">
                        <div class="detail-item">
                            <i class="fas fa-credit-card"></i>
                            <span>${course.credits} Credits</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-tag"></i>
                            <span class="${utils.getTypeClass(course.type)}">${course.type.charAt(0).toUpperCase() + course.type.slice(1)}</span>
                        </div>
                    </div>
                    ${course.prerequisites.length > 0 ? `
                        <div class="course-prerequisites">
                            <div class="prerequisites-title">Prerequisites:</div>
                            <div class="prerequisites-list">
                                ${course.prerequisites.map(prereq => `
                                    <span class="prerequisite-tag">${prereq}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${course.materials.length > 0 ? `
                        <div class="course-materials">
                            <div class="materials-title">Available Materials:</div>
                            <div class="materials-count">${course.materials.length} file(s)</div>
                        </div>
                    ` : ''}
                    <div class="course-actions">
                        <button class="btn btn-primary" onclick="viewCourseDetails('${course.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${course.materials.length > 0 ? `
                            <button class="btn btn-outline" onclick="viewCourseMaterials('${course.id}')">
                                <i class="fas fa-download"></i> Materials
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        elements.coursesGrid.innerHTML = coursesHTML;
    },

    /**
     * Render course statistics
     * @param {Array} courses - All courses
     */
    renderStats(courses) {
        const stats = {
            total: courses.length,
            core: courses.filter(c => c.type === 'core').length,
            elective: courses.filter(c => c.type === 'elective').length,
            credits: courses.reduce((sum, c) => sum + c.credits, 0)
        };

        const statElements = {
            'total-courses': stats.total,
            'core-courses': stats.core,
            'elective-courses': stats.elective,
            'total-credits': stats.credits
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    },

    /**
     * Update active filter button
     * @param {string} activeFilter - Currently active filter
     */
    updateFilterButtons(activeFilter) {
        elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        });
    }
};

// Event Handlers
const handlers = {
    /**
     * Handle filter button clicks
     */
    setupFilterButtons() {
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (filter !== state.currentFilter) {
                    state.currentFilter = filter;
                    state.filteredCourses = filters.apply(state.allCourses, filter);
                    renderer.updateFilterButtons(filter);
                    renderer.renderCourses(state.filteredCourses);
                }
            });
        });
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

// Global functions for course actions
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
        state.isLoading = true;
        
        // Show loading state
        if (elements.coursesGrid) {
            utils.showLoading(elements.coursesGrid);
        }

        // Set up event handlers
        handlers.setupMobileMenu();
        handlers.setupOutsideClick();
        handlers.setupFilterButtons();

        // Fetch courses data
        const coursesData = await api.fetchCourses();
        
        // Update state
        state.allCourses = coursesData;
        state.filteredCourses = coursesData;
        state.coursesData = coursesData;

        // Hide loading state
        utils.hideLoading();

        // Render content
        renderer.renderCourses(state.filteredCourses);
        renderer.renderStats(state.allCourses);
        renderer.updateFilterButtons(state.currentFilter);

        console.log('Courses page initialized successfully');
        console.log(`Loaded ${coursesData.length} courses`);
        
    } catch (error) {
        console.error('Error initializing courses page:', error);
        utils.hideLoading();
        
        if (elements.coursesGrid) {
            utils.showError(elements.coursesGrid, 'Failed to load courses. Please check your connection and try again.');
        }
    } finally {
        state.isLoading = false;
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for potential use in other modules
window.CoursesPage = {
    init,
    api,
    renderer,
    filters,
    utils,
    state
};