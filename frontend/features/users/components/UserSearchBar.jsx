import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toProfileUrl } from "@shared/utils/usernameValidation";
import { apiFetch } from "@shared/api/apiClient";
import { SearchField } from "@shared/components/SearchField";

export default function UserSearchBar({ excludeUsername }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const inputRef = useRef(null);

  const requestIdRef = useRef(0);
  const loadingTimerRef = useRef(null);

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

  useEffect(() => {
    const query = q.trim();

    if (!query) {
      setUsers([]);
      setOpen(false);
      setShowLoading(false);
      clearTimeout(loadingTimerRef.current);
      return;
    }

    const id = ++requestIdRef.current;

    const t = setTimeout(async () => {
      // Start a 1-second timer — only show "Searching…" if the fetch takes longer
      loadingTimerRef.current = setTimeout(() => {
        if (requestIdRef.current === id) {
          setShowLoading(true);
          setOpen(true);
        }
      }, 1000);

      try {
        const res = await apiFetch(
          `/users/search?q=${encodeURIComponent(query)}`
        );
        const body = await res.json();

        if (requestIdRef.current !== id) return;

        clearTimeout(loadingTimerRef.current);
        setShowLoading(false);

        const list = Array.isArray(body.users) ? body.users : [];
        const filtered = excludeUsername
          ? list.filter((u) => u.username !== excludeUsername)
          : list;

        setUsers(filtered);
        setOpen(true);
      } catch (err) {
        console.error("User search failed", err);
        if (requestIdRef.current === id) {
          clearTimeout(loadingTimerRef.current);
          setShowLoading(false);
          setUsers([]);
          setOpen(false);
        }
      }
    }, 100);

    return () => {
      clearTimeout(t);
      clearTimeout(loadingTimerRef.current);
    };
  }, [q, excludeUsername]);

  function handleResultClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    setOpen(false);
    setQ("");
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }

  function handleResultMouseDown(event) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      // Keep the input focused so the dropdown stays open for context-menu and new-tab actions.
      event.preventDefault();
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <SearchField
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onClear={() => {
          setQ("");
          setUsers([]);
          setOpen(false);
          setShowLoading(false);
          inputRef.current?.focus();
        }}
        onFocus={() => {
          if (users.length) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        onEscape={() => {
          setOpen(false);
        }}
        placeholder="Search users"
        id="mobile-search-input"
        className="max-w-md"
      />

      {open && (
        <div className="absolute mt-2 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/80 backdrop-blur-md shadow-lg overflow-hidden z-50">
          {showLoading && (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 flex items-center gap-3 h-[60px]">Searching…</div>
          )}
          {!showLoading && users.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 flex items-center gap-3 h-[60px]">No users found</div>
          )}
          {!showLoading &&
            users.map((u) => (
              <Link
                key={u.id || u.username}
                to={toProfileUrl(u.username)}
                onMouseDown={handleResultMouseDown}
                onClick={handleResultClick}
                className="w-full text-left px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-900/60 flex items-center gap-3 transition-colors"
              >
                <div className={`w-9 h-9 rounded-[30%] overflow-hidden bg-gradient-to-br ${getAvatarGradient(u.id || u._id)} flex items-center justify-center flex-shrink-0`}>
                  {u.profile_pic ? (
                    <img
                      src={u.profile_pic}
                      alt={u.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {u.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-medium">{u.username}</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
