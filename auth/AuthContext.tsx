// src/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSQLiteContext } from "expo-sqlite";

type User = {
  id: number;
  username: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const db = useSQLiteContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Відновлення сесії при старті
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("authUser");

        if (storedUsername) {
          // getFirstAsync повертає any, тому явно мапимо об'єкт
          const row: any = await db.getFirstAsync(
            "SELECT id, username FROM users WHERE username = ?",
            [storedUsername]
          );

          if (row) {
            setUser({ id: row.id, username: row.username });
          }
        }
      } catch (e) {
        console.warn("Failed to restore session", e);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [db]);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const row: any = await db.getFirstAsync(
        "SELECT id, username FROM users WHERE username = ? AND password = ?",
        [username, password]
      );

      if (!row) {
        return false; // невірний логін/пароль
      }

      const loggedUser: User = { id: row.id, username: row.username };
      setUser(loggedUser);

      await AsyncStorage.setItem("authUser", loggedUser.username);
      await AsyncStorage.setItem("authToken", "local-only-token");

      return true;
    } catch (e) {
      console.warn("Login error", e);
      return false;
    }
  };

  const register = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      await db.runAsync(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password]
      );

      // одразу логінимо після реєстрації
      return await login(username, password);
    } catch (e: any) {
      if (String(e).includes("UNIQUE")) {
        console.warn("Username already exists");
        return false;
      }
      console.warn("Register error", e);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(["authUser", "authToken"]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};
