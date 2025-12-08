import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CategoriesTable from '../components/categories/CategoriesTable';
import ProductsTable from '../components/products/ProductsTable';
import CustomerTable from '../components/customer/CustomerTable';
import StorekeeperTable from '../components/storekeeper/StorekeeperTable';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState(localStorage.getItem("activeSection") || "categories");

  useEffect(() => {
    localStorage.setItem("activeSection", activeSection);
  }, [activeSection]);

  const renderSection = () => {
    switch (activeSection) {
      case 'categories': return <CategoriesTable />;
      case 'products': return <ProductsTable />;
      case 'customers': return <CustomerTable />;
      case 'storekeepers': return <StorekeeperTable />;
      default: return <CategoriesTable />;
    }
  };

  return (
    <>
      <Header />
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      {renderSection()}
    </>
  );
};

export default Dashboard;