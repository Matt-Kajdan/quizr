import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { BACKEND_URL } from "../api/backendUrl";
import { auth } from "./firebase";

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return await user.getIdToken()
}

export async function signup(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  return await user.getIdToken()
}

export async function forgotPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();

      // Explicitly flush the exact theme state to the backend before signing out
      await fetch(`${BACKEND_URL}/me/theme`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ theme: currentTheme }),
      });
    } catch (e) {
      console.error("Failed to sync theme before logout", e);
    }
  }

  await auth.signOut();
}
