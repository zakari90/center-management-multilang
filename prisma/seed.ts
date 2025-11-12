import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping seed.');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin', 10);
  const adminId = new ObjectId().toString();
  
  const admin = await prisma.user.create({
    data: {
      id: adminId,
      email: 'admin@admin.com',
      password: hashedPassword,
      name: 'admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created successfully:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

