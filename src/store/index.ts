import { configureStore } from "@reduxjs/toolkit";
import shutterReducer from "./shutterSlice";

export const store = configureStore({
  reducer: {
    shutter: shutterReducer,
  },
});

export interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
}

export interface RootState {
  shutter: ShutterState;
}

// export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
