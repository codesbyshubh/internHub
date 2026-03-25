const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/internships', require('./routes/internships'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/saved', require('./routes/saved'));

// Categories endpoint
const db = require('./config/db');
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ internships }]] = await db.query("SELECT COUNT(*) as internships FROM internships WHERE status='active'");
    const [[{ jobs }]] = await db.query("SELECT COUNT(*) as jobs FROM jobs WHERE status='active'");
    const [[{ companies }]] = await db.query("SELECT COUNT(*) as companies FROM companies");
    const [[{ students }]] = await db.query("SELECT COUNT(*) as students FROM users WHERE role='student'");
    res.json({ success: true, data: { internships, jobs, companies, students } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Employer dashboard stats
app.get('/api/employer/dashboard', require('./middleware/auth').protect, require('./middleware/auth').employerOnly, async (req, res) => {
  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (!company.length) return res.status(404).json({ success: false, message: 'Company not found' });

    const cId = company[0].id;
    const [[{ active_internships }]] = await db.query("SELECT COUNT(*) as active_internships FROM internships WHERE company_id=? AND status='active'", [cId]);
    const [[{ active_jobs }]] = await db.query("SELECT COUNT(*) as active_jobs FROM jobs WHERE company_id=? AND status='active'", [cId]);
    const [[{ total_applications }]] = await db.query(`
      SELECT COUNT(*) as total_applications FROM applications a
      WHERE (a.listing_type='internship' AND a.listing_id IN (SELECT id FROM internships WHERE company_id=?))
         OR (a.listing_type='job' AND a.listing_id IN (SELECT id FROM jobs WHERE company_id=?))
    `, [cId, cId]);

    const [recent_internships] = await db.query('SELECT * FROM internships WHERE company_id=? ORDER BY created_at DESC LIMIT 5', [cId]);
    const [recent_jobs] = await db.query('SELECT * FROM jobs WHERE company_id=? ORDER BY created_at DESC LIMIT 5', [cId]);

    res.json({ success: true, data: { active_internships, active_jobs, total_applications, recent_internships, recent_jobs } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
