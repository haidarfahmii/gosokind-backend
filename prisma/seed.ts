import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding (Super Admin Only)...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // ========================================
    // 1. CLEAR EXISTING DATA
    // ========================================
    // Kita tetap perlu clear data untuk menghindari duplikasi
    console.log("🗑️  Clearing existing data...");

    // Hapus tabel yang memiliki relasi ke Employee terlebih dahulu
    await prisma.attendance.deleteMany();
    await prisma.bypassRequest.deleteMany();
    await prisma.orderStationProcess.deleteMany();

    // Hapus Employee (termasuk admin lama)
    await prisma.employee.deleteMany();

    console.log("✅ Existing employee data cleared\n");

    // ========================================
    // 2. SEED SUPER ADMIN
    // ========================================
    console.log("👤 Creating Super Admin...");
    const hashedPasswordAdmin = await bcrypt.hash("super123", 10);

    const superAdmin = await prisma.employee.create({
      data: {
        id: "emp-superadmin",
        email: "admin@gosokind.com",
        password: hashedPasswordAdmin,
        fullName: "Super Admin",
        role: "SUPER_ADMIN", // Pastikan sesuai dengan ENUM di schema.prisma
        // outletId tidak perlu diisi karena Super Admin tidak terikat outlet
      },
    });

    console.log(`✅ Created Super Admin: ${superAdmin.email}\n`);

    // ========================================
    // SUCCESS SUMMARY
    // ========================================
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Database seeding completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📝 LOGIN CREDENTIALS:\n");

    console.log("🔐 SUPER ADMIN:");
    console.log("   Email    : admin@gosokind.com");
    console.log("   Password : super123");
    console.log("   Role     : SUPER_ADMIN\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📊 DATABASE SUMMARY:");
    console.log(`   Employees      : 1 (Super Admin Only)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🚀 You can now start testing the API!");
    console.log("   Server: npm run dev");
    console.log("   Prisma Studio: npx prisma studio\n");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
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
