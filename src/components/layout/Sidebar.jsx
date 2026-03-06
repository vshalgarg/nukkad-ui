import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ activeSection, setActiveSection, isOpen, onClose }) => {
  const menu = [
    { key: 'categories', label: 'Categories' },
    { key: 'products', label: 'Products' },
    { key: 'customers', label: 'Customers' },
    { key: 'storekeepers', label: 'Storekeepers' },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
    fixed top-16 left-0 bottom-0 w-64
    bg-white
    border-r border-slate-200
    shadow-sm
    z-50
    transition-transform duration-300
    -translate-x-full
    lg:translate-x-0
    ${isOpen ? 'translate-x-0' : ''}
  `}
      >
        <div className="px-6 py-6">
          <nav className="space-y-2">
            {menu.map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveSection(item.key);
                  onClose();
                }}
                className={`
                  w-full text-left px-5 py-3 rounded-xl font-medium text-base
                  transition-all duration-200
                  ${activeSection === item.key
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-teal-700'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};


export default Sidebar;
