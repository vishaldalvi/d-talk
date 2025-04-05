'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Loading from '@/app/loading';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('authToken');

    if (token) {
      router.replace('/chat');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return <Loading />;
}
