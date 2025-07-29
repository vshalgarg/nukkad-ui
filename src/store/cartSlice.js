// store/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  userId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartUser: (state, action) => {
      const newUserId = action.payload;

      if (state.userId && state.userId !== newUserId) {
        state.items = [];
      }

      state.userId = newUserId;
    },

    clearCart: state => {
      state.items = [];
      state.userId = null;
    },

    setCartItems: (state, action) => {
      const items = action.payload;
      state.items = Array.isArray(items) ? items : Object.values(items);
    },

    addToCart: (state, action) => {
      const { product, quantity, selectedUnit, itemId } = action.payload;

      const index = state.items.findIndex(
        item => item.product.id === product.id,
      );

      if (index >= 0) return;

      state.items.push({
        itemId,
        product: {
          ...product,
          amount: product.amount,
          selectedUnit: selectedUnit || product.selectedUnit || '',
        },
      });
    },

    updateCartItemQuantity: (state, action) => {
      const { itemId, amount, selectedUnit, itemCount } = action.payload;

      const index = state.items.findIndex(
        item => item.itemId === itemId || item.product.id === itemId,
      );

      if (index !== -1) {
        const oldItem = state.items[index];
        state.items[index] = {
          ...oldItem,
          product: {
            ...oldItem.product,
            amount:
              typeof amount === 'number' || typeof amount === 'string'
                ? amount
                : oldItem.product.amount,
            selectedUnit: selectedUnit || oldItem.selectedUnit,
          },
        };
      }
    },
    removeFromCart: (state, action) => {
      const { itemId } = action.payload;
      console.log('Removing item with ID:', itemId);
      state.items = state.items.filter(item => item.product.id !== itemId);
    },
    clearProductCartData: (state, action) => {
      const productId = action.payload;
      console.log('Clearing cart data for product ID:', productId);

      const item = state.items.find(item => item.product.id === productId);
      if (item) {
        item.product.amount = '';
        item.selectedUnit = '';
      }

      console.log(
        'Cleared product cart data for ID:',
        productId,
        'with item:',
        item,
      );
    },
  },
});

export const {
  setCartUser,
  clearCart,
  setCartItems,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearProductCartData,
} = cartSlice.actions;

export default cartSlice.reducer;
