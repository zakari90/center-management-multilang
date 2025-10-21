/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/authentication";

export async function POST(req: NextRequest) {
  try {
    const session : any= await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, address, phone, classrooms, workingDays, subjects } = body;

    console.log("Data received:", {
      name, address, phone, classrooms, workingDays, subjects 
    });

    // Validation
    if (!name || !Array.isArray(classrooms) || !Array.isArray(workingDays)) {
      return NextResponse.json({ 
        error: "Missing or invalid fields. Name is required, classrooms and workingDays must be arrays" 
      }, { status: 400 });
    }

    // Additional validation for subjects
    if (subjects && !Array.isArray(subjects)) {
      return NextResponse.json({ 
        error: "Subjects must be an array" 
      }, { status: 400 });
    }

    const center = await db.center.create({
      data: {
        name,
        address: address || null,
        phone: phone || null,
        classrooms,
        workingDays,
        adminId: session.user.id, // ✅ Use session.user.id instead of adminId from body
        subjects: {
          create: subjects?.map((subject: any) => ({
            name: subject.name,
            grade: subject.grade,
            price: subject.price,
            duration: subject.duration || null,
          })) || []
        }
      },
      include: {
        subjects: true
      }
    });    

    return NextResponse.json(center, { status: 201 });
  } catch (error) {
    console.error("[CENTER_POST]", error);
    return NextResponse.json({ 
      error: "Failed to create center",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session :any = await getSession();

    if (!session || session.user.role in [ "ADMIN" ,"MANAGER"]) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const center = await db.center.findMany({
      where: { adminId: session.user.id },
      include: { subjects: true }
    });

    return NextResponse.json(center, { status: 201 });
  } catch (error) {
    console.error("[CENTER_GET]", error);
    return NextResponse.json({ 
      error: "Failed to get center data",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  try {
    const session :any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json()
    const { centerId, name, address, phone, classrooms, workingDays } = body

    if (!centerId) {
      return NextResponse.json(
        { error: 'Center ID is required' },
        { status: 400 }
      )
    }

    const center = await db.center.update({
      where: { id: centerId },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(classrooms && { classrooms }),
        ...(workingDays && { workingDays })
      }
    })

    return NextResponse.json(center)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update center' },
      { status: 500 }
    )
  }
}
