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
} from "react-native";
import { useAuth } from "../auth/AuthContext";

const colors = {
  bg: "#f3f4f6",
  card: "#ffffff",
  primary: "#2563eb",
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
          borderRadius: 10,
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
    textColor = colors.primary;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
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

export default function IndexScreen() {
  const { user, loading, login, register, logout } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

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

  // ---------- ЛОАДЕР ПРИ СТАРТІ ----------
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
        <Text style={{ fontSize: 18, color: colors.muted }}>
          Завантаження...
        </Text>
      </View>
    );
  }

  // ---------- ГОЛОВНИЙ ЕКРАН (користувач залогінений) ----------
  if (user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
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
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                marginBottom: 16,
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
      </View>
    );
  }

  // ---------- ЕКРАН ЛОГІН / РЕЄСТРАЦІЯ ----------
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
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
