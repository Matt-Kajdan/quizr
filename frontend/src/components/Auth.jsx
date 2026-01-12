// src/components/Auth.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { AuthContext } from "../context/AuthContext";

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) {
        return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{
            backgroundColor: "var(--opal-bg-color)",
            backgroundImage: "var(--opal-backdrop-image)"
            }}
        >
            <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-300 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Checking authentication...</p>
            </div>
        </div>
        );
    }

    return <AuthContext.Provider value={currentUser}>{children}</AuthContext.Provider>;
};
