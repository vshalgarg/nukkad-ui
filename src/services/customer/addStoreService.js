import api from '../api';

//Get store by Id
export const getStoreById = async storekeeperId => {
  console.log('Get Store to Customer with storeQrId:', storekeeperId);
  try {
    const response = await api.get(
      `/nukkad/api/customer/v1/get/store/by/store/qr/id?storeQrId=${storekeeperId}`,
    );

    console.log('Get Store API Success:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error(' get Store API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      storekeeperId,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to add store to customer',
    );
  }
};

// Add Store to Customer
export const addCustomerStore = async storekeeperId => {
  console.log('Adding Store to Customer with storeQrId:', storekeeperId);

  try {
    const response = await api.post(
      `/nukkad/api/customer/v1/add/store?storeQrId=${storekeeperId}`,
    );

    console.log('Add Store API Success:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error(' Add Store API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      storekeeperId,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to add store to customer',
    );
  }
};
// Set default store for customer
export const setDefaultStore = async storekeeperId => {
  console.log('Setting Default Store for Customer with storekeeperId:', storekeeperId);

  try {
    const response = await api.post(
      `/nukkad/api/customer/v1/set/default/store/${storekeeperId}`,
    );

    console.log('Set Default Store API Success:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Set Default Store API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      storekeeperId,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to set default store',
    );
  }
};

// Get default store for customer
export const getDefaultStore = async () => {
  console.log('Fetching Default Store for Customer');

  try {
    const response = await api.get(
      `/nukkad/api/customer/v1/get/default/store`,
    );

    console.log('Get Default Store API Success:', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Get Default Store API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to fetch default store',
    );
  }
};
