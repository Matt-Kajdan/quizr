// src/components/Auth.js
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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
            backgroundColor: "#f7f5f1",
            backgroundImage: `
              radial-gradient(1200px 800px at 5% 0%, rgba(255, 227, 170, 0.28), transparent 60%),
              radial-gradient(900px 700px at 85% 10%, rgba(255, 190, 220, 0.24), transparent 55%),
              radial-gradient(1000px 800px at 15% 90%, rgba(180, 220, 255, 0.24), transparent 60%),
              radial-gradient(900px 800px at 85% 85%, rgba(190, 235, 210, 0.24), transparent 60%)
            `
            }}
        >
            <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 font-medium">Checking authentication...</p>
            </div>
        </div>
        );
    }

    return <AuthContext.Provider value={currentUser}>{children}</AuthContext.Provider>;
};
