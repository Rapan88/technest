// app/index.tsx
import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthContext";

const colors = {
  bg: "#0F9D58", // зелений фон
  card: "#ffffff",
  primary: "#10B981", // зелена кнопка
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  inputBg: "#f9fafb",
};

type Section =
  | "Головна"
  | "Активи"
  | "Підтримка"
  | "Адміністрування"
  | "Інструменти"
  | "Налаштування";

type AssetItem = {
  id: string;
  name: string;
  inventoryNumber: string;
  description?: string;
};

type AssetCategory = {
  id: string;
  title: string;
  items: AssetItem[];
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
  const {
    user,
    loading,
    login,
    register,
    logout,
    changePassword,
    deleteAccount,
  } = useAuth();

  // логін/реєстрація
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // меню / розділи
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("Головна");

  // АКТИВИ
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [assetModalMode, setAssetModalMode] = useState<
    "addCategory" | "addItem" | "editItem" | null
  >(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const [assetTitleInput, setAssetTitleInput] = useState("");
  const [assetItemNameInput, setAssetItemNameInput] = useState("");
  const [assetItemInvInput, setAssetItemInvInput] = useState("");
  const [assetItemDescInput, setAssetItemDescInput] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // НАЛАШТУВАННЯ (редагування акаунта)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

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

  // --------- АКТИВИ: модалка ---------

  const closeAssetModal = () => {
    setIsAssetModalOpen(false);
    setAssetModalMode(null);
    setAssetTitleInput("");
    setAssetItemNameInput("");
    setAssetItemInvInput("");
    setAssetItemDescInput("");
    setEditingItemId(null);
  };

  const handleSaveCategory = () => {
    const title = assetTitleInput.trim();
    if (!title) {
      Alert.alert("Помилка", "Введіть назву пункту");
      return;
    }

    setAssetCategories((prev) => [
      ...prev,
      { id: Date.now().toString(), title, items: [] },
    ]);

    closeAssetModal();
  };

  const handleSaveItem = () => {
    if (!selectedCategoryId) {
      Alert.alert("Помилка", "Спочатку оберіть пункт (категорію)");
      return;
    }

    const name = assetItemNameInput.trim();
    const inv = assetItemInvInput.trim();

    if (!name || !inv) {
      Alert.alert("Помилка", "Введіть назву та інвентарний номер");
      return;
    }

    setAssetCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== selectedCategoryId) return cat;

        if (assetModalMode === "editItem" && editingItemId) {
          return {
            ...cat,
            items: cat.items.map((item) =>
              item.id === editingItemId
                ? {
                    ...item,
                    name,
                    inventoryNumber: inv,
                    description: assetItemDescInput.trim(),
                  }
                : item
            ),
          };
        }

        const newItem: AssetItem = {
          id: Date.now().toString(),
          name,
          inventoryNumber: inv,
          description: assetItemDescInput.trim(),
        };

        return {
          ...cat,
          items: [...cat.items, newItem],
        };
      })
    );

    closeAssetModal();
  };

  // --------- АКТИВИ: збереження в AsyncStorage ---------

  // завантаження активів при вході користувача
  useEffect(() => {
    if (!user) {
      setAssetCategories([]);
      setSelectedCategoryId(null);
      return;
    }

    const loadAssets = async () => {
      try {
        const key = `assets_${user.username}`;
        const json = await AsyncStorage.getItem(key);
        if (json) {
          const parsed = JSON.parse(json) as AssetCategory[];
          setAssetCategories(parsed);
        }
      } catch (e) {
        console.warn("Не вдалося завантажити активи", e);
      }
    };

    loadAssets();
  }, [user?.username]);

  // збереження активів при зміні
  useEffect(() => {
    if (!user) return;

    const saveAssets = async () => {
      try {
        const key = `assets_${user.username}`;
        await AsyncStorage.setItem(key, JSON.stringify(assetCategories));
      } catch (e) {
        console.warn("Не вдалося зберегти активи", e);
      }
    };

    saveAssets();
  }, [assetCategories, user?.username]);

  // --------- НАЛАШТУВАННЯ: акаунт ---------

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Помилка", "Заповніть усі поля для зміни пароля");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Помилка", "Нові паролі не співпадають");
      return;
    }

    const ok = await changePassword(currentPassword, newPassword);
    if (!ok) {
      Alert.alert(
        "Помилка",
        "Не вдалося змінити пароль. Перевірте поточний пароль."
      );
      return;
    }

    Alert.alert("Успіх", "Пароль успішно змінено");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Підтвердження",
      "Ви впевнені, що хочете видалити акаунт? Цю дію неможливо скасувати.",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Видалити",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteAccount();
            if (!ok) {
              Alert.alert(
                "Помилка",
                "Не вдалося видалити акаунт. Спробуйте пізніше."
              );
              return;
            }
            Alert.alert("Готово", "Акаунт успішно видалено");
          },
        },
      ]
    );
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
    const menuItems: Section[] = [
      "Головна",
      "Активи",
      "Підтримка",
      "Адміністрування",
      "Інструменти",
      "Налаштування",
    ];

    const renderSectionContent = () => {
      switch (activeSection) {
        case "Головна":
          return (
            <>
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
                  marginTop: 4,
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
            </>
          );

        case "Активи": {
          const currentCategory = selectedCategoryId
            ? assetCategories.find((c) => c.id === selectedCategoryId) ?? null
            : null;

          if (!currentCategory) {
            return (
              <>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Активи
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    marginBottom: 12,
                  }}
                >
                  Пункт — це категорія (наприклад, "Комп’ютери"), а підпункти —
                  конкретні одиниці обладнання.
                </Text>

                {assetCategories.length === 0 ? (
                  <Text style={{ color: colors.muted }}>
                    Поки що немає жодного пункту. Натисніть кнопку "+" у
                    верхньому правому куті, щоб додати перший пункт.
                  </Text>
                ) : (
                  assetCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        marginTop: 8,
                      }}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {cat.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          marginTop: 2,
                        }}
                      >
                        Підпунктів: {cat.items.length}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            );
          }

          return (
            <>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
                onPress={() => setSelectedCategoryId(null)}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.muted}
                />
                <Text
                  style={{
                    marginLeft: 4,
                    color: colors.muted,
                    fontSize: 14,
                  }}
                >
                  До списку активів
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {currentCategory.title}
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  marginBottom: 12,
                }}
              >
                Підпункти — конкретні одиниці обладнання. Натисніть на елемент,
                щоб відредагувати його.
              </Text>

              {currentCategory.items.length === 0 ? (
                <Text style={{ color: colors.muted }}>
                  Поки що немає жодного підпункту. Натисніть кнопку "+" у
                  верхньому правому куті, щоб додати.
                </Text>
              ) : (
                currentCategory.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginTop: 8,
                    }}
                    onPress={() => {
                      setAssetModalMode("editItem");
                      setEditingItemId(item.id);
                      setAssetItemNameInput(item.name);
                      setAssetItemInvInput(item.inventoryNumber);
                      setAssetItemDescInput(item.description ?? "");
                      setIsAssetModalOpen(true);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                    >
                      Інвентарний номер: {item.inventoryNumber}
                    </Text>
                    {item.description ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                          marginTop: 2,
                        }}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </>
          );
        }

        case "Підтримка":
          return (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Підтримка
              </Text>
              <Text style={{ color: colors.muted }}>
                Журнал звернень, заявки на ремонт, історія обслуговувань.
                Детальна реалізація — пізніше.
              </Text>
            </>
          );

        case "Адміністрування":
          return (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Адміністрування
              </Text>
              <Text style={{ color: colors.muted }}>
                Керування користувачами, ролями, правами доступу та
                конфігурацією системи.
              </Text>
            </>
          );

        case "Інструменти":
          return (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Інструменти
              </Text>
              <Text style={{ color: colors.muted }}>
                Додаткові модулі: імпорт/експорт даних, генерація звітів,
                статистика.
              </Text>
            </>
          );

        case "Налаштування":
          return (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Налаштування
              </Text>
              <Text style={{ color: colors.muted, marginBottom: 12 }}>
                Керування акаунтом поточного користувача.
              </Text>

              <View style={{ marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 8,
                    color: colors.text,
                  }}
                >
                  Редагувати акаунт
                </Text>

                <LabeledInput
                  label="Поточний пароль"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Введіть поточний пароль"
                />

                <LabeledInput
                  label="Новий пароль"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Введіть новий пароль"
                />

                <LabeledInput
                  label="Повторіть новий пароль"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry
                  placeholder="Повторіть новий пароль"
                />

                <PrimaryButton
                  title="Зберегти новий пароль"
                  onPress={handleChangePassword}
                />
              </View>

              <View style={{ marginTop: 24 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    marginBottom: 8,
                    color: colors.text,
                  }}
                >
                  Дії з акаунтом
                </Text>

                <View style={{ marginBottom: 8 }}>
                  <PrimaryButton
                    title="Видалити акаунт"
                    onPress={handleDeleteAccount}
                    variant="secondary"
                  />
                </View>

                <PrimaryButton
                  title="Вийти з акаунта"
                  onPress={logout}
                  variant="ghost"
                />
              </View>
            </>
          );

        default:
          return null;
      }
    };

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

          {activeSection === "Активи" && (
            <TouchableOpacity
              style={{ marginLeft: "auto" }}
              onPress={() => {
                if (selectedCategoryId) {
                  // додати підпункт
                  setAssetModalMode("addItem");
                  setAssetItemNameInput("");
                  setAssetItemInvInput("");
                  setAssetItemDescInput("");
                } else {
                  // додати пункт
                  setAssetModalMode("addCategory");
                  setAssetTitleInput("");
                }
                setEditingItemId(null);
                setIsAssetModalOpen(true);
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={26}
                color="#ECFDF5"
              />
            </TouchableOpacity>
          )}
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
            {renderSectionContent()}
          </View>
        </ScrollView>

        {/* Сайд-меню */}
        {isMenuOpen && (
          <View style={StyleSheet.absoluteFillObject}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
              activeOpacity={1}
              onPress={() => setIsMenuOpen(false)}
            />
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

              {menuItems.map((item) => {
                const isActive = item === activeSection;

                return (
                  <TouchableOpacity
                    key={item}
                    style={{ paddingVertical: 12 }}
                    onPress={() => {
                      setActiveSection(item);
                      setIsMenuOpen(false);
                      if (item !== "Активи") {
                        setSelectedCategoryId(null);
                      }
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: isActive ? colors.primary : colors.text,
                        fontWeight: isActive ? "700" : "400",
                      }}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Модалка для додавання / редагування пунктів і підпунктів */}
        {isAssetModalOpen && assetModalMode && (
          <View style={StyleSheet.absoluteFillObject}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
              activeOpacity={1}
              onPress={closeAssetModal}
            />
            <View
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                top: "25%",
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 12,
                  color: colors.text,
                  textAlign: "center",
                }}
              >
                {assetModalMode === "addCategory"
                  ? "Новий пункт"
                  : assetModalMode === "addItem"
                  ? "Новий підпункт"
                  : "Редагування підпункту"}
              </Text>

              {assetModalMode === "addCategory" ? (
                <LabeledInput
                  label="Назва пункту"
                  value={assetTitleInput}
                  onChangeText={setAssetTitleInput}
                  placeholder="Наприклад, Комп’ютери"
                />
              ) : (
                <>
                  <LabeledInput
                    label="Назва обладнання"
                    value={assetItemNameInput}
                    onChangeText={setAssetItemNameInput}
                    placeholder="Наприклад, ПК Dell 01"
                  />
                  <LabeledInput
                    label="Інвентарний номер"
                    value={assetItemInvInput}
                    onChangeText={setAssetItemInvInput}
                    placeholder="Наприклад, INV-001"
                  />
                  <LabeledInput
                    label="Опис (необов'язково)"
                    value={assetItemDescInput}
                    onChangeText={setAssetItemDescInput}
                    placeholder="Місце розташування, стан тощо"
                  />
                </>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <View style={{ marginRight: 8 }}>
                  <PrimaryButton
                    title="Скасувати"
                    onPress={closeAssetModal}
                    variant="secondary"
                  />
                </View>
                <PrimaryButton
                  title="Зберегти"
                  onPress={
                    assetModalMode === "addCategory"
                      ? handleSaveCategory
                      : handleSaveItem
                  }
                />
              </View>
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
