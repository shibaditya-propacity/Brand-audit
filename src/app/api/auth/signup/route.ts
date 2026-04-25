import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { signToken, COOKIE, TTL } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const token = await signToken({ userId: String(user._id), email: user.email, name: user.name });

    const res = NextResponse.json({ success: true, user: { name: user.name, email: user.email } });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   TTL,
      path:     '/',
    });
    return res;
  } catch (err) {
    console.error('signup error', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
