import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/admin/register-admin
 * Register the first and only admin account
 * Public endpoint - but only works if no admin exists
 */
export async function POST(request: Request) {
  let locale = "en";
  try {
    const body = await request.json();
    if (body.locale) locale = body.locale;

    const { name, email, password, isEncrypted } = body;

    const t = await getTranslations({
      locale,
      namespace: "adminRegistration",
    });

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: t("allFieldsRequired") },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: t("invalidEmail") }, { status: 400 });
    }

    // Validate password length
    if (password.length < 4) {
      return NextResponse.json(
        { error: t("passwordTooShort") },
        { status: 400 },
      );
    }

    // Check if an admin already exists
    const existingAdminCount = await db.user.count({
      where: {
        role: "ADMIN",
      },
    });

    if (existingAdminCount > 0) {
      return NextResponse.json(
        {
          error: t("adminExistsError"),
        },
        { status: 409 },
      );
    }

    // Check if email is already taken
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: t("emailAlreadyRegistered") },
        { status: 409 },
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate salt if encryption is enabled
    const encryptionSalt = isEncrypted
      ? crypto.randomBytes(16).toString("base64")
      : null;

    // Create the admin user
    const admin = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        isEncrypted: !!isEncrypted,
        encryptionSalt,
      },
    });

    // Return success (without password)
    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Failed to register admin:", error);

    // Get translations for error (using the locale we captured or default)
    const t = await getTranslations({
      locale,
      namespace: "adminRegistration",
    });

    return NextResponse.json(
      { error: t("registrationError") },
      { status: 500 },
    );
  }
}
