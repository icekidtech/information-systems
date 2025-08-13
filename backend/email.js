const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_CONFIG = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Replace with actual email
        pass: process.env.EMAIL_PASS || 'your-app-password'     // Replace with actual app password
    }
};

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter(EMAIL_CONFIG);
};

// Send passcode email to student
const sendPasscodeEmail = async (recipientEmail, studentName, regNumber, passcode) => {
    try {
        // For development/demo purposes, we'll log the email instead of sending
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n=== EMAIL SIMULATION ===');
            console.log('To:', recipientEmail);
            console.log('Subject: Account Activation - Department of Information Systems');
            console.log('Student:', studentName);
            console.log('Registration Number:', regNumber);
            console.log('Generated Passcode:', passcode);
            console.log('========================\n');
            
            return Promise.resolve({
                success: true,
                message: 'Email simulated (development mode)',
                recipient: recipientEmail
            });
        }

        // Production email sending
        const transporter = createTransporter();

        // Email template
        const emailTemplate = {
            from: {
                name: 'Department of Information Systems',
                address: EMAIL_CONFIG.auth.user
            },
            to: recipientEmail,
            subject: 'Account Activation - Department of Information Systems',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Activation</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #2563eb, #7c3aed);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: #f8f9fa;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .passcode {
                            background: #2563eb;
                            color: white;
                            padding: 15px;
                            text-align: center;
                            font-size: 24px;
                            font-weight: bold;
                            border-radius: 5px;
                            margin: 15px 0;
                        }
                        .warning {
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            color: #856404;
                            padding: 15px;
                            border-radius: 5px;
                            margin: 15px 0;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            font-size: 12px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>InfoSys UniUyo</h1>
                        <p>Department of Information Systems</p>
                    </div>
                    
                    <div class="content">
                        <h2>Welcome to the Department of Information Systems!</h2>
                        
                        <p>Dear <strong>${studentName}</strong>,</p>
                        
                        <p>Congratulations! Your registration has been approved by our administrative team. 
                        Your account is now active and you can access the student portal.</p>
                        
                        <p><strong>Registration Details:</strong></p>
                        <ul>
                            <li><strong>Registration Number:</strong> ${regNumber}</li>
                            <li><strong>Email:</strong> ${recipientEmail}</li>
                            <li><strong>Status:</strong> Active</li>
                        </ul>
                        
                        <p>Your login passcode is:</p>
                        <div class="passcode">${passcode}</div>
                        
                        <div class="warning">
                            <strong>Important Security Information:</strong>
                            <ul>
                                <li>Keep this passcode secure and confidential</li>
                                <li>Do not share your passcode with anyone</li>
                                <li>You can change your passcode after logging in</li>
                                <li>If you suspect unauthorized access, contact the admin immediately</li>
                            </ul>
                        </div>
                        
                        <p><strong>How to Access Your Account:</strong></p>
                        <ol>
                            <li>Visit the student portal at: <a href="http://localhost:5000/pages/login.html">Student Login</a></li>
                            <li>Enter your registration number: <strong>${regNumber}</strong></li>
                            <li>Enter your passcode: <strong>${passcode}</strong></li>
                            <li>Click "Login" to access your dashboard</li>
                        </ol>
                        
                        <p><strong>What you can do in your student portal:</strong></p>
                        <ul>
                            <li>View and download course materials</li>
                            <li>Check upcoming events and announcements</li>
                            <li>Update your profile information</li>
                            <li>Change your passcode</li>
                        </ul>
                        
                        <p>If you have any questions or need assistance, please contact our support team or visit the department office.</p>
                        
                        <p>Welcome aboard!</p>
                        
                        <p>Best regards,<br>
                        <strong>Department of Information Systems</strong><br>
                        Faculty of Computing<br>
                        University of Uyo</p>
                    </div>
                    
                    <div class="footer">
                        <p>Department of Information Systems | Faculty of Computing | University of Uyo</p>
                        <p>P.M.B. 1017, Uyo, Akwa Ibom State, Nigeria</p>
                        <p>Email: info@informationsystems.edu.org</p>
                        <p><em>This is an automated message. Please do not reply to this email.</em></p>
                    </div>
                </body>
                </html>
            `,
            text: `
                Department of Information Systems - Account Activation
                
                Dear ${studentName},
                
                Congratulations! Your registration has been approved. Your account is now active.
                
                Registration Details:
                - Registration Number: ${regNumber}
                - Email: ${recipientEmail}
                - Status: Active
                
                Your login passcode is: ${passcode}
                
                IMPORTANT: Keep this passcode secure and confidential. You can change it after logging in.
                
                To access your account:
                1. Visit the student portal
                2. Enter your registration number: ${regNumber}
                3. Enter your passcode: ${passcode}
                4. Click "Login"
                
                Welcome to the Department of Information Systems!
                
                Best regards,
                Department of Information Systems
                Faculty of Computing
                University of Uyo
            `
        };

        // Send email
        const info = await transporter.sendMail(emailTemplate);

        console.log('Email sent successfully:', info.messageId);
        return {
            success: true,
            messageId: info.messageId,
            recipient: recipientEmail
        };

    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Send notification email to admin about new registration
const sendAdminNotification = async (studentData) => {
    try {
        // For development, just log the notification
        if (process.env.NODE_ENV !== 'production') {
            console.log('\n=== ADMIN NOTIFICATION ===');
            console.log('New student registration pending approval:');
            console.log('Name:', studentData.name);
            console.log('Registration Number:', studentData.regNumber);
            console.log('Email:', studentData.email);
            console.log('Date:', new Date().toISOString());
            console.log('==========================\n');
            return Promise.resolve({ success: true });
        }

        // Production implementation would send actual email to admin
        const transporter = createTransporter();
        
        const emailTemplate = {
            from: {
                name: 'Information Systems Portal',
                address: EMAIL_CONFIG.auth.user
            },
            to: 'admin@informationsystems.edu.org', // Admin email
            subject: 'New Student Registration - Pending Approval',
            html: `
                <h2>New Student Registration</h2>
                <p>A new student has registered and is awaiting approval:</p>
                <ul>
                    <li><strong>Name:</strong> ${studentData.name}</li>
                    <li><strong>Registration Number:</strong> ${studentData.regNumber}</li>
                    <li><strong>Email:</strong> ${studentData.email}</li>
                    <li><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p>Please review and approve the registration in the admin dashboard.</p>
            `
        };

        const info = await transporter.sendMail(emailTemplate);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Admin notification error:', error);
        // Don't throw error for notification failures
        return { success: false, error: error.message };
    }
};

// Test email configuration
const testEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✓ Email configuration is valid');
        return true;
    } catch (error) {
        console.warn('⚠ Email configuration error:', error.message);
        console.warn('⚠ Email functionality will be simulated');
        return false;
    }
};

module.exports = {
    sendPasscodeEmail,
    sendAdminNotification,
    testEmailConfig
};