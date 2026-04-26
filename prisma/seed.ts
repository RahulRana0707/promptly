import "dotenv/config";

import { DEV_USER_ID } from "../lib/constants/dev-user-id";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.profile.upsert({
    where: { userId: DEV_USER_ID },
    create: {
      userId: DEV_USER_ID,
      data: {},
    },
    update: {},
  });

  console.log(`Seeded Profile for userId="${DEV_USER_ID}"`);
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
