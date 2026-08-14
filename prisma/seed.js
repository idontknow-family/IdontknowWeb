require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
    },
  });
  console.log(`Admin user ready: ${adminUsername}`);

  const members = [
    {
      icName: 'Tyrant Knx',
      oocName: 'Tyrant',
      discordTag: 'tyrant#0001',
      avatarUrl: null,
      rank: 'LEADER',
      status: 'ACTIVE',
      phoneNumber: '555-0101',
      specialty: 'Family Leader / Operations',
      primaryGear: 'Combat Pistol, Sultan RS',
      notes: 'Founder of the family. Final say on all major decisions.',
    },
    {
      icName: 'Frequent Knx',
      oocName: 'Frequent',
      discordTag: 'frequent#0002',
      avatarUrl: null,
      rank: 'CO_LEADER',
      status: 'ACTIVE',
      phoneNumber: '555-0102',
      specialty: 'Recruitment & Logistics',
      primaryGear: 'SMG, Buffalo S',
      notes: 'Handles day-to-day recruitment and supply runs.',
    },
    {
      icName: 'Try Knx',
      oocName: 'Try',
      discordTag: 'tryknx#0003',
      avatarUrl: null,
      rank: 'HIGH_COMMAND',
      status: 'ACTIVE',
      phoneNumber: '555-0103',
      specialty: 'Security & Enforcement',
      primaryGear: 'Carbine Rifle, Kuruma',
      notes: 'Oversees turf security.',
    },
    {
      icName: 'Muzah Knx',
      oocName: 'Muzah',
      discordTag: 'muzah#0004',
      avatarUrl: null,
      rank: 'OFFICIAL_MEMBER',
      status: 'ACTIVE',
      phoneNumber: '555-0104',
      specialty: 'Driver',
      primaryGear: 'Pistol, Comet',
      notes: 'Reliable wheelman.',
    },
    {
      icName: 'Blackdog Knx',
      oocName: 'Blackdog',
      discordTag: 'blackdog#0005',
      avatarUrl: null,
      rank: 'RECRUIT',
      status: 'INACTIVE',
      phoneNumber: '555-0105',
      specialty: 'Trainee',
      primaryGear: 'Unarmed',
      notes: 'New recruit, currently on leave.',
    },
  ];

  for (const m of members) {
    await prisma.member.create({ data: m });
  }
  console.log(`Seeded ${members.length} members.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
