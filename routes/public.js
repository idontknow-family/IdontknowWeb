const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const resolveAvatarUrl = require('../utils/resolveAvatarUrl');

const RANK_LABELS = {
  LEADER: 'Leader',
  CO_LEADER: 'Co-Leader',
  HIGH_COMMAND: 'High Command',
  OFFICIAL_MEMBER: 'Official Member',
  RECRUIT: 'Recruit',
};

router.get('/', (req, res, next) => {
  try {
    res.render('index', {
      title: `${process.env.FAMILY_NAME || 'FAMILY'} | Home`,
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      familySlogan: process.env.FAMILY_SLOGAN || 'Loyalty. Power. Legacy.',
      familyLogoUrl: process.env.FAMILY_LOGO_URL || '',
      familyLogoVideoColorUrl: process.env.FAMILY_LOGO_VIDEO_COLOR_URL || '/images/logo-color.mp4',
      familyLogoVideoMatteUrl: process.env.FAMILY_LOGO_VIDEO_MATTE_URL || '/images/logo-matte.mp4',
      backgroundMusicUrl: process.env.BACKGROUND_MUSIC_URL || '',
      designCredit: process.env.DESIGN_CREDIT || '',
      musicCredit: process.env.MUSIC_CREDIT || '',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/roster', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: [{ rank: 'asc' }, { icName: 'asc' }],
    });

    const membersResolved = members.map((m) => ({
      ...m,
      resolvedAvatarUrl: resolveAvatarUrl(m.avatarUrl),
    }));

    // แยก Leader ออกมาโชว์เด่นๆ ข้างบน ที่เหลือไปอยู่ใน grid ที่ paginate
    const leaders = membersResolved.filter((m) => m.rank === 'LEADER');
    const others = membersResolved.filter((m) => m.rank !== 'LEADER');

    res.render('roster', {
      title: `Member - ${process.env.FAMILY_NAME || 'FAMILY'}`,
      familyName: process.env.FAMILY_NAME || 'HOUSE OF RAVEN',
      backgroundMusicUrl: process.env.BACKGROUND_MUSIC_URL || '',
      leaders,
      others,
      rankLabels: RANK_LABELS,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;