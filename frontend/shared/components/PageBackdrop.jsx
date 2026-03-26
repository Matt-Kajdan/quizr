const desktopBackdropStyle = {
  backgroundColor: "var(--opal-bg-color)",
  backgroundImage: "var(--opal-backdrop-image)",
};

const mobileBackdropStyle = {
  backgroundColor: "var(--mobile-bg-color)",
};

const mobileBackdropPatternStyle = {
  backgroundImage: `
    linear-gradient(to right, var(--mobile-grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--mobile-grid-line) 1px, transparent 1px)
  `,
  backgroundSize: "18px 18px",
  transform: "rotate(45deg) scale(1.35)",
  transformOrigin: "center",
};

export function PageBackdrop() {
  return (
    <>
      <div className="fixed inset-0 sm:hidden" style={mobileBackdropStyle}></div>
      <div className="fixed inset-0 hidden sm:block" style={desktopBackdropStyle}></div>

      <div className="pointer-events-none fixed inset-0 hidden overflow-hidden sm:block dark:hidden">
        <div className="absolute left-1/4 top-1/4 h-[28rem] w-[28rem] rounded-full bg-amber-200/30 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 h-[28rem] w-[28rem] rounded-full bg-rose-200/30 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/25 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </>
  );
}
