import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    console.log(`Found ${allUsers.length} total users:`);
    allUsers.forEach((u) => console.log(`- ${u.email} (${u.role})`));

    const adminCount = allUsers.filter((u) => u.role === "ADMIN").length;

    if (adminCount > 0) {
      console.log(`Deleting ${adminCount} ADMIN user(s)...`);
      const result = await prisma.user.deleteMany({
        where: {
          role: "ADMIN",
        },
      });
      console.log(`Successfully deleted ${result.count} admin user(s).`);
    } else {
      console.log("No ADMIN users found to delete.");
    }
  } catch (error) {
    console.error("Database error:", error);
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
