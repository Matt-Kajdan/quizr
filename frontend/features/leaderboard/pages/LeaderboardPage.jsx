import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "@features/quizzes/api/quizzes";
import { PageShell } from "@shared/components/PageShell";
import { PageHeader } from "@shared/components/PageHeader";
import { PaginationControl } from "@shared/components/PaginationControl";
import { SelectDropdown } from "@shared/components/SelectDropdown";
import { toProfileUrl } from "@shared/utils/usernameValidation";

const columns = [
  { key: "rank", label: "#", isNumeric: true },
  { key: "username", label: "Player", isNumeric: false },
  { key: "totalCorrect", label: "Correct", isNumeric: true },
  { key: "avgPercent", label: "Avg. score", isNumeric: true },
  { key: "attemptsCount", label: "Attempts", isNumeric: true },
  { key: "quizzesTaken", label: "Quizzes taken", isNumeric: true },
  { key: "attemptsOnTheirQuizzes", label: "Own attempts", isNumeric: true },
  { key: "quizzesCreated", label: "Created", isNumeric: true }
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "totalCorrect",
    direction: "desc"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const avatarGradients = [
    "from-rose-300 to-pink-400 dark:from-rose-500/80 dark:to-pink-600/80",
    "from-sky-300 to-blue-400 dark:from-sky-500/80 dark:to-blue-600/80",
    "from-emerald-300 to-green-400 dark:from-emerald-500/80 dark:to-green-600/80",
    "from-orange-300 to-amber-400 dark:from-orange-500/80 dark:to-amber-600/80"
  ];
  const getAvatarGradient = (userId) => {
    const value = String(userId || "");
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) % avatarGradients.length;
    }
    return avatarGradients[hash];
  };
  const opalBackdropStyle = {
    backgroundColor: "var(--opal-bg-color)",
    backgroundImage: "var(--opal-backdrop-image)"
  };

  useEffect(() => {
    let mounted = true;
    async function loadLeaderboard() {
      try {
        const body = await getLeaderboard();
        if (!mounted) return;
        setEntries(body.leaderboard || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadLeaderboard();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    return entries.map((entry) => {
      const totalQuestions = entry.totalQuestions || 0;
      const totalCorrect = entry.totalCorrect || 0;
      const avgPercent = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      const bestPercent = Number.isFinite(entry.bestPercent) ? entry.bestPercent : 0;
      return {
        ...entry,
        avgPercent,
        bestPercent
      };
    });
  }, [entries]);

  // baseRanks removed: rank will reflect current sorted row order (index + 1)

  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    const { key, direction } = sortConfig;
    const order = direction === "asc" ? 1 : -1;
    const getUsername = (row) => {
      const name = row?.user_data?.username;
      return typeof name === "string" ? name.trim() : "";
    };

    sorted.sort((a, b) => {
      const aName = getUsername(a);
      const bName = getUsername(b);
      if (key === "username") {
        if (!aName && !bName) return 0;
        if (!aName) return 1;
        if (!bName) return -1;
        return aName.localeCompare(bName) * order;
      }
      const aVal = Number.isFinite(a[key]) ? a[key] : 0;
      const bVal = Number.isFinite(b[key]) ? b[key] : 0;
      if (aVal !== bVal) return (aVal - bVal) * order;
      if (!aName && !bName) return 0;
      if (!aName) return 1;
      if (!bName) return -1;
      return aName.localeCompare(bName);
    });

    return sorted;
  }, [rows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));
  const paginatedRows = sortedRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function handleSort(key) {
    setSortConfig((prev) => {
      if (key === "rank") {
        return { key: prev.key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      const defaultDirection = key === "username" ? "asc" : "desc";
      return { key, direction: defaultDirection };
    });
    setCurrentPage(1);
  }

  function handleItemsPerPageChange(value) {
    setItemsPerPage(value);
    setCurrentPage(1);
  }

  function renderSortIcon(key) {
    const isActive = sortConfig.key === key;
    const isAsc = sortConfig.direction === "asc";
    return (
      <span className="inline-flex w-4 justify-center text-slate-400">
        {isAsc ? (
          <svg
            className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-0"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 5l4 6H6l4-6z" />
          </svg>
        ) : (
          <svg
            className={`h-3 w-3 ${isActive ? "opacity-100" : "opacity-0"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 15l-4-6h8l-4 6z" />
          </svg>
        )}
      </span>
    );
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 -top-20 flex items-center justify-center"
        style={opalBackdropStyle}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 -top-20 flex items-center justify-center p-4" style={opalBackdropStyle}>
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 border border-slate-200/80 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">Error</h3>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader title="Leaderboard" subtitle="All quizzes combined" />

      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="mb-4 flex items-center gap-3 sm:justify-end">
              {totalPages > 1 && (
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  label={(
                    <>
                      <span className="sm:hidden">{currentPage} of {totalPages}</span>
                      <span className="hidden sm:inline">Page {currentPage} of {totalPages}</span>
                    </>
                  )}
                  className="w-full sm:w-[210px]"
                />
              )}
              <SelectDropdown
                className={totalPages > 1
                  ? "w-[110px] shrink-0 sm:w-full sm:max-w-[232px]"
                  : "w-full sm:max-w-[232px]"}
                value={itemsPerPage}
                options={PAGE_SIZE_OPTIONS}
                onChange={handleItemsPerPageChange}
                buttonClassName="category-dropdown-button w-full h-11 rounded-2xl text-sm font-semibold cursor-pointer flex items-center justify-between px-4 relative"
                menuClassName="rounded-2xl overflow-hidden"
                optionClassName="font-medium"
                itemRoundedClassName="first:rounded-t-2xl last:rounded-b-2xl"
                renderTrigger={({ isOpen, selectedLabel }) => (
                  <>
                    <span>
                      <span className="sm:hidden">#</span>
                      <span className="hidden sm:inline">Display on one page</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-slate-500">{selectedLabel}</span>
                      <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </>
                )}
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[660px] border-collapse text-[11px] sm:min-w-[760px] sm:text-base">
                  <thead className="bg-slate-100/70 text-left text-slate-600">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={`h-auto p-0 align-middle ${column.key === "username" ? "text-left w-[160px] max-w-[160px] sm:w-[220px] sm:max-w-[220px]" : ""
                            }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            className={`flex h-full min-h-0 w-full items-center gap-1 px-2.5 py-1.5 text-left font-semibold text-slate-700 transition-colors hover:bg-slate-200/40 hover:text-slate-900 sm:min-h-[64px] sm:gap-2 sm:px-4 sm:py-3 ${column.key === "username" ? "justify-start" : "justify-between"}`}
                          >
                            <span className={`${column.key === "rank" ? "w-full" : ""}`}>{column.label}</span>
                            <span className="text-xs text-slate-400 shrink-0">{renderSortIcon(column.key)}</span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/50 text-slate-700 text-left">
                    {sortedRows.length === 0 ? (
                      <tr>
                        <td className="px-2.5 py-2 text-center text-slate-500 sm:px-4 sm:py-4" colSpan={columns.length}>
                          No leaderboard data yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((entry, index) => (
                        <tr key={entry.user_id}>
                          <td className="px-2.5 py-1.5 text-left font-medium text-slate-800 sm:px-4 sm:py-3">
                            {sortConfig.direction === "desc"
                              ? (currentPage - 1) * itemsPerPage + index + 1
                              : sortedRows.length - ((currentPage - 1) * itemsPerPage + index)}
                          </td>
                          <td className="p-0 font-medium text-slate-800 text-left w-[160px] max-w-[160px] sm:w-[220px] sm:max-w-[220px]">
                            {entry.user_data?.username ? (
                              <Link
                                to={toProfileUrl(entry.user_data.username)}
                                className="flex w-full min-w-0 items-center gap-1.5 px-1.5 py-1 text-slate-800 hover:text-slate-800 hover:font-semibold sm:gap-3 sm:px-4 sm:py-3"
                              >
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[24%] bg-gradient-to-br ${getAvatarGradient(entry.user_id)} text-[10px] font-semibold text-white shadow-sm sm:h-9 sm:w-9 sm:rounded-[30%] sm:text-sm`}
                                >
                                  {entry.user_data?.profile_pic ? (
                                    <img
                                      src={entry.user_data.profile_pic}
                                      alt={entry.user_data.username}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<span>${(entry.user_data?.username || "?").charAt(0).toUpperCase()}</span>`;
                                      }}
                                    />
                                  ) : (
                                    <span>{(entry.user_data?.username || "?").charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="truncate text-slate-800 dark:text-slate-200">
                                  {entry.user_data?.username}
                                </span>
                              </Link>
                            ) : (
                              <div className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 text-slate-700 sm:gap-3 sm:px-4 sm:py-3">
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[24%] bg-gradient-to-br ${getAvatarGradient(entry.user_id)} text-[10px] font-semibold text-white shadow-sm sm:h-9 sm:w-9 sm:rounded-[30%] sm:text-sm`}
                                >
                                  <span>?</span>
                                </div>
                                <span className="truncate text-slate-500">
                                  {entry.user_id ? `Unknown user (${entry.user_id})` : "Unknown user"}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-400 sm:px-4 sm:py-3">{entry.totalCorrect}</td>
                          <td className="px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-400 sm:px-4 sm:py-3">
                            {Math.round(entry.avgPercent)}%
                          </td>
                          <td className="px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-400 sm:px-4 sm:py-3">{entry.attemptsCount}</td>
                          <td className="px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-400 sm:px-4 sm:py-3">{entry.quizzesTaken}</td>
                          <td className="px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-400 sm:px-4 sm:py-3">{entry.attemptsOnTheirQuizzes || 0}</td>
                          <td className="px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-400 sm:px-4 sm:py-3">{entry.quizzesCreated}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Pagination */}
          {sortedRows.length > itemsPerPage && (
            <div className="mt-4 flex items-center justify-center">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-full sm:w-[210px]"
              />
            </div>
          )}
    </PageShell>
  );
}
