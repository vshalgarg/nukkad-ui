import api from '../api';

export const updateOrderStatusById = async (orderId, payload, token) => {
  console.log('🔁 Update Order Status API');

  try {
    const response = await api.patch(
      `nukkad/api/orders/v1/order/updateByStatus/${orderId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('✅ Order Status Update Success:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Order Status Update Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to update order status',
    );
  }
};
