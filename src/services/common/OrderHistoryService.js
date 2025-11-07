import api from '../api';

export const fetchOrderHistory = async (token, options = {}) => {
  console.log('Fetching Order History...');

  const {
    page = 0,
    size = 10,
    status,
    startDate,
    endDate,
    minPrice,
    maxPrice,
  } = options;

  const queryParams = [];

  queryParams.push(`page=${page}`);
  queryParams.push(`size=${size}`);

  if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
  if (startDate) queryParams.push(`startDate=${startDate}`);
  if (endDate) queryParams.push(`endDate=${endDate}`);
  if (minPrice) queryParams.push(`minPrice=${minPrice}`);
  if ((status === 'DISPATCHED' || status === 'DELIVERED') && maxPrice)
    queryParams.push(`maxPrice=${maxPrice}`);

  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

  try {
    const response = await api.get(
      `/nukkad/api/orders/v1/order/history${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('Order History Success:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    console.error('Order History Error:', {
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
