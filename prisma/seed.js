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
    { icName: 'Tyrant Knx', facebookUrl: 'https://facebook.com/tyrantknx', rank: 'LEADER', status: 'ACTIVE' },
    { icName: 'Frequent Knx', facebookUrl: 'https://facebook.com/frequentknx', rank: 'CO_LEADER', status: 'ACTIVE' },
    { icName: 'Try Knx', facebookUrl: 'https://facebook.com/tryknx', rank: 'HIGH_COMMAND', status: 'ACTIVE' },
    { icName: 'Muzah Knx', facebookUrl: 'https://facebook.com/muzahknx', rank: 'OFFICIAL_MEMBER', status: 'ACTIVE' },
    { icName: 'Blackdog Knx', facebookUrl: 'https://facebook.com/blackdogknx', rank: 'RECRUIT', status: 'INACTIVE' },
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
