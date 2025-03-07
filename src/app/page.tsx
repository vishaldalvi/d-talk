'use client';

import Login from '@/app/pages/Login';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const user = localStorage.getItem('user');

  if (!user) {
    return (
      <Login />
    );
  } else {
    router.push('/chat')
  }
}
