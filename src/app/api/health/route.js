
import { NextResponse } from 'next/server';
import db from "@/lib/db";

export async function GET() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Simple test - just try to find a user (won't error if collection is empty)
    await db.user.findFirst();
    
    console.log('✅ Database connection successful');
    
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