"use client";

import { rollDice, ALLOWED_DIE_SIDES, type DieSides } from "@/lib/dice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setResults, setSides, setCount, setPerDieBonus, setTotalBonus, resetDice } from "@/store/diceSlice";

export default function DiceRoller() {
  const dispatch = useAppDispatch();
  const { results, sides, count, perDieBonus, totalBonus } = useAppSelector((state) => state.dice);

  const handleRoll = () => {
    const rolls = rollDice(sides, count);
    dispatch(setResults(rolls));
  };

  const handleSidesChange = (newSides: DieSides) => {
    dispatch(setSides(newSides));
  };

  const handleCountChange = (newCount: number) => {
    dispatch(setCount(newCount));
  };

  const total = results.length > 0
    ? results.reduce((sum, value) => sum + value + perDieBonus, 0) + totalBonus
    : 0;

  return (
    <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Dice Roller
      </h2>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sides" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Die Type:
            </label>
            <select
              id="sides"
              value={sides}
              onChange={(e) => handleSidesChange(Number(e.target.value) as DieSides)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {ALLOWED_DIE_SIDES.map((side) => (
                <option key={side} value={side}>
                  D{side}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="count" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Number of Dice:
            </label>
            <input
              id="count"
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => handleCountChange(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="perDieBonus" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Per die bonus:
            </label>
            <input
              id="perDieBonus"
              type="number"
              value={perDieBonus}
              onChange={(e) => dispatch(setPerDieBonus(Number(e.target.value) || 0))}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="totalBonus" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Total bonus:
            </label>
            <input
              id="totalBonus"
              type="number"
              value={totalBonus}
              onChange={(e) => dispatch(setTotalBonus(Number(e.target.value) || 0))}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRoll}
            className="rounded-md bg-zinc-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Roll {count}D{sides}
          </button>
          <button
            type="button"
            onClick={() => dispatch(resetDice())}
            className="rounded-md border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Clear
          </button>
        </div>
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-md bg-zinc-100 p-6 dark:bg-zinc-800">
              <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Individual Results:
              </p>
              <div className="flex flex-wrap gap-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-2xl font-bold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {result + perDieBonus}
                  </div>
                ))}
              </div>
            </div>
            {results.length > 1 && (
              <div className="rounded-md bg-zinc-900 p-6 text-center dark:bg-zinc-100">
                <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">
                  Total:
                </p>
                <p className="text-5xl font-bold text-white dark:text-zinc-900">{total}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
