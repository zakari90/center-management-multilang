import { NextResponse } from 'next/server';
import db from "@/lib/db";

export async function GET() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test the connection
    const result = await db.$queryRaw`db.adminCommand({ ping: 1 })`;
    
    console.log('✅ Database connection successful');
    console.log(result);
    
    return NextResponse.json({
      success: true,
      message: '✓ Connected to MongoDB successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}