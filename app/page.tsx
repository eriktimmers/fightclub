export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-12 py-12">
          <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
              Welcome to FightClub
            </h1>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              This is your main page content. The navbar is at the top, and this is the main content area below it.
              Start building your application here.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              Get Started
            </button>
            <button className="rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
