/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session: any = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // All users (admin and manager) can see all receipts
    const receipts = await db.receipt.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      studentId,
      teacherId,
      amount,
      type,
      paymentMethod,
      description,
      date,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (type === "STUDENT_PAYMENT" && !studentId) {
      return NextResponse.json(
        { error: "Student ID required for student payment" },
        { status: 400 },
      );
    }

    if (type === "TEACHER_PAYMENT" && !teacherId) {
      return NextResponse.json(
        { error: "Teacher ID required for teacher payment" },
        { status: 400 },
      );
    }

    const receipt = await db.receipt.create({
      data: {
        id: id || undefined,
        receiptNumber: body.receiptNumber || `RCP-${Date.now()}`,
        amount: parseFloat(amount) || 0,
        type,
        paymentMethod: paymentMethod || null,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        studentId: studentId || null,
        teacherId: teacherId || null,
        managerId: session.user.id,
      },
      include: {
        student: true,
        teacher: true,
      },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Error creating receipt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
