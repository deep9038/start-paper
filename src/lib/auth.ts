import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return session.user;
}

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return session.user;
}

export function isAdmin(role?: string) {
  return role === 'admin';
}
