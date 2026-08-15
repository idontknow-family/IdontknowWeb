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

// Home / Landing page — hero + spinning logo only
router.get('/', (req, res) => {
  res.render('index', {
    title: `${process.env.FAMILY_NAME || 'FAMILY'} | Home`,
    familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
    familySlogan: process.env.FAMILY_SLOGAN || 'Loyalty. Power. Legacy.',
    familyLogoUrl: process.env.FAMILY_LOGO_URL || '',
    backgroundMusicUrl: process.env.BACKGROUND_MUSIC_URL || '',
    designCredit: process.env.DESIGN_CREDIT || '',
    musicCredit: process.env.MUSIC_CREDIT || '',
  });
});

// Dedicated Member Roster page
router.get('/roster', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: [{ rank: 'asc' }, { icName: 'asc' }],
    });

    res.render('roster', {
      title: `Member - ${process.env.FAMILY_NAME || 'FAMILY'}`,
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      members,
      rankLabels: RANK_LABELS,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;