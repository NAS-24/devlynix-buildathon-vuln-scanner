'use client';
import React from 'react';

export default function LogoutButton() {
  const handleLogout = () => {
    // Clear the authentication state
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user_id');
    
    // Refresh the page to trigger the Login flow
    window.location.reload();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-recon-critRed transition-colors"
    >
      Log Out
    </button>
  );
}