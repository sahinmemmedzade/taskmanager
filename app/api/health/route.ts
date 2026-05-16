import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'disconnected';

  try {
    await connectDB();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: `${Date.now() - start}ms`,
    database: dbStatus,
    environment: process.env.NODE_ENV,
  });
}
