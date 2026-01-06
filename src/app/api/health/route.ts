import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Health check endpoint to keep Supabase active
 * This endpoint performs a simple query to prevent Supabase from going to sleep
 * UptimeRobot can ping this endpoint every 5 minutes
 */
export async function GET() {
  try {
    // Perform a simple query to keep Supabase active
    // Using a lightweight query that doesn't return much data
    const { data, error } = await supabase
      .from('toilets')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase health check error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          error: error.message 
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase is active',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
