import AttackRoller from "@/components/AttackRoller";

export default function AttackPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Attack Roll
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Roll attack dice with critical hit confirmation
          </p>
        </div>
        <div className="flex justify-center">
          <AttackRoller />
        </div>
      </div>
    </div>
  );
}
