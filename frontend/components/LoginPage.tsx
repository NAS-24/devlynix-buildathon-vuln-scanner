'use client';
import React, { useState } from 'react';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple check for your hackathon demo
    if (username === 'admin' && password === 'devlynix2026') {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user_id', username); 
    onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#111] p-8 rounded-lg border border-[#222]">
        <h2 className="text-white font-black text-xl mb-6">LOGIN</h2>
        <input 
          type="text" placeholder="Username" className="w-full bg-[#1a1a1a] p-3 rounded mb-4 text-white"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          type="password" placeholder="Password" className="w-full bg-[#1a1a1a] p-3 rounded mb-6 text-white"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-recon-critRed text-[10px] mb-4">Invalid credentials.</p>}
        <button type="submit" className="w-full bg-recon-accentGreen text-black font-black py-3 rounded uppercase">
          Enter System
        </button>
      </form>
    </div>
  );
}