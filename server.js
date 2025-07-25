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
                // Update existing user with OAuth info
                await pool.query(
                    'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3 WHERE id = $4',
                    ['google', profile.id, profile.displayName, user.id]
                );
                user.oauth_provider = 'google';
                user.oauth_id = profile.id;
                user.display_name = profile.displayName;
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
                    'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3 WHERE id = $4',
                    ['facebook', profile.id, `${profile.name.givenName} ${profile.name.familyName}`, user.id]
                );
                user.oauth_provider = 'facebook';
                user.oauth_id = profile.id;
                user.display_name = `${profile.name.givenName} ${profile.name.familyName}`;
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
                    'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3 WHERE id = $4',
                    ['github', profile.id, profile.displayName || profile.username, user.id]
                );
                user.oauth_provider = 'github';
                user.oauth_id = profile.id;
                user.display_name = profile.displayName || profile.username;
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
                    // Update existing user with Replit OAuth info
                    await pool.query(
                        'UPDATE users SET oauth_provider = $1, oauth_id = $2, display_name = $3 WHERE id = $4',
                        ['replit', `replit_${email}`, email.split('@')[0], user.id]
                    );
                    user.oauth_provider = 'replit';
                    user.oauth_id = `replit_${email}`;
                    user.display_name = email.split('@')[0];
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