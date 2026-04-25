import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { signToken, COOKIE, TTL } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

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
    console.error('signin error', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
