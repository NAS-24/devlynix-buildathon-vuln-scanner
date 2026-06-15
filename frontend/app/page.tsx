'use client';
import { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import BentoGrid from '@/components/BentoGrid';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user was already logged in
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return <BentoGrid />;
}