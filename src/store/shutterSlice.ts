import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
}

const initialState: ShutterState = {
  middleBarPositions: [],
  sectionHeights: [],
};

const shutterSlice = createSlice({
  name: "shutter",
  initialState,
  reducers: {
    setMiddleBarPositions(state, action: PayloadAction<number[]>) {
      state.middleBarPositions = action.payload;
    },
    setSectionHeights(state, action: PayloadAction<number[]>) {
      state.sectionHeights = action.payload;
    },
    resetShutterState(state) {
      state.middleBarPositions = [];
      state.sectionHeights = [];
    },
  },
});

export const { setMiddleBarPositions, setSectionHeights } =
  shutterSlice.actions;
export const { resetShutterState } = shutterSlice.actions;
export default shutterSlice.reducer;
