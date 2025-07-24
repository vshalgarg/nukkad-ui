import api from '../api';

export const getOrders = async token => {
  const endpoint = '/nukkad/api/orders/v1/order/orderByStoreKeeper';
  const fullUrl = api.defaults.baseURL
    ? `${api.defaults.baseURL}${endpoint}`
    : endpoint;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  console.log('📦 [getOrders] API Request');
  console.log('➡️ Method: GET');
  console.log('➡️ URL:', fullUrl);
  console.log('➡️ Headers:', headers);

  try {
    const response = await api.get(endpoint, {
      headers,
    });

    console.log('✅ [getOrders] Success Response');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

    return response.data;
  } catch (error) {
    console.error('❌ [getOrders] Error Response');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }

    throw new Error(error.response?.data?.message || 'Failed to get orders');
  }
};
