import bcrypt from "bcrypt";
const adminPassword = "admin"; // <-- replace with your password

async function hashPassword() {
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
}

hashPassword();
