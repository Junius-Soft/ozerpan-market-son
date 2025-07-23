import { configureStore } from "@reduxjs/toolkit";
import shutterReducer from "./shutterSlice";
import appReducer from "./appSlice";

export const store = configureStore({
  reducer: {
    shutter: shutterReducer,
    app: appReducer,
  },
});

export interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
  sectionMotors: boolean[];
  sectionConnections: string[];
  sectionMotorPositions: string[];
}

export interface AppState {
  currency: "EUR" | "TRY";
  eurRate: number;
}

export interface RootState {
  shutter: ShutterState;
  app: AppState;
}

// export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
