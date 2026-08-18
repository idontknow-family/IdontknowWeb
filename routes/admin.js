const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const uploadSingleAvatar = require('../middleware/upload');
const resolveAvatarUrl = require('../utils/resolveAvatarUrl');

router.use(requireAuth);

const RANKS = ['LEADER', 'CO_LEADER', 'HIGH_COMMAND', 'OFFICIAL_MEMBER', 'RECRUIT'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

// Dashboard: list all members
router.get('/', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: [{ rank: 'asc' }, { icName: 'asc' }],
    });
    const membersResolved = members.map((m) => ({ ...m, resolvedAvatarUrl: resolveAvatarUrl(m.avatarUrl) }));
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      adminUsername: req.session.adminUsername,
      members: membersResolved,
      RANKS,
      STATUSES,
    });
  } catch (err) {
    next(err);
  }
});

// New member form
router.get('/members/new', (req, res) => {
  res.render('admin/member-form', {
    title: 'Add New Member',
    familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
    adminUsername: req.session.adminUsername,
    member: null,
    RANKS,
    STATUSES,
    error: null,
  });
});

// CREATE
router.post('/members', uploadSingleAvatar, async (req, res, next) => {
  try {
    if (req.uploadError) {
      return res.render('admin/member-form', {
        title: 'Add New Member',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
        adminUsername: req.session.adminUsername,
        member: req.body,
        RANKS,
        STATUSES,
        error: req.uploadError,
      });
    }

    const { icName, rank, status, avatarUrl, facebookUrl } = req.body;

    const finalAvatarUrl = req.file
      ? `/uploads/${req.file.filename}`
      : avatarUrl || null;

    await prisma.member.create({
      data: {
        icName,
        rank: RANKS.includes(rank) ? rank : 'RECRUIT',
        status: STATUSES.includes(status) ? status : 'ACTIVE',
        avatarUrl: finalAvatarUrl,
        facebookUrl: facebookUrl || null,
      },
    });

    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

// Edit member form
router.get('/members/:id/edit', async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!member) return res.redirect('/admin');

    res.render('admin/member-form', {
      title: 'Edit Member',
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      adminUsername: req.session.adminUsername,
      member,
      RANKS,
      STATUSES,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.post('/members/:id', uploadSingleAvatar, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (req.uploadError) {
      const existing = await prisma.member.findUnique({ where: { id } });
      return res.render('admin/member-form', {
        title: 'Edit Member',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
        adminUsername: req.session.adminUsername,
        member: existing,
        RANKS,
        STATUSES,
        error: req.uploadError,
      });
    }

    const { icName, rank, status, avatarUrl, facebookUrl } = req.body;

    const data = {
      icName,
      rank: RANKS.includes(rank) ? rank : 'RECRUIT',
      status: STATUSES.includes(status) ? status : 'ACTIVE',
      facebookUrl: facebookUrl || null,
    };

    if (req.file) {
      data.avatarUrl = `/uploads/${req.file.filename}`;
    } else if (avatarUrl) {
      data.avatarUrl = avatarUrl;
    }

    await prisma.member.update({ where: { id }, data });
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

// DELETE
router.post('/members/:id/delete', async (req, res, next) => {
  try {
    await prisma.member.delete({ where: { id: Number(req.params.id) } });
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

module.exports = router;