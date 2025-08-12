const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'], // Allow both ports
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded materials and images)
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve frontend static files (CSS, JS, images)
app.use('/styles', express.static(path.join(__dirname, '../styles')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use('/pages', express.static(path.join(__dirname, '../pages')));
app.use('/doc', express.static(path.join(__dirname, '../doc')));

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Information Systems Backend API is running' });
});

// Frontend route handlers
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/login.html'));
});

app.get('/student/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/student/login.html'));
});

app.get('/student/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/student/dashboard.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../pages/admin/dashboard.html'));
});

// Catch all handler for frontend routes (SPA behavior)
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    // Check if it's a file request (has extension)
    if (path.extname(req.path)) {
        return res.status(404).send('File not found');
    }
    
    // For all other routes, serve the main index.html
    res.sendFile(path.join(__dirname, '../pages/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initDatabase();
        console.log('✓ Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`✓ Information Systems Backend API running on port ${PORT}`);
            console.log(`✓ Frontend available at: http://localhost:${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
            console.log(`✓ API endpoints: http://localhost:${PORT}/api`);
            console.log(`✓ Admin login: http://localhost:${PORT}/admin/login`);
            console.log(`✓ Student login: http://localhost:${PORT}/student/login`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server gracefully...');
    process.exit(0);
});

startServer();

module.exports = app;