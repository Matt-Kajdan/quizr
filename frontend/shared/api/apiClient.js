// this helper file fetches the user token ID from the Firebase and attaches it to any protected route request
import { auth } from "../auth/firebase";
import { authReady } from "../auth/authState";
import { BACKEND_URL } from "./backendUrl";

export async function apiFetch(path, options = {}) {
    // Wait for Firebase auth to initialize (authReady resolves on first state change)
    await authReady;
    const user = auth.currentUser;
    if (!user) {
        window.location.href = "/login";
        throw new Error("Not authenticated");
    }
    const token = await user.getIdToken();

    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
    });

    if (res.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }
    if (res.status === 423) {
        let body = null;
        try {
            body = await res.json();
        } catch {
            body = null;
        }
        if (body?.username) {
            window.location.href = `/users/${body.username.replace(/ /g, '_')}`;
        }
        throw new Error(body?.message || "Account pending deletion");
    }
    return res;
}
