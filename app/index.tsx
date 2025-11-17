// app/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInputProps,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";

const colors = {
  bg: "#0F9D58",      // зелений фон
  card: "#ffffff",
  primary: "#10B981", // зелена кнопка
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  inputBg: "#f9fafb",
};

type LabeledInputProps = TextInputProps & {
  label: string;
};

const LabeledInput: React.FC<LabeledInputProps> = ({ label, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text
      style={{
        marginBottom: 4,
        fontSize: 14,
        color: colors.muted,
        fontWeight: "500",
      }}
    >
      {label}
    </Text>
    <TextInput
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.inputBg,
          fontSize: 16,
          color: colors.text,
        },
        props.style,
      ]}
      placeholderTextColor={colors.muted}
    />
  </View>
);

const PrimaryButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
}> = ({ title, onPress, variant = "primary" }) => {
  let backgroundColor = "transparent";
  let textColor = colors.primary;
  let borderColor = "transparent";

  if (variant === "primary") {
    backgroundColor = colors.primary;
    textColor = "#ffffff";
  } else if (variant === "secondary") {
    backgroundColor = "#ffffff";
    textColor = colors.primary;
    borderColor = colors.primary;
  } else if (variant === "ghost") {
    backgroundColor = "transparent";
    textColor = "#ffffff";
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor,
        borderWidth: borderColor === "transparent" ? 0 : 1,
        borderColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: textColor,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default function Index() {
  const { user, loading, login, register, logout } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setPassword2("");
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Помилка", "Введіть логін і пароль");
      return;
    }
    const ok = await login(username.trim(), password);
    if (!ok) {
      Alert.alert("Помилка", "Невірний логін або пароль");
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !password2) {
      Alert.alert("Помилка", "Заповніть усі поля");
      return;
    }
    if (password !== password2) {
      Alert.alert("Помилка", "Паролі не співпадають");
      return;
    }

    const ok = await register(username.trim(), password);
    if (!ok) {
      Alert.alert(
        "Помилка",
        "Не вдалося зареєструвати (можливо, логін уже існує)"
      );
      return;
    }

    resetForm();
  };

  // ---------- ЛОАДЕР ----------
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18, color: "#ECFDF5" }}>Завантаження...</Text>
      </View>
    );
  }

  // ---------- ГОЛОВНИЙ ЕКРАН (залогінений) ----------
  if (user) {
    const menuItems = [
      "Активи",
      "Підтримка",
      "Адміністрування",
      "Інструменти",
      "Налаштування",
    ];

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Хедер */}
        <View
          style={{
            paddingTop: 40,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
            <Ionicons name="menu" size={28} color="#ECFDF5" />
          </TouchableOpacity>
          <Text
            style={{
              marginLeft: 12,
              fontSize: 20,
              fontWeight: "700",
              color: "#ECFDF5",
            }}
          >
            TechNest
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Привіт, {user.username}! 👋
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                marginBottom: 16,
              }}
            >
              Це стартовий екран мобільного застосунку{"\n"}
              ведення технічної документації щодо{"\n"}
              експлуатації матеріально-технічного забезпечення.
            </Text>

            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                marginBottom: 16,
                backgroundColor: "#F9FAFB",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                Далі плануємо реалізувати:
              </Text>
              <Text style={{ color: colors.muted, marginBottom: 4 }}>
                • Облік обладнання (назва, інв. номер, місце, стан)
              </Text>
              <Text style={{ color: colors.muted, marginBottom: 4 }}>
                • Привʼязку технічних документів до кожної одиниці МТЗ
              </Text>
              <Text style={{ color: colors.muted }}>
                • Журнал обслуговувань, ремонтів та оглядів
              </Text>
            </View>

            <PrimaryButton title="Вийти з акаунта" onPress={logout} />
          </View>
        </ScrollView>

        {/* Сайд-меню */}
        {isMenuOpen && (
          <View style={StyleSheet.absoluteFillObject}>
            {/* напівпрозорий фон */}
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
              activeOpacity={1}
              onPress={() => setIsMenuOpen(false)}
            />

            {/* панель зліва */}
            <View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: "70%",
                backgroundColor: "#ffffff",
                paddingTop: 48,
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  marginBottom: 24,
                  color: colors.text,
                }}
              >
                Меню
              </Text>

              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={{ paddingVertical: 12 }}
                  onPress={() => {
                    // тут потім вставиш навігацію на екрани
                    Alert.alert(item, "Тут буде перехід на відповідний екран");
                    setIsMenuOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.text }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  // ---------- ЛОГІН / РЕЄСТРАЦІЯ ----------
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 24, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: "#ECFDF5",
              letterSpacing: 1,
            }}
          >
            TechNest
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#D1FAE5",
              marginTop: 4,
              textAlign: "center",
            }}
          >
            Мобільний застосунок для ведення{"\n"}
            технічної документації МТЗ
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            {mode === "login"
              ? "Вхід до системи"
              : "Реєстрація користувача"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {mode === "login"
              ? "Увійдіть, щоб працювати з технічною документацією."
              : "Створіть локальний акаунт для роботи з додатком."}
          </Text>

          <LabeledInput
            label="Логін"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="Наприклад, tech_user"
          />

          <LabeledInput
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Введіть пароль"
          />

          {mode === "register" && (
            <LabeledInput
              label="Повторіть пароль"
              value={password2}
              onChangeText={setPassword2}
              secureTextEntry
              placeholder="Повторіть пароль"
            />
          )}

          <View style={{ marginTop: 8 }}>
            {mode === "login" ? (
              <PrimaryButton title="Увійти" onPress={handleLogin} />
            ) : (
              <PrimaryButton
                title="Зареєструватися"
                onPress={handleRegister}
              />
            )}
          </View>

          <View
            style={{
              marginTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 12,
              alignItems: "center",
            }}
          >
            {mode === "login" ? (
              <>
                <Text style={{ color: colors.muted, marginBottom: 8 }}>
                  Немає акаунта?
                </Text>
                <PrimaryButton
                  title="Створити акаунт"
                  onPress={() => {
                    setMode("register");
                    setPassword("");
                    setPassword2("");
                  }}
                  variant="secondary"
                />
              </>
            ) : (
              <>
                <Text style={{ color: colors.muted, marginBottom: 8 }}>
                  Вже є акаунт?
                </Text>
                <PrimaryButton
                  title="Увійти"
                  onPress={() => {
                    setMode("login");
                    setPassword("");
                    setPassword2("");
                  }}
                  variant="ghost"
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
