import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Header = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r bg-[#00ba59] text-white shadow-lg z-50 flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold tracking-wide">Nukkad's Admin Panel</h1>
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="text-blue bg-red-700 hover:bg-red-900 px-2 py-1 rounded-full font-semibold transition shadow-md"
      >
        Logout
      </button>
    </header>
  );
};

export default Header;