import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      return p;
    } catch (e) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <StudentContext.Provider value={{ profile, loading, refresh, setProfile }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => useContext(StudentContext);
