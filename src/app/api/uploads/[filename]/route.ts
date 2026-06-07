import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'node:fs/promises';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!filename || filename.includes('..')) return new NextResponse(null, { status: 404 });
  const dir = process.env.DATA_DIR || '/tmp/data';
  const fp = path.join(dir, 'uploads', filename);
  try {
    const buf = await readFile(fp);
    const ext = filename.split('.').pop()?.toLowerCase();
    const ct: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
    return new NextResponse(buf, { headers: { 'Content-Type': ct[ext || ''] || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000' } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
