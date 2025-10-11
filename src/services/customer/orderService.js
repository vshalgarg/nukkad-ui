import api from '../api';

export const placeOrder = async (orderData, token) => {
  try {
    console.log(' Order placed by customer request', orderData);

    const res = await api.post('/nukkad/api/orders/v1/placeOrder', orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(' Order Api response', res.data);
    return res.data;
  } catch (err) {
    const errorData = {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      stack: err.stack,
    };

    console.error(' Order Error Fail:', errorData.data);

    throw new Error(
      err.response?.data?.error ||
        err.response?.data?.message ||
        'Unhandled exception while placing order',
    );
  }
};
