const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// SAVED ITEMS ROUTES

// @POST /api/saved - Save a listing
router.post('/', protect, async (req, res) => {
  const { listing_type, listing_id } = req.body;
  try {
    await db.query(
      'INSERT IGNORE INTO saved_items (user_id, listing_type, listing_id) VALUES (?, ?, ?)',
      [req.user.id, listing_type, listing_id]
    );
    res.json({ success: true, message: 'Saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @DELETE /api/saved/:listingType/:listingId
router.delete('/:listingType/:listingId', protect, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM saved_items WHERE user_id = ? AND listing_type = ? AND listing_id = ?',
      [req.user.id, req.params.listingType, req.params.listingId]
    );
    res.json({ success: true, message: 'Removed from saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/saved/my
router.get('/my', protect, async (req, res) => {
  try {
    const [internSaved] = await db.query(`
      SELECT s.*, i.title, i.type, i.stipend_min, i.stipend_max, i.location, i.duration,
             c.name as company_name, c.logo as company_logo, 'internship' as listing_type
      FROM saved_items s
      JOIN internships i ON s.listing_id = i.id
      JOIN companies c ON i.company_id = c.id
      WHERE s.user_id = ? AND s.listing_type = 'internship'
    `, [req.user.id]);

    const [jobSaved] = await db.query(`
      SELECT s.*, j.title, j.type, j.salary_min, j.salary_max, j.location,
             c.name as company_name, c.logo as company_logo, 'job' as listing_type
      FROM saved_items s
      JOIN jobs j ON s.listing_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE s.user_id = ? AND s.listing_type = 'job'
    `, [req.user.id]);

    res.json({ success: true, data: [...internSaved, ...jobSaved] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
