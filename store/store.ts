import { configureStore } from "@reduxjs/toolkit";
import diceReducer from "./diceSlice";
import attackReducer from "./attackSlice";

export const store = configureStore({
  reducer: {
    dice: diceReducer,
    attack: attackReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
