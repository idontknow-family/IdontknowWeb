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

    res.render('index', {
      title: `${process.env.FAMILY_NAME || 'FAMILY'} | Roster`,
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      familySlogan: process.env.FAMILY_SLOGAN || 'Loyalty. Power. Legacy.',
      members,
      rankLabels: RANK_LABELS,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
