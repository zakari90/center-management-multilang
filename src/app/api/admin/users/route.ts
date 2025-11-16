/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/users/route.ts
import { getSession } from '@/lib/authentication';
import db from '@/lib/db';
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session : any = await getSession()
    
    // Check if user is authenticated and is an ADMIN
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }


    const users = await db.user.findMany({
      where: { role: "MANAGER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password:true,
        createdAt: true,
        _count: {
          select: {
            administeredCenters: true,
            managedStudents: true,
            managedTeachers: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match component interface
    const transformedUsers = users.map((user:any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password,
      createdAt: user.createdAt.toISOString(),
      stats: {
        centers: user._count.administeredCenters,
        students: user._count.managedStudents,
        teachers: user._count.managedTeachers,
      }
    }))

    return NextResponse.json(transformedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    )
  }
}

const adminUsername = "admin";
const adminPassword = "admin";
const adminEmail = "admin@admin.com";

// This function assumes req is a POST request with JSON containing email and password
export async function POST(req: NextRequest) {
  console.log("POST request received ---------------------------------------------");
  
  try {
    const body = await req.json();
    const { email, password, id } = body;
console.log("Body received ---------------------------------------------", body);
console.log("Email received ---------------------------------------------", email);
console.log("Password received ---------------------------------------------", password);
console.log("Id received ---------------------------------------------", id);

    // Validate required fields
    if (!email || !password || !id) {
      return NextResponse.json(
        { error: { message: "Email, password, and id are required." } },
        { status: 400 }
      );
    }

    // Check for user by email
    let user = await db.user.findUnique({ where: { email } });

    if (user) {
      // User exists, verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json({
          error: { message: "Invalid password." }
        }, { status: 401 });
      }

      // Password is valid, return user!
      return NextResponse.json({
        message: "User exists.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }, { status: 200 });
    }

    // If not, check for admin credentials
   try {
    if (email === adminEmail && password === adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      user = await db.user.create({
        data: {
          id,
          email: adminEmail,
          password: hashedPassword,
          name: adminUsername,
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        message: "Admin user created.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }, { status: 201 });
    }
   } catch (error: any) {
    console.log("Error creating admin user::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::", error);
    
    // Check if it's a MongoDB replica set error
    if (error?.code === 'P2031' || error?.message?.includes('replica set')) {
      return NextResponse.json({
        error: { 
          message: "MongoDB replica set is required. Please run: mongosh --eval \"rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })\"",
          code: "REPLICA_SET_REQUIRED"
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      error: { message: "Internal server error" }
    }, { status: 500 });
   }


    // No user found, and not admin creation case
    return NextResponse.json({
      error: { message: "User not found." }
    }, { status: 404 });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
