const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, employerOnly } = require('../middleware/auth');

// @POST /api/applications - Apply to internship or job
router.post('/', protect, async (req, res) => {
  const { listing_type, listing_id, cover_letter, availability } = req.body;

  if (!listing_type || !listing_id) {
    return res.status(400).json({ success: false, message: 'Listing type and ID are required' });
  }

  if (req.user.role === 'employer') {
    return res.status(403).json({ success: false, message: 'Employers cannot apply to listings' });
  }

  try {
    // Check if already applied
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE user_id = ? AND listing_type = ? AND listing_id = ?',
      [req.user.id, listing_type, listing_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already applied to this listing' });
    }

    const [result] = await db.query(
      'INSERT INTO applications (user_id, listing_type, listing_id, cover_letter, availability) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, listing_type, listing_id, cover_letter, availability]
    );

    res.status(201).json({ success: true, message: 'Application submitted successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/applications/my - Get user's applications
router.get('/my', protect, async (req, res) => {
  try {
    const [internApps] = await db.query(`
      SELECT a.*, i.title, i.type, i.stipend_min, i.stipend_max, i.location,
             c.name as company_name, c.logo as company_logo, 'internship' as listing_type
      FROM applications a
      JOIN internships i ON a.listing_id = i.id
      JOIN companies c ON i.company_id = c.id
      WHERE a.user_id = ? AND a.listing_type = 'internship'
    `, [req.user.id]);

    const [jobApps] = await db.query(`
      SELECT a.*, j.title, j.type, j.salary_min, j.salary_max, j.location,
             c.name as company_name, c.logo as company_logo, 'job' as listing_type
      FROM applications a
      JOIN jobs j ON a.listing_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.user_id = ? AND a.listing_type = 'job'
    `, [req.user.id]);

    const allApplications = [...internApps, ...jobApps]
      .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));

    res.json({ success: true, data: allApplications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/applications/employer/:listingType/:listingId - Employer views applications
router.get('/employer/:listingType/:listingId', protect, employerOnly, async (req, res) => {
  try {
    const { listingType, listingId } = req.params;
    
    const [apps] = await db.query(`
      SELECT a.*, u.name as applicant_name, u.email as applicant_email,
             u.phone, u.college, u.graduation_year, u.skills, u.bio
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.listing_type = ? AND a.listing_id = ?
      ORDER BY a.applied_at DESC
    `, [listingType, listingId]);

    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @PUT /api/applications/:id/status - Update application status
router.put('/:id/status', protect, employerOnly, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Application status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @DELETE /api/applications/:id - Withdraw application
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.query('DELETE FROM applications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Application withdrawn' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/applications/check/:listingType/:listingId
router.get('/check/:listingType/:listingId', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, status FROM applications WHERE user_id = ? AND listing_type = ? AND listing_id = ?',
      [req.user.id, req.params.listingType, req.params.listingId]
    );
    res.json({ success: true, applied: rows.length > 0, application: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
