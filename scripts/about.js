/**
 * About Page JavaScript
 * Handles dynamic content loading and interactions for the about page
 */

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    ENDPOINTS: {
        ABOUT: '/api/about',
        STATS: '/api/stats',
        FACULTY: '/api/faculty'
    }
};

// DOM Elements
const elements = {
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    mainNav: document.querySelector('.main-nav'),
    statsCards: document.querySelectorAll('.stat-number'),
    facultyGrid: document.querySelector('.faculty-grid'),
    aboutSection: document.querySelector('.about-content'),
    visionMission: document.querySelector('.vision-mission')
};

// State management
const state = {
    isLoading: false,
    aboutData: null,
    facultyData: null,
    statsData: null
};

// Utility Functions
const utils = {
    /**
     * Show loading state for an element
     * @param {HTMLElement} element - Element to show loading state
     */
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
            element.innerHTML = '<div class="loading-spinner">Loading...</div>';
        }
    },

    /**
     * Hide loading state for an element
     * @param {HTMLElement} element - Element to hide loading state
     */
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    },

    /**
     * Show error message
     * @param {HTMLElement} element - Element to show error in
     * @param {string} message - Error message
     */
    showError(element, message) {
        if (element) {
            element.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    },

    /**
     * Animate number counting
     * @param {HTMLElement} element - Element containing the number
     * @param {number} target - Target number
     * @param {number} duration - Animation duration in ms
     */
    animateNumber(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(progress * target);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} - Whether element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

// API Functions
const api = {
    /**
     * Fetch about data from backend
     * @returns {Promise<Object>} About data
     */
    async fetchAboutData() {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.ABOUT);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch about data from API, using fallback:', error);
            return this.getFallbackAboutData();
        }
    },

    /**
     * Fetch statistics data
     * @returns {Promise<Object>} Statistics data
     */
    async fetchStatsData() {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.STATS);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch stats data from API, using fallback:', error);
            return this.getFallbackStatsData();
        }
    },

    /**
     * Fetch faculty data
     * @returns {Promise<Array>} Faculty data
     */
    async fetchFacultyData() {
        try {
            const response = await fetch(CONFIG.ENDPOINTS.FACULTY);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch faculty data from API, using fallback:', error);
            return this.getFallbackFacultyData();
        }
    },

    /**
     * Fallback about data when API is unavailable
     * @returns {Object} Static about data
     */
    getFallbackAboutData() {
        return {
            description: "The Department of Information Systems bridges the gap between business and technology, preparing students for the digital economy. We focus on practical applications of information technology in organizational contexts.",
            vision: "To be a leading department in Information Systems education and research, producing graduates who drive digital transformation in Nigeria and beyond.",
            mission: "To provide quality education in Information Systems, conduct cutting-edge research, and foster innovation in the application of technology to solve real-world business problems.",
            established: "2018",
            accreditation: "Fully Accredited by NUC"
        };
    },

    /**
     * Fallback statistics data
     * @returns {Object} Static statistics
     */
    getFallbackStatsData() {
        return {
            students: 245,
            faculty: 12,
            courses: 32,
            graduates: 89
        };
    },

    /**
     * Fallback faculty data
     * @returns {Array} Static faculty information
     */
    getFallbackFacultyData() {
        return [
            {
                name: "Dr. Emmanuel Akpan",
                title: "Head of Department",
                qualification: "Ph.D Computer Science",
                email: "e.akpan@uniuyo.edu.ng",
                specialization: "Database Systems, Information Security"
            },
            {
                name: "Prof. Grace Udoh",
                title: "Professor",
                qualification: "Ph.D Information Systems",
                email: "g.udoh@uniuyo.edu.ng",
                specialization: "Business Intelligence, Data Analytics"
            },
            {
                name: "Dr. Michael Etuk",
                title: "Senior Lecturer",
                qualification: "Ph.D Information Technology",
                email: "m.etuk@uniuyo.edu.ng",
                specialization: "Web Development, Mobile Computing"
            },
            {
                name: "Dr. Sarah Okon",
                title: "Lecturer I",
                qualification: "Ph.D Management Information Systems",
                email: "s.okon@uniuyo.edu.ng",
                specialization: "Enterprise Systems, Project Management"
            }
        ];
    }
};

