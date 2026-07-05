// Seed script — creates the initial admin user for platform management
// Run with: node prisma/seed.js
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const prisma = require("../src/config/prisma");

const seedAdmin = async () => {
  const email = "admin@neurobridge.com";
  const phone = "+233500000000";

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", Number(process.env.SALT_ROUNDS) || 10);

  const admin = await prisma.user.create({
    data: {
      firstName: "System",
      lastName: "Admin",
      email,
      phone,
      password: hashedPassword,
      role: "ADMIN",
      isApproved: true,
    },
  });

  console.log(`Admin user created: ${admin.email} (${admin.id})`);
  console.log("Default password: Admin@123");
  console.log("⚠️  Change this password immediately after first login.");
};

seedAdmin()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
