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

    const supervisors = (process.env.SUPERVISORS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    res.render('index', {
      title: `${process.env.FAMILY_NAME || 'FAMILY'} | Roster`,
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      familySlogan: process.env.FAMILY_SLOGAN || 'Loyalty. Power. Legacy.',
      familyLogoUrl: process.env.FAMILY_LOGO_URL || '',
      backgroundMusicUrl: process.env.BACKGROUND_MUSIC_URL || '',
      designCredit: process.env.DESIGN_CREDIT || '',
      musicCredit: process.env.MUSIC_CREDIT || '',
      supervisors,
      members,
      rankLabels: RANK_LABELS,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
