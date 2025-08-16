const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|avi|mov/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Generate random passcode
function generatePasscode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Department About Information API
router.get('/about', async (req, res) => {
    try {
        const aboutData = {
            department: {
                name: "Department of Information Systems",
                faculty: "Faculty of Computing",
                university: "University of Uyo",
                location: "Uyo, Akwa Ibom State, Nigeria",
                established: "2010"
            },
            mission: "To provide world-class education in Information Systems, fostering innovation and excellence in the digital transformation of business and society.",
            vision: "To be the leading department in Nigeria for Information Systems education, research, and innovation, producing graduates who drive digital excellence and sustainable development in the global economy.",
            objectives: [
                "Deliver high-quality undergraduate and graduate programs in Information Systems",
                "Conduct cutting-edge research in emerging technologies and their business applications",
                "Foster industry partnerships and collaboration",
                "Develop skilled professionals for the digital economy",
                "Promote innovation and entrepreneurship in technology"
            ],
            stats: {
                students: "500+",
                faculty: "25+",
                graduates: "1000+",
                years: "15+"
            },
            programs: [
                {
                    level: "Undergraduate",
                    title: "Bachelor of Science in Information Systems",
                    duration: "4 years",
                    description: "Comprehensive program covering systems analysis, database management, enterprise systems, and information security."
                },
                {
                    level: "Graduate",
                    title: "Master of Science in Information Systems",
                    duration: "2 years",
                    description: "Advanced study in systems integration, business intelligence, and strategic technology management."
                }
            ],
            expertise: [
                {
                    area: "Database Systems",
                    description: "Design and management of enterprise database solutions"
                },
                {
                    area: "Enterprise Systems",
                    description: "ERP, CRM, and business process automation"
                },
                {
                    area: "Cybersecurity",
                    description: "Information security and risk management"
                },
                {
                    area: "Data Analytics",
                    description: "Business intelligence and data-driven decision making"
                },
                {
                    area: "Digital Transformation",
                    description: "Technology strategy and organizational change"
                },
                {
                    area: "Mobile Systems",
                    description: "Mobile application development and enterprise mobility"
                }
            ]
        };

        res.json(aboutData);
    } catch (error) {
        console.error('Error fetching about data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Courses Information API
router.get('/courses', async (req, res) => {
    try {
        const db = req.app.get('db');
        
        // Get course materials count by course
        const materialsCount = await new Promise((resolve, reject) => {
            db.all(`SELECT courseTitle, COUNT(*) as materialCount 
                    FROM materials 
                    GROUP BY courseTitle 
                    ORDER BY courseTitle`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const coursesData = {
            programs: {
                undergraduate: {
                    title: "Bachelor of Science in Information Systems",
                    duration: "4 years",
                    levels: {
                        "100": [
                            { code: "COS101", title: "Introduction to Computing", units: 3, type: "core" },
                            { code: "COS102", title: "Problem Solving and Programming", units: 3, type: "core" },
                            { code: "MTH101", title: "Elementary Mathematics I", units: 3, type: "core" },
                            { code: "MTH102", title: "Elementary Mathematics II", units: 3, type: "core" },
                            { code: "GST101", title: "Use of English", units: 2, type: "gst" },
                            { code: "GST102", title: "Nigerian Peoples and Culture", units: 2, type: "gst" }
                        ],
                        "200": [
                            { code: "INS201", title: "Systems Analysis and Design", units: 3, type: "core" },
                            { code: "INS202", title: "Database Management Systems", units: 3, type: "core" },
                            { code: "INS203", title: "Business Process Modeling", units: 3, type: "core" },
                            { code: "COS201", title: "Data Structures and Algorithms", units: 3, type: "core" },
                            { code: "MTH201", title: "Mathematical Methods", units: 3, type: "core" },
                            { code: "STA201", title: "Statistics for Computing", units: 3, type: "core" }
                        ],
                        "300": [
                            { code: "INS301", title: "Enterprise Resource Planning", units: 3, type: "core" },
                            { code: "INS302", title: "Information Security", units: 3, type: "core" },
                            { code: "INS303", title: "Web Technologies", units: 3, type: "core" },
                            { code: "INS304", title: "Data Analytics", units: 3, type: "core" },
                            { code: "INS305", title: "Project Management", units: 3, type: "elective" },
                            { code: "INS306", title: "Mobile Application Development", units: 3, type: "elective" }
                        ],
                        "400": [
                            { code: "INS401", title: "Strategic Information Systems", units: 3, type: "core" },
                            { code: "INS402", title: "Business Intelligence", units: 3, type: "core" },
                            { code: "INS403", title: "Digital Transformation", units: 3, type: "core" },
                            { code: "INS404", title: "Research Project", units: 6, type: "core" },
                            { code: "INS405", title: "Emerging Technologies", units: 3, type: "elective" },
                            { code: "INS406", title: "IT Governance", units: 3, type: "elective" }
                        ]
                    }
                },
                graduate: {
                    title: "Master of Science in Information Systems",
                    duration: "2 years",
                    courses: [
                        { code: "INS701", title: "Advanced Database Systems", units: 3, type: "core" },
                        { code: "INS702", title: "Enterprise Architecture", units: 3, type: "core" },
                        { code: "INS703", title: "Advanced Data Analytics", units: 3, type: "core" },
                        { code: "INS704", title: "Research Methodology", units: 3, type: "core" },
                        { code: "INS705", title: "Thesis", units: 6, type: "core" }
                    ]
                }
            },
            prerequisites: {
                "100": "SSCE/WAEC with credits in Mathematics, English, and three other subjects including Physics or Chemistry",
                "200": "Successful completion of 100 level courses with minimum CGPA of 2.0",
                "300": "Completion of prerequisite 200 level courses in relevant areas",
                "400": "Advanced courses requiring completion of foundational courses and project proposal",
                "Graduate": "Bachelor's degree in related field with minimum second class lower division"
            },
            careers: [
                {
                    title: "Systems Analyst",
                    description: "Analyze and design information systems to meet business requirements"
                },
                {
                    title: "Database Administrator",
                    description: "Manage and maintain enterprise database systems"
                },
                {
                    title: "IT Project Manager",
                    description: "Lead technology projects and coordinate development teams"
                },
                {
                    title: "Business Intelligence Analyst",
                    description: "Extract insights from data to support business decisions"
                },
                {
                    title: "Cybersecurity Specialist",
                    description: "Protect organizational information and systems from threats"
                },
                {
                    title: "Digital Transformation Consultant",
                    description: "Help organizations leverage technology for competitive advantage"
                }
            ],
            materialsAvailable: materialsCount
        };

        res.json(coursesData);
    } catch (error) {
        console.error('Error fetching courses data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contact Information API
router.get('/contact', async (req, res) => {
    try {
        const contactData = {
            department: {
                name: "Department of Information Systems",
                faculty: "Faculty of Computing",
                university: "University of Uyo"
            },
            address: {
                street: "Faculty of Computing Building",
                city: "Uyo",
                state: "Akwa Ibom State",
                country: "Nigeria",
                postalCode: "P.M.B. 1017"
            },
            contact: {
                phone: "+234 123 456 7890",
                email: "info@informationsystems.edu.org",
                website: "https://informationsystems.uniuyo.edu.ng"
            },
            office_hours: {
                weekdays: "8:00 AM - 5:00 PM",
                weekends: "Closed",
                holidays: "Closed"
            },
            social_media: {
                facebook: "https://facebook.com/InfoSysUniUyo",
                twitter: "https://twitter.com/InfoSysUniUyo",
                linkedin: "https://linkedin.com/company/infosys-uniuyo",
                instagram: "https://instagram.com/InfoSysUniUyo"
            },
            key_personnel: [
                {
                    name: "Prof. John Doe",
                    position: "Head of Department",
                    email: "hod@informationsystems.edu.org",
                    office: "Room 101, Computing Building"
                },
                {
                    name: "Dr. Jane Smith",
                    position: "Deputy Head of Department",
                    email: "dhod@informationsystems.edu.org",
                    office: "Room 102, Computing Building"
                },
                {
                    name: "Dr. Michael Johnson",
                    position: "Admissions Officer",
                    email: "admissions@informationsystems.edu.org",
                    office: "Room 103, Computing Building"
                }
            ],
            directions: "The Faculty of Computing is located on the main campus of the University of Uyo. Take the main entrance and follow signs to the Computing Building."
        };

        res.json(contactData);
    } catch (error) {
        console.error('Error fetching contact data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contact Form Submission API
router.post('/contact', async (req, res) => {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    try {
        const db = req.app.get('db');
        
        // Store contact form submission in database
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO contact_submissions (name, email, phone, subject, message) 
                    VALUES (?, ?, ?, ?, ?)`,
                [name, email, phone || null, subject, message],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // Send notification email to department
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'info@informationsystems.edu.org',
            subject: `Contact Form Submission: ${subject}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Contact form submitted successfully. We will get back to you soon.' });
    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Student signup
router.post('/signup', async (req, res) => {
    const { name, regNumber, email } = req.body;

    if (!name || !regNumber || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const db = req.app.get('db');
        
        // Check if registration number already exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE regNumber = ?', [regNumber], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Registration number already exists' });
        }

        // Insert pending registration
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (name, regNumber, email, status) VALUES (?, ?, ?, ?)',
                [name, regNumber, email, 'pending'], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });

        res.status(201).json({ message: 'Registration submitted successfully. Please wait for admin approval.' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pending registrations (admin only)
router.get('/pending-registrations', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const db = req.app.get('db');
        const pendingUsers = await new Promise((resolve, reject) => {
            db.all('SELECT id, name, regNumber, email, createdAt FROM users WHERE status = ?', 
                ['pending'], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });

        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending registrations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Confirm registration (admin only)
router.post('/confirm-registration/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.id;

    try {
        const db = req.app.get('db');
        
        // Get user details
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ? AND status = ?', 
                [userId, 'pending'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        if (!user) {
            return res.status(404).json({ error: 'Pending registration not found' });
        }

        const passcode = generatePasscode();

        // Update user status and set passcode
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET status = ?, passcode = ? WHERE id = ?',
                ['confirmed', passcode, userId], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });

        // Send email with passcode
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Account Confirmed - Information Systems Department',
            html: `
                <h2>Account Confirmation</h2>
                <p>Dear ${user.name},</p>
                <p>Your account has been confirmed. Here are your login credentials:</p>
                <p><strong>Registration Number:</strong> ${user.regNumber}</p>
                <p><strong>Passcode:</strong> ${passcode}</p>
                <p>You can now login to the student dashboard.</p>
                <p>Best regards,<br>Information Systems Department</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Registration confirmed and passcode sent via email' });
    } catch (error) {
        console.error('Error confirming registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Student login
router.post('/login', async (req, res) => {
    const { regNumber, passcode } = req.body;

    if (!regNumber || !passcode) {
        return res.status(400).json({ error: 'Registration number and passcode are required' });
    }

    try {
        const db = req.app.get('db');
        
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE regNumber = ? AND status = ?', 
                [regNumber, 'confirmed'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
        });

        if (!user || user.passcode !== passcode) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, regNumber: user.regNumber, role: 'student' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                regNumber: user.regNumber,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const db = req.app.get('db');
        
        const admin = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM admins WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: admin.id,
                username: admin.username,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password/passcode
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    try {
        const db = req.app.get('db');
        
        if (req.user.role === 'student') {
            // For students, change passcode
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!user || user.passcode !== currentPassword) {
                return res.status(401).json({ error: 'Current passcode is incorrect' });
            }

            await new Promise((resolve, reject) => {
                db.run('UPDATE users SET passcode = ? WHERE id = ?',
                    [newPassword, req.user.id], function(err) {
                        if (err) reject(err);
                        else resolve();
                    });
            });
        } else if (req.user.role === 'admin') {
            // For admins, change password
            const admin = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM admins WHERE id = ?', [req.user.id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await new Promise((resolve, reject) => {
                db.run('UPDATE admins SET password = ? WHERE id = ?',
                    [hashedPassword, req.user.id], function(err) {
                        if (err) reject(err);
                        else resolve();
                    });
            });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload material (admin only)
router.post('/materials', authenticateToken, upload.single('file'), async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { courseTitle, description, type } = req.body;

    if (!courseTitle || !req.file) {
        return res.status(400).json({ error: 'Course title and file are required' });
    }

    try {
        const db = req.app.get('db');
        
        const filePath = `/uploads/${req.file.filename}`;
        
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO materials (courseTitle, description, type, fileName, filePath, uploadedBy) VALUES (?, ?, ?, ?, ?, ?)',
                [courseTitle, description, type, req.file.originalname, filePath, req.user.id],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });

        res.status(201).json({ message: 'Material uploaded successfully' });
    } catch (error) {
        console.error('Upload material error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get materials
router.get('/materials', async (req, res) => {
    try {
        const db = req.app.get('db');
        
        const materials = await new Promise((resolve, reject) => {
            db.all('SELECT id, courseTitle, description, type, fileName, filePath, createdAt FROM materials ORDER BY createdAt DESC',
                [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
        });

        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get news articles
router.get('/api/news', (req, res) => {
    try {
        const query = `
            SELECT id, title, excerpt, content, imageUrl, date, author
            FROM news 
            ORDER BY date DESC 
            LIMIT 10
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching news:', err);
                return res.status(500).json({ error: 'Failed to fetch news' });
            }
            res.json(rows || []);
        });
    } catch (error) {
        console.error('Error in /api/news:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student achievements
router.get('/api/achievements', (req, res) => {
    try {
        const query = `
            SELECT id, title, description, icon, link, date
            FROM achievements 
            ORDER BY date DESC 
            LIMIT 6
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching achievements:', err);
                return res.status(500).json({ error: 'Failed to fetch achievements' });
            }
            res.json(rows || []);
        });
    } catch (error) {
        console.error('Error in /api/achievements:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;