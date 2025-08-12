/**
 * Data Management Module for Department of Information Systems
 * Uses SQL.js for client-side SQLite database
 */

// Database instance
let db;
const DB_NAME = 'information-systems';

// Initialize database
async function initDatabase() {
  try {
    // Load SQL.js
    const SQL = await initSqlJs({
      locateFile: file => `scripts/sql.js/${file}`
    });
    
    // Create new database
    db = new SQL.Database();
    
    // Create tables if they don't exist
    createTables();
    
    // Seed initial data
    await seedDatabase();
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Create database tables
function createTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      regNumber TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passcode TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Materials table
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseTitle TEXT NOT NULL,
      type TEXT NOT NULL,
      fileName TEXT NOT NULL,
      filePath TEXT,
      uploadedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploadedBy) REFERENCES users(id)
    )
  `);

  // Events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      eventDate TEXT NOT NULL,
      imageUrl TEXT,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);
}

// Seed initial data
async function seedDatabase() {
  // Check if admin already exists
  const adminCheck = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  
  if (!adminCheck) {
    // Create default admin
    db.prepare(`
      INSERT INTO users (name, regNumber, email, passcode, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Admin User',
      'admin/001',
      'admin@uniuyo.edu.ng',
      'admin123', // In production, this should be hashed
      'admin',
      'approved'
    );
  }

  // Add sample materials if none exist
  const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  if (materialCount === 0) {
    const sampleMaterials = [
      {
        courseTitle: 'Introduction to Information Systems',
        type: 'pdf',
        fileName: 'is101-intro.pdf',
        uploadedBy: 1
      },
      {
        courseTitle: 'Database Systems',
        type: 'pptx',
        fileName: 'cs201-databases.pptx',
        uploadedBy: 1
      }
    ];

    const insertMaterial = db.prepare(`
      INSERT INTO materials (courseTitle, type, fileName, uploadedBy)
      VALUES (?, ?, ?, ?)
    `);

    sampleMaterials.forEach(material => {
      insertMaterial.run(
        material.courseTitle,
        material.type,
        material.fileName,
        material.uploadedBy
      );
    });
  }

  // Add sample events if none exist
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventCount === 0) {
    const sampleEvents = [
      {
        title: 'Departmental Orientation',
        description: 'Welcome new students to the department',
        eventDate: '2024-09-15',
        createdBy: 1
      },
      {
        title: 'Tech Workshop',
        description: 'Hands-on workshop on modern web technologies',
        eventDate: '2024-10-20',
        createdBy: 1
      }
    ];

    const insertEvent = db.prepare(`
      INSERT INTO events (title, description, eventDate, createdBy)
      VALUES (?, ?, ?, ?)
    `);

    sampleEvents.forEach(event => {
      insertEvent.run(
        event.title,
        event.description,
        event.eventDate,
        event.createdBy
      );
    });
  }
}

// User Management
const userService = {
  // Validate registration number format (e.g., 24/sc/co/346)
  validateRegNumber(regNumber) {
    const pattern = /^\d{2}\/[a-z]{2,4}\/[a-z]{2,4}\/\d{3}$/i;
    return pattern.test(regNumber);
  },

  // Sign up a new student (pending approval)
  signUp(name, regNumber, email) {
    if (!this.validateRegNumber(regNumber)) {
      return Promise.reject('Invalid registration number format. Use format: YY/dept/code/XXX');
    }

    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO users (name, regNumber, email, status)
          VALUES (?, ?, ?, 'pending')
        `);
        stmt.run(name.toLowerCase(), regNumber.toLowerCase(), email.toLowerCase());
        resolve({ success: true, message: 'Registration submitted for approval' });
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          reject('Registration number or email already exists');
        } else {
          console.error('Signup error:', error);
          reject('Error during registration');
        }
      }
    });
  },

  // Get all pending signups (admin only)
  getPendingSignups() {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('SELECT id, name, regNumber, email FROM users WHERE status = ?');
        const results = stmt.all('pending');
        resolve(results);
      } catch (error) {
        console.error('Error fetching pending signups:', error);
        reject('Error fetching pending signups');
      }
    });
  },

  // Approve a signup and generate passcode
  approveSignup(userId) {
    return new Promise((resolve, reject) => {
      try {
        // Generate random 8-character alphanumeric passcode
        const passcode = Math.random().toString(36).slice(-8);
        
        const stmt = db.prepare(`
          UPDATE users 
          SET status = 'approved', 
              passcode = ?,
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        const result = stmt.run(passcode, userId);
        
        if (result.changes > 0) {
          // Get user details for email
          const user = db.prepare('SELECT email, regNumber FROM users WHERE id = ?').get(userId);
          
          // Simulate email sending
          console.log(`Email sent to ${user.email}: Your passcode is ${passcode}`);
          
          resolve({
            success: true,
            message: 'User approved successfully',
            passcode: passcode // For demo purposes
          });
        } else {
          reject('User not found');
        }
      } catch (error) {
        console.error('Error approving signup:', error);
        reject('Error approving signup');
      }
    });
  },

  // Login user
  login(regNumber, passcode) {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, name, regNumber, email, role, status 
          FROM users 
          WHERE regNumber = ? AND passcode = ?
        `);
        
        const user = stmt.get(regNumber.toLowerCase(), passcode);
        
        if (user) {
          if (user.status !== 'approved') {
            reject('Your account is pending approval');
          } else {
            // Remove sensitive data before returning
            const { passcode, ...userData } = user;
            resolve({ success: true, user: userData });
          }
        } else {
          reject('Invalid registration number or passcode');
        }
      } catch (error) {
        console.error('Login error:', error);
        reject('Error during login');
      }
    });
  },

  // Change passcode
  changePasscode(userId, currentPasscode, newPasscode) {
    return new Promise((resolve, reject) => {
      try {
        // Verify current passcode
        const checkStmt = db.prepare('SELECT id FROM users WHERE id = ? AND passcode = ?');
        const user = checkStmt.get(userId, currentPasscode);
        
        if (!user) {
          reject('Current passcode is incorrect');
          return;
        }
        
        // Update passcode
        const updateStmt = db.prepare(`
          UPDATE users 
          SET passcode = ?, 
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        updateStmt.run(newPasscode, userId);
        resolve({ success: true, message: 'Passcode updated successfully' });
      } catch (error) {
        console.error('Error changing passcode:', error);
        reject('Error changing passcode');
      }
    });
  }
};

