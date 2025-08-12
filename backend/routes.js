const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('./db');
const { sendPasscodeEmail } = require('./email');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../assets/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Define allowed file types
        const allowedTypes = {
            'application/pdf': ['.pdf'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'video/mp4': ['.mp4'],
            'video/avi': ['.avi'],
            'video/quicktime': ['.mov'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif']
        };

        if (allowedTypes[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, PPT, PPTX, DOC, DOCX, MP4, AVI, MOV, JPG, PNG, GIF files are allowed.'));
        }
    }
});

// Utility function to generate random passcode
const generatePasscode = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Utility function to validate registration number format
const validateRegNumber = (regNumber) => {
    // Expected format: YY/dept/code/XXX (e.g., 24/is/co/346)
    const regex = /^\d{2}\/[a-zA-Z]{2,4}\/[a-zA-Z]{2,4}\/\d{3,4}$/i;
    return regex.test(regNumber);
};

// POST /api/signup - Student registration
router.post('/signup', async (req, res) => {
    try {
        const { name, regNumber, email } = req.body;

        // Validation
        if (!name || !regNumber || !email) {
            return res.status(400).json({ 
                error: 'All fields are required',
                message: 'Please provide name, registration number, and email' 
            });
        }

        if (!validateRegNumber(regNumber)) {
            return res.status(400).json({
                error: 'Invalid registration number format',
                message: 'Registration number must follow format: YY/dept/code/XXX (e.g., 24/is/co/346)'
            });
        }

        const db = getDatabase();

        // Check if user already exists
        db.get(
            'SELECT id FROM users WHERE regNumber = ? OR email = ?',
            [regNumber.toLowerCase(), email.toLowerCase()],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (row) {
                    return res.status(409).json({
                        error: 'User already exists',
                        message: 'Registration number or email already registered'
                    });
                }

                // Insert new pending registration
                db.run(
                    `INSERT INTO users (name, regNumber, email, status) 
                     VALUES (?, ?, ?, 'pending')`,
                    [name.trim(), regNumber.toLowerCase(), email.toLowerCase()],
                    function(err) {
                        if (err) {
                            console.error('Error inserting user:', err);
                            return res.status(500).json({ error: 'Failed to register user' });
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Registration submitted successfully. Awaiting admin approval.',
                            userId: this.lastID
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/pending-registrations - Get pending registrations (Admin only)
router.get('/pending-registrations', (req, res) => {
    try {
        const db = getDatabase();

        db.all(
            `SELECT id, name, regNumber, email, createdAt 
             FROM users 
             WHERE status = 'pending' 
             ORDER BY createdAt DESC`,
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error fetching pending registrations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/confirm-registration - Confirm student registration (Admin only)
router.post('/confirm-registration', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const db = getDatabase();

        // Get user details
        db.get(
            'SELECT * FROM users WHERE id = ? AND status = ?',
            [userId, 'pending'],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'Pending user not found' });
                }

                try {
                    // Generate random passcode
                    const passcode = generatePasscode(10);
                    const hashedPasscode = await bcrypt.hash(passcode, 12);

                    // Update user status and set passcode
                    db.run(
                        `UPDATE users 
                         SET passcode = ?, status = 'active', updatedAt = CURRENT_TIMESTAMP 
                         WHERE id = ?`,
                        [hashedPasscode, userId],
                        async (err) => {
                            if (err) {
                                console.error('Error updating user:', err);
                                return res.status(500).json({ error: 'Failed to confirm registration' });
                            }

                            // Send passcode email
                            try {
                                await sendPasscodeEmail(user.email, user.name, user.regNumber, passcode);
                                
                                res.json({
                                    success: true,
                                    message: 'Registration confirmed and passcode sent to student email',
                                    passcode: passcode // Remove this in production
                                });
                            } catch (emailError) {
                                console.error('Email error:', emailError);
                                // Still return success since user was activated
                                res.json({
                                    success: true,
                                    message: 'Registration confirmed but email failed to send',
                                    passcode: passcode // Remove this in production
                                });
                            }
                        }
                    );
                } catch (hashError) {
                    console.error('Password hashing error:', hashError);
                    res.status(500).json({ error: 'Failed to process registration' });
                }
            }
        );
    } catch (error) {
        console.error('Confirm registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/login - User login
router.post('/login', async (req, res) => {
    try {
        const { regNumber, passcode } = req.body;

        if (!regNumber || !passcode) {
            return res.status(400).json({ 
                error: 'Registration number and passcode are required' 
            });
        }

        const db = getDatabase();

        db.get(
            'SELECT * FROM users WHERE regNumber = ? AND status = ?',
            [regNumber.toLowerCase(), 'active'],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(401).json({ 
                        error: 'Invalid credentials',
                        message: 'Registration number not found or account not activated'
                    });
                }

                try {
                    // Compare passcode
                    const isValidPasscode = await bcrypt.compare(passcode, user.passcode);

                    if (!isValidPasscode) {
                        return res.status(401).json({ 
                            error: 'Invalid credentials',
                            message: 'Incorrect passcode'
                        });
                    }

                    // Return user info (without sensitive data)
                    res.json({
                        success: true,
                        user: {
                            id: user.id,
                            name: user.name,
                            regNumber: user.regNumber,
                            email: user.email,
                            role: user.role
                        },
                        message: 'Login successful'
                    });

                } catch (bcryptError) {
                    console.error('Bcrypt error:', bcryptError);
                    res.status(500).json({ error: 'Authentication error' });
                }
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/change-password - Change user passcode
router.post('/change-password', async (req, res) => {
    try {
        const { regNumber, currentPasscode, newPasscode } = req.body;

        if (!regNumber || !currentPasscode || !newPasscode) {
            return res.status(400).json({ 
                error: 'All fields are required',
                message: 'Please provide registration number, current passcode, and new passcode'
            });
        }

        if (newPasscode.length < 6) {
            return res.status(400).json({
                error: 'Invalid new passcode',
                message: 'New passcode must be at least 6 characters long'
            });
        }

        const db = getDatabase();

        db.get(
            'SELECT * FROM users WHERE regNumber = ? AND status = ?',
            [regNumber.toLowerCase(), 'active'],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                try {
                    // Verify current passcode
                    const isValidPasscode = await bcrypt.compare(currentPasscode, user.passcode);

                    if (!isValidPasscode) {
                        return res.status(401).json({ 
                            error: 'Invalid current passcode' 
                        });
                    }

                    // Hash new passcode
                    const hashedNewPasscode = await bcrypt.hash(newPasscode, 12);

                    // Update passcode
                    db.run(
                        'UPDATE users SET passcode = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
                        [hashedNewPasscode, user.id],
                        (err) => {
                            if (err) {
                                console.error('Error updating passcode:', err);
                                return res.status(500).json({ error: 'Failed to update passcode' });
                            }

                            res.json({
                                success: true,
                                message: 'Passcode updated successfully'
                            });
                        }
                    );

                } catch (bcryptError) {
                    console.error('Bcrypt error:', bcryptError);
                    res.status(500).json({ error: 'Password processing error' });
                }
            }
        );
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/materials - Upload course material (Admin only)
router.post('/materials', upload.single('materialFile'), (req, res) => {
    try {
        const { courseTitle, type } = req.body;
        const file = req.file;

        if (!courseTitle || !type || !file) {
            return res.status(400).json({ 
                error: 'All fields are required',
                message: 'Please provide course title, type, and file'
            });
        }

        const db = getDatabase();
        const filePath = `/assets/uploads/${file.filename}`;

        db.run(
            `INSERT INTO materials (courseTitle, type, fileName, filePath, uploadedBy) 
             VALUES (?, ?, ?, ?, ?)`,
            [courseTitle, type, file.originalname, filePath, 1], // Assuming admin user ID is 1
            function(err) {
                if (err) {
                    console.error('Error inserting material:', err);
                    return res.status(500).json({ error: 'Failed to upload material' });
                }

                res.status(201).json({
                    success: true,
                    message: 'Material uploaded successfully',
                    material: {
                        id: this.lastID,
                        courseTitle,
                        type,
                        fileName: file.originalname,
                        filePath
                    }
                });
            }
        );
    } catch (error) {
        console.error('Material upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/materials - Get all materials
router.get('/materials', (req, res) => {
    try {
        const db = getDatabase();

        db.all(
            `SELECT m.*, u.name as uploadedByName 
             FROM materials m 
             LEFT JOIN users u ON m.uploadedBy = u.id 
             ORDER BY m.createdAt DESC`,
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/materials/:id - Delete material (Admin only)
router.delete('/materials/:id', (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Material ID is required' });
        }

        const db = getDatabase();

        // Get material details first to delete file
        db.get(
            'SELECT * FROM materials WHERE id = ?',
            [id],
            (err, material) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!material) {
                    return res.status(404).json({ error: 'Material not found' });
                }

                // Delete from database
                db.run(
                    'DELETE FROM materials WHERE id = ?',
                    [id],
                    (err) => {
                        if (err) {
                            console.error('Error deleting material:', err);
                            return res.status(500).json({ error: 'Failed to delete material' });
                        }

                        // Try to delete physical file
                        const filePath = path.join(__dirname, '..', material.filePath);
                        fs.unlink(filePath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.warn('Could not delete file:', unlinkErr.message);
                            }
                        });

                        res.json({
                            success: true,
                            message: 'Material deleted successfully'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/events - Create new event (Admin only)
router.post('/events', upload.single('eventImage'), (req, res) => {
    try {
        const { title, date, description } = req.body;
        const file = req.file;

        if (!title || !date) {
            return res.status(400).json({ 
                error: 'Title and date are required',
                message: 'Please provide event title and date'
            });
        }

        const db = getDatabase();
        const imagePath = file ? `/assets/uploads/${file.filename}` : null;

        db.run(
            `INSERT INTO events (title, date, description, imagePath, createdBy) 
             VALUES (?, ?, ?, ?, ?)`,
            [title, date, description || '', imagePath, 1], // Assuming admin user ID is 1
            function(err) {
                if (err) {
                    console.error('Error inserting event:', err);
                    return res.status(500).json({ error: 'Failed to create event' });
                }

                res.status(201).json({
                    success: true,
                    message: 'Event created successfully',
                    event: {
                        id: this.lastID,
                        title,
                        date,
                        description,
                        imagePath
                    }
                });
            }
        );
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events - Get all events
router.get('/events', (req, res) => {
    try {
        const db = getDatabase();

        db.all(
            `SELECT e.*, u.name as createdByName 
             FROM events e 
             LEFT JOIN users u ON e.createdBy = u.id 
             ORDER BY e.date DESC, e.createdAt DESC`,
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/events/:id', (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        const db = getDatabase();

        // Get event details first to delete image file
        db.get(
            'SELECT * FROM events WHERE id = ?',
            [id],
            (err, event) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!event) {
                    return res.status(404).json({ error: 'Event not found' });
                }

                // Delete from database
                db.run(
                    'DELETE FROM events WHERE id = ?',
                    [id],
                    (err) => {
                        if (err) {
                            console.error('Error deleting event:', err);
                            return res.status(500).json({ error: 'Failed to delete event' });
                        }

                        // Try to delete image file if exists
                        if (event.imagePath) {
                            const filePath = path.join(__dirname, '..', event.imagePath);
                            fs.unlink(filePath, (unlinkErr) => {
                                if (unlinkErr) {
                                    console.warn('Could not delete image file:', unlinkErr.message);
                                }
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Event deleted successfully'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;