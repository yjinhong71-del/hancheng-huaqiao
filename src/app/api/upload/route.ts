import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { mkdir, writeFile } from 'node:fs/promises';

function getS3Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: 'auto', endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

export async function POST(request: NextRequest) {
  const s3 = getS3Client();
  if (!s3) return handleLocalUpload(request);
  return handleR2Upload(request, s3);
}

async function handleR2Upload(request: NextRequest, s3: S3Client) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '没有文件' }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `uploads/${uuid()}.${ext}`;
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicUrl = process.env.R2_PUBLIC_URL!;
    await s3.send(new PutObjectCommand({
      Bucket: bucket, Key: key, Body: buffer,
      ContentType: file.type || 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    }));
    return NextResponse.json({ url: `${publicUrl}/${key}` });
  } catch (err: any) {
    console.error('R2 upload error:', err);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

async function handleLocalUpload(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '没有文件' }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuid()}.${ext}`;
    const dataDir = process.env.DATA_DIR || '/tmp/data';
    const uploadDir = path.join(dataDir, 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (err: any) {
    console.error('Local upload error:', err);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
