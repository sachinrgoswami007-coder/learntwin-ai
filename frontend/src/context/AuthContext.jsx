import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = unauth, obj = auth

  useEffect(() => {
    const token = localStorage.getItem("lt_token");
    if (!token) {
      setUser(false);
      return;
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("lt_token");
        setUser(false);
      });
  }, []);

  const persist = (data) => {
    localStorage.setItem("lt_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const value = {
    user,
    login: async (body) => persist(await api.login(body)),
    register: async (body) => persist(await api.register(body)),
    demoLogin: async () => persist(await api.demoLogin()),
    demoTeacherLogin: async () => persist(await api.demoTeacherLogin()),
    logout: () => {
      localStorage.removeItem("lt_token");
      setUser(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
