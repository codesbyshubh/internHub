const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, employerOnly } = require('../middleware/auth');

// @GET /api/companies
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.email,
        (SELECT COUNT(*) FROM internships i WHERE i.company_id = c.id AND i.status = 'active') as active_internships,
        (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'active') as active_jobs
      FROM companies c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/companies/my
router.get('/my', protect, employerOnly, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @PUT /api/companies/my
router.put('/my', protect, employerOnly, async (req, res) => {
  const { name, description, website, industry, size, location, founded_year } = req.body;

  try {
    await db.query(`
      UPDATE companies SET name=?, description=?, website=?, industry=?, size=?, location=?, founded_year=?
      WHERE user_id=?
    `, [name, description, website, industry, size, location, founded_year, req.user.id]);

    res.json({ success: true, message: 'Company profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const [internships] = await db.query(
      'SELECT * FROM internships WHERE company_id = ? AND status = "active" LIMIT 5',
      [req.params.id]
    );
    const [jobs] = await db.query(
      'SELECT * FROM jobs WHERE company_id = ? AND status = "active" LIMIT 5',
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], internships, jobs } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
