const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create consultation requests table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultation_requests (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                legal_service VARCHAR(255),
                message TEXT,
                status VARCHAR(20) DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create consultation responses table (for backwards compatibility)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultation_responses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                service_type VARCHAR(100),
                timeline VARCHAR(100),
                case_details TEXT,
                status VARCHAR(20) DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Email configuration
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Function to send consultation notification email
async function sendConsultationNotification(consultationData) {
    try {
        const transporter = createEmailTransporter();
        
        // Determine form type for subject line
        const formType = getFormTypeDescription(consultationData.legal_service || consultationData.serviceType);
        const subjectLine = `New ${formType} Request - The Law Office of Sharon K. Lowry`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@sharonlowrylaw.com',
            to: process.env.NOTIFICATION_EMAIL || 'creageco@gmail.com',
            cc: 'sklowry@sklowrylaw.com',
            subject: subjectLine,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4B0082; border-bottom: 2px solid #4B0082; padding-bottom: 10px;">
                        New ${formType} Request
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Client Information</h3>
                        <p><strong>Name:</strong> ${consultationData.name}</p>
                        <p><strong>Email:</strong> ${consultationData.email}</p>
                        <p><strong>Phone:</strong> ${consultationData.phone || 'Not provided'}</p>
                        <p><strong>Service Type:</strong> ${consultationData.legal_service || consultationData.serviceType || 'Not specified'}</p>
                        <p><strong>Form Source:</strong> ${formType}</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #4B0082; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Message Details</h3>
                        <div style="line-height: 1.6; white-space: pre-line;">${(consultationData.message || 'No details provided').replace(/\n/g, '<br>')}</div>
                    </div>
                    
                    <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            <strong>Submitted:</strong> ${new Date(consultationData.created_at).toLocaleString()}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="text-align: center; margin: 30px 0; color: #6c757d;">
                            Please review this request and contact the client directly.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                    <p style="color: #6c757d; font-size: 12px; text-align: center;">
                        This is an automated notification from The Law Office of Sharon K. Lowry website consultation system.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Consultation notification email sent successfully');
        console.log('Email details:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            messageId: info.messageId
        });
        return true;
    } catch (error) {
        console.error('Failed to send consultation notification email:', error);
        return false;
    }
}

// Helper function to determine form type description
function getFormTypeDescription(serviceType) {
    if (!serviceType) return 'General Contact';
    
    const formTypeMap = {
        'Wills & Estate Planning': 'Wills & Estate Planning',
        'Probate Administration': 'Probate', 
        'Applications for Heirship': 'Heirship Application',
        'Powers of Attorney': 'Financial Powers of Attorney',
        'Medical Powers of Attorney and Advance Directives': 'Medical Powers of Attorney and Advance Directives',
        'General Consultation': 'General Contact',
        'Estate Planning': 'Wills & Estate Planning',
        'Probate': 'Probate Administration',
        'Heirship': 'Heirship Application',
        'Power of Attorney': 'Powers of Attorney',
        'Guardianship': 'Guardianship Application'
    };
    
    return formTypeMap[serviceType] || 'General Contact';
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// New consultation request API endpoints (both singular and plural for compatibility)
app.post('/api/consultation-request', async (req, res) => {
    await handleConsultationRequest(req, res);
});

app.post('/api/consultation-requests', async (req, res) => {
    await handleConsultationRequest(req, res);
});

// Shared consultation request handler
async function handleConsultationRequest(req, res) {
    try {
        const { 
            name, email, phone, 
            legal_service, legalService, serviceType, 
            message, goals, questions, situation, needs, urgency,
            maritalStatus, hasChildren, primaryAssets, relationship,
            deceasedName, dateOfDeath, knownHeirs, assets, documents,
            ageRange, agents, specialInstructions, personName,
            estateValue, hasWill, daysSinceDeath, heirAgreement,
            guardianshipType
        } = req.body;
        
        // Determine service type from various possible fields
        const finalServiceType = serviceType || legalService || legal_service || 'General Consultation';
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        // Combine all message-like fields into a comprehensive message with proper line breaks
        const messageFields = [];
        if (message) messageFields.push(`Message:\n${message}`);
        if (goals) messageFields.push(`Goals:\n${goals}`);
        if (questions) messageFields.push(`Questions:\n${questions}`);
        if (situation) messageFields.push(`Situation:\n${situation}`);
        if (needs) messageFields.push(`Needs:\n${needs}`);
        if (urgency) messageFields.push(`Urgency:\n${urgency}`);
        if (maritalStatus) messageFields.push(`Marital Status:\n${maritalStatus}`);
        if (hasChildren) messageFields.push(`Has Children:\n${hasChildren}`);
        if (primaryAssets) messageFields.push(`Primary Assets:\n${primaryAssets}`);
        if (relationship) messageFields.push(`Relationship:\n${relationship}`);
        if (deceasedName) messageFields.push(`Deceased Name:\n${deceasedName}`);
        if (dateOfDeath) messageFields.push(`Date of Death:\n${dateOfDeath}`);
        if (knownHeirs) messageFields.push(`Known Heirs:\n${knownHeirs}`);
        if (assets) messageFields.push(`Assets:\n${assets}`);
        if (documents) messageFields.push(`Documents Needed:\n${documents}`);
        if (ageRange) messageFields.push(`Age Range:\n${ageRange}`);
        if (agents) messageFields.push(`Proposed Agents:\n${agents}`);
        if (specialInstructions) messageFields.push(`Special Instructions:\n${specialInstructions}`);
        if (personName) messageFields.push(`Person Name:\n${personName}`);
        if (estateValue) messageFields.push(`Estate Value:\n${estateValue}`);
        if (hasWill) messageFields.push(`Has Will:\n${hasWill}`);
        if (daysSinceDeath) messageFields.push(`Days Since Death:\n${daysSinceDeath}`);
        if (heirAgreement) messageFields.push(`Heir Agreement:\n${heirAgreement}`);
        if (guardianshipType) messageFields.push(`Guardianship Type:\n${guardianshipType}`);
        
        const combinedMessage = messageFields.length > 0 ? messageFields.join('\n\n') : 'No additional details provided';
        
        // Insert consultation request into database
        const result = await pool.query(
            'INSERT INTO consultation_requests (name, email, phone, legal_service, message, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
            [name, email, phone || null, finalServiceType, combinedMessage, 'unread']
        );
        
        const consultationData = result.rows[0];
        
        // Send email notification (don't block response if email fails)
        sendConsultationNotification(consultationData).catch(error => {
            console.error('Email notification failed, but consultation was saved:', error);
        });
        
        res.json({ 
            success: true, 
            message: 'Request submitted successfully',
            request_id: consultationData.id
        });
    } catch (error) {
        console.error('Error submitting consultation request:', error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
}

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all for other routes
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.sendFile(filePath);
    } else {
        // Try to serve corresponding HTML file
        const htmlPath = path.join(__dirname, req.path.replace(/\/$/, '') + '.html');
        if (fs.existsSync(htmlPath)) {
            res.sendFile(htmlPath);
        } else {
            res.status(404).sendFile(path.join(__dirname, 'index.html'));
        }
    }
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${port}/`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    pool.end(() => {
        process.exit(0);
    });
});