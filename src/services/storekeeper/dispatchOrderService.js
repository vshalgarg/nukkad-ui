import api from '../api';

export const dispatchOrder = async (payload, token) => {
    console.log("Dispatch ORder API")
  try {
    const response = await api.post(
      'nukkad/api/orders/v1/order/dispatchOrder',payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log('✅ Order Dispatch API Success:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Order Dispatch API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to dispatch order',
    );
  }
};