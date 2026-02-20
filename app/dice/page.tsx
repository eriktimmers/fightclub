import DiceRoller from "@/components/DiceRoller";

export default function DicePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Dice Roller
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Roll dice for your FightClub battles
          </p>
        </div>
        <div className="flex justify-center">
          <DiceRoller />
        </div>
      </div>
    </div>
  );
}
