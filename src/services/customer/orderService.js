import api from '../api';

export const placeOrder = async (orderData, token) => {
  try {
    console.log('📝 Order placed by customer request', orderData);

    const res = await api.post('/nukkad/api/orders/v1/placeOrder', orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Order Api response', res.data);
    return res.data;
  } catch (err) {
    console.error('❌ Order Error Full:', {
      message: err.message,
      status: err.response?.status,
      headers: err.response?.headers,
      data: err.response?.data,
    });
    throw new Error(
      err.response?.data?.error ||
        err.response?.data?.message ||
        `Request failed with status ${err.response?.status}`,
    );
  }
};
