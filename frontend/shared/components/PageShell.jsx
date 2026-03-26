import { PageBackdrop } from "./PageBackdrop";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function PageShell({ children, mainClassName }) {
  return (
    <>
      <PageBackdrop />
      <div className="relative min-h-screen">
        <main
          className={joinClasses(
            "relative mx-auto min-h-full max-w-6xl px-3 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-12 sm:pb-12 lg:px-8",
            mainClassName
          )}
        >
          {children}
        </main>
      </div>
    </>
  );
}
