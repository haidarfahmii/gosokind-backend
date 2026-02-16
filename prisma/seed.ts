import { prisma } from "../src/lib/prisma";
import { EmployeeRole, OrderStatus } from "../src/generated/prisma";
import bcrypt from "bcrypt";

async function main() {
  console.log("🚀 Starting Unified Seeding...");
  const password = await bcrypt.hash("123456", 10);

  // 1. Create Outlet
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

  // 2. Create Employees (All Roles)
  const employees = [
    { email: "driver@gosokind.com", role: EmployeeRole.DRIVER, name: "Aziz Driver" },
    { email: "washing@gosokind.com", role: EmployeeRole.WORKER_WASHING, name: "Fahmi Washing" },
    { email: "ironing@gosokind.com", role: EmployeeRole.WORKER_IRONING, name: "Rafa Ironing" },
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
  console.log("✅ Employees Seeded (Pass: 123456)");

  // 3. Create Master Data (Laundry Items)
  const itemKaos = await prisma.laundryItem.upsert({
    where: { id: "item-kaos" }, update: {},
    create: { id: "item-kaos", name: "Kaos" }
  });
  const itemCelana = await prisma.laundryItem.upsert({
    where: { id: "item-celana" }, update: {},
    create: { id: "item-celana", name: "Celana" }
  });

  // 4. Create Customer & Address
  const customer = await prisma.customer.upsert({
    where: { email: "customer.test@gmail.com" },
    update: {},
    create: {
      email: "customer.test@gmail.com",
      fullName: "Pak Customer",
      password: password,
      isVerified: true
    }
  });

  const address = await prisma.address.create({
    data: {
      label: "Rumah Utama", address: "Jl. Test No. 123", latitude: 0, longitude: 0,
      customerId: customer.id
    }
  });

  // 5. Create Test Orders for Feature 3
  
  // ORDER 1: Untuk testing DRIVER (Waiting for Pickup)
  await prisma.order.create({
    data: {
      orderNumber: "INV-DRIVER-001",
      customerId: customer.id,
      addressId: address.id,
      status: OrderStatus.WAITING_FOR_PICKUP,
      orderItems: {
        create: [
          { laundryItemId: itemKaos.id, quantity: 3 },
          { laundryItemId: itemCelana.id, quantity: 2 }
        ]
      }
    }
  });

  // ORDER 2: Untuk testing WORKER (Ready for Washing)
  await prisma.order.create({
    data: {
      orderNumber: "INV-WASH-001",
      customerId: customer.id,
      addressId: address.id,
      status: OrderStatus.WASHING, // Corrected from READY_FOR_WASHING to match schema
      orderItems: {
        create: { laundryItemId: itemKaos.id, quantity: 10 }
      }
    }
  });

  console.log("✅ Feature 3 Orders Seeded Successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());