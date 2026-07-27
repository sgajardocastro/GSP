import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT * FROM sch_leangsp.tsrv_tipo_template;
    `;
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error querying types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
