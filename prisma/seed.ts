import { prisma } from "../src/lib/prisma";
import { EmployeeRole } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";
// const prisma = new PrismaClient(); // Removed local instantiation

async function main() {
  console.log("Seeding database...");
  const password = await bcrypt.hash("123456", 10);

  const outlet = await prisma.outlet.upsert({
    where: { id: "outlet-pusat" },
    update: {},
    create: {
      id: "outlet-pusat",
      name: "GosokInd Pusat",
      address: "Jl. Sudirman No. 1",
      latitude: -6.2088,
      longitude: 106.8456,
    },
  });

  const employees = [
    { email: "driver@gosokind.com", role: EmployeeRole.DRIVER, name: "Budi Driver" },
    { email: "washing@gosokind.com", role: EmployeeRole.WORKER_WASHING, name: "Siti Washing" },
    { email: "ironing@gosokind.com", role: EmployeeRole.WORKER_IRONING, name: "Dewi Ironing" },
    { email: "packing@gosokind.com", role: EmployeeRole.WORKER_PACKING, name: "Joko Packing" },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: password,
        fullName: emp.name,
        role: emp.role,
        outletId: outlet.id,
      },
    });
  }
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
