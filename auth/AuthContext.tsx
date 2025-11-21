// auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "admin" | "user";

type StoredUser = {
  username: string;
  password: string; // для простоти залишаємо як є
  role: Role;
};

type AuthUser = {
  username: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;

  // звичайна авторизація
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;

  // адміністрування
  allUsers: StoredUser[];
  refreshUsers: () => Promise<void>;
  setUserRole: (username: string, role: Role) => Promise<boolean>;
  deleteUserByAdmin: (username: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USERS_KEY = "auth_users";
const CURRENT_USER_KEY = "auth_current_user";

type Props = { children: ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(true);

  // завантаження користувачів + поточного
  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(USERS_KEY);
        let users: StoredUser[] = stored ? JSON.parse(stored) : [];

        // гарантуємо роль для кожного користувача
        users = users.map((u) => {
          if (u.username.toLowerCase() === "bilous") {
            return { ...u, role: "admin" as Role };
          }
          return { ...u, role: u.role ?? ("user" as Role) };
        });

        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
        setAllUsers(users);

        const currentName = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (currentName) {
          const cu = users.find((u) => u.username === currentName);
          if (cu) {
            setUser({ username: cu.username, role: cu.role });
          }
        }
      } catch (e) {
        console.warn("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const saveUsers = async (users: StoredUser[]) => {
    setAllUsers(users);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const login = async (username: string, password: string) => {
    const name = username.trim();
    const u = allUsers.find((x) => x.username === name);
    if (!u || u.password !== password) return false;

    // ще раз гарантуємо роль bilous
    const role: Role =
      u.username.toLowerCase() === "bilous" ? "admin" : u.role ?? "user";

    setUser({ username: u.username, role });
    await AsyncStorage.setItem(CURRENT_USER_KEY, u.username);
    return true;
  };

  const register = async (username: string, password: string) => {
    const name = username.trim();
    if (!name || !password) return false;

    const exists = allUsers.some((u) => u.username === name);
    if (exists) return false;

    const role: Role =
      name.toLowerCase() === "bilous" ? "admin" : "user";

    const newUser: StoredUser = { username: name, password, role };
    const newList = [...allUsers, newUser];
    await saveUsers(newList);

    // після реєстрації просто створюємо, але не логінимо автоматично
    return true;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user) return false;
    const u = allUsers.find((x) => x.username === user.username);
    if (!u || u.password !== currentPassword) return false;

    const updated: StoredUser = { ...u, password: newPassword };
    const list = allUsers.map((x) =>
      x.username === u.username ? updated : x
    );
    await saveUsers(list);
    return true;
  };

  const deleteAccount = async () => {
    if (!user) return false;

    const list = allUsers.filter((u) => u.username !== user.username);
    await saveUsers(list);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    return true;
  };

  // --- АДМІН-ФУНКЦІЇ ---

  const refreshUsers = async () => {
    const stored = await AsyncStorage.getItem(USERS_KEY);
    let users: StoredUser[] = stored ? JSON.parse(stored) : [];
    users = users.map((u) => {
      if (u.username.toLowerCase() === "bilous") {
        return { ...u, role: "admin" as Role };
      }
      return { ...u, role: u.role ?? ("user" as Role) };
    });
    await saveUsers(users);
  };

  const setUserRole = async (username: string, role: Role) => {
    // bilous завжди адмін
    if (username.toLowerCase() === "bilous" && role !== "admin") {
      Alert?.alert?.(
        "Неможливо",
        "Користувач bilous завжди має бути адміністратором."
      );
      return false;
    }

    const u = allUsers.find((x) => x.username === username);
    if (!u) return false;

    const updated: StoredUser = { ...u, role };
    const list = allUsers.map((x) =>
      x.username === username ? updated : x
    );
    await saveUsers(list);

    // оновлюємо поточного, якщо ми міняємо йому роль
    if (user && user.username === username) {
      setUser({ username, role });
    }

    return true;
  };

  const deleteUserByAdmin = async (username: string) => {
    // не даємо видалити самого себе, і bilous
    if (username.toLowerCase() === "bilous") {
      Alert?.alert?.(
        "Неможливо",
        "Акаунт bilous не можна видалити."
      );
      return false;
    }
    if (user && user.username === username) {
      Alert?.alert?.(
        "Увага",
        "Щоб видалити свій акаунт, використайте функцію видалення в налаштуваннях."
      );
      return false;
    }

    const exists = allUsers.some((u) => u.username === username);
    if (!exists) return false;

    const list = allUsers.filter((u) => u.username !== username);
    await saveUsers(list);
    return true;
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    changePassword,
    deleteAccount,
    allUsers,
    refreshUsers,
    setUserRole,
    deleteUserByAdmin,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
