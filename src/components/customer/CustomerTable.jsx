import React, { useState, useEffect } from 'react';
import CustomerService from '../../services/CustomerService';
import { toast } from 'react-toastify';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

const CustomerTable = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await CustomerService.getAllCustomers();

      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      } else if (data.data && Array.isArray(data.data)) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customers');
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (customerId) => {
    try {
      const customer = await CustomerService.getCustomerById(customerId);
      setSelectedCustomer(customer);
      setShowProfileModal(true);
    } catch (err) {
      toast.error(err.message || 'Failed to load profile');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await CustomerService.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      toast.success('Customer deleted!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="ml-64 pt-20 px-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Premium Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-green-200 overflow-hidden">

          {/* Green Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Customers</h1>
                <p className="text-green-100 text-base">View and manage all customers</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-b border-green-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-green-800">
              <div className="col-span-2 flex justify-center">ID</div>
              <div className="col-span-6 flex justify-center">Name</div>
              <div className="col-span-4 flex justify-center">Actions</div>
            </div>
          </div>


          {/* Scrollable Body */}
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-20 text-center text-gray-600">
                <p className="text-2xl font-bold">No customers found</p>
                <p className="mt-2">Your customer list is empty</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <div key={customer.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-green-50 transition">
                    <div className="col-span-2 text-gray-700 font-medium flex items-center justify-center">{customer.id}</div>
                    <div className="col-span-6 text-gray-800 font-medium flex items-center justify-center">
                      {customer.name}
                      {customer.email && <span className="ml-3 text-xs text-gray-500">({customer.email})</span>}
                    </div>
                    <div className="col-span-4 flex items-center justify-center">
                      <button
                        onClick={() => handleViewProfile(customer.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition text-green-600 hover:text-green-700"
                        title="View Profile"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 hover:text-red-700 ml-4"
                        title="Delete Customer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/*Profile Modal */}
      {showProfileModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-green-200 flex flex-col">

            {/*Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                  <p className="text-green-100 text-sm mt-1">ID: #{selectedCustomer.id}</p>
                </div>
                <button
                  onClick={closeProfileModal}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/*Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">

              {/* Personal*/}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Profile</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wider">Full Name</p>
                    <p className="font-medium text-gray-900 text-sm">{selectedCustomer.name}</p>
                  </div>
                  {selectedCustomer.email && (
                    <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Email</p>
                      <p className="font-medium text-sm">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {selectedCustomer.mobileNumber && (
                    <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                      <p className="text-xs text-gray-600 uppercase tracking-wider">Mobile</p>
                      <p className="font-medium text-sm">{selectedCustomer.mobileNumber}</p>
                    </div>
                  )}
                  {selectedCustomer.dob && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 uppercase tracking-wider">DOB</p>
                      <p className="font-medium text-sm">{selectedCustomer.dob}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address if exists */}
              {selectedCustomer.address && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 text-sm">Address</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedCustomer.address}</p>
                </div>
              )}
            </div>

            {/*Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t flex justify-end">
              <button
                onClick={closeProfileModal}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerTable;