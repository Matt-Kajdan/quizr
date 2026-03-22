function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const opalBackdropStyle = {
  backgroundColor: "var(--opal-bg-color)",
  backgroundImage: "var(--opal-backdrop-image)",
};

export function PageShell({ children, mainClassName }) {
  return (
    <>
      <div className="fixed inset-0" style={opalBackdropStyle}></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-[28rem] w-[28rem] rounded-full bg-amber-200/30 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 h-[28rem] w-[28rem] rounded-full bg-rose-200/30 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/25 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
      <div className="relative min-h-screen">
        <main
          className={joinClasses(
            "relative mx-auto min-h-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 sm:pt-12 sm:pb-12 lg:px-8",
            mainClassName
          )}
        >
          {children}
        </main>
      </div>
    </>
  );
}
