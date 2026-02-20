import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { DieSides } from "@/lib/dice";

interface DiceState {
  results: number[];
  sides: DieSides;
  count: number;
}

const initialState: DiceState = {
  results: [],
  sides: 6,
  count: 1,
};

const diceSlice = createSlice({
  name: "dice",
  initialState,
  reducers: {
    setResults: (state, action: PayloadAction<number[]>) => {
      state.results = action.payload;
    },
    setSides: (state, action: PayloadAction<DieSides>) => {
      state.sides = action.payload;
    },
    setCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
    resetDice: (state) => {
      state.results = [];
    },
  },
});

export const { setResults, setSides, setCount, resetDice } = diceSlice.actions;
export default diceSlice.reducer;
