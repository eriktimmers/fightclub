import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { DieSides } from "@/lib/dice";

interface DiceState {
  results: number[];
  sides: DieSides;
  count: number;
  perDieBonus: number;
  totalBonus: number;
}

const initialState: DiceState = {
  results: [],
  sides: 20,
  count: 1,
  perDieBonus: 0,
  totalBonus: 0,
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
    setPerDieBonus: (state, action: PayloadAction<number>) => {
      state.perDieBonus = action.payload;
    },
    setTotalBonus: (state, action: PayloadAction<number>) => {
      state.totalBonus = action.payload;
    },
    resetDice: (state) => {
      state.results = [];
      state.sides = 20;
      state.count = 1;
      state.perDieBonus = 0;
      state.totalBonus = 0;
    },
  },
});

export const { setResults, setSides, setCount, setPerDieBonus, setTotalBonus, resetDice } = diceSlice.actions;
export default diceSlice.reducer;
