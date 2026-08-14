const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { redirectIfAuthed } = require('../middleware/auth');

router.get('/login', redirectIfAuthed, (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: null,
    familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
  });
});

router.post('/login', redirectIfAuthed, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Username and password are required.',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      });
    }

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid username or password.',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      });
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid username or password.',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      res.redirect('/admin');
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
});

module.exports = router;
