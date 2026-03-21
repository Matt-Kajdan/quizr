// Shared gate to prevent /me fetches during signup
// (between Firebase auth creation and DB user creation)
let _isSigningUp = false;
const listeners = new Set();

export const isSigningUp = () => _isSigningUp;

export const setSigningUp = (value) => {
  _isSigningUp = value;
  listeners.forEach((listener) => listener(_isSigningUp));
};

export const subscribeToSignupGate = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
