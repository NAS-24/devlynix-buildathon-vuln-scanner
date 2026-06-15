'use client';
import React, { useState, useCallback } from 'react';

// Optimized memoized input to prevent re-render cascades
const MemoizedInput = React.memo(({ value, onChange, placeholder, type = "text" }: any) => (
  <input 
    type={type} 
    value={value}
    onChange={onChange}
    className="w-full bg-black border border-[#333333] text-white text-sm px-4 py-3 rounded focus:outline-none focus:border-white transition-colors placeholder-gray-700 will-change-transform"
    placeholder={placeholder}
    required
  />
));

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize handlers to keep input performance snappy
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value), []);
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'devlynix2026') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user_id', username); 
        onLogin();
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row font-sans text-white">
      
      {/* LEFT PANEL: Branding */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 border-b md:border-b-0 md:border-r border-[#222222] bg-[#0a0a0a]">
        <div className="max-w-xl">
          <div className="inline-block px-3 py-1 mb-6 border border-[#222222] bg-[#111111] rounded-full">
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-mono font-bold">System Online // V1.0</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">RECON.</h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            An automated, agentic vulnerability scanner designed to map attack surfaces, detect critical misconfigurations, and deliver actionable remediation workflows.
          </p>
          <div className="flex flex-col gap-4 font-mono text-xs text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>Dynamic Injection Assessment</div>
            <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>OSV.dev Dependency Audits</div>
            <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>Security Header Analysis</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Interface */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#050505]">
        <div className="w-full max-w-md p-8 rounded-xl bg-[#111111] border border-[#222222] shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-2">Initialize Session</h2>
          <p className="text-gray-500 text-xs mb-6">Enter your security credentials to access the console.</p>

          <div className="mb-6 p-4 bg-[#141414] border border-[#333333] rounded-lg flex items-center justify-between group hover:border-[#555555] transition-colors">
            <div className="font-mono text-[10px] text-gray-400">
              <span className="text-emerald-500 font-bold mr-2">DEMO MODE:</span> admin / devlynix2026
            </div>
            <button 
              type="button"
              onClick={() => { setUsername('admin'); setPassword('devlynix2026'); }}
              className="text-[9px] font-black uppercase bg-[#222222] hover:bg-white hover:text-black text-white px-3 py-1.5 rounded transition-all"
            >
              Auto-Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Username</label>
              <MemoizedInput value={username} onChange={handleUsernameChange} placeholder="Enter operator username" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <MemoizedInput type="password" value={password} onChange={handlePasswordChange} placeholder="••••••••" />
            </div>

            {error && (
              <div className="p-3 bg-red-900/10 border border-red-900/40 rounded text-red-500 text-xs font-mono">
                ⚠️ Invalid operator credentials.
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-4 w-full bg-white text-black font-black text-xs uppercase tracking-widest py-4 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}