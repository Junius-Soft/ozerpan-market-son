import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  currency: "EUR" | "TRY"; // Seçilen para birimi
  eurRate: number; // Euro kuru
  quantity: number; // Ürün adeti
}

const initialState: AppState = {
  currency: "EUR",
  eurRate: 0,
  quantity: 1,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setCurrency(state, action: PayloadAction<"EUR" | "TRY">) {
      state.currency = action.payload;
    },
    setEurRate(state, action: PayloadAction<number>) {
      state.eurRate = action.payload;
    },
    setQuantity(state, action: PayloadAction<number>) {
      state.quantity = action.payload;
    },
  },
});

export const { setCurrency, setEurRate, setQuantity } = appSlice.actions;
export default appSlice.reducer;
