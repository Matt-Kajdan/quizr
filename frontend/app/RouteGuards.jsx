import { Navigate, Outlet } from "react-router-dom";
import { isSigningUp } from "@shared/auth/signupGate";
import { useAuth } from "@shared/auth/useAuth";

export function ProtectedRoute() {
  const user = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const user = useAuth();

  if (user && !isSigningUp()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
