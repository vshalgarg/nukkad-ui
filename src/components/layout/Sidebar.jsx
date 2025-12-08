import React from 'react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menu = [
    { key: 'categories', label: 'Categories' },
    { key: 'products', label: 'Products' },
    { key: 'customers', label: 'Customers' },
    { key: 'storekeepers', label: 'Storekeepers' }
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg z-50">
      <div className="pt-16 pb-6 px-6">

        <nav className="space-y-2">
          {menu.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full text-left px-5 py-3.5 rounded-xl font-medium text-base transition-all duration-200 flex items-center gap-3
                ${activeSection === item.key
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
            >
              {/* Active Indicator */}
              {activeSection === item.key && (
                <div className="w-1 h-8 bg-white rounded-r-full absolute left-0"></div>
              )}
              
              <span className={`inline-block w-2 h-2 rounded-full transition-all
                ${activeSection === item.key ? 'bg-white' : 'bg-green-500 opacity-0 group-hover:opacity-100'}`}
              ></span>
              
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;