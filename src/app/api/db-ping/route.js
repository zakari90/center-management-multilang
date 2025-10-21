import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const client = await connectToDatabase();
    const result = await client.db().admin().ping();
    
    return NextResponse.json({
      success: true,
      message: '✓ MongoDB connected successfully',
      ping: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}