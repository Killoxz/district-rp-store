import { NextResponse } from 'next/server';
import { getErlcServerStatus } from '@/lib/erlc';

export async function GET() {
  const status = await getErlcServerStatus();
  return NextResponse.json(status);
}
