import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CriticalRange = "none" | "20" | "19-20" | "18-20";

export interface AttackResult {
  initialRoll: number;
  initialTotal: number;
  isCritical: boolean;
  confirmRoll?: number;
  confirmTotal?: number;
}

interface AttackState {
  criticalRange: CriticalRange;
  bonus: number;
  result: AttackResult | null;
}

const initialState: AttackState = {
  criticalRange: "20",
  bonus: 0,
  result: null,
};

const attackSlice = createSlice({
  name: "attack",
  initialState,
  reducers: {
    setCriticalRange: (state, action: PayloadAction<CriticalRange>) => {
      state.criticalRange = action.payload;
    },
    setBonus: (state, action: PayloadAction<number>) => {
      state.bonus = action.payload;
    },
    setResult: (state, action: PayloadAction<AttackResult>) => {
      state.result = action.payload;
    },
    resetAttack: (state) => {
      state.result = null;
    },
  },
});

export const { setCriticalRange, setBonus, setResult, resetAttack } = attackSlice.actions;
export default attackSlice.reducer;
