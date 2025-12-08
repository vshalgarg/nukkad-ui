import axios from 'axios';
import { API_URL, CLIENT_NAME, CLIENT_SECRET } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { showToast } from '../utils/toastUtils';

const api = axios.create({
  baseURL: API_URL ,
  headers: {
    clientName: CLIENT_NAME,
    clientSecret: CLIENT_SECRET,
    Accept: 'application/json', 
  },
});

//  Request Interceptor
api.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    showToast('error', 'No Internet Connection', 'Please check your network.');
    return Promise.reject(new Error('No Internet Connection'));
  }

  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(' API Request:', {
    method: config.method,
    url: `${config.baseURL}${config.url}`,
    headers: config.headers,
    data: config.data,
    params: config.params,
  });

  return config;
});

//  Response Interceptor
api.interceptors.response.use(
  response => {
    const { responseCode, message } = response.data;

    console.log(' API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });

    if (responseCode && responseCode !== 200) {
      showToast('error', 'Error', message || 'Something went wrong');
      return Promise.reject({
        code: responseCode,
        message: message,
        data: response.data,
      });
    }

    return response;
  },
  error => {
    console.error(' API Error:', {
      message: error.message,
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    if (error.message === 'No Internet Connection') {
      // already shown toast in request interceptor
    } else if (error.message.includes('Network Error')) {
      showToast('error', 'Network Error', 'Please check your connection.');
    } else if (error.code === 'ECONNABORTED') {
      showToast('error', 'Timeout', 'The request took too long.');
    }

    return Promise.reject(error);
  },
);

export default api;
