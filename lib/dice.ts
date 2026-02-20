/**
 * Allowed die sides
 */
export const ALLOWED_DIE_SIDES = [2, 3, 4, 6, 8, 10, 12, 20, 30, 100] as const;

export type DieSides = typeof ALLOWED_DIE_SIDES[number];

/**
 * Rolls a die with the specified number of sides
 * @param sides - The number of sides on the die (must be one of: 2, 3, 4, 6, 8, 10, 12, 20, 30, 100)
 * @returns A random number between 1 and the number of sides (inclusive)
 * @throws Error if sides is not a valid die size
 */
export function rollDie(sides: DieSides): number {
  if (!ALLOWED_DIE_SIDES.includes(sides)) {
    throw new Error(
      `Invalid die size. Allowed sides: ${ALLOWED_DIE_SIDES.join(", ")}`
    );
  }
  
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rolls multiple dice with the specified number of sides
 * @param sides - The number of sides on each die (must be one of: 2, 3, 4, 6, 8, 10, 12, 20, 30, 100)
 * @param count - The number of dice to roll
 * @returns An array of random numbers, each between 1 and the number of sides
 */
export function rollDice(sides: DieSides, count: number): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Count must be a positive integer");
  }
  
  return Array.from({ length: count }, () => rollDie(sides));
}

/**
 * Rolls multiple dice and returns the sum
 * @param sides - The number of sides on each die (must be one of: 2, 3, 4, 6, 8, 10, 12, 20, 30, 100)
 * @param count - The number of dice to roll
 * @returns The sum of all rolled dice
 */
export function rollDiceSum(sides: DieSides, count: number): number {
  return rollDice(sides, count).reduce((sum, value) => sum + value, 0);
}