// Content Rendering Functions
const renderer = {
    /**
     * Render statistics with animation
     * @param {Object} stats - Statistics data
     */
    renderStats(stats) {
        const statMapping = {
            'students': stats.students || 245,
            'faculty': stats.faculty || 12,
            'courses': stats.courses || 32,
            'graduates': stats.graduates || 89
        };

        elements.statsCards.forEach(card => {
            const statType = card.getAttribute('data-stat');
            if (statMapping[statType]) {
                // Start animation when card comes into view
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            utils.animateNumber(card, statMapping[statType]);
                            observer.unobserve(entry.target);
                        }
                    });
                });
                observer.observe(card.parentElement);
            }
        });
    },

    /**
     * Render faculty information
     * @param {Array} faculty - Faculty data
     */
    renderFaculty(faculty) {
        if (!elements.facultyGrid) return;

        const facultyHTML = faculty.map(member => `
            <div class="faculty-card">
                <div class="faculty-image">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="faculty-info">
                    <h4 class="faculty-name">${member.name}</h4>
                    <p class="faculty-title">${member.title}</p>
                    <p class="faculty-qualification">${member.qualification}</p>
                    ${member.specialization ? `<p class="faculty-specialization"><strong>Specialization:</strong> ${member.specialization}</p>` : ''}
                    <div class="faculty-contact">
                        <p><i class="fas fa-envelope"></i> ${member.email}</p>
                    </div>
                </div>
            </div>
        `).join('');

        elements.facultyGrid.innerHTML = facultyHTML;
    },

    /**
     * Update about content
     * @param {Object} aboutData - About information
     */
    updateAboutContent(aboutData) {
        // Update description if element exists
        const descElement = document.querySelector('.about-text p');
        if (descElement && aboutData.description) {
            descElement.textContent = aboutData.description;
        }

        // Update vision and mission
        const visionElement = document.querySelector('.vision-card p');
        const missionElement = document.querySelector('.mission-card p');
        
        if (visionElement && aboutData.vision) {
            visionElement.textContent = aboutData.vision;
        }
        
        if (missionElement && aboutData.mission) {
            missionElement.textContent = aboutData.mission;
        }
    }
};

// Event Handlers
const handlers = {
    /**
     * Handle mobile menu toggle
     */
    handleMobileMenu() {
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
    handleOutsideClick() {
        document.addEventListener('click', (e) => {
            if (elements.mainNav?.classList.contains('active') &&
                !e.target.closest('.main-nav') &&
                !e.target.closest('.mobile-menu-btn')) {
                elements.mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    },

    /**
     * Handle smooth scrolling for anchor links
     */
    handleSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
};

// Main initialization function
async function init() {
    try {
        state.isLoading = true;

        // Set up event handlers
        handlers.handleMobileMenu();
        handlers.handleOutsideClick();
        handlers.handleSmoothScroll();

        // Load data concurrently
        const [aboutData, statsData, facultyData] = await Promise.all([
            api.fetchAboutData(),
            api.fetchStatsData(),
            api.fetchFacultyData()
        ]);

        // Store data in state
        state.aboutData = aboutData;
        state.statsData = statsData;
        state.facultyData = facultyData;

        // Render content
        renderer.updateAboutContent(aboutData);
        renderer.renderStats(statsData);
        renderer.renderFaculty(facultyData);

        console.log('About page initialized successfully');
    } catch (error) {
        console.error('Error initializing about page:', error);
        
        // Show error message if critical elements fail to load
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-banner';
            errorDiv.innerHTML = `
                <div class="container">
                    <p><i class="fas fa-exclamation-triangle"></i> Some content may not be up to date. Please refresh the page or try again later.</p>
                </div>
            `;
            mainContent.insertBefore(errorDiv, mainContent.firstChild);
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
window.AboutPage = {
    init,
    api,
    renderer,
    utils,
    state
};