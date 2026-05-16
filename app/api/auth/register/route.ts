import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Ad, email və şifrə tələb olunur' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifrə ən az 6 simvol olmalıdır' }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Email formatı düzgün deyil' }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Bu email artıq istifadə olunur' }, { status: 409 });
    }

    const user = await User.create({ name, email, password });
    const token = signToken({ userId: user._id.toString(), email: user.email });

    return NextResponse.json(
      { token, user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server xətası baş verdi' }, { status: 500 });
  }
}
