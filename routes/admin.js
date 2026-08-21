const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const uploadSingleAvatar = require('../middleware/upload');
const resolveAvatarUrl = require('../utils/resolveAvatarUrl');

router.use(requireAuth);

const RANKS = ['LEADER', 'CO_LEADER', 'HIGH_COMMAND', 'OFFICIAL_MEMBER', 'RECRUIT'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

// กัน javascript: URI หลุดเข้าไปเป็น href ในหน้า roster/dashboard
function sanitizeFacebookUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

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
router.get('/members/new', (req, res, next) => {
  try {
    res.render('admin/member-form', {
      title: 'Add New Member',
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      adminUsername: req.session.adminUsername,
      member: null,
      RANKS,
      STATUSES,
      error: null,
    });
  } catch (err) {
    next(err);
  }
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

    if (!icName || !icName.trim()) {
      return res.render('admin/member-form', {
        title: 'Add New Member',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
        adminUsername: req.session.adminUsername,
        member: req.body,
        RANKS,
        STATUSES,
        error: 'IC Name is required.',
      });
    }

    const finalAvatarUrl = req.file
      ? `/uploads/${req.file.filename}`
      : avatarUrl || null;

    await prisma.member.create({
      data: {
        icName: icName.trim(),
        rank: RANKS.includes(rank) ? rank : 'RECRUIT',
        status: STATUSES.includes(status) ? status : 'ACTIVE',
        avatarUrl: finalAvatarUrl,
        facebookUrl: sanitizeFacebookUrl(facebookUrl),
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/admin');

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return res.redirect('/admin');

    res.render('admin/member-form', {
      title: 'Edit Member',
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      adminUsername: req.session.adminUsername,
      member: { ...member, resolvedAvatarUrl: resolveAvatarUrl(member.avatarUrl) },
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
    if (!Number.isInteger(id)) return res.redirect('/admin');

    if (req.uploadError) {
      const existing = await prisma.member.findUnique({ where: { id } });
      return res.render('admin/member-form', {
        title: 'Edit Member',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
        adminUsername: req.session.adminUsername,
        member: existing ? { ...existing, resolvedAvatarUrl: resolveAvatarUrl(existing.avatarUrl) } : null,
        RANKS,
        STATUSES,
        error: req.uploadError,
      });
    }

    const { icName, rank, status, avatarUrl, facebookUrl } = req.body;

    if (!icName || !icName.trim()) {
      const existing = await prisma.member.findUnique({ where: { id } });
      return res.render('admin/member-form', {
        title: 'Edit Member',
        familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
        adminUsername: req.session.adminUsername,
        member: existing ? { ...existing, resolvedAvatarUrl: resolveAvatarUrl(existing.avatarUrl) } : null,
        RANKS,
        STATUSES,
        error: 'IC Name is required.',
      });
    }

    const data = {
      icName: icName.trim(),
      rank: RANKS.includes(rank) ? rank : 'RECRUIT',
      status: STATUSES.includes(status) ? status : 'ACTIVE',
      facebookUrl: sanitizeFacebookUrl(facebookUrl),
    };

    if (req.file) {
      data.avatarUrl = `/uploads/${req.file.filename}`;
    } else if (avatarUrl) {
      data.avatarUrl = avatarUrl;
    }

    await prisma.member.update({ where: { id }, data });
    res.redirect('/admin');
  } catch (err) {
    if (err.code === 'P2025') return res.redirect('/admin'); // record หายไปแล้ว (ลบซ้ำ/race) ไม่ต้องโชว์ 500
    next(err);
  }
});

// DELETE
router.post('/members/:id/delete', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.redirect('/admin');

    await prisma.member.delete({ where: { id } });
    res.redirect('/admin');
  } catch (err) {
    if (err.code === 'P2025') return res.redirect('/admin'); // ลบไปแล้ว (double-click/race) ไม่ต้องโชว์ 500
    next(err);
  }
});

module.exports = router;