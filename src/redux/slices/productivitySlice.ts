import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ProductivitySettings } from "../../types";

const defaultSettings: ProductivitySettings = {
  dailyGoal: 5,
  thresholds: {
    red: 0.25,
    orange: 0.5,
    yellow: 0.75,
    green: 1,
  },
};

const productivitySlice = createSlice({
  name: "productivity",
  initialState: defaultSettings,
  reducers: {
    // Replace entire productivity settings (used when loading from Firestore)
    setAll(state, action: PayloadAction<ProductivitySettings>) {
      return action.payload;
    },
    setDailyGoal(state, action: PayloadAction<number>) {
      state.dailyGoal = action.payload;
    },
    setThresholds(
      state,
      action: PayloadAction<ProductivitySettings["thresholds"]>,
    ) {
      state.thresholds = action.payload;
    },
  },
});

export const { setDailyGoal, setThresholds } = productivitySlice.actions;

export const { setAll: setAllProductivity } = productivitySlice.actions;

export default productivitySlice.reducer;
