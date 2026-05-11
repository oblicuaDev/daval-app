import { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS } from '../data/mockData';
import { tokenStore } from '../api/client.js';
import { authApi } from '../api/modules/auth.js';

const AuthContext = createContext(null);

const USER_KEY = 'daval.user';
const BC_NAME = 'daval-auth';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function broadcastAuthEvent(type, payload = {}) {
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({ type, ...payload });
    bc.close();
  } catch {
    // BroadcastChannel not supported (e.g. some Safari versions) — silent fallback
  }
}

export function AuthProvider({ children }) {
  // Lazy initializer: hydrate from localStorage on first render
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [users, setUsers] = useState(INITIAL_USERS);

  // Cross-tab sync: listen for login/logout events from other tabs
  useEffect(() => {
    let bc;
    try {
      bc = new BroadcastChannel(BC_NAME);
      bc.onmessage = (e) => {
        if (e.data.type === 'LOGOUT') {
          setCurrentUser(null);
        } else if (e.data.type === 'LOGIN' && e.data.user) {
          setCurrentUser(e.data.user);
        }
      };
    } catch {
      // Fallback: listen to storage event (Safari / older browsers)
      const onStorage = (e) => {
        if (e.key === USER_KEY) {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
    return () => bc?.close();
  }, []);

  // Listen for global logout triggered by the API layer (daval:logout event fired on 401)
  useEffect(() => {
    const onApiLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem(USER_KEY);
    };
    window.addEventListener('daval:logout', onApiLogout);
    return () => window.removeEventListener('daval:logout', onApiLogout);
  }, []);

  async function login(email, password) {
    try {
      const { token, refreshToken, user } = await authApi.login(email, password);
      tokenStore.set(token);
      if (refreshToken) tokenStore.setRefresh(refreshToken);
      setCurrentUser(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      broadcastAuthEvent('LOGIN', { user });
      return { success: true, role: user.role };
    } catch {
      // Fall back to mock when API is unavailable
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        broadcastAuthEvent('LOGIN', { user });
        return { success: true, role: user.role };
      }
      return { success: false };
    }
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem(USER_KEY);
    tokenStore.clear();
    broadcastAuthEvent('LOGOUT');
  }

  function registerUser(user) {
    setUsers(prev => [...prev, user]);
    setCurrentUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    broadcastAuthEvent('LOGIN', { user });
    return user;
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, setUsers, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
