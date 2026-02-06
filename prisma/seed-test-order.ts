import { PrismaClient, OrderStatus } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Ambil user customer/outlet sembarang (atau create dummy)
  // Untuk test cepat, kita buat customer dummy
  const customer = await prisma.customer.create({
    data: {
      email: "customer.test@gmail.com",
      fullName: "Pak Customer",
      password: "hash",
      isVerified: true
    }
  });

  const address = await prisma.address.create({
    data: {
        label: "Rumah", address: "Jl. Test", latitude: 0, longitude: 0,
        customerId: customer.id
    }
  });

  const itemKaos = await prisma.laundryItem.create({ data: { name: "Kaos" } });

  // Create ORDER yang siap di-pickup
  const order = await prisma.order.create({
    data: {
      orderNumber: "INV-TEST-001",
      customerId: customer.id,
      addressId: address.id,
      status: OrderStatus.WAITING_FOR_PICKUP, // [cite: 65]
      orderItems: {
        create: {
            laundryItemId: itemKaos.id,
            quantity: 5 // Ingat angka ini untuk validasi worker!
        }
      }
    }
  });

  console.log(`✅ Dummy Order Created: ${order.id}`);
  console.log(`📋 Copy Order ID ini untuk Postman!`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());