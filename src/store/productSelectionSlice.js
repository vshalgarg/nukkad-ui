import { createSlice } from '@reduxjs/toolkit';

const productSelectionsSlice = createSlice({
  name: 'productSelections',
  initialState: {},
  reducers: {
    setProductSelection: (state, action) => {
      const { productId, amount, selectedUnit } = action.payload;
      state[productId] = { amount, selectedUnit };
    },
    clearProductSelection: (state, action) => {
      const { productId } = action.payload;
      delete state[productId];
    },
    clearAllSelections: () => {
      return {};
    },
  },
});

export const {
  setProductSelection,
  clearProductSelection,
  clearAllSelections,
} = productSelectionsSlice.actions;

export default productSelectionsSlice.reducer;
