import { createContext, useContext, useState } from 'react';
import { INITIAL_USERS } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);

  function login(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return { success: true, role: user.role };
    }
    return { success: false };
  }

  function logout() {
    setCurrentUser(null);
  }

  function registerUser(user) {
    setUsers(prev => [...prev, user]);
    setCurrentUser(user);
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
