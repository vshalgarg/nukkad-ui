import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Header = ({ onToggleSidebar }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header
  className="
    fixed top-0 left-0 right-0 z-50
    bg-teal-700
    text-white shadow-sm
  "
>
  <div className="h-14 sm:h-16 flex items-center px-3 sm:px-8 gap-2">

    {/* LEFT */}
    <div className="flex items-center gap-2 min-w-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md hover:bg-white/20 lg:hidden"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* MOBILE = short name */}
      <h1 className="font-bold truncate text-base sm:text-xl">
        <span className="sm:hidden">Nukkad Admin</span>
        <span className="hidden sm:inline">Nukkad Admin Panel</span>
      </h1>
    </div>

    {/* RIGHT */}
    <button
      onClick={() => {
        logout();
        navigate('/login');
      }}
      className="
        ml-auto
       bg-rose-500 hover:bg-rose-600
        px-3 sm:px-4
        py-1.5
        rounded-full
        text-xs sm:text-sm
        font-semibold
        shadow
      "
    >
      Logout
    </button>

  </div>
</header>

  );
};


export default Header;
