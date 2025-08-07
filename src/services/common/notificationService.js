import api from '../api';

export const changeNotificationStatus = async (token, status = 'OFF') => {
  console.log(' Sending request to change notification status');

  try {
    const response = await api.post(
      '/nukkad/api/notification/v1/set/status',
      {
        notificationStatus: status,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(' Notification Status Changed:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error(' Notification Status Change Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to change notification status',
    );
  }
};

export const getAllNotifications = async token => {
  console.log(' Fetching all user notifications');

  try {
    const response = await api.get(
      '/nukkad/api/notification/v1/get/notifications',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(' Notifications fetched:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('Fetch Notifications Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to fetch notifications',
    );
  }
};

export const clearAllNotifications = async token => {
  console.log(' Sending request to clear all notifications');

  try {
    const response = await api.delete(
      '/nukkad/api/notification/v1/delete/notifications',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(' Notifications cleared:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error(' Clear Notifications Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to clear notifications',
    );
  }
};
