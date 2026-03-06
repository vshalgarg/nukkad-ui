import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CategoriesTable from '../components/categories/CategoriesTable';
import ProductsTable from '../components/products/ProductsTable';
import CustomerTable from '../components/customer/CustomerTable';
import StorekeeperTable from '../components/storekeeper/StorekeeperTable';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState(
    localStorage.getItem('activeSection') || 'categories'
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  const renderSection = () => {
    switch (activeSection) {
      case 'categories':
        return <CategoriesTable />;
      case 'products':
        return <ProductsTable />;
      case 'customers':
        return <CustomerTable />;
      case 'storekeepers':
        return <StorekeeperTable />;
      default:
        return <CategoriesTable />;
    }
  };

 return (
  <div className="min-h-screen w-full bg-slate-50
">
    <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

    <Sidebar
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
    />

    <main className="pt-14 sm:pt-16 h-full overflow-auto lg:ml-64">
      {renderSection()}
    </main>
  </div>
);

};

export default Dashboard;
