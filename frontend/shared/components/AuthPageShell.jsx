import { Moon, Sun } from "lucide-react";
import { useTheme } from "@shared/state/useTheme";
import { PageBackdrop } from "./PageBackdrop";

export function AuthPageShell({ title, subtitle, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <PageBackdrop />
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/75 text-slate-700 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-300 transition-colors hover:bg-white dark:hover:bg-slate-700/50 sm:top-4"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="fixed inset-0 overflow-y-auto pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:flex sm:flex-col sm:justify-center sm:pt-16 sm:pb-16">
        <main className="relative mx-auto w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="mb-4 px-2 text-center sm:mb-6">
            <h1 className="mb-2 select-none text-3xl font-semibold text-slate-800 dark:text-slate-100 sm:text-4xl">
              {title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950 sm:rounded-3xl sm:p-8 sm:dark:bg-slate-900/55">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
