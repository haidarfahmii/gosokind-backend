import { prisma } from '../src/lib/prisma';
import { EmployeeRole } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const users = [
    { email: 'driver@demo.com', role: EmployeeRole.DRIVER, fullName: 'Demo Driver' },
    { email: 'washer@demo.com', role: EmployeeRole.WORKER_WASHING, fullName: 'Demo Washer' },
    { email: 'ironer@demo.com', role: EmployeeRole.WORKER_IRONING, fullName: 'Demo Ironer' },
    { email: 'packer@demo.com', role: EmployeeRole.WORKER_PACKING, fullName: 'Demo Packer' },
  ];

  for (const user of users) {
    const existing = await prisma.employee.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.employee.create({
        data: {
          email: user.email,
          password,
          fullName: user.fullName,
          role: user.role,
        },
      });
      console.log(`✅ Created user: ${user.email}`);
    } else {
      console.log(`ℹ️ User already exists: ${user.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
