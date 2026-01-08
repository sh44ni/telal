const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function seedAdmin() {
  try {
    // Read existing database
    const dbContent = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(dbContent);

    // Check if users array exists
    if (!db.users) {
      db.users = [];
    }

    // Check if admin already exists
    const adminExists = db.users.some(user => user.email === 'admin@telalalbedaya.com');

    if (adminExists) {
      console.log('Admin user already exists. Skipping seed.');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      id: `user-${Date.now()}`,
      name: 'Admin',
      email: 'admin@telalalbedaya.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add admin to users array
    db.users.push(adminUser);

    // Write back to database
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@telalalbedaya.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

seedAdmin();
