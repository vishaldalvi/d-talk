'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/app/pages/Login';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    setUser(storedUser);

    if (storedUser) {
      router.push('/chat');
    }
  }, [router]);

  if (!isClient) {
    return null;
  }

  return user ? null : <Login />;
}
