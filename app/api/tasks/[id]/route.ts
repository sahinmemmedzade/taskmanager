import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import Task from '@/models/Task';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const task = await Task.findOne({ _id: id, userId: user.userId });
    if (!task) return NextResponse.json({ error: 'Task tapılmadı' }, { status: 404 });

    const allowed = ['title', 'description', 'status', 'priority', 'dueDate'];
    for (const key of allowed) {
      if (key in body) {
         
        (task as any)[key] = body[key];
      }
    }

    await task.save();
    return NextResponse.json({ task });
  } catch (err) {
    console.error('Update task error:', err);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });

  try {
    await connectDB();
    const { id } = await params;
    const task = await Task.findOneAndDelete({ _id: id, userId: user.userId });
    if (!task) return NextResponse.json({ error: 'Task tapılmadı' }, { status: 404 });
    return NextResponse.json({ message: 'Task silindi' });
  } catch (err) {
    console.error('Delete task error:', err);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}
