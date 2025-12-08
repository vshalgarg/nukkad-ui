import React, { useState, useEffect } from 'react';
import StorekeeperService from '../../services/StorekeeperService';
import { toast } from 'react-toastify';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

const StorekeeperTable = () => {
  const [storekeepers, setStorekeepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStorekeeper, setSelectedStorekeeper] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchStorekeepers();
  }, []);

  const fetchStorekeepers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await StorekeeperService.getAllStorekeepers();

      if (Array.isArray(data)) {
        setStorekeepers(data);
      } else if (data.storekeepers && Array.isArray(data.storekeepers)) {
        setStorekeepers(data.storekeepers);
      } else if (data.data && Array.isArray(data.data)) {
        setStorekeepers(data.data);
      } else {
        setStorekeepers([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load storekeepers');
      toast.error(err.message || 'Failed to load storekeepers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (storekeeperId) => {
    try {
      const storekeeper = await StorekeeperService.getStorekeeperById(storekeeperId);
      console.log("storekeeper" + storekeeper)
      setSelectedStorekeeper(storekeeper);
      setShowProfileModal(true);
    } catch (err) {
      toast.error(err.message || 'Failed to load profile');
    }
  };

  const handleDeleteStorekeeper = async (storekeeperId) => {
    if (!window.confirm('Are you sure you want to delete this storekeeper?')) return;

    try {
      await StorekeeperService.deleteStorekeeper(storekeeperId);
      setStorekeepers(prev => prev.filter(s => s.id !== storekeeperId));
      toast.success('Storekeeper deleted!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStorekeeper(null);
  };

  return (
    <div className="ml-64 pt-20 px-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/*Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-green-200 overflow-hidden">

          {/*Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Storekeepers</h1>
                <p className="text-green-100 text-base">Manage all storekeepers</p>
              </div>
            </div>
          </div>

          {/* Sticky Header*/}
          <div className="bg-green-50 border-b border-green-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-green-800">
              <div className="col-span-2 flex justify-center">ID</div>
              <div className="col-span-6 flex justify-center">Store Name</div>
              <div className="col-span-4 flex justify-center">Actions</div>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading storekeepers...</p>
              </div>
            ) : storekeepers.length === 0 ? (
              <div className="p-20 text-center text-gray-600">
                <p className="text-2xl font-bold">No storekeepers found</p>
                <p className="mt-2">Your storekeeper list is empty</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {storekeepers.map((sk) => (
                  <div key={sk.id} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-green-50 transition">
                    <div className="col-span-2 text-gray-700 font-medium flex items-center justify-center">{sk.id}</div>
                    <div className="col-span-6 text-gray-800 font-medium flex items-center justify-center">
                      {sk.storeName || '—'}
                    </div>
                    <div className="col-span-4 flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleViewProfile(sk.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition text-green-600 hover:text-green-700"
                        title="View Profile"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStorekeeper(sk.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 hover:text-red-700"
                        title="Delete Storekeeper"
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
{showProfileModal && selectedStorekeeper && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-green-200 flex flex-col">
      
      {/*Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{selectedStorekeeper.name}</h2>
            <p className="text-green-100 text-sm mt-1">
              {selectedStorekeeper.storeName} • QR: {selectedStorekeeper.storeQrId || '—'}
            </p>
          </div>
          <button 
            onClick={closeProfileModal} 
            className="text-white hover:bg-white/20 p-2 rounded-lg transition text-xl"
          >
            ×
          </button>
        </div>
      </div>

      
      <div className="p-6 flex-1 overflow-y-auto space-y-4">
        
        {/* Store Info - 2x2 grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Store Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wider">Store Name</p>
              <p className="font-medium text-gray-900 text-sm">{selectedStorekeeper.storeName}</p>
            </div>
            {selectedStorekeeper.gstNum && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wider">GST</p>
                <p className="font-mono text-sm">{selectedStorekeeper.gstNum}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact - Compact */}
        {(selectedStorekeeper.mobileNumber || selectedStorekeeper.contactNumber) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedStorekeeper.mobileNumber && (
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                  <p className="text-xs text-gray-600">Mobile</p>
                  <p className="font-medium text-sm">{selectedStorekeeper.mobileNumber}</p>
                </div>
              )}
              {selectedStorekeeper.contactNumber && (
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                  <p className="text-xs text-gray-600">Contact</p>
                  <p className="font-medium text-sm">{selectedStorekeeper.contactNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address*/}
        {(selectedStorekeeper.addressLine1 || selectedStorekeeper.city) && (
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Address</h3>
            <div className="space-y-1 text-sm">
              {selectedStorekeeper.addressLine1 && <p>{selectedStorekeeper.addressLine1}</p>}
              {selectedStorekeeper.addressLine2 && <p>{selectedStorekeeper.addressLine2}</p>}
              <div className="flex flex-wrap gap-3 text-xs mt-2">
                {selectedStorekeeper.city && <span className="px-2 py-1 bg-white rounded-full text-gray-700">City: {selectedStorekeeper.city}</span>}
                {selectedStorekeeper.state && <span className="px-2 py-1 bg-white rounded-full text-gray-700">State: {selectedStorekeeper.state}</span>}
                {selectedStorekeeper.pincode && <span className="px-2 py-1 bg-white rounded-full text-gray-700">Pin: {selectedStorekeeper.pincode}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Footer */}
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

export default StorekeeperTable;