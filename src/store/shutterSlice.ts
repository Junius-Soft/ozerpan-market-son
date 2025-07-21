import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
  sectionMotors: boolean[]; // Her bölmenin motor durumu (true = motor var, false = yok)
  sectionConnections: string[]; // Her bölmenin bağlantı durumu ("left", "right", "none")
}

const initialState: ShutterState = {
  middleBarPositions: [],
  sectionHeights: [],
  sectionMotors: [],
  sectionConnections: [],
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
    setSectionMotors(state, action: PayloadAction<boolean[]>) {
      state.sectionMotors = action.payload;
    },
    setSectionConnections(state, action: PayloadAction<string[]>) {
      state.sectionConnections = action.payload;
    },
    toggleSectionMotor(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (state.sectionMotors[index] === undefined) {
        state.sectionMotors[index] = true;
      } else {
        state.sectionMotors[index] = !state.sectionMotors[index];
      }

      // Motor eklendiğinde bağlantıyı temizle
      if (state.sectionMotors[index]) {
        state.sectionConnections[index] = "none";
      }
    },
    setSectionConnection(
      state,
      action: PayloadAction<{ index: number; connection: string }>
    ) {
      const { index, connection } = action.payload;
      state.sectionConnections[index] = connection;

      // Bağlantı yapıldığında motoru temizle
      if (connection !== "none") {
        state.sectionMotors[index] = false;
      }
    },
    resetShutterState(state) {
      state.middleBarPositions = [];
      state.sectionHeights = [];
      state.sectionMotors = [];
      state.sectionConnections = [];
    },
  },
});

export const {
  setMiddleBarPositions,
  setSectionHeights,
  setSectionMotors,
  setSectionConnections,
  toggleSectionMotor,
  setSectionConnection,
} = shutterSlice.actions;
export const { resetShutterState } = shutterSlice.actions;
export default shutterSlice.reducer;
