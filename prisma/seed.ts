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
 * - 5 Orders
 */

import {
  PrismaClient,
  EmployeeRole,
  OutletStatus,
  OrderStatus,
  PricingType,
} from "@prisma/client";
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
  console.log("🗑️  Skipping clean up, using upsert for idempotency...");

  // Pre-hash passwords to optimize run time instead of awaiting in loops
  const adminPwd = await hashPassword(MOCK_CREDENTIALS.ADMIN_PASSWORD);
  const driverPwd = await hashPassword(MOCK_CREDENTIALS.DRIVER_PASSWORD);
  const workerPwd = await hashPassword(MOCK_CREDENTIALS.WORKER_PASSWORD);
  const customerPwd = await hashPassword(MOCK_CREDENTIALS.CUSTOMER_PASSWORD);

  // =============================================
  // STEP 2: Buat Outlet
  // =============================================
  console.log("🏪 Creating outlet...");

  const outlet = await prisma.outlet.upsert({
    where: { id: "seed-outlet-jaksel-001" },
    update: {},
    create: {
      id: "seed-outlet-jaksel-001",
      outletCode: "OUT-JAKSEL-001",
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
  const superAdmin = await prisma.employee.upsert({
    where: { email: "superadmin@gosokind.com" },
    update: {
      password: adminPwd,
      fullName: "Budi Santoso (Super Admin)",
      role: EmployeeRole.SUPER_ADMIN,
      outletId: null,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "superadmin@gosokind.com",
      password: adminPwd,
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
  const outletAdmin = await prisma.employee.upsert({
    where: { email: "outletadmin@gosokind.com" },
    update: {
      password: adminPwd,
      fullName: "Sari Dewi (Outlet Admin)",
      role: EmployeeRole.OUTLET_ADMIN,
      outletId: outlet.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "outletadmin@gosokind.com",
      password: adminPwd,
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
  const driver = await prisma.employee.upsert({
    where: { email: "driver@gosokind.com" },
    update: {
      password: driverPwd,
      fullName: "Andi Pratama (Driver)",
      role: EmployeeRole.DRIVER,
      outletId: outlet.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "driver@gosokind.com",
      password: driverPwd,
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
  const workerWashing = await prisma.employee.upsert({
    where: { email: "worker.cuci@gosokind.com" },
    update: {
      password: workerPwd,
      fullName: "Rudi Hermawan (Worker Cuci)",
      role: EmployeeRole.WORKER_WASHING,
      outletId: outlet.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "worker.cuci@gosokind.com",
      password: workerPwd,
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
  const workerIroning = await prisma.employee.upsert({
    where: { email: "worker.setrika@gosokind.com" },
    update: {
      password: workerPwd,
      fullName: "Dewi Susanti (Worker Setrika)",
      role: EmployeeRole.WORKER_IRONING,
      outletId: outlet.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "worker.setrika@gosokind.com",
      password: workerPwd,
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
  const workerPacking = await prisma.employee.upsert({
    where: { email: "worker.packing@gosokind.com" },
    update: {
      password: workerPwd,
      fullName: "Joko Widodo (Worker Packing)",
      role: EmployeeRole.WORKER_PACKING,
      outletId: outlet.id,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: "worker.packing@gosokind.com",
      password: workerPwd,
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

  const customer = await prisma.customer.upsert({
    where: { email: "customer@gosokind.com" },
    update: {
      password: customerPwd,
      fullName: "Rina Kusuma (Customer)",
      isVerified: true,
      deletedAt: null,
    },
    create: {
      email: "customer@gosokind.com",
      password: customerPwd,
      fullName: "Rina Kusuma (Customer)",
      isVerified: true,
    },
  });

  // Ensure addresses are separated so upsert doesn't multiply them
  let primaryAddress = await prisma.address.findFirst({
    where: { customerId: customer.id, isPrimary: true },
  });

  if (!primaryAddress) {
    primaryAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
        label: "Rumah",
        address: "Jl. Bangka Raya No. 12, Mampang Prapatan, Jakarta Selatan",
        latitude: -6.2549,
        longitude: 106.8197,
        isPrimary: true,
      },
    });

    await prisma.address.create({
      data: {
        customerId: customer.id,
        label: "Kantor",
        address: "Jl. HR Rasuna Said Kav. 6, Setiabudi, Jakarta Selatan",
        latitude: -6.2279,
        longitude: 106.8317,
        isPrimary: false,
      },
    });
  }

  console.log(
    `   ✅ Customer: ${customer.email} | pw: ${MOCK_CREDENTIALS.CUSTOMER_PASSWORD}`,
  );
  console.log(
    `   ✅ Address Primary: ${primaryAddress.label} (ID: ${primaryAddress.id})`,
  );

  // =============================================
  // STEP 5: Buat Laundry Items (Master Data)
  // =============================================
  console.log("\n👗 Creating laundry items...");

  const laundryItems = [
    // KILOAN (WEIGHT)
    {
      name: "Cuci Setrika Kiloan",
      category: "Kiloan",
      unit: "Kg",
      basePrice: 8000,
      pricingType: PricingType.WEIGHT,
    },
    {
      name: "Cuci Kering Kiloan",
      category: "Kiloan",
      unit: "Kg",
      basePrice: 6000,
      pricingType: PricingType.WEIGHT,
    },

    // SATUAN - Atasan (ITEM)
    {
      name: "Kaos",
      category: "Atasan",
      unit: "Pcs",
      basePrice: 8000,
      pricingType: PricingType.ITEM,
    },
    {
      name: "Kemeja",
      category: "Atasan",
      unit: "Pcs",
      basePrice: 10000,
      pricingType: PricingType.ITEM,
    },
    {
      name: "Polo Shirt",
      category: "Atasan",
      unit: "Pcs",
      basePrice: 10000,
      pricingType: PricingType.ITEM,
    },
    {
      name: "Jaket",
      category: "Atasan",
      unit: "Pcs",
      basePrice: 15000,
      pricingType: PricingType.ITEM,
    },

    // SATUAN - Bawahan (ITEM)
    {
      name: "Celana Jeans",
      category: "Bawahan",
      unit: "Pcs",
      basePrice: 12000,
      pricingType: PricingType.ITEM,
    },
    {
      name: "Celana Pendek",
      category: "Bawahan",
      unit: "Pcs",
      basePrice: 8000,
      pricingType: PricingType.ITEM,
    },

    // SATUAN - Linen (ITEM)
    {
      name: "Handuk",
      category: "Linen",
      unit: "Pcs",
      basePrice: 10000,
      pricingType: PricingType.ITEM,
    },
    {
      name: "Sprei Single",
      category: "Linen",
      unit: "Set",
      basePrice: 25000,
      pricingType: PricingType.ITEM,
    },

    // SATUAN - Bed Cover (ITEM)
    {
      name: "Bed Cover Queen",
      category: "Bed Cover",
      unit: "Pcs",
      basePrice: 35000,
      pricingType: PricingType.ITEM,
    },

    // SATUAN - Lainnya (ITEM)
    {
      name: "Mukena",
      category: "Lainnya",
      unit: "Set",
      basePrice: 20000,
      pricingType: PricingType.ITEM,
    },
  ];

  const createdItems = [];
  for (const item of laundryItems) {
    // Cek dulu kalau sudah ada atau update biar idempoten
    const existing = await prisma.laundryItem.findFirst({
      where: {
        name: { equals: item.name, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      // Jika butuh mengupdate data lama agar memiliki pricingType, kita update di sini
      if (!existing.pricingType || existing.pricingType !== item.pricingType) {
        const updated = await prisma.laundryItem.update({
          where: { id: existing.id },
          data: { pricingType: item.pricingType },
        });
        createdItems.push(updated);
        console.log(`   🔄 Item diupdate (PricingType): ${updated.name}`);
      } else {
        createdItems.push(existing);
        console.log(`   ⏭️  Item sudah ada: ${item.name}`);
      }
    } else {
      const created = await prisma.laundryItem.create({ data: item });
      createdItems.push(created);
      console.log(
        `   ✅ Item: ${created.name} | Tipe: ${created.pricingType} | Harga: Rp ${created.basePrice?.toLocaleString("id-ID")}`,
      );
    }
  }

  // =============================================
  // STEP 6: Buat Orders (Dengan Variasi Status & Item)
  // =============================================
  console.log("\n📦 Creating orders and order items...");

  const baseOrderNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Ambil beberapa item yang sudah dibuat di Step 5 untuk dijadikan mock order
  const itemKiloan =
    createdItems.find((i) => i.pricingType === PricingType.WEIGHT) ||
    createdItems[0];
  const itemSatuanAtasan =
    createdItems.find((i) => i.category === "Atasan") || createdItems[2];
  const itemSatuanLinen =
    createdItems.find((i) => i.category === "Linen") || createdItems[8];

  // Skenario Order untuk mempermudah Testing Flow
  const orderScenarios = [
    {
      status: OrderStatus.WAITING_FOR_PICKUP,
      note: "Baru dibuat user, menunggu driver",
    },
    {
      status: OrderStatus.ARRIVED_AT_OUTLET,
      note: "Sudah di outlet, Admin baru input item",
    },
    { status: OrderStatus.WASHING, note: "Sedang dikerjakan oleh Worker Cuci" },
    {
      status: OrderStatus.READY_FOR_DELIVERY,
      note: "Selesai packing, siap diantar balik",
    },
    {
      status: OrderStatus.COMPLETED,
      note: "Sudah diterima customer (History)",
    },
  ];

  const createdOrders = [];

  for (let i = 0; i < orderScenarios.length; i++) {
    const scenario = orderScenarios[i];
    const orderNumber = `${baseOrderNumber}${(i + 1).toString().padStart(3, "0")}`;

    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existingOrder) {
      createdOrders.push(existingOrder);
      console.log(
        `   ⏭️  Order sudah ada: ${orderNumber} (${scenario.status})`,
      );
      continue;
    }

    // Default variable untuk order yang belum diproses admin
    let totalWeight = null;
    let totalPrice = null;
    let orderItemsData: any[] = [];

    // Jika statusnya bukan WAITING_FOR_PICKUP atau PICKUP_ON_THE_WAY,
    // berarti asumsinya Admin Outlet sudah menginput cucian.
    if (scenario.status !== OrderStatus.ARRIVED_AT_OUTLET) {
      // Simulasi keranjang cucian pelanggan: 3 Kg Kiloan + 2 Kemeja + 1 Sprei
      const qtyKiloan = 3.5; // 3.5 Kg
      const qtyAtasan = 2; // 2 Pcs
      const qtyLinen = 1; // 1 Set

      orderItemsData = [
        { laundryItemId: itemKiloan.id, quantity: qtyKiloan },
        { laundryItemId: itemSatuanAtasan.id, quantity: qtyAtasan },
        { laundryItemId: itemSatuanLinen.id, quantity: qtyLinen },
      ];

      totalWeight = qtyKiloan; // Biasanya totalWeight hanya akumulasi dari yang kiloan
      totalPrice =
        qtyKiloan * (itemKiloan.basePrice || 0) +
        qtyAtasan * (itemSatuanAtasan.basePrice || 0) +
        qtyLinen * (itemSatuanLinen.basePrice || 0);
    }

    const created = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        outletId: outlet.id,
        addressId: primaryAddress?.id || "",
        status: scenario.status,
        totalWeight,
        totalPrice,
        pickupDriverId: driver.id, // Set driver penjemput
        // Relasi untuk insert orderItems jika ada
        ...(orderItemsData.length > 0 && {
          orderItems: {
            create: orderItemsData,
          },
        }),
      },
    });

    createdOrders.push(created);
    console.log(
      `   ✅ Order: ${created.orderNumber} | Status: ${created.status} | Rp ${totalPrice?.toLocaleString("id-ID") || "0"} - (${scenario.note})`,
    );
  }

  // =============================================
  // STEP 7: Ringkasan Output
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
  console.log(
    `   order_id_1         = ${createdOrders[0]?.id} (${createdOrders[0]?.orderNumber})`,
  );
  console.log(
    `   order_id_2         = ${createdOrders[1]?.id} (${createdOrders[1]?.orderNumber})`,
  );
  console.log(
    `   order_id_3         = ${createdOrders[2]?.id} (${createdOrders[2]?.orderNumber})`,
  );
  console.log(
    `   order_id_4         = ${createdOrders[3]?.id} (${createdOrders[3]?.orderNumber})`,
  );
  console.log(
    `   order_id_5         = ${createdOrders[4]?.id} (${createdOrders[4]?.orderNumber})`,
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
