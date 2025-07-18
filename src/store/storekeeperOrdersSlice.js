import { createSlice } from '@reduxjs/toolkit';
// import ordersData from '../HardcodeData/orderData.js';

const initialState = {
  orders: [],
};

const storekeeperOrdersSlice = createSlice({
  name: 'storekeeperOrders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, newStatus } = action.payload;
      const order = state.orders.find(order => order.orderId === orderId);
      if (order) {
        order.orderStatus = newStatus;
      }
    },
    updateOrderPrices: (state, action) => {
      const { orderId, items } = action.payload;
      const order = state.orders.find(order => order.orderId === orderId);
      if (order) {
        order.items = items;
      }
    },
    resetOrdersFromFile: state => {
      state.orders = [...ordersData];
    },
    updateOrderNote: (state, action) => {
      const { orderId, storeKeeperNote } = action.payload;
      const order = state.orders.find(order => order.orderId === orderId);
      if (order) {
        order.storeKeeperNote = storeKeeperNote;
      }
    },
  },
});

export const {
  updateOrderStatus,
  updateOrderPrices,
  resetOrdersFromFile,
  setOrders,
  updateOrderNote,
} = storekeeperOrdersSlice.actions;


export default storekeeperOrdersSlice.reducer;
