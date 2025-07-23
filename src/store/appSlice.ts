import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  currency: "EUR" | "TRY"; // Seçilen para birimi
  eurRate: number; // Euro kuru
}

const initialState: AppState = {
  currency: "EUR",
  eurRate: 0,
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
  },
});

export const { setCurrency, setEurRate } = appSlice.actions;
export default appSlice.reducer;
