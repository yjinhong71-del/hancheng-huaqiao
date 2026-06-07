import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';

export async function POST() {
  const s = await getUserSession();
  s.destroy();
  return NextResponse.json({ success: true });
}
