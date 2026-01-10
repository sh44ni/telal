// Prisma seed script for creating admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@telalalbedaya.com' }
        });

        if (existingAdmin) {
            console.log('Admin user already exists. Skipping.');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.create({
            data: {
                name: 'Admin',
                email: 'admin@telalalbedaya.com',
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@telalalbedaya.com');
        console.log('🔑 Password: admin123');
        console.log('');
        console.log('⚠️  Please change the password after first login!');
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
