import api from '../api';
export const getOrderHistory = async token => {
  console.log('📥 Fetching Customer Order History...');

  try {
    const response = await api.get('/nukkad/api/orders/v1/order/history', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Order History API Success:', {
      status: response.status,
      data: response.data,
    });
    
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    console.log('responseCode', message);
    console.error('❌ Order History API Error:', {
      message: error.message,
      status,
      data: error.response?.data,
    });

    if (status === 400 && message === 'Order Not Found') {
      return [{"fromError":5}];
    }
    throw new Error(message || 'Failed to fetch order history');
  }
};
