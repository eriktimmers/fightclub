"use client";

import { useEffect, useRef } from "react";
import { rollDie } from "@/lib/dice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCriticalRange, setBonus, setResult } from "@/store/attackSlice";
import type { CriticalRange } from "@/store/attackSlice";

type AttackRollerProps = {
  /** When true, roll attack once on mount (e.g. when opened from opponent action). */
  autoRoll?: boolean;
  /** Called after an auto-roll has been performed. */
  onAutoRollDone?: () => void;
};

export default function AttackRoller({ autoRoll = false, onAutoRollDone }: AttackRollerProps) {
  const dispatch = useAppDispatch();
  const { criticalRange, bonus, result } = useAppSelector((state) => state.attack);
  const hasAutoRolled = useRef(false);

  const isCriticalHit = (roll: number, range: CriticalRange): boolean => {
    switch (range) {
      case "none":
        return false;
      case "20":
        return roll === 20;
      case "19-20":
        return roll >= 19;
      case "18-20":
        return roll >= 18;
      default:
        return false;
    }
  };

  const handleAttack = () => {
    const initialRoll = rollDie(20);
    const initialTotal = initialRoll + bonus;
    const isCritical = isCriticalHit(initialRoll, criticalRange);

    if (isCritical) {
      const confirmRoll = rollDie(20);
      const confirmTotal = confirmRoll + bonus;
      dispatch(setResult({
        initialRoll,
        initialTotal,
        isCritical,
        confirmRoll,
        confirmTotal,
      }));
    } else {
      dispatch(setResult({
        initialRoll,
        initialTotal,
        isCritical: false,
      }));
    }
  };

  const handleCriticalRangeChange = (newRange: CriticalRange) => {
    dispatch(setCriticalRange(newRange));
  };

  const handleBonusChange = (newBonus: number) => {
    dispatch(setBonus(newBonus));
  };

  useEffect(() => {
    if (autoRoll && !hasAutoRolled.current) {
      hasAutoRolled.current = true;
      const initialRoll = rollDie(20);
      const initialTotal = initialRoll + bonus;
      const isCritical = isCriticalHit(initialRoll, criticalRange);
      if (isCritical) {
        const confirmRoll = rollDie(20);
        const confirmTotal = confirmRoll + bonus;
        dispatch(setResult({
          initialRoll,
          initialTotal,
          isCritical,
          confirmRoll,
          confirmTotal,
        }));
      } else {
        dispatch(setResult({
          initialRoll,
          initialTotal,
          isCritical: false,
        }));
      }
      onAutoRollDone?.();
    }
  }, [autoRoll, bonus, criticalRange, dispatch, onAutoRollDone]);

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Attack Roll
      </h2>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="criticalRange" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Critical Range:
            </label>
            <select
              id="criticalRange"
              value={criticalRange}
              onChange={(e) => handleCriticalRangeChange(e.target.value as CriticalRange)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="none">None</option>
              <option value="20">20</option>
              <option value="19-20">19-20</option>
              <option value="18-20">18-20</option>
            </select>
          </div>
          <div>
            <label htmlFor="bonus" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Attack Bonus:
            </label>
            <input
              id="bonus"
              type="number"
              value={bonus}
              onChange={(e) => handleBonusChange(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Enter bonus"
            />
          </div>
        </div>
        <button
          onClick={handleAttack}
          className="rounded-md bg-zinc-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Roll Attack
        </button>
        {result && (
          <div className="space-y-4">
            <div className={`rounded-lg p-6 ${result.isCritical ? "bg-amber-100 dark:bg-amber-900/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Initial Roll:
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-2xl font-bold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
                    {result.initialRoll}
                  </div>
                  <span className="text-xl font-medium text-zinc-600 dark:text-zinc-400">+</span>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-200 text-xl font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100">
                    {bonus}
                  </div>
                  <span className="text-xl font-medium text-zinc-600 dark:text-zinc-400">=</span>
                  <div className="flex h-16 min-w-[4rem] items-center justify-center rounded-lg bg-zinc-900 px-4 text-2xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {result.initialTotal}
                  </div>
                </div>
              </div>
              {result.isCritical && (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      ⚔️ CRITICAL THREAT!
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Confirmation Roll:
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-2xl font-bold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
                        {result.confirmRoll}
                      </div>
                      <span className="text-xl font-medium text-zinc-600 dark:text-zinc-400">+</span>
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-200 text-xl font-semibold text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100">
                        {bonus}
                      </div>
                      <span className="text-xl font-medium text-zinc-600 dark:text-zinc-400">=</span>
                      <div className="flex h-16 min-w-[4rem] items-center justify-center rounded-lg bg-amber-600 px-4 text-2xl font-bold text-white dark:bg-amber-500">
                        {result.confirmTotal}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
