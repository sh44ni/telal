// Seed script to create admin user
// Run with: npx tsx scripts/seed-admin.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding admin user...");

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: "admin@telalalbedaya.com" },
    });

    if (existingAdmin) {
        console.log("✅ Admin user already exists!");
        return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const admin = await prisma.user.create({
        data: {
            name: "Admin",
            email: "admin@telalalbedaya.com",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log("✅ Admin user created successfully!");
    console.log("   Email: admin@telalalbedaya.com");
    console.log("   Password: admin123");
    console.log("   Role: ADMIN");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
