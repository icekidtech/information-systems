// DOM Elements
const newsContainer = document.getElementById('newsContainer');
const achievementsContainer = document.getElementById('achievementsContainer');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');

// API Endpoints
const API_BASE_URL = 'http://localhost:3000/api';
const ENDPOINTS = {
    NEWS: `${API_BASE_URL}/news`,
    ACHIEVEMENTS: `${API_BASE_URL}/achievements`
};

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

// Format date
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Fetch data from API
const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

// Render news articles
const renderNews = (articles) => {
    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = '<p class="no-data">No news articles available at the moment.</p>';
        return;
    }

    const newsHTML = articles.map(article => `
        <article class="news-card">
            <img src="${article.imageUrl || '/assets/images/news-placeholder.jpg'}" 
                 alt="${article.title}" 
                 class="news-image">
            <div class="news-content">
                <span class="news-date">${formatDate(article.date)}</span>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.excerpt}</p>
                <a href="/news/${article.id}" class="btn btn-outline">Read More</a>
            </div>
        </article>
    `).join('');

    newsContainer.innerHTML = newsHTML;
};

// Render achievements
const renderAchievements = (achievements) => {
    if (!achievements || achievements.length === 0) {
        achievementsContainer.innerHTML = '<p class="no-data">No achievements to display at the moment.</p>';
        return;
    }

    const achievementsHTML = achievements.map(achievement => `
        <div class="achievement-card">
            <div class="achievement-icon">
                <i class="fas fa-${achievement.icon || 'trophy'}"></i>
            </div>
            <h3 class="achievement-title">${achievement.title}</h3>
            <p class="achievement-description">${achievement.description}</p>
            ${achievement.link ? `<a href="${achievement.link}" class="btn btn-outline btn-sm" target="_blank">View Details</a>` : ''}
        </div>
    `).join('');

    achievementsContainer.innerHTML = achievementsHTML;
};

// Initialize the page
const init = async () => {
    try {
        // Fetch and render news
        const newsData = await fetchData(ENDPOINTS.NEWS);
        if (newsData) {
            renderNews(newsData);
        }

        // Fetch and render achievements
        const achievementsData = await fetchData(ENDPOINTS.ACHIEVEMENTS);
        if (achievementsData) {
            renderAchievements(achievementsData);
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
};

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);