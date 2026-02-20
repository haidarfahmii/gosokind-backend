/**
 * 🧺 Gosokind Laundry - Mock Data Seed Script
 * ============================================
 * Jalankan dengan: npx ts-node prisma/seed.ts
 * (Atau: npx prisma db seed)
 *
 * Script ini membuat data mock lengkap untuk testing Postman:
 * - 1 Outlet
 * - 1 Super Admin
 * - 1 Outlet Admin
 * - 1 Driver
 * - 1 Worker Cuci (WORKER_WASHING)
 * - 1 Worker Setrika (WORKER_IRONING)
 * - 1 Worker Packing (WORKER_PACKING)
 * - 1 Customer (verified)
 * - 1 Address untuk Customer
 * - 10 Laundry Items
 */

import { PrismaClient, EmployeeRole, OutletStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// =============================================
// 🔑 MOCK CREDENTIALS
// =============================================
const MOCK_CREDENTIALS = {
  ADMIN_PASSWORD: "Admin@123",
  DRIVER_PASSWORD: "Driver@123",
  WORKER_PASSWORD: "Worker@123",
  CUSTOMER_PASSWORD: "Customer@123",
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Starting seed process...\n");

  // =============================================
  // STEP 1: Bersihkan data lama (opsional)
  // =============================================
  console.log("🗑️  Cleaning up existing mock data...");

  // Hapus berdasarkan email agar tidak conflict
  const mockEmails = [
    "superadmin@gosokind.com",
    "outletadmin@gosokind.com",
    "driver@gosokind.com",
    "worker.cuci@gosokind.com",
    "worker.setrika@gosokind.com",
    "worker.packing@gosokind.com",
    "customer@gosokind.com",
  ];

  // Soft delete customer lama
  await prisma.customer.updateMany({
    where: { email: { in: [mockEmails[6]] }, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  // Soft delete employees lama
  await prisma.employee.updateMany({
    where: { email: { in: mockEmails.slice(0, 6) }, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  // =============================================
  // STEP 2: Buat Outlet
  // =============================================
  console.log("🏪 Creating outlet...");

  const outlet = await prisma.outlet.upsert({
    where: { id: "seed-outlet-jaksel-001" },
    update: {},
    create: {
      id: "seed-outlet-jaksel-001",
      name: "Gosokind Outlet - Jakarta Selatan",
      address: "Jl. Kemang Raya No. 45, Kemang, Jakarta Selatan",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      latitude: -6.2607,
      longitude: 106.8135,
      status: OutletStatus.AVAILABLE,
    },
  });

  console.log(`   ✅ Outlet created: ${outlet.name} (ID: ${outlet.id})`);

  // =============================================
  // STEP 3: Buat Employees
  // =============================================
  console.log("\n👥 Creating employees...");

  // 3a. Super Admin (tidak perlu outletId)
  const superAdmin = await prisma.employee.create({
    data: {
      email: "superadmin@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.ADMIN_PASSWORD),
      fullName: "Budi Santoso (Super Admin)",
      role: EmployeeRole.SUPER_ADMIN,
      outletId: null,
      isActive: true,
    },
  });
  console.log(
    `   ✅ Super Admin: ${superAdmin.email} | pw: ${MOCK_CREDENTIALS.ADMIN_PASSWORD}`,
  );

  // 3b. Outlet Admin
  const outletAdmin = await prisma.employee.create({
    data: {
      email: "outletadmin@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.ADMIN_PASSWORD),
      fullName: "Sari Dewi (Outlet Admin)",
      role: EmployeeRole.OUTLET_ADMIN,
      outletId: outlet.id,
      isActive: true,
    },
  });
  console.log(
    `   ✅ Outlet Admin: ${outletAdmin.email} | pw: ${MOCK_CREDENTIALS.ADMIN_PASSWORD}`,
  );

  // 3c. Driver
  const driver = await prisma.employee.create({
    data: {
      email: "driver@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.DRIVER_PASSWORD),
      fullName: "Andi Pratama (Driver)",
      role: EmployeeRole.DRIVER,
      outletId: outlet.id,
      isActive: true,
    },
  });
  console.log(
    `   ✅ Driver: ${driver.email} | pw: ${MOCK_CREDENTIALS.DRIVER_PASSWORD}`,
  );

  // 3d. Worker Cuci (WORKER_WASHING)
  const workerWashing = await prisma.employee.create({
    data: {
      email: "worker.cuci@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.WORKER_PASSWORD),
      fullName: "Rudi Hermawan (Worker Cuci)",
      role: EmployeeRole.WORKER_WASHING,
      outletId: outlet.id,
      isActive: true,
    },
  });
  console.log(
    `   ✅ Worker Cuci: ${workerWashing.email} | pw: ${MOCK_CREDENTIALS.WORKER_PASSWORD}`,
  );

  // 3e. Worker Setrika (WORKER_IRONING)
  const workerIroning = await prisma.employee.create({
    data: {
      email: "worker.setrika@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.WORKER_PASSWORD),
      fullName: "Dewi Susanti (Worker Setrika)",
      role: EmployeeRole.WORKER_IRONING,
      outletId: outlet.id,
      isActive: true,
    },
  });
  console.log(
    `   ✅ Worker Setrika: ${workerIroning.email} | pw: ${MOCK_CREDENTIALS.WORKER_PASSWORD}`,
  );

  // 3f. Worker Packing (WORKER_PACKING)
  const workerPacking = await prisma.employee.create({
    data: {
      email: "worker.packing@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.WORKER_PASSWORD),
      fullName: "Joko Widodo (Worker Packing)",
      role: EmployeeRole.WORKER_PACKING,
      outletId: outlet.id,
      isActive: true,
    },
  });
  console.log(
    `   ✅ Worker Packing: ${workerPacking.email} | pw: ${MOCK_CREDENTIALS.WORKER_PASSWORD}`,
  );

  // =============================================
  // STEP 4: Buat Customer (Verified)
  // =============================================
  console.log("\n👤 Creating customer...");

  const customer = await prisma.customer.create({
    data: {
      email: "customer@gosokind.com",
      password: await hashPassword(MOCK_CREDENTIALS.CUSTOMER_PASSWORD),
      fullName: "Rina Kusuma (Customer)",
      isVerified: true,
      // Tambah address sekaligus
      addresses: {
        create: [
          {
            label: "Rumah",
            address:
              "Jl. Bangka Raya No. 12, Mampang Prapatan, Jakarta Selatan",
            latitude: -6.2549,
            longitude: 106.8197,
            isPrimary: true,
          },
          {
            label: "Kantor",
            address: "Jl. HR Rasuna Said Kav. 6, Setiabudi, Jakarta Selatan",
            latitude: -6.2279,
            longitude: 106.8317,
            isPrimary: false,
          },
        ],
      },
    },
    include: {
      addresses: true,
    },
  });

  const primaryAddress =
    customer.addresses.find((a) => a.isPrimary) || customer.addresses[0];

  console.log(
    `   ✅ Customer: ${customer.email} | pw: ${MOCK_CREDENTIALS.CUSTOMER_PASSWORD}`,
  );
  console.log(
    `   ✅ Address Primary: ${primaryAddress?.label} (ID: ${primaryAddress?.id})`,
  );

  // =============================================
  // STEP 5: Buat Laundry Items (Master Data)
  // =============================================
  console.log("\n👗 Creating laundry items...");

  const laundryItems = [
    // Atasan
    { name: "Kaos", category: "Atasan", unit: "Pcs", basePrice: 8000 },
    { name: "Kemeja", category: "Atasan", unit: "Pcs", basePrice: 10000 },
    { name: "Polo Shirt", category: "Atasan", unit: "Pcs", basePrice: 10000 },
    { name: "Jaket", category: "Atasan", unit: "Pcs", basePrice: 15000 },
    // Bawahan
    {
      name: "Celana Jeans",
      category: "Bawahan",
      unit: "Pcs",
      basePrice: 12000,
    },
    {
      name: "Celana Pendek",
      category: "Bawahan",
      unit: "Pcs",
      basePrice: 8000,
    },
    // Linen
    { name: "Handuk", category: "Linen", unit: "Pcs", basePrice: 10000 },
    { name: "Sprei Single", category: "Linen", unit: "Set", basePrice: 25000 },
    // Bed Cover
    {
      name: "Bed Cover Queen",
      category: "Bed Cover",
      unit: "Pcs",
      basePrice: 35000,
    },
    // Lainnya
    { name: "Mukena", category: "Lainnya", unit: "Set", basePrice: 20000 },
  ];

  const createdItems = [];
  for (const item of laundryItems) {
    // Cek dulu kalau sudah ada
    const existing = await prisma.laundryItem.findFirst({
      where: {
        name: { equals: item.name, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      createdItems.push(existing);
      console.log(`   ⏭️  Item sudah ada: ${item.name}`);
    } else {
      const created = await prisma.laundryItem.create({ data: item });
      createdItems.push(created);
      console.log(
        `   ✅ Item: ${created.name} | Harga: Rp ${created.basePrice?.toLocaleString("id-ID")}`,
      );
    }
  }

  // =============================================
  // STEP 6: Ringkasan Output
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));

  console.log("\n📋 SUMMARY - Copy ini ke Postman Environment (manual):");
  console.log(`   outlet_id          = ${outlet.id}`);
  console.log(`   customer_id        = ${customer.id}`);
  console.log(`   address_id         = ${primaryAddress?.id}`);
  console.log(`   driver_id          = ${driver.id}`);
  console.log(`   worker_washing_id  = ${workerWashing.id}`);
  console.log(`   worker_ironing_id  = ${workerIroning.id}`);
  console.log(`   worker_packing_id  = ${workerPacking.id}`);
  console.log(
    `   laundry_item_id_1  = ${createdItems[0]?.id} (${createdItems[0]?.name})`,
  );
  console.log(
    `   laundry_item_id_2  = ${createdItems[4]?.id} (${createdItems[4]?.name})`,
  );

  console.log("\n🔑 MOCK ACCOUNTS:");
  console.log(
    "┌────────────────────┬─────────────────────────────────┬──────────────┐",
  );
  console.log(
    "│ Role               │ Email                           │ Password     │",
  );
  console.log(
    "├────────────────────┼─────────────────────────────────┼──────────────┤",
  );
  console.log(
    `│ Super Admin        │ superadmin@gosokind.com         │ Admin@123    │`,
  );
  console.log(
    `│ Outlet Admin       │ outletadmin@gosokind.com        │ Admin@123    │`,
  );
  console.log(
    `│ Driver             │ driver@gosokind.com             │ Driver@123   │`,
  );
  console.log(
    `│ Worker Cuci        │ worker.cuci@gosokind.com        │ Worker@123   │`,
  );
  console.log(
    `│ Worker Setrika     │ worker.setrika@gosokind.com     │ Worker@123   │`,
  );
  console.log(
    `│ Worker Packing     │ worker.packing@gosokind.com     │ Worker@123   │`,
  );
  console.log(
    `│ Customer           │ customer@gosokind.com           │ Customer@123 │`,
  );
  console.log(
    "└────────────────────┴─────────────────────────────────┴──────────────┘",
  );

  console.log("\n🚀 NEXT STEPS:");
  console.log(
    "   1. Import gosokind-order-management.postman_collection.json ke Postman",
  );
  console.log(
    "   2. Import gosokind-local.postman_environment.json ke Postman",
  );
  console.log("   3. Pilih environment 'Gosokind - Local Environment'");
  console.log("   4. Jalankan folder '🔐 Auth' untuk login semua akun");
  console.log(
    "   5. Jalankan folder '🏪 Setup Data' untuk populate variabel IDs",
  );
  console.log("   6. Mulai test dari folder '🛒 Order Flow - Full Journey'");
  console.log("\n" + "=".repeat(60));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("\n❌ Seed Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
