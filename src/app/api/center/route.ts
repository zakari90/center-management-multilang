import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
// import { Subject } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { CenterInputSchema } from "@/lib/validations/schemas";
// app/api/centers/route.ts

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = CenterInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, address, phone, classrooms, workingDays, managers } =
      result.data;

    // Extract non-validated fields that we still need from body (like adminId/id for logic, though adminId should ideally be from session)
    const { id, adminId } = body;

    // Additional check for adminId if it's required for creation logic (though in a real app this should probably come from session)
    if (!adminId) {
      return NextResponse.json(
        { error: "adminId are required" },
        { status: 400 },
      );
    }

    // ✅ Check if center exists (for update scenario)
    if (id) {
      const existingCenter = await db.center.findUnique({
        where: { id },
        include: { subjects: true },
      });

      if (existingCenter) {
        // ✅ Center exists - update it
        const updatedCenter = await db.center.update({
          where: { id },
          data: {
            name,
            address: address || null,
            phone: phone || null,
            classrooms,
            workingDays,
            managers,
            updatedAt: new Date(),
          },
          include: { subjects: true },
        });

        return NextResponse.json(updatedCenter, { status: 200 });
      }
    }

    // ✅ Center doesn't exist - create it
    const center = await db.center.create({
      data: {
        id: id || undefined, // Use provided ID or let MongoDB generate
        name,
        address,
        phone,
        classrooms,
        workingDays,
        managers,
        adminId,
      },
    });

    return NextResponse.json(center, { status: 201 });
  } catch (error: any) {
    // Handle duplicate key error (center already exists)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Center with this ID already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create center",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
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
    const session: any = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = session.user.id;
    const userRole = session.user.role;

    const centers = await db.center.findMany({
      where: {
        OR: [{ adminId: adminId }, { managers: { has: adminId } }],
      },
      include: { subjects: true },
    });

    return NextResponse.json(centers, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to get center data",
        message: error?.message || "Unknown error",
        code: error?.code || undefined,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { centerId } = body; // Only extract centerId from body initially due to collision with result.data

    if (!centerId) {
      return NextResponse.json(
        { error: "Center ID is required" },
        { status: 400 },
      );
    }

    // Validate update data
    const result = CenterInputSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, address, phone, classrooms, workingDays } = result.data;

    // Extract homepage content fields directly from body (not in schema yet)
    const {
      homeTitle,
      homeSubtitle,
      homeBadge,
      homeDescription,
      homeCtaText,
      homePhone,
      homeAddress,
      publicRegistrationEnabled,
    } = body;

    const center = await db.center.update({
      where: { id: centerId },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(classrooms && { classrooms }),
        ...(workingDays && { workingDays }),
        // Homepage content fields
        ...(homeTitle !== undefined && { homeTitle }),
        ...(homeSubtitle !== undefined && { homeSubtitle }),
        ...(homeBadge !== undefined && { homeBadge }),
        ...(homeDescription !== undefined && { homeDescription }),
        ...(homeCtaText !== undefined && { homeCtaText }),
        ...(homePhone !== undefined && { homePhone }),
        ...(homeAddress !== undefined && { homeAddress }),
        ...(publicRegistrationEnabled !== undefined && {
          publicRegistrationEnabled,
        }),
      },
    });

    return NextResponse.json(center);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update center" },
      { status: 500 },
    );
  }
}
