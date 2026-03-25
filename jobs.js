const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, employerOnly } = require('../middleware/auth');

// @GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { category, type, work_mode, location, salary_min, keyword, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT j.*, c.name as company_name, c.logo as company_logo, c.location as company_location
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active'
    `;
    const params = [];

    if (keyword) {
      query += ` AND (j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      query += ` AND j.category = ?`;
      params.push(category);
    }
    if (type) {
      query += ` AND j.type = ?`;
      params.push(type);
    }
    if (work_mode) {
      query += ` AND j.work_mode = ?`;
      params.push(work_mode);
    }
    if (location) {
      query += ` AND j.location LIKE ?`;
      params.push(`%${location}%`);
    }
    if (salary_min) {
      query += ` AND j.salary_min >= ?`;
      params.push(parseInt(salary_min));
    }

    const countQuery = query.replace('SELECT j.*, c.name as company_name, c.logo as company_logo, c.location as company_location', 'SELECT COUNT(*) as total');
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT j.*, c.name as company_name, c.logo as company_logo, c.description as company_description,
             c.website as company_website, c.industry as company_industry, c.size as company_size
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await db.query('UPDATE jobs SET views = views + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @POST /api/jobs
router.post('/', protect, employerOnly, async (req, res) => {
  const {
    title, category, type, location, work_mode, salary_min, salary_max,
    experience, skills_required, description, qualifications, apply_by, openings
  } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ success: false, message: 'Title, category, and description are required' });
  }

  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (company.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const [result] = await db.query(`
      INSERT INTO jobs (company_id, title, category, type, location, work_mode, salary_min, salary_max,
        experience, skills_required, description, qualifications, apply_by, openings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company[0].id, title, category, type || 'full-time', location,
      work_mode || 'in-office', salary_min || 0, salary_max || 0,
      experience, skills_required, description, qualifications, apply_by, openings || 1
    ]);

    res.status(201).json({ success: true, message: 'Job posted successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @PUT /api/jobs/:id
router.put('/:id', protect, employerOnly, async (req, res) => {
  const {
    title, category, type, location, work_mode, salary_min, salary_max,
    experience, skills_required, description, qualifications, apply_by, openings, status
  } = req.body;

  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    const [job] = await db.query('SELECT * FROM jobs WHERE id = ? AND company_id = ?', [req.params.id, company[0]?.id]);

    if (job.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await db.query(`
      UPDATE jobs SET title=?, category=?, type=?, location=?, work_mode=?, salary_min=?, salary_max=?,
      experience=?, skills_required=?, description=?, qualifications=?, apply_by=?, openings=?, status=?
      WHERE id=?
    `, [title, category, type, location, work_mode, salary_min, salary_max, experience,
        skills_required, description, qualifications, apply_by, openings, status, req.params.id]);

    res.json({ success: true, message: 'Job updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @DELETE /api/jobs/:id
router.delete('/:id', protect, employerOnly, async (req, res) => {
  try {
    const [company] = await db.query('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    await db.query('DELETE FROM jobs WHERE id = ? AND company_id = ?', [req.params.id, company[0]?.id]);
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
