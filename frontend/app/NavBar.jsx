import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "@shared/auth/authService";
import { toProfileUrl } from "@shared/utils/usernameValidation";
import { useAuth } from "@shared/auth/useAuth";
import { Button } from "@shared/components/Button";
import { useTheme } from "@shared/state/useTheme";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import UserSearchBar from "@features/users/components/UserSearchBar";
import {
  Home as HomeIcon,
  PlusSquare,
  Users,
  Trophy,
  User,
  Search,
  Sun,
  Moon,
} from "lucide-react";

function NavBar({ accountStatus, accountUsername }) {
  const user = useAuth();
  const isMobile = useIsMobile();
  const { theme, toggleTheme, isLoading } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const username = accountUsername;
  const isAccountLocked = accountStatus === "pending_deletion";
  const profileLabel = username || "Profile";

  if (isLoading) {
    return null;
  }

  const navLinks = [
    { to: "/", icon: HomeIcon, label: "Home", mobileOnly: false },
    { to: "/quizzes/create", icon: PlusSquare, label: "Create", mobileOnly: false },
    { to: "/friends", icon: Users, label: "Friends", mobileOnly: false, requiresAuth: true },
    { to: "/leaderboard", icon: Trophy, label: "Rank", mobileOnly: false, requiresAuth: true },
    { to: toProfileUrl(username || ''), icon: User, label: "Profile", mobileOnly: false, requiresAuth: true, isProfile: true },
  ];

  const isQuizEditor = location.pathname === "/quizzes/create"
    || (location.pathname.startsWith("/quiz/") && location.pathname.endsWith("/edit"));

  const handleSearchClick = () => {
    const searchInput = document.getElementById("mobile-search-input");
    if (searchInput) {
      searchInput.focus();
    }
  };

  const desktopNavLinks = [
    { to: "/", label: "Home", minWidthClass: "min-w-[5.5rem]" },
    { to: "/quizzes/create", label: "Create Quiz", minWidthClass: "min-w-[7.5rem]" },
    { to: "/friends", label: "Friends", minWidthClass: "min-w-[6.5rem]", requiresAuth: true },
    { to: "/leaderboard", label: "Leaderboard", minWidthClass: "min-w-[8.5rem]", requiresAuth: true },
  ];

  function isDesktopNavActive(to) {
    if (to === "/") {
      return location.pathname === "/";
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  function handleDesktopNavClick(event, to) {
    if (!isDesktopNavActive(to)) return;
    event.preventDefault();
    navigate(0);
  }

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navLinks.map((link) => {
            if (link.requiresAuth && !user) return null;
            if (link.isProfile && !username) return null;

            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                  }`
                }
              >
                <Icon size={24} />
                <span className="text-[10px] mt-1 font-medium">{link.label}</span>
              </NavLink>
            );
          })}

          {isQuizEditor ? (
            <button
              onClick={toggleTheme}
              className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400"
            >
              {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
              <span className="text-[10px] mt-1 font-medium">Theme</span>
            </button>
          ) : (
            <button
              onClick={handleSearchClick}
              className="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400"
            >
              <Search size={24} />
              <span className="text-[10px] mt-1 font-medium">Search</span>
            </button>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 z-50 w-screen bg-white/70 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1.5">
            {!isAccountLocked && (
              <>
                {desktopNavLinks.map((link) => {
                  if (link.requiresAuth && !user) return null;
                  if (link.isProfile && !username) return null;

                  const isActive = isDesktopNavActive(link.to);

                  return (
                    <Button
                      key={link.to}
                      to={link.to}
                      onClick={(event) => handleDesktopNavClick(event, link.to)}
                      variant="subtle"
                      color="standard"
                      bold={isActive}
                      className={`h-11 ${link.minWidthClass}`}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </>
            )}
          </div>

          <div className="flex-1 flex justify-center px-4">
            {user && !isAccountLocked && <UserSearchBar excludeUsername={username} />}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <Button
                onClick={toggleTheme}
                variant="subtle"
                color="standard"
                ariaLabel="Toggle theme"
                icon={theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              >
              </Button>
            )}
            {user && username && (
              <Button
                to={toProfileUrl(username)}
                onClick={(event) => handleDesktopNavClick(event, toProfileUrl(username))}
                variant="subtle"
                color="standard"
                bold={isDesktopNavActive(toProfileUrl(username))}
                className="h-11 min-w-[6.5rem]"
              >
                {profileLabel}
              </Button>
            )}

            {user && (
              <Button
                onClick={() => logout()}
                variant="primary"
                color="standard"
              >
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
