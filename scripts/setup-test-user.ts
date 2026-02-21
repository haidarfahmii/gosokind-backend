
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'aziz@gosokind.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.employee.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
      fullName: 'Test User',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Test user ready:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
