const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, employerOnly } = require('../middleware/auth');

// @GET /api/internships - Get all internships with filters
router.get('/', async (req, res) => {
  try {
    const { category, type, location, stipend_min, keyword, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT i.*, c.name as company_name, c.logo as company_logo, c.location as company_location
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE i.status = 'active'
    `;
    const params = [];

    if (keyword) {
      query += ` AND (i.title LIKE ? OR i.description LIKE ? OR i.skills_required LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      query += ` AND i.category = ?`;
      params.push(category);
    }
    if (type) {
      query += ` AND i.type = ?`;
      params.push(type);
    }
    if (location) {
      query += ` AND i.location LIKE ?`;
      params.push(`%${location}%`);
    }
    if (stipend_min) {
      query += ` AND i.stipend_min >= ?`;
      params.push(parseInt(stipend_min));
    }

    const countQuery = query.replace('SELECT i.*, c.name as company_name, c.logo as company_logo, c.location as company_location', 'SELECT COUNT(*) as total');
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/internships/:id - Get single internship
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, c.name as company_name, c.logo as company_logo, 
             c.description as company_description, c.website as company_website,
             c.industry as company_industry, c.size as company_size,
             c.location as company_location
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // Increment views
    await db.query('UPDATE internships SET views = views + 1 WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @POST /api/internships - Create internship (employer only)
router.post('/', protect, employerOnly, async (req, res) => {
  const {
    title, category, type, location, stipend_min, stipend_max,
    duration, openings, skills_required, description, perks,
    apply_by, start_date, is_part_time
  } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ success: false, message: 'Title, category, and description are required' });
  }

  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (company.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found. Please set up your company profile.' });
    }

    const [result] = await db.query(`
      INSERT INTO internships (company_id, title, category, type, location, stipend_min, stipend_max,
        duration, openings, skills_required, description, perks, apply_by, start_date, is_part_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company[0].id, title, category, type || 'in-office', location,
      stipend_min || 0, stipend_max || 0, duration, openings || 1,
      skills_required, description, perks, apply_by, start_date, is_part_time || false
    ]);

    res.status(201).json({ success: true, message: 'Internship posted successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @PUT /api/internships/:id - Update internship
router.put('/:id', protect, employerOnly, async (req, res) => {
  const {
    title, category, type, location, stipend_min, stipend_max,
    duration, openings, skills_required, description, perks,
    apply_by, start_date, status
  } = req.body;

  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    const [intern] = await db.query('SELECT * FROM internships WHERE id = ? AND company_id = ?', [req.params.id, company[0]?.id]);

    if (intern.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this internship' });
    }

    await db.query(`
      UPDATE internships SET title=?, category=?, type=?, location=?, stipend_min=?, stipend_max=?,
      duration=?, openings=?, skills_required=?, description=?, perks=?, apply_by=?, start_date=?, status=?
      WHERE id=?
    `, [title, category, type, location, stipend_min, stipend_max, duration, openings,
        skills_required, description, perks, apply_by, start_date, status, req.params.id]);

    res.json({ success: true, message: 'Internship updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @DELETE /api/internships/:id
router.delete('/:id', protect, employerOnly, async (req, res) => {
  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    await db.query('DELETE FROM internships WHERE id = ? AND company_id = ?', [req.params.id, company[0]?.id]);
    res.json({ success: true, message: 'Internship deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
