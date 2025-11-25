/* eslint-disable @typescript-eslint/no-explicit-any */
import db from "@/lib/db";
// import { Subject } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
// app/api/centers/route.ts

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name,
      address,
      phone,
      classrooms = [],
      workingDays = [],
      managers = [],
      adminId, // required: this must be a valid User.id (ObjectId as string)
    } = body

    if (!name || !adminId) {
      return NextResponse.json(
        { error: 'name and adminId are required' },
        { status: 400 },
      )
    }

    const center = await db.center.create({
      data: {
        name,
        address,
        phone,
        classrooms,
        workingDays,
        managers,
        adminId,
      },
    })

    return NextResponse.json(center, { status: 201 })
  } catch (error) {
    console.error('[CENTERS_POST]', error)
    return NextResponse.json(
      { error: 'Failed to create center' },
      { status: 500 },
    )
  }
}
// export async function POST(req: NextRequest) {
//   try {

//     const body = await req.json();
//     const { id, name, address, phone, classrooms, workingDays, subjects, adminId } = body;

//     console.log("Data received:", {
//       name, address, phone, classrooms, workingDays, subjects, adminId
//     });

//     // Validation
//     if (!name || !Array.isArray(classrooms) || !Array.isArray(workingDays)) {
//       return NextResponse.json({ 
//         error: "Missing or invalid fields. Name is required, classrooms and workingDays must be arrays" 
//       }, { status: 400 });
//     }

//     // Additional validation for subjects
//     if (subjects && !Array.isArray(subjects)) {
//       return NextResponse.json({ 
//         error: "Subjects must be an array" 
//       }, { status: 400 });
//     }

//     const center = await db.center.create({
//       data: {
//         id,
//         name,
//         address: address || null,
//         phone: phone || null,
//         classrooms,
//         workingDays,
//         adminId, 
//         subjects: {
//           create: subjects?.map((subject: any) => ({
//             name: subject.name,
//             grade: subject.grade,
//             price: subject.price,
//             duration: subject.duration || null,
//           })) || []
//         }
//       },
//       include: {
//         subjects: true
//       }
//     });    

//     return NextResponse.json(center, { status: 201 });
//   } catch (error) {
//     console.error("[CENTER_POST]", error);
//     console.log("-------------------------------------------", error);
//     return NextResponse.json({ 
//       error: error,
//       details: process.env.NODE_ENV === 'development' ? error : undefined
//     }, { status: 500 });
//   }
// }

export async function GET(req: NextRequest) {
  try {
    const body = await req.json();

    const { adminId } = body;
    const center = await db.center.findMany({
      where: { adminId},
      include: { subjects: true }
    });

    return NextResponse.json(center, { status: 201 });
  } catch (error) {
    console.error("[CENTER_GET]", error);
    return NextResponse.json({ 
      error: "Failed to get center data",
      details:  error
    }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
  try {

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
  } catch (error) {
    console.log(error);
    
    return NextResponse.json(
      { error: 'Failed to update center' },
      { status: 500 }
    )
  }
}
