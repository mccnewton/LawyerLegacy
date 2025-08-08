const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { Issuer, Strategy } = require('openid-client');
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
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255),
                oauth_provider VARCHAR(50),
                oauth_id VARCHAR(255),
                display_name VARCHAR(255),
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create consultation responses table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultation_responses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                service_type VARCHAR(100),
                timeline VARCHAR(100),
                case_details TEXT,
                admin_notes TEXT,
                status VARCHAR(20) DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert authorized admin users if they don't exist
        const authorizedEmails = ['creageco@gmail.com', 'mccnewton@gmail.com'];
        
        for (const email of authorizedEmails) {
            const userExists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $1', [email]);
            if (userExists.rows.length === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(
                    'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                    [email, email, hashedPassword, 'admin']
                );
                console.log(`Admin user created: ${email}/admin123`);
            }
        }

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// Email configuration
const createEmailTransporter = () => {
    return nodemailer.createTransport({
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
        const subjectLine = `New ${formType} Request - Sharon K. Lowry Law`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@sharonlowrylaw.com',
            to: process.env.NOTIFICATION_EMAIL || 'creageco@gmail.com', // Default to admin email
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
                        <p style="line-height: 1.6;">${consultationData.message || 'No details provided'}</p>
                    </div>
                    
                    <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #6c757d; font-size: 14px;">
                            <strong>Submitted:</strong> ${new Date(consultationData.created_at).toLocaleString()}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/admin.html` : 'http://localhost:5000/admin.html'}" 
                           style="background-color: #4B0082; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View in Admin Dashboard
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                    <p style="color: #6c757d; font-size: 12px; text-align: center;">
                        This is an automated notification from Sharon K. Lowry Law website consultation system.
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
        'Probate Administration': 'Probate Administration', 
        'Applications for Heirship': 'Heirship Application',
        'Powers of Attorney': 'Powers of Attorney',
        'Guardianship Applications': 'Guardianship Application',
        'Small Estate Affidavits': 'Small Estate Affidavit',
        'General Consultation': 'General Contact',
        'Estate Planning': 'Wills & Estate Planning',
        'Probate': 'Probate Administration',
        'Heirship': 'Heirship Application',
        'Power of Attorney': 'Powers of Attorney',
        'Guardianship': 'Guardianship Application',
        'Small Estate': 'Small Estate Affidavit'
    };
    
    return formTypeMap[serviceType] || 'General Contact';
}

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        
        if (!user.password_hash) {
            return done(null, false, { message: 'Please use OAuth login' });
        }
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return done(null, false, { message: 'Invalid password' });
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Google OAuth Strategy
const callbackURL = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/auth/google/callback` : "/auth/google/callback";
console.log('Google OAuth Callback URL:', callbackURL);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
            return done(null, false, { message: 'No email provided by Google' });
        }
        
        // Check if user is authorized
        const authorizedEmails = ['creageco@gmail.com', 'mccnewton@gmail.com'];
        if (!authorizedEmails.includes(email)) {
            return done(null, false, { message: 'Unauthorized email address' });
        }
        
        // Check if user already exists by OAuth ID
        let result = await pool.query('SELECT * FROM users WHERE oauth_id = $1 AND oauth_provider = $2', [profile.id, 'google']);
        let user = result.rows[0];
        
        if (!user) {
            // Check by email or username
            result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
            user = result.rows[0];
            
            if (!user) {
                // Create new user with unique username
                const username = `google_${profile.id}`;
                result = await pool.query(
                    'INSERT INTO users (username, email, oauth_provider, oauth_id, display_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [username, email, 'google', profile.id, profile.displayName, 'admin']
                );
                user = result.rows[0];
            } else {
                // Update existing user with OAuth info and ensure admin role
                await pool.query(
                    'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3, role = $4 WHERE id = $5',
                    ['google', profile.id, profile.displayName, 'admin', user.id]
                );
                user.oauth_provider = 'google';
                user.oauth_id = profile.id;
                user.display_name = profile.displayName;
                user.role = 'admin';
            }
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        
        // Check if user is authorized
        const authorizedEmails = ['creageco@gmail.com', 'mccnewton@gmail.com'];
        if (!authorizedEmails.includes(email)) {
            return done(null, false, { message: 'Unauthorized email address' });
        }
        
        // Check if user already exists by OAuth ID
        let result = await pool.query('SELECT * FROM users WHERE oauth_id = $1 AND oauth_provider = $2', [profile.id, 'facebook']);
        let user = result.rows[0];
        
        if (!user) {
            result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
            user = result.rows[0];
            
            if (!user) {
                const username = `facebook_${profile.id}`;
                result = await pool.query(
                    'INSERT INTO users (username, email, oauth_provider, oauth_id, display_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [username, email, 'facebook', profile.id, `${profile.name.givenName} ${profile.name.familyName}`, 'admin']
                );
                user = result.rows[0];
            } else {
                await pool.query(
                    'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3, role = $4 WHERE id = $5',
                    ['facebook', profile.id, `${profile.name.givenName} ${profile.name.familyName}`, 'admin', user.id]
                );
                user.oauth_provider = 'facebook';
                user.oauth_id = profile.id;
                user.display_name = `${profile.name.givenName} ${profile.name.familyName}`;
                user.role = 'admin';
            }
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
            return done(null, false, { message: 'No email provided by GitHub' });
        }
        
        // Check if user is authorized
        const authorizedEmails = ['creageco@gmail.com', 'mccnewton@gmail.com'];
        if (!authorizedEmails.includes(email)) {
            return done(null, false, { message: 'Unauthorized email address' });
        }
        
        // Check if user already exists by OAuth ID
        let result = await pool.query('SELECT * FROM users WHERE oauth_id = $1 AND oauth_provider = $2', [profile.id, 'github']);
        let user = result.rows[0];
        
        if (!user) {
            result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
            user = result.rows[0];
            
            if (!user) {
                const username = `github_${profile.id}`;
                result = await pool.query(
                    'INSERT INTO users (username, email, oauth_provider, oauth_id, display_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [username, email, 'github', profile.id, profile.displayName || profile.username, 'admin']
                );
                user = result.rows[0];
            } else {
                await pool.query(
                    'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3, role = $4 WHERE id = $5',
                    ['github', profile.id, profile.displayName || profile.username, 'admin', user.id]
                );
                user.oauth_provider = 'github';
                user.oauth_id = profile.id;
                user.display_name = profile.displayName || profile.username;
                user.role = 'admin';
            }
        }
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Replit Auth Strategy - Simple implementation for Replit environment
function setupReplitAuth() {
    // Simple Replit Auth that works without external credentials
    passport.use('replit', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'replit_token'
    }, async (email, token, done) => {
        try {
            // Check if user is authorized
            const authorizedEmails = ['creageco@gmail.com', 'mccnewton@gmail.com'];
            if (!authorizedEmails.includes(email)) {
                return done(null, false, { message: 'Unauthorized email address' });
            }
            
            // Check if user already exists by OAuth ID or email
            let result = await pool.query('SELECT * FROM users WHERE oauth_provider = $1 AND email = $2', ['replit', email]);
            let user = result.rows[0];
            
            if (!user) {
                // Check by email or username
                result = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $1', [email]);
                user = result.rows[0];
                
                if (!user) {
                    // Create new user with unique username
                    const username = `replit_${Date.now()}`;
                    result = await pool.query(
                        'INSERT INTO users (username, email, oauth_provider, oauth_id, display_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                        [username, email, 'replit', `replit_${email}`, email.split('@')[0], 'admin']
                    );
                    user = result.rows[0];
                } else {
                    // Update existing user with Replit OAuth info and ensure admin role
                    await pool.query(
                        'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3, role = $4 WHERE id = $5',
                        ['replit', `replit_${email}`, email.split('@')[0], 'admin', user.id]
                    );
                    user.oauth_provider = 'replit';
                    user.oauth_id = `replit_${email}`;
                    user.display_name = email.split('@')[0];
                    user.role = 'admin';
                }
            }
            
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));

    console.log('Replit Auth configured successfully');
}

// Initialize Replit Auth
setupReplitAuth();

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error);
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Static files middleware
app.use(express.static('.', {
    index: false, // Disable automatic index serving
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Authentication routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if email is authorized
        const authorizedEmails = ['creageco@gmail.com', 'mccnewton@gmail.com'];
        if (!authorizedEmails.includes(username)) {
            return res.status(401).json({ error: 'Unauthorized email address' });
        }
        
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        res.json({ 
            success: true, 
            user: { username: user.username, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// OAuth Routes
app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/contact?error=oauth_failed' }),
    (req, res) => {
        req.session.user = {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        };
        res.redirect('/admin');
    }
);

app.get('/auth/facebook', passport.authenticate('facebook', { 
    scope: ['email'] 
}));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/contact?error=oauth_failed' }),
    (req, res) => {
        req.session.user = {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        };
        res.redirect('/admin');
    }
);

app.get('/auth/github', passport.authenticate('github', { 
    scope: ['user:email'] 
}));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/contact?error=oauth_failed' }),
    (req, res) => {
        req.session.user = {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        };
        res.redirect('/admin');
    }
);

// Replit Auth Routes
app.get('/auth/replit', (req, res) => {
    // Redirect to a simple login form for Replit users
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Replit Login</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; }
                .login-card { background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="login-card p-4">
                            <h3 class="text-center mb-4">
                                <i class="fas fa-code text-warning"></i> Replit Login
                            </h3>
                            <form action="/auth/replit/callback" method="POST">
                                <div class="mb-3">
                                    <label class="form-label">Authorized Email</label>
                                    <input type="email" class="form-control" name="email" required 
                                           placeholder="Enter your authorized email">
                                </div>
                                <div class="mb-3">
                                    <input type="hidden" name="replit_token" value="replit_auth_token">
                                </div>
                                <button type="submit" class="btn btn-warning w-100">
                                    <i class="fas fa-sign-in-alt"></i> Login with Replit
                                </button>
                            </form>
                            <div class="text-center mt-3">
                                <a href="/contact" class="text-muted">← Back to Contact</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </body>
        </html>
    `);
});

app.post('/auth/replit/callback', 
    passport.authenticate('replit', { failureRedirect: '/contact?error=oauth_failed' }),
    (req, res) => {
        req.session.user = {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        };
        res.redirect('/admin');
    }
);

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ 
            isAuthenticated: true, 
            user: { username: req.session.user.username, role: req.session.user.role }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Consultation responses API
app.post('/api/consultation', async (req, res) => {
    try {
        const { name, email, phone, service_type, timeline, case_details } = req.body;
        
        const result = await pool.query(`
            INSERT INTO consultation_responses 
            (name, email, phone, service_type, timeline, case_details)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [name, email, phone, service_type, timeline, case_details]);

        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error('Consultation submission error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/consultations', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM consultation_responses 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Consultations fetch error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/consultations/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        
        await pool.query(`
            UPDATE consultation_responses 
            SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [status, admin_notes, id]);

        res.json({ success: true });
    } catch (err) {
        console.error('Consultation update error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/consultations/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM consultation_responses WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Consultation delete error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

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
        
        // Combine all message-like fields into a comprehensive message
        const messageFields = [];
        if (message) messageFields.push(`Message: ${message}`);
        if (goals) messageFields.push(`Goals: ${goals}`);
        if (questions) messageFields.push(`Questions: ${questions}`);
        if (situation) messageFields.push(`Situation: ${situation}`);
        if (needs) messageFields.push(`Needs: ${needs}`);
        if (urgency) messageFields.push(`Urgency: ${urgency}`);
        if (maritalStatus) messageFields.push(`Marital Status: ${maritalStatus}`);
        if (hasChildren) messageFields.push(`Has Children: ${hasChildren}`);
        if (primaryAssets) messageFields.push(`Primary Assets: ${primaryAssets}`);
        if (relationship) messageFields.push(`Relationship: ${relationship}`);
        if (deceasedName) messageFields.push(`Deceased Name: ${deceasedName}`);
        if (dateOfDeath) messageFields.push(`Date of Death: ${dateOfDeath}`);
        if (knownHeirs) messageFields.push(`Known Heirs: ${knownHeirs}`);
        if (assets) messageFields.push(`Assets: ${assets}`);
        if (documents) messageFields.push(`Documents Needed: ${documents}`);
        if (ageRange) messageFields.push(`Age Range: ${ageRange}`);
        if (agents) messageFields.push(`Proposed Agents: ${agents}`);
        if (specialInstructions) messageFields.push(`Special Instructions: ${specialInstructions}`);
        if (personName) messageFields.push(`Person Name: ${personName}`);
        if (estateValue) messageFields.push(`Estate Value: ${estateValue}`);
        if (hasWill) messageFields.push(`Has Will: ${hasWill}`);
        if (daysSinceDeath) messageFields.push(`Days Since Death: ${daysSinceDeath}`);
        if (heirAgreement) messageFields.push(`Heir Agreement: ${heirAgreement}`);
        if (guardianshipType) messageFields.push(`Guardianship Type: ${guardianshipType}`);
        
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

// API endpoint to get consultation requests (admin only)
app.get('/api/consultation-requests', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM consultation_requests ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching consultation requests:', error);
        res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }
});

// API endpoint to update consultation request status (admin only)
app.patch('/api/consultation-requests/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(
            'UPDATE consultation_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Consultation request not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating consultation request:', error);
        res.status(500).json({ error: 'Failed to update consultation request' });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else {
        res.redirect('/?login=required');
    }
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