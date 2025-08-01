// import axios from 'axios';

// import { API_URL, CLIENT_NAME, CLIENT_SECRET } from '@env';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//     clientName: CLIENT_NAME,
//     clientSecret: CLIENT_SECRET,
//     Accept: 'application/json',
//   },
// });

// api.interceptors.request.use(async(config)=>{
//   const token=await AsyncStorage.getItem('authToken');
//   if(token){
//     config.headers.Authorization=`Bearer ${token}`;
//   }
//   return config;
// })

// api.interceptors.response.use(
//   response => {
//     const { responseCode, message } = response.data;
//     if (responseCode && responseCode !== 200) {
//       return Promise.reject({
//         code: responseCode,
//         message: message,
//         data: response.data,
//       });
//     }
//     return response;
//   },
//   error => {
//     return Promise.reject(error);
//   },
// );
// export default api;

import axios from 'axios';
import { API_URL, CLIENT_NAME, CLIENT_SECRET } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    clientName: CLIENT_NAME,
    clientSecret: CLIENT_SECRET,
    Accept: 'application/json',
  },
});

// 📤 Request Interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔍 Log full request details
  console.log('➡️ API Request:', {
    method: config.method,
    url: `${config.baseURL}${config.url}`,
    headers: config.headers,
    data: config.data,
    params: config.params,
  });

  return config;
});

// 📥 Response Interceptor
api.interceptors.response.use(
  (response) => {
    const { responseCode, message } = response.data;

    // 🔍 Log successful responses
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });

    if (responseCode && responseCode !== 200) {
      return Promise.reject({
        code: responseCode,
        message: message,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // ❌ Log errors
    console.error('❌ API Error:', {
      message: error.message,
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;
