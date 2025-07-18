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
      token: token,
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
      return [{ fromError: 5 }];
    }
    throw new Error(message || 'Failed to fetch order history');
  }
};

export const getFilteredOrderHistory = async (  token,  { status, startDate, endDate, minPrice, maxPrice }) => {
  console.log('📥 Fetching Filtered Customer Order History...');

  const queryParams = [];

  if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
  if (startDate) queryParams.push(`startDate=${startDate}`);
  if (endDate) queryParams.push(`endDate=${endDate}`);
  if (minPrice) queryParams.push(`minPrice=${minPrice}`);
  if ((status==="DISPATCHED"||status==="DELIVERED")&&maxPrice) queryParams.push(`maxPrice=${maxPrice}`);

  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

  console.log('queryString', queryString);
  try {
    const response = await api.get(
      `/nukkad/api/orders/v1/order/history${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('✅ Filtered Order History API Success:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    console.error('❌ Filtered Order History API Error:', {
      message: error.message,
      status,
      data: error.response?.data,
    });

    if (status === 400 && message === 'Order Not Found') {
      return [{ fromError: 5 }];
    }

    throw new Error(message || 'Failed to fetch filtered order history');
  }
};

