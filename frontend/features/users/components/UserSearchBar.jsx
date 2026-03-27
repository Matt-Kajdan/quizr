import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toProfileUrl } from "@shared/utils/usernameValidation";
import { apiFetch } from "@shared/api/apiClient";
import { SearchField } from "@shared/components/SearchField";
import { UserAvatar } from "@shared/components/UserAvatar";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function UserSearchBar({ excludeUsername, className, inputClassName }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const inputRef = useRef(null);

  const requestIdRef = useRef(0);
  const loadingTimerRef = useRef(null);

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
    <div className={joinClasses("relative w-full max-w-md", className)}>
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
        className="w-full"
        inputClassName={inputClassName}
        isResultsOpen={open}
        isResultsLoading={showLoading}
        results={users}
        emptyResultsMessage="No users found"
        resultsPanelClassName="fixed left-0 right-0 top-[calc(env(safe-area-inset-top)+3.5rem)] z-50 overflow-hidden bg-white shadow-lg dark:bg-slate-950 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-full sm:rounded-xl sm:border sm:border-slate-200/80 sm:dark:border-slate-800/80"
        getResultKey={(u) => u.id || u.username}
        renderResult={(u) => (
          <Link
            to={toProfileUrl(u.username)}
            onMouseDown={handleResultMouseDown}
            onClick={handleResultClick}
            className="w-full text-left px-4 py-3 text-sm text-slate-800 visited:text-slate-800 hover:bg-slate-100/80 hover:text-slate-800 dark:text-slate-100 dark:visited:text-slate-100 dark:hover:bg-slate-900/60 dark:hover:text-slate-100 flex items-center gap-3 transition-colors"
          >
            <UserAvatar
              userId={u.id || u._id}
              name={u.username}
              src={u.profile_pic}
              size={36}
              shape="rounded"
              className="shrink-0"
              textClassName="text-sm"
            />
            <span className="font-medium">{u.username}</span>
          </Link>
        )}
      />
    </div>
  );
}
