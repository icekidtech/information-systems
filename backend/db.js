const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../database/information_systems.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Database connection
let db;

// Initialize database connection
const initDatabase = async () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                createTables()
                    .then(() => seedDefaultData())
                    .then(() => resolve())
                    .catch(reject);
            }
        });
    });
};

// Create database tables
const createTables = () => {
    return new Promise((resolve, reject) => {
        const queries = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                regNumber TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                passcode TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                status TEXT NOT NULL DEFAULT 'pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Materials table
            `CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                courseTitle TEXT NOT NULL,
                type TEXT NOT NULL,
                fileName TEXT NOT NULL,
                filePath TEXT NOT NULL,
                uploadedBy INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploadedBy) REFERENCES users(id)
            )`,
            
            // Events table
            `CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                description TEXT,
                imagePath TEXT,
                createdBy INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (createdBy) REFERENCES users(id)
            )`,

            // Create news table
            `CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                excerpt TEXT,
                content TEXT,
                imageUrl TEXT,
                date TEXT NOT NULL,
                author TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Create achievements table  
            `CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                icon TEXT DEFAULT 'trophy',
                link TEXT,
                date TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        let completed = 0;
        const total = queries.length;

        queries.forEach((query, index) => {
            db.run(query, (err) => {
                if (err) {
                    console.error(`Error creating table ${index + 1}:`, err.message);
                    reject(err);
                } else {
                    completed++;
                    if (completed === total) {
                        console.log('✓ All database tables created successfully');
                        resolve();
                    }
                }
            });
        });
    });
};

// Seed default data
const seedDefaultData = async () => {
    return new Promise((resolve, reject) => {
        // Check if admin user already exists
        db.get('SELECT id FROM users WHERE role = ?', ['admin'], async (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                try {
                    // Create default admin user
                    const hashedPassword = await bcrypt.hash('admin123', 12);
                    
                    db.run(
                        `INSERT INTO users (name, regNumber, email, passcode, role, status) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            'System Administrator',
                            '24/is/ad/001',
                            'admin@informationsystems.uniuyo.edu.ng',
                            hashedPassword,
                            'admin',
                            'active'
                        ],
                        (err) => {
                            if (err) {
                                console.error('Error creating admin user:', err.message);
                                reject(err);
                            } else {
                                console.log('✓ Default admin user created');
                                console.log('  - RegNumber: 24/is/ad/001');
                                console.log('  - Password: admin123');
                                seedSampleData().then(resolve).catch(reject);
                            }
                        }
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                console.log('✓ Admin user already exists');
                seedSampleData().then(resolve).catch(reject);
            }
        });
    });
};

// Seed sample materials and events
const seedSampleData = () => {
    return new Promise((resolve, reject) => {
        // Check if sample data already exists
        db.get('SELECT COUNT(*) as count FROM materials', (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row.count === 0) {
                // Insert sample materials
                const sampleMaterials = [
                    {
                        courseTitle: 'Introduction to Information Systems',
                        type: 'pdf',
                        fileName: 'IS101_Introduction.pdf',
                        filePath: '/assets/uploads/IS101_Introduction.pdf'
                    },
                    {
                        courseTitle: 'Database Management Systems',
                        type: 'pdf',
                        fileName: 'IS201_Database.pdf',
                        filePath: '/assets/uploads/IS201_Database.pdf'
                    },
                    {
                        courseTitle: 'Systems Analysis and Design',
                        type: 'pptx',
                        fileName: 'IS301_Systems_Analysis.pptx',
                        filePath: '/assets/uploads/IS301_Systems_Analysis.pptx'
                    }
                ];

                let materialsInserted = 0;
                sampleMaterials.forEach((material) => {
                    db.run(
                        `INSERT INTO materials (courseTitle, type, fileName, filePath, uploadedBy) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [material.courseTitle, material.type, material.fileName, material.filePath, 1],
                        (err) => {
                            if (err) {
                                console.error('Error inserting sample material:', err.message);
                            } else {
                                materialsInserted++;
                                if (materialsInserted === sampleMaterials.length) {
                                    console.log('✓ Sample materials inserted');
                                    insertSampleEvents();
                                }
                            }
                        }
                    );
                });
            } else {
                console.log('✓ Sample data already exists');
                resolve();
            }
        });

        const insertSampleEvents = () => {
            const sampleEvents = [
                {
                    title: 'Department Orientation 2025',
                    date: '2025-01-15',
                    description: 'Welcome new students to the Department of Information Systems'
                },
                {
                    title: 'Tech Innovation Workshop',
                    date: '2025-02-20',
                    description: 'Workshop on emerging technologies in information systems'
                }
            ];

            let eventsInserted = 0;
            sampleEvents.forEach((event) => {
                db.run(
                    `INSERT INTO events (title, date, description, createdBy) 
                     VALUES (?, ?, ?, ?)`,
                    [event.title, event.date, event.description, 1],
                    (err) => {
                        if (err) {
                            console.error('Error inserting sample event:', err.message);
                        } else {
                            eventsInserted++;
                            if (eventsInserted === sampleEvents.length) {
                                console.log('✓ Sample events inserted');
                                resolve();
                            }
                        }
                    }
                );
            });
        };
    });
};

// Get database instance
const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};

// Close database connection
const closeDatabase = () => {
    return new Promise((resolve) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
};

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
};