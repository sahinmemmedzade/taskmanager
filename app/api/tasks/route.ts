import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Task from '@/models/Task';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

     
    const query: any = { userId: user.userId };
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });

  try {
    await connectDB();
    const { title, description, priority, dueDate } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Başlıq tələb olunur' }, { status: 400 });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim(),
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: user.userId,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('Create task error:', err);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}
