const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

const RANK_LABELS = {
  LEADER: 'Leader',
  CO_LEADER: 'Co-Leader',
  HIGH_COMMAND: 'High Command',
  OFFICIAL_MEMBER: 'Official Member',
  RECRUIT: 'Recruit',
};

router.get('/', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: [{ rank: 'asc' }, { icName: 'asc' }],
    });

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;

    res.render('index', {
      title: `${process.env.FAMILY_NAME || 'FAMILY'} | Roster`,
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      familySlogan: process.env.FAMILY_SLOGAN || 'Loyalty. Power. Legacy.',
      members,
      totalMembers,
      activeMembers,
      rankLabels: RANK_LABELS,
    });
  } catch (err) {
    next(err);
  }
});

// JSON API used by the client-side search/filter script
router.get('/api/members', async (req, res, next) => {
  try {
    const { q, rank, status } = req.query;

    const where = {};
    if (rank && rank !== 'ALL') where.rank = rank;
    if (status && status !== 'ALL') where.status = status;
    if (q) {
      where.OR = [
        { icName: { contains: q, mode: 'insensitive' } },
        { oocName: { contains: q, mode: 'insensitive' } },
        { discordTag: { contains: q, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: [{ rank: 'asc' }, { icName: 'asc' }],
    });

    res.json({ members, rankLabels: RANK_LABELS });
  } catch (err) {
    next(err);
  }
});

router.get('/api/members/:id', async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json({ member, rankLabels: RANK_LABELS });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