// Material Management
const materialService = {
  // Get all materials with optional filtering
  getMaterials(filter = {}) {
    return new Promise((resolve, reject) => {
      try {
        let query = 'SELECT * FROM materials';
        const params = [];
        
        // Add filters if provided
        if (filter.courseTitle) {
          query += ' WHERE courseTitle LIKE ?';
          params.push(`%${filter.courseTitle}%`);
        }
        
        query += ' ORDER BY createdAt DESC';
        const stmt = db.prepare(query);
        const results = stmt.all(...params);
        resolve(results);
      } catch (error) {
        console.error('Error fetching materials:', error);
        reject('Error fetching materials');
      }
    });
  },

  // Add new material
  addMaterial(material, userId) {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO materials (courseTitle, type, fileName, filePath, uploadedBy)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          material.courseTitle,
          material.type,
          material.fileName,
          material.filePath || null,
          userId
        );
        
        resolve({ success: true, message: 'Material added successfully' });
      } catch (error) {
        console.error('Error adding material:', error);
        reject('Error adding material');
      }
    });
  },

  // Delete material
  deleteMaterial(materialId, userId) {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('DELETE FROM materials WHERE id = ? AND uploadedBy = ?');
        const result = stmt.run(materialId, userId);
        
        if (result.changes > 0) {
          resolve({ success: true, message: 'Material deleted successfully' });
        } else {
          reject('Material not found or unauthorized');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        reject('Error deleting material');
      }
    });
  }
};

// Event Management
const eventService = {
  // Get all events
  getEvents() {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('SELECT * FROM events ORDER BY eventDate DESC');
        const results = stmt.all();
        resolve(results);
      } catch (error) {
        console.error('Error fetching events:', error);
        reject('Error fetching events');
      }
    });
  },

  // Add new event
  addEvent(event, userId) {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO events (title, description, eventDate, imageUrl, createdBy)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          event.title,
          event.description,
          event.eventDate,
          event.imageUrl || null,
          userId
        );
        
        resolve({ success: true, message: 'Event added successfully' });
      } catch (error) {
        console.error('Error adding event:', error);
        reject('Error adding event');
      }
    });
  },

  // Delete event
  deleteEvent(eventId, userId) {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('DELETE FROM events WHERE id = ? AND createdBy = ?');
        const result = stmt.run(eventId, userId);
        
        if (result.changes > 0) {
          resolve({ success: true, message: 'Event deleted successfully' });
        } else {
          reject('Event not found or unauthorized');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        reject('Error deleting event');
      }
    });
  }
};

// Export the database and services
export { 
  initDatabase,
  userService, 
  materialService, 
  eventService 
};

// Initialize database when module loads
document.addEventListener('DOMContentLoaded', () => {
  initDatabase().then(success => {
    if (success) {
      console.log('Database ready');
    } else {
      console.error('Failed to initialize database');
    }
  });
});