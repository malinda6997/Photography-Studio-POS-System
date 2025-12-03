'use client';
import { useEffect } from 'react';
import { useAuth } from './components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading

    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>
  );
}

