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
    loadingSpinner: document.getElementById('loadingSpinner'),
    mainContent: document.querySelector('.main-content'),
    heroStats: document.getElementById('heroStats'),
    deptInfoGrid: document.getElementById('deptInfoGrid'),
    objectivesGrid: document.getElementById('objectivesGrid'),
    programsGrid: document.getElementById('programsGrid'),
    expertiseGrid: document.getElementById('expertiseGrid'),
    errorMessage: document.getElementById('errorMessage'),
    loginLink: document.getElementById('loginLink'),
    logoutBtn: document.getElementById('logoutBtn'),
    authLinks: document.querySelector('.auth-links')
};

// Static data for immediate rendering
const staticData = {
    stats: [
        { number: '500+', label: 'Students Enrolled' },
        { number: '15+', label: 'Faculty Members' },
        { number: '10+', label: 'Years of Excellence' },
        { number: '95%', label: 'Graduate Employment Rate' }
    ],
    departmentInfo: [
        { title: 'Established', content: '2010' },
        { title: 'Location', content: 'Faculty of Computing Building' },
        { title: 'Head of Department', content: 'Prof. John Doe' },
        { title: 'Total Faculty', content: '15 Lecturers' }
    ],
    objectives: [
        {
            icon: 'fas fa-graduation-cap',
            title: 'Quality Education',
            description: 'Provide comprehensive education in information systems and technology'
        },
        {
            icon: 'fas fa-lightbulb',
            title: 'Innovation',
            description: 'Foster innovative thinking and problem-solving skills'
        },
        {
            icon: 'fas fa-handshake',
            title: 'Industry Partnership',
            description: 'Build strong partnerships with industry leaders'
        },
        {
            icon: 'fas fa-globe',
            title: 'Global Perspective',
            description: 'Prepare students for the global digital economy'
        }
    ],
    programs: [
        {
            title: 'Bachelor of Information Systems',
            degree: 'B.Sc. Information Systems',
            duration: '4 Years',
            description: 'Comprehensive undergraduate program covering business processes, technology, and data management.'
        },
        {
            title: 'Master of Information Systems',
            degree: 'M.Sc. Information Systems',
            duration: '2 Years',
            description: 'Advanced graduate program focusing on strategic IT management and enterprise systems.'
        }
    ],
    expertise: [
        { title: 'Database Management', description: 'Design and administration of enterprise databases' },
        { title: 'Systems Analysis', description: 'Business process analysis and system design' },
        { title: 'Web Development', description: 'Modern web applications and services' },
        { title: 'Data Analytics', description: 'Business intelligence and data science' },
        { title: 'Cybersecurity', description: 'Information security and risk management' },
        { title: 'Project Management', description: 'IT project planning and execution' }
    ]
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
     * Hide loading spinner immediately
     */
    hideLoading() {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.style.display = 'none';
            elements.loadingSpinner.setAttribute('aria-hidden', 'true');
        }
    },

    /**
     * Show main content
     */
    showContent() {
        if (elements.mainContent) {
            elements.mainContent.style.display = 'block';
            elements.mainContent.style.visibility = 'visible';
            elements.mainContent.style.opacity = '1';
        }
    },

    /**
     * Hide error message
     */
    hideError() {
        if (elements.errorMessage) {
            elements.errorMessage.style.display = 'none';
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
     * Render hero stats
     */
    renderHeroStats() {
        if (!elements.heroStats) return;
        
        elements.heroStats.innerHTML = staticData.stats.map(stat => `
            <div class="hero-stat">
                <span class="hero-stat-number">${stat.number}</span>
                <span class="hero-stat-label">${stat.label}</span>
            </div>
        `).join('');
    },

    /**
     * Render department info
     */
    renderDepartmentInfo() {
        if (!elements.deptInfoGrid) return;
        
        elements.deptInfoGrid.innerHTML = staticData.departmentInfo.map(info => `
            <div class="info-card">
                <h3>${info.title}</h3>
                <p>${info.content}</p>
            </div>
        `).join('');
    },

    /**
     * Render mission and vision cards
     */
    renderMissionVision() {
        const missionCard = document.querySelector('.mission-card');
        const visionCard = document.querySelector('.vision-card');
        
        if (missionCard) {
            missionCard.innerHTML = `
                <div class="card-icon">
                    <i class="fas fa-bullseye"></i>
                </div>
                <h2>Our Mission</h2>
                <p>To provide world-class education in Information Systems, fostering innovation and excellence in the digital transformation of business and society.</p>
            `;
        }
        
        if (visionCard) {
            visionCard.innerHTML = `
                <div class="card-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <h2>Our Vision</h2>
                <p>To be a leading department in Information Systems education, research, and innovation in Nigeria and beyond.</p>
            `;
        }
    },

    /**
     * Render objectives
     */
    renderObjectives() {
        if (!elements.objectivesGrid) return;
        
        elements.objectivesGrid.innerHTML = staticData.objectives.map(obj => `
            <div class="objective-card">
                <i class="${obj.icon}"></i>
                <h3>${obj.title}</h3>
                <p>${obj.description}</p>
            </div>
        `).join('');
    },

    /**
     * Render programs
     */
    renderPrograms() {
        if (!elements.programsGrid) return;
        
        elements.programsGrid.innerHTML = staticData.programs.map(program => `
            <div class="program-card">
                <div class="program-header">
                    <h3>${program.title}</h3>
                    <span class="program-degree">${program.degree}</span>
                </div>
                <div class="program-content">
                    <div class="program-duration">
                        <i class="fas fa-clock"></i> Duration: ${program.duration}
                    </div>
                    <div class="program-description">${program.description}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Render expertise areas
     */
    renderExpertise() {
        if (!elements.expertiseGrid) return;
        
        elements.expertiseGrid.innerHTML = staticData.expertise.map(area => `
            <div class="expertise-item">
                <h4>${area.title}</h4>
                <p>${area.description}</p>
            </div>
        `).join('');
    },

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
                const isActive = elements.mainNav.classList.contains('active');
                elements.mobileMenuBtn.setAttribute('aria-expanded', isActive);
                document.body.style.overflow = isActive ? 'hidden' : '';
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
                elements.mobileMenuBtn?.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    },

    /**
     * Handle authentication display
     */
    handleAuth() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (elements.authLinks) {
            if (user && token) {
                // User is logged in
                elements.authLinks.innerHTML = `
                    <span>Welcome back!</span>
                    <a href="#" class="btn btn-danger" id="logoutBtn">Logout</a>
                `;
                
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        window.location.href = '/';
                    });
                }
            } else {
                // User not logged in
                elements.authLinks.innerHTML = `
                    <a href="/pages/login.html" class="btn btn-outline">Student Login</a>
                `;
            }
        }
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
        handlers.handleAuth();

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
        renderer.renderHeroStats();
        renderer.renderDepartmentInfo();
        renderer.renderMissionVision();
        renderer.renderObjectives();
        renderer.renderPrograms();
        renderer.renderExpertise();

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
        utils.hideLoading();
        utils.showContent();
    }
}

// Force immediate initialization
utils.hideLoading();
utils.showContent();

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded, initialize immediately
    init();
}

// Fallback - force hide loading after 100ms regardless
setTimeout(() => {
    utils.hideLoading();
    utils.showContent();
}, 100);

// Export for potential use in other modules
window.AboutPage = {
    init,
    api,
    renderer,
    utils,
    state
};