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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as MailComposer from "expo-mail-composer";
import QRCode from "react-native-qrcode-svg";
// import { BarCodeScanner } from "expo-barcode-scanner";

import { useAuth } from "../auth/AuthContext";

// ----------- ТЕМА (темно-зелена) -----------
const colors = {
  bg: "#022C22",
  card: "#064E3B",
  primary: "#22C55E",
  text: "#ECFDF5",
  muted: "#6EE7B7",
  border: "#115E3B",
  inputBg: "#022C22",
};

type Section =
  | "Головна"
  | "Активи"
  | "AI-помічник"
  | "Підтримка"
  | "Адміністрування"
  | "Друк"
  | "Сканер"
  | "Налаштування";

type AssetDocument = {
  id: string;
  name: string;
  path: string;
};

type AssetServiceRecord = {
  id: string;
  serviceType: string;
  date: string;
  mileageHours: string;
  workList: string;
  partsList: string;
  responsible: string;
  nextService: string;
  comment: string;
  photoUri?: string;
};

type AssetItem = {
  id: string;
  qrCode?: string; // постійний QR-код для даного активу
  name: string;
  inventoryNumber: string;
  description?: string;

  model?: string;
  serialNumber?: string;
  status?: string;
  room?: string;
  responsible?: string;
  phone?: string;
  group?: string;
  comments?: string;
  photoUri?: string;

  documents?: AssetDocument[];
  serviceHistory?: AssetServiceRecord[];
};

type AssetCategory = {
  id: string;
  title: string;
  items: AssetItem[];
};

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "Відкрито" | "В роботі" | "Закрито";
  createdAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

// ====== НАЛАШТУВАННЯ OPENAI ======
const OPENAI_MODEL = "gpt-4.1-mini"; // легший і дешевший, але норм для чату

// демо-активи (5 пунктів по 15 записів)
const createDemoAssets = (): AssetCategory[] => {
  const defs = [
    { id: "cat-pc", title: "Комп'ютери", prefix: "PC" },
    { id: "cat-prn", title: "Принтери та МФП", prefix: "PRN" },
    { id: "cat-net", title: "Мережеве обладнання", prefix: "NET" },
    { id: "cat-car", title: "Транспорт", prefix: "CAR" },
    { id: "cat-oth", title: "Інше обладнання", prefix: "OTH" },
  ];

  return defs.map((def) => {
    const items: AssetItem[] = [];
    for (let i = 1; i <= 15; i++) {
      const num2 = i.toString().padStart(2, "0");
      const num3 = i.toString().padStart(3, "0");
      items.push({
        id: `${def.prefix}-${num3}`,
        qrCode: `TN-${def.prefix}-${num3}`, // для демо одразу є QR
        name: `${def.title} ${num2}`,
        inventoryNumber: `INV-${def.prefix}-${num3}`,
        description: "Демонстраційний запис активу.",
        status: i % 3 === 0 ? "В ремонті" : "В експлуатації",
        room: `Кімната ${100 + i}`,
        responsible: i % 2 === 0 ? "Ст. сержант Іванов" : "Сержант Петренко",
        phone: "+380671234567",
        group: def.title,
        comments:
          "Це тестовий запис. Ви можете змінити або видалити його при потребі.",
        documents: [],
        serviceHistory: [],
      });
    }
    return { id: def.id, title: def.title, items };
  });
};

type LabeledInputProps = TextInputProps & { label: string };

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
  variant?: "primary" | "secondary" | "ghost" | "danger";
}> = ({ title, onPress, variant = "primary" }) => {
  let backgroundColor = "transparent";
  let textColor = colors.primary;
  let borderColor = "transparent";

  if (variant === "primary") {
    backgroundColor = colors.primary;
    textColor = colors.bg;
  } else if (variant === "secondary") {
    backgroundColor = "transparent";
    textColor = colors.primary;
    borderColor = colors.primary;
  } else if (variant === "ghost") {
    backgroundColor = "transparent";
    textColor = colors.text;
  } else if (variant === "danger") {
    backgroundColor = "transparent";
    textColor = "#F97373";
    borderColor = "#F97373";
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

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
}> = ({ label, value, subtitle }) => (
  <View
    style={{
      flex: 1,
      minWidth: "45%",
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      margin: 4,
    }}
  >
    <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
      {value}
    </Text>
    {subtitle ? (
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

export default function Index() {
  const {
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // фільтр / пошук
  const [assetSearchText, setAssetSearchText] = useState("");
  const [assetStatusFilter, setAssetStatusFilter] = useState<
    "all" | "inUse" | "inRepair" | "noStatus"
  >("all");

  // детальна сторінка активу
  const [activeAssetTab, setActiveAssetTab] = useState<
    "info" | "docs" | "service"
  >("info");
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [assetEditBackup, setAssetEditBackup] = useState<AssetItem | null>(
    null
  );
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [showAssetQr, setShowAssetQr] = useState(false);

  // модалка додавання пункту / підпункту
  const [assetModalMode, setAssetModalMode] = useState<
    "addCategory" | "addItem" | "editItem" | null
  >(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const [assetTitleInput, setAssetTitleInput] = useState("");
  const [assetItemNameInput, setAssetItemNameInput] = useState("");
  const [assetItemInvInput, setAssetItemInvInput] = useState("");
  const [assetItemDescInput, setAssetItemDescInput] = useState("");
  const [editingItemIdModal, setEditingItemIdModal] = useState<string | null>(
    null
  );

  // форма обслуговування
  const [newServiceType, setNewServiceType] = useState("");
  const [newServiceDate, setNewServiceDate] = useState("");
  const [newServiceMileage, setNewServiceMileage] = useState("");
  const [newServiceWork, setNewServiceWork] = useState("");
  const [newServiceParts, setNewServiceParts] = useState("");
  const [newServiceResponsible, setNewServiceResponsible] = useState("");
  const [newServiceNext, setNewServiceNext] = useState("");
  const [newServiceComment, setNewServiceComment] = useState("");
  const [newServicePhoto, setNewServicePhoto] = useState("");

  // вибір активів для експорту
  const [selectedExportAssetIds, setSelectedExportAssetIds] = useState<
    string[]
  >([]);

  // налаштування акаунта
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPasswordAcc, setNewPasswordAcc] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // підтримка
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // сканер
  const [hasCameraPermission, setHasCameraPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [qrScanned, setQrScanned] = useState(false);
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);

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
    if (!ok) Alert.alert("Помилка", "Невірний логін або пароль");
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

  const closeAssetModal = () => {
    setIsAssetModalOpen(false);
    setAssetModalMode(null);
    setAssetTitleInput("");
    setAssetItemNameInput("");
    setAssetItemInvInput("");
    setAssetItemDescInput("");
    setEditingItemIdModal(null);
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

  const handleSaveItemModal = () => {
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

        if (assetModalMode === "editItem" && editingItemIdModal) {
          return {
            ...cat,
            items: cat.items.map((item) =>
              item.id === editingItemIdModal
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
          documents: [],
          serviceHistory: [],
        };

        return { ...cat, items: [...cat.items, newItem] };
      })
    );

    closeAssetModal();
  };

  const updateCurrentItem = (updater: (item: AssetItem) => AssetItem) => {
    if (!selectedCategoryId || !selectedItemId) return;

    setAssetCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== selectedCategoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((it) =>
            it.id === selectedItemId ? updater(it) : it
          ),
        };
      })
    );
  };

  // фото для активу
  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Доступ заборонено",
        "Надайте доступ до галереї, щоб обрати фото."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      updateCurrentItem((item) => ({ ...item, photoUri: uri }));
    }
  };

  const takePhotoWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Доступ заборонено",
        "Надайте доступ до камери, щоб зробити фото."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      updateCurrentItem((item) => ({ ...item, photoUri: uri }));
    }
  };

  // документи
  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const doc: AssetDocument = {
        id: Date.now().toString(),
        name: asset.name ?? "Документ",
        path: asset.uri,
      };

      updateCurrentItem((item) => ({
        ...item,
        documents: [...(item.documents ?? []), doc],
      }));
    } catch (e) {
      console.warn("Помилка при виборі документа:", e);
      Alert.alert("Помилка", "Не вдалося завантажити документ");
    }
  };

  const handleOpenDocument = async (doc: AssetDocument) => {
    try {
      if (!doc.path) {
        Alert.alert(
          "Помилка",
          "Не вдалося відкрити документ: відсутній шлях до файлу"
        );
        return;
      }

      const uri = doc.path;

      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        await WebBrowser.openBrowserAsync(uri);
        return;
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          "Помилка",
          "Відкриття локальних PDF не підтримується на цій платформі."
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Відкрити PDF-документ",
      });
    } catch (e) {
      console.warn("Помилка при відкритті документа:", e);
      Alert.alert("Помилка", "Не вдалося відкрити документ");
    }
  };

  const handleDeleteDocument = (id: string) => {
    updateCurrentItem((item) => ({
      ...item,
      documents: (item.documents ?? []).filter((d) => d.id !== id),
    }));
  };

  // AsyncStorage: активи + підтримка
  useEffect(() => {
    if (!user) {
      setAssetCategories([]);
      setSelectedCategoryId(null);
      setSelectedItemId(null);
      setIsEditingAsset(false);
      setIsAddingService(false);
      setEditingServiceId(null);
      setAssetEditBackup(null);
      setSelectedExportAssetIds([]);
      setTickets([]);
      setShowAssetQr(false);
      setHasCameraPermission("unknown");
      setQrScanned(false);
      setLastScannedValue(null);
      return;
    }

    const load = async () => {
      try {
        const key = `assets_${user.username}`;
        const json = await AsyncStorage.getItem(key);

        if (json) {
          const parsed = JSON.parse(json) as AssetCategory[];
          setAssetCategories(parsed);
        } else {
          const demo = createDemoAssets();
          setAssetCategories(demo);
        }
      } catch (e) {
        console.warn("Не вдалося завантажити активи", e);
      }

      try {
        const keySupport = `support_${user.username}`;
        const js = await AsyncStorage.getItem(keySupport);
        if (js) setTickets(JSON.parse(js) as SupportTicket[]);
      } catch (e) {
        console.warn("Не вдалося завантажити звернення", e);
      }
    };

    load();
  }, [user?.username]);

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

  useEffect(() => {
    if (!user) return;
    const saveTickets = async () => {
      try {
        const key = `support_${user.username}`;
        await AsyncStorage.setItem(key, JSON.stringify(tickets));
      } catch (e) {
        console.warn("Не вдалося зберегти звернення", e);
      }
    };
    saveTickets();
  }, [tickets, user?.username]);

  // дозвіл на камеру для сканера
  useEffect(() => {
    if (
      user &&
      activeSection === "Сканер" &&
      hasCameraPermission === "unknown"
    ) {
      (async () => {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasCameraPermission(status === "granted" ? "granted" : "denied");
        } catch (e) {
          console.warn("Помилка запиту доступу до камери:", e);
          setHasCameraPermission("denied");
        }
      })();
    }
  }, [user, activeSection, hasCameraPermission]);

  // налаштування акаунта
  const handleChangePassword = async () => {
    if (!currentPassword || !newPasswordAcc || !confirmNewPassword) {
      Alert.alert("Помилка", "Заповніть усі поля для зміни пароля");
      return;
    }
    if (newPasswordAcc !== confirmNewPassword) {
      Alert.alert("Помилка", "Нові паролі не співпадають");
      return;
    }

    const ok = await changePassword(currentPassword, newPasswordAcc);
    if (!ok) {
      Alert.alert(
        "Помилка",
        "Не вдалося змінити пароль. Перевірте поточний пароль."
      );
      return;
    }

    Alert.alert("Успіх", "Пароль успішно змінено");
    setCurrentPassword("");
    setNewPasswordAcc("");
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

  // підтримка: створення звернення + email
  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert("Помилка", "Вкажіть тему і опис звернення");
      return;
    }

    const t: SupportTicket = {
      id: Date.now().toString(),
      subject: ticketSubject.trim(),
      category: ticketCategory.trim() || "Загальне питання",
      message: ticketMessage.trim(),
      status: "Відкрито",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setTickets((prev) => [t, ...prev]);
    setTicketSubject("");
    setTicketCategory("");
    setTicketMessage("");

    // формуємо листа
    try {
      const available = await MailComposer.isAvailableAsync();
      if (available) {
        await MailComposer.composeAsync({
          recipients: ["svatik.bs@gmail.com"],
          subject: `TechNest – звернення: ${t.subject}`,
          body:
            `Користувач: ${user?.username ?? "невідомий"}\n` +
            `Категорія: ${t.category}\n` +
            `Дата: ${t.createdAt}\n\n` +
            `Опис:\n${t.message}\n`,
        });
        Alert.alert(
          "Звернення створено",
          "Запит збережено в додатку та відкрито лист на електронну пошту."
        );
      } else {
        Alert.alert(
          "Звернення створено",
          "Запит збережено в додатку, але відправити email з цього пристрою неможливо."
        );
      }
    } catch (e) {
      console.warn("Помилка відправки email:", e);
      Alert.alert(
        "Звернення створено",
        "Запит збережено, але при відкритті пошти сталася помилка."
      );
    }
  };

  const toggleTicketStatus = (id: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status:
                t.status === "Відкрито"
                  ? "В роботі"
                  : t.status === "В роботі"
                  ? "Закрито"
                  : "Відкрито",
            }
          : t
      )
    );
  };
  // ================= AI-ПОМІЧНИК =================

  // Виклик до OpenAI API
  const callAiAssistant = async (userMessage: string): Promise<string> => {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "ВСТАВ_СВІЙ_API_КЛЮЧ_ТУТ") {
      return (
        "AI-помічник ще не налаштований. " +
        "Вкажіть свій OPENAI_API_KEY у константі OPENAI_API_KEY в файлі app/index.tsx."
      );
    }

    // Формуємо короткий опис активів (щоб модель щось знала про базу)
    const categorySummaries = assetCategories
      .slice(0, 10) // щоб не посилати забагато
      .map((cat) => {
        const count = cat.items.length;
        return `• ${cat.title}: ${count} од.`;
      })
      .join("\n");

    const systemPrompt =
      "Ти асистент з технічного обслуговування для мобільного застосунку " +
      "ведення документації щодо експлуатації матеріально-технічного забезпечення (MTЗ). " +
      "Відповідай українською, коротко й по суті. Якщо потрібні інструкції, давай їх по кроках.";

    const userContent =
      `Питання користувача:\n${userMessage}\n\n` +
      `Короткий опис активів з бази:\n${
        categorySummaries || "Активи відсутні."
      }`;

    const body = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("OpenAI error:", errorText);
      return (
        "Не вдалося отримати відповідь від AI-помічника. " +
        "Перевірте інтернет та API-ключ. Код: " +
        response.status
      );
    }

    const data = await response.json();

    const content =
      data?.choices?.[0]?.message?.content?.toString?.() ||
      "Не вдалося розпізнати відповідь моделі.";
    return content;
  };

  // Надсилання повідомлення в чат
  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || isChatLoading) return;

    setChatInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const aiText = await callAiAssistant(text);

      const aiMsg: ChatMessage = {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        text: aiText,
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.warn("AI error", e);
      const aiMsg: ChatMessage = {
        id: Date.now().toString() + "-aierr",
        role: "assistant",
        text:
          "Сталася помилка при зверненні до AI-помічника. " +
          "Спробуйте ще раз пізніше.",
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // вибір активів для експорту
  const toggleExportAsset = (id: string) => {
    setSelectedExportAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const selectAllAssetsForExport = () => {
    const allIds = assetCategories.flatMap((cat) => cat.items.map((i) => i.id));
    setSelectedExportAssetIds(allIds);
  };
  const clearExportSelection = () => setSelectedExportAssetIds([]);

  const handleExportToExcel = async () => {
    try {
      const allItems = assetCategories.flatMap((cat) =>
        cat.items.map((item) => ({ catTitle: cat.title, ...item }))
      );

      if (allItems.length === 0) {
        Alert.alert("Експорт", "Немає жодного активу для експорту.");
        return;
      }

      const itemsToExport =
        selectedExportAssetIds.length === 0
          ? allItems
          : allItems.filter((i) => selectedExportAssetIds.includes(i.id));

      if (itemsToExport.length === 0) {
        Alert.alert(
          "Експорт",
          "Жоден актив не обрано. Або зніміть фільтр, або виберіть потрібні записи."
        );
        return;
      }

      const header = [
        "Пункт",
        "Найменування",
        "Модель",
        "Серійний номер",
        "Інвентарний номер",
        "Статус",
        "Приміщення",
        "Відповідальний",
        "Контактний номер",
        "Група",
        "Кількість документів",
        "Записів обслуговування",
        "Коментарі",
      ];

      const escapeCsv = (value: string | undefined | null): string => {
        const v = (value ?? "").toString();
        if (v.includes(";") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      };

      const rows = itemsToExport.map((item) => {
        const docsCount = item.documents?.length ?? 0;
        const servicesCount = item.serviceHistory?.length ?? 0;
        return [
          escapeCsv((item as any).catTitle),
          escapeCsv(item.name),
          escapeCsv(item.model),
          escapeCsv(item.serialNumber),
          escapeCsv(item.inventoryNumber),
          escapeCsv(item.status),
          escapeCsv(item.room),
          escapeCsv(item.responsible),
          escapeCsv(item.phone),
          escapeCsv(item.group),
          docsCount.toString(),
          servicesCount.toString(),
          escapeCsv(item.comments),
        ].join(";");
      });

      const csvBody = [header.join(";"), ...rows].join("\n");
      const csv = "\uFEFF" + "sep=;\n" + csvBody;

      const filename = `technest_assets_${Date.now()}.csv`;
      const uri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(uri, csv);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Експорт", "Файл збережено в пам'яті пристрою:\n" + uri);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "text/csv",
        dialogTitle: "Експорт активів у Excel (CSV)",
      });
    } catch (e) {
      console.warn("Помилка експортy:", e);
      Alert.alert("Помилка", "Не вдалося згенерувати файл для експорту.");
    }
  };

  // обробка QR-сканування
  const handleQrScanned = (data: string) => {
    setQrScanned(true);
    setLastScannedValue(data);

    let targetCat: AssetCategory | null = null;
    let targetItem: AssetItem | null = null;

    for (const cat of assetCategories) {
      const it = cat.items.find((i) => i.qrCode === data);
      if (it) {
        targetCat = cat;
        targetItem = it;
        break;
      }
    }

    if (targetCat && targetItem) {
      Alert.alert("Знайдено актив", `Відкриваємо: ${targetItem.name}`, [
        {
          text: "Відкрити",
          onPress: () => {
            setActiveSection("Активи");
            setSelectedCategoryId(targetCat!.id);
            setSelectedItemId(targetItem!.id);
            setActiveAssetTab("info");
            setIsEditingAsset(false);
            setIsAddingService(false);
            setEditingServiceId(null);
            setAssetEditBackup(null);
            setShowAssetQr(true);
          },
        },
        { text: "Скасувати", style: "cancel" },
      ]);
    } else {
      Alert.alert(
        "Не знайдено",
        "За цим QR-кодом у базі активів нічого не знайдено."
      );
    }
  };

  // ЛОАДЕР
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
        <Text style={{ fontSize: 18, color: colors.text }}>
          Завантаження...
        </Text>
      </View>
    );
  }

  // ================= ЗАЛОГІНЕНИЙ =================
  if (user) {
    const menuItems: Section[] = [
      "Головна",
      "Активи",
      "AI-помічник",
      "Підтримка",
      "Адміністрування",
      "Друк",
      "Сканер",
      "Налаштування",
    ];

    const renderSectionContent = () => {
      switch (activeSection) {
        case "Головна": {
          const totalCategories = assetCategories.length;
          let totalAssets = 0;
          let totalDocs = 0;
          let totalServiceRecords = 0;
          let assetsWithIssues = 0;
          const statusMap: Record<string, number> = {};

          const latestService: {
            assetName: string;
            date: string;
            type: string;
          }[] = [];

          assetCategories.forEach((cat) => {
            totalAssets += cat.items.length;
            cat.items.forEach((item) => {
              const docsCount = item.documents?.length ?? 0;
              const histCount = item.serviceHistory?.length ?? 0;
              totalDocs += docsCount;
              totalServiceRecords += histCount;

              const status = (item.status?.trim() || "Без статусу") as string;
              statusMap[status] = (statusMap[status] ?? 0) + 1;
              if (status.toLowerCase().includes("ремонт")) {
                assetsWithIssues += 1;
              }

              if (item.serviceHistory && item.serviceHistory.length > 0) {
                const sorted = [...item.serviceHistory].sort((a, b) =>
                  (b.date || "").localeCompare(a.date || "")
                );
                const last = sorted[0];
                latestService.push({
                  assetName: item.name,
                  date: last.date,
                  type: last.serviceType,
                });
              }
            });
          });

          const statusEntries = Object.entries(statusMap).sort(
            (a, b) => b[1] - a[1]
          );

          const categoryStats = assetCategories
            .map((cat) => {
              let assets = cat.items.length;
              let services = 0;
              cat.items.forEach((item) => {
                services += item.serviceHistory?.length ?? 0;
              });
              return { id: cat.id, title: cat.title, assets, services };
            })
            .sort((a, b) => b.assets - a.assets);

          const latest3 = latestService
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .slice(0, 3);

          return (
            <>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Панель стану активів
              </Text>

              {/* 1. Основні показники */}
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 14,
                  backgroundColor: colors.card,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginHorizontal: -4,
                  }}
                >
                  <StatCard
                    label="Активи"
                    value={totalAssets}
                    subtitle={
                      totalCategories > 0
                        ? `У ${totalCategories} пунктах`
                        : undefined
                    }
                  />
                  <StatCard
                    label="Документи"
                    value={totalDocs}
                    subtitle="Прив’язані PDF"
                  />
                  <StatCard
                    label="Записи ТО"
                    value={totalServiceRecords}
                    subtitle="ТО, ремонти, огляди"
                  />
                  <StatCard
                    label="З проблемами"
                    value={assetsWithIssues}
                    subtitle='Статус містить "ремонт"'
                  />
                </View>
              </View>

              {/* 2. Діаграма статусів */}
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 14,
                  backgroundColor: colors.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Структура за статусами
                </Text>

                {statusEntries.length === 0 ? (
                  <Text style={{ color: colors.muted }}>
                    Статуси ще не заповнені для активів.
                  </Text>
                ) : (
                  statusEntries.slice(0, 5).map(([name, count]) => {
                    const percent =
                      totalAssets > 0
                        ? Math.round((count / totalAssets) * 100)
                        : 0;

                    return (
                      <View key={name} style={{ marginBottom: 8 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.text,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {name}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.muted }}>
                            {count} од. ({percent}%)
                          </Text>
                        </View>

                        <View
                          style={{
                            height: 10,
                            borderRadius: 999,
                            backgroundColor: colors.inputBg,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              width: `${Math.min(percent, 100)}%`,
                              height: "100%",
                              backgroundColor: colors.primary,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* 3. Розподіл по пунктах */}
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 14,
                  backgroundColor: colors.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Пункти та кількість активів
                </Text>

                {categoryStats.length === 0 ? (
                  <Text style={{ color: colors.muted }}>
                    Поки що немає жодного пункту. Додайте їх у розділі "Активи".
                  </Text>
                ) : (
                  categoryStats.slice(0, 6).map((c) => {
                    const p =
                      totalAssets > 0
                        ? Math.round((c.assets / totalAssets) * 100)
                        : 0;
                    return (
                      <View key={c.id} style={{ marginBottom: 8 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.text,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {c.title}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.muted }}>
                            {c.assets} од. ({p}%)
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: colors.inputBg,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              width: `${Math.min(p, 100)}%`,
                              height: "100%",
                              backgroundColor: "#16A34A",
                            }}
                          />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* 4. Останні роботи з обслуговування */}
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  backgroundColor: colors.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Останнє обслуговування
                </Text>

                {latest3.length === 0 ? (
                  <Text style={{ color: colors.muted }}>
                    Записів обслуговування поки що немає.
                  </Text>
                ) : (
                  latest3.map((r, idx) => (
                    <View key={idx} style={{ marginBottom: 6 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.text,
                          fontWeight: "600",
                        }}
                      >
                        {r.type || "Обслуговування"} – {r.date}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.muted,
                        }}
                      >
                        Актив: {r.assetName}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          );
        }

        case "Активи": {
          const currentCategory = selectedCategoryId
            ? assetCategories.find((c) => c.id === selectedCategoryId) ?? null
            : null;

          const currentItem =
            currentCategory && selectedItemId
              ? currentCategory.items.find((i) => i.id === selectedItemId) ??
                null
              : null;

          // рівень 1: список категорій
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
                        backgroundColor: colors.inputBg,
                      }}
                      onPress={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedItemId(null);
                        setIsEditingAsset(false);
                        setIsAddingService(false);
                        setEditingServiceId(null);
                        setAssetEditBackup(null);
                        setShowAssetQr(false);
                      }}
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

          // рівень 2: список активів
          if (currentCategory && !currentItem) {
            const filteredItems = currentCategory.items.filter((item) => {
              const search = assetSearchText.trim().toLowerCase();
              const matchesSearch =
                !search ||
                item.name.toLowerCase().includes(search) ||
                item.inventoryNumber.toLowerCase().includes(search);

              let matchesStatus = true;
              const st = (item.status || "").toLowerCase();
              if (assetStatusFilter === "inUse") {
                matchesStatus = st.includes("експлуата");
              } else if (assetStatusFilter === "inRepair") {
                matchesStatus = st.includes("ремонт");
              } else if (assetStatusFilter === "noStatus") {
                matchesStatus = !item.status;
              }

              return matchesSearch && matchesStatus;
            });

            return (
              <>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setSelectedCategoryId(null);
                    setSelectedItemId(null);
                    setIsEditingAsset(false);
                    setIsAddingService(false);
                    setEditingServiceId(null);
                    setAssetEditBackup(null);
                    setShowAssetQr(false);
                  }}
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
                    До списку пунктів
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

                {/* пошук + фільтр */}
                <LabeledInput
                  label="Пошук по підпунктах"
                  value={assetSearchText}
                  onChangeText={setAssetSearchText}
                  placeholder="Назва або інвентарний номер"
                />

                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 12,
                    justifyContent: "space-between",
                  }}
                >
                  {[
                    { key: "all", label: "Всі" },
                    { key: "inUse", label: "В експлуатації" },
                    { key: "inRepair", label: "В ремонті" },
                    { key: "noStatus", label: "Без статусу" },
                  ].map((f) => {
                    const active = assetStatusFilter === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        onPress={() =>
                          setAssetStatusFilter(
                            f.key as "all" | "inUse" | "inRepair" | "noStatus"
                          )
                        }
                        style={{
                          flex: 1,
                          marginHorizontal: 4,
                          paddingVertical: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active
                            ? colors.primary
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            fontSize: 12,
                            lineHeight: 16,
                            fontWeight: active ? "600" : "500",
                            color: active ? colors.bg : colors.muted,
                          }}
                          numberOfLines={2}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredItems.length === 0 ? (
                  <Text style={{ color: colors.muted }}>
                    Нічого не знайдено за вказаними фільтрами.
                  </Text>
                ) : (
                  filteredItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        marginTop: 8,
                        backgroundColor: colors.inputBg,
                      }}
                      onPress={() => {
                        setSelectedItemId(item.id);
                        setActiveAssetTab("info");
                        setIsEditingAsset(false);
                        setIsAddingService(false);
                        setEditingServiceId(null);
                        setAssetEditBackup(null);
                        setShowAssetQr(false);
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
                    </TouchableOpacity>
                  ))
                )}
              </>
            );
          }

          // рівень 3: детальний актив
          if (currentCategory && currentItem) {
            const docs = currentItem.documents ?? [];
            const history = currentItem.serviceHistory ?? [];

            const handleGenerateQrForCurrent = () => {
              updateCurrentItem((item) => {
                if (item.qrCode) return item;
                const code = item.qrCode ?? `TN-${item.id}`;
                return { ...item, qrCode: code };
              });
              setShowAssetQr(true);
            };

            return (
              <>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setSelectedItemId(null);
                    setIsEditingAsset(false);
                    setIsAddingService(false);
                    setEditingServiceId(null);
                    setAssetEditBackup(null);
                    setShowAssetQr(false);
                  }}
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
                    marginBottom: 8,
                  }}
                >
                  {currentItem.name}
                </Text>

                {/* вкладки */}
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 12,
                    justifyContent: "space-around",
                  }}
                >
                  {[
                    { key: "info", label: "Інформація" },
                    { key: "docs", label: "Документи" },
                    { key: "service", label: "Обслуговування" },
                  ].map((tab) => {
                    const isActive = activeAssetTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => {
                          setActiveAssetTab(tab.key as any);
                          if (tab.key !== "service") {
                            setIsAddingService(false);
                            setEditingServiceId(null);
                          }
                        }}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          paddingVertical: 8,
                          paddingHorizontal: 4,
                          borderBottomWidth: isActive ? 2 : 0,
                          borderBottomColor: colors.primary,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isActive ? "700" : "500",
                            color: isActive ? colors.primary : colors.muted,
                          }}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ІНФОРМАЦІЯ */}
                {activeAssetTab === "info" && (
                  <View>
                    <LabeledInput
                      label="Найменування"
                      value={currentItem.name}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({ ...item, name: text }))
                      }
                    />
                    <LabeledInput
                      label="Модель"
                      value={currentItem.model ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({ ...item, model: text }))
                      }
                    />
                    <LabeledInput
                      label="Серійний номер"
                      value={currentItem.serialNumber ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({
                          ...item,
                          serialNumber: text,
                        }))
                      }
                    />
                    <LabeledInput
                      label="Інвентарний номер"
                      value={currentItem.inventoryNumber}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({
                          ...item,
                          inventoryNumber: text,
                        }))
                      }
                    />
                    <LabeledInput
                      label="Статус"
                      value={currentItem.status ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({ ...item, status: text }))
                      }
                    />
                    <LabeledInput
                      label="Приміщення"
                      value={currentItem.room ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({ ...item, room: text }))
                      }
                    />
                    <LabeledInput
                      label="Відповідальний"
                      value={currentItem.responsible ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({
                          ...item,
                          responsible: text,
                        }))
                      }
                    />
                    <LabeledInput
                      label="Контактний номер"
                      value={currentItem.phone ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({ ...item, phone: text }))
                      }
                    />
                    <LabeledInput
                      label="Група"
                      value={currentItem.group ?? ""}
                      editable={isEditingAsset}
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({ ...item, group: text }))
                      }
                    />

                    {/* Фото над коментарями */}
                    <Text
                      style={{
                        marginBottom: 4,
                        fontSize: 14,
                        color: colors.muted,
                        fontWeight: "500",
                      }}
                    >
                      Фото
                    </Text>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 8,
                        marginBottom: 8,
                        alignItems: "center",
                        backgroundColor: colors.inputBg,
                      }}
                    >
                      {currentItem.photoUri ? (
                        <Image
                          source={{ uri: currentItem.photoUri }}
                          style={{
                            width: 160,
                            height: 120,
                            borderRadius: 12,
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={{ color: colors.muted }}>
                          Фото ще не додано
                        </Text>
                      )}
                    </View>

                    {isEditingAsset && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            marginRight: 4,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: colors.primary,
                            alignItems: "center",
                          }}
                          onPress={pickImageFromLibrary}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontWeight: "600",
                            }}
                          >
                            Обрати фото
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            flex: 1,
                            marginLeft: 4,
                            paddingVertical: 10,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: colors.primary,
                            alignItems: "center",
                          }}
                          onPress={takePhotoWithCamera}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontWeight: "600",
                            }}
                          >
                            Зробити фото
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* QR-код */}
                    <Text
                      style={{
                        marginBottom: 4,
                        fontSize: 14,
                        color: colors.muted,
                        fontWeight: "500",
                      }}
                    >
                      QR-код активу
                    </Text>

                    {currentItem.qrCode && showAssetQr && (
                      <View
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          paddingVertical: 12,
                          marginBottom: 8,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.inputBg,
                        }}
                      >
                        <QRCode value={currentItem.qrCode} size={150} />
                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: colors.muted,
                          }}
                        >
                          {currentItem.qrCode}
                        </Text>
                      </View>
                    )}

                    <View style={{ marginBottom: 12 }}>
                      <PrimaryButton
                        title={
                          currentItem.qrCode
                            ? showAssetQr
                              ? "Сховати QR-код"
                              : "Показати QR-код"
                            : "Згенерувати QR-код"
                        }
                        onPress={() => {
                          if (!currentItem.qrCode) {
                            handleGenerateQrForCurrent();
                          } else {
                            setShowAssetQr((prev) => !prev);
                          }
                        }}
                      />
                    </View>

                    <LabeledInput
                      label="Коментарі"
                      value={currentItem.comments ?? ""}
                      editable={isEditingAsset}
                      multiline
                      onChangeText={(text) =>
                        updateCurrentItem((item) => ({
                          ...item,
                          comments: text,
                        }))
                      }
                      style={{ height: 80, textAlignVertical: "top" }}
                    />

                    {!isEditingAsset ? (
                      <View style={{ marginTop: 12 }}>
                        <PrimaryButton
                          title="Редагувати"
                          onPress={() => {
                            setAssetEditBackup(currentItem);
                            setIsEditingAsset(true);
                          }}
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          marginTop: 12,
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 4 }}>
                          <PrimaryButton
                            title="Скасувати"
                            variant="secondary"
                            onPress={() => {
                              if (assetEditBackup) {
                                updateCurrentItem(() => ({
                                  ...assetEditBackup,
                                }));
                              }
                              setIsEditingAsset(false);
                              setAssetEditBackup(null);
                            }}
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 4 }}>
                          <PrimaryButton
                            title="Зберегти"
                            onPress={() => {
                              setIsEditingAsset(false);
                              setAssetEditBackup(null);
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* ДОКУМЕНТИ */}
                {activeAssetTab === "docs" && (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.muted,
                        marginBottom: 8,
                      }}
                    >
                      Тут зберігаються PDF-документи, пов’язані з активом.
                    </Text>

                    {docs.length === 0 ? (
                      <Text style={{ color: colors.muted, marginBottom: 8 }}>
                        Документи ще не додані.
                      </Text>
                    ) : (
                      docs.map((doc) => (
                        <View
                          key={doc.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            marginBottom: 6,
                            backgroundColor: colors.inputBg,
                          }}
                        >
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => handleOpenDocument(doc)}
                          >
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: colors.text,
                              }}
                              numberOfLines={1}
                            >
                              {doc.name}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{ marginRight: 8 }}
                            onPress={() => handleOpenDocument(doc)}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color: colors.primary,
                                fontWeight: "600",
                              }}
                            >
                              Відкрити
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeleteDocument(doc.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color="#F97373"
                            />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}

                    <View style={{ marginTop: 12 }}>
                      <PrimaryButton
                        title="Завантажити документ"
                        onPress={handleUploadDocument}
                      />
                    </View>
                  </View>
                )}

                {/* ОБСЛУГОВУВАННЯ */}
                {activeAssetTab === "service" && (
                  <View>
                    <View
                      style={{
                        marginBottom: 12,
                        padding: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.inputBg,
                      }}
                    >
                      {history.length === 0 ? (
                        <Text style={{ color: colors.muted, marginBottom: 4 }}>
                          Записів про обслуговування ще немає.
                        </Text>
                      ) : (
                        history.map((rec) => (
                          <View
                            key={rec.id}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 10,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: colors.border,
                              marginBottom: 8,
                              backgroundColor: colors.card,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: colors.text,
                              }}
                            >
                              {rec.serviceType} — {rec.date}
                            </Text>
                            {rec.mileageHours ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Пробіг / мотогодини: {rec.mileageHours}
                              </Text>
                            ) : null}
                            {rec.workList ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Роботи: {rec.workList}
                              </Text>
                            ) : null}
                            {rec.partsList ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Запчастини: {rec.partsList}
                              </Text>
                            ) : null}
                            {rec.responsible ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Виконавець: {rec.responsible}
                              </Text>
                            ) : null}
                            {rec.nextService ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Наступне ТО: {rec.nextService}
                              </Text>
                            ) : null}
                            {rec.comment ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Коментар: {rec.comment}
                              </Text>
                            ) : null}
                            {rec.photoUri ? (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.muted,
                                  marginTop: 2,
                                }}
                              >
                                Фото: {rec.photoUri}
                              </Text>
                            ) : null}

                            <View style={{ marginTop: 6 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  setIsAddingService(true);
                                  setEditingServiceId(rec.id);
                                  setNewServiceType(rec.serviceType);
                                  setNewServiceDate(rec.date);
                                  setNewServiceMileage(rec.mileageHours ?? "");
                                  setNewServiceWork(rec.workList ?? "");
                                  setNewServiceParts(rec.partsList ?? "");
                                  setNewServiceResponsible(
                                    rec.responsible ?? ""
                                  );
                                  setNewServiceNext(rec.nextService ?? "");
                                  setNewServiceComment(rec.comment ?? "");
                                  setNewServicePhoto(rec.photoUri ?? "");
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: colors.primary,
                                    fontWeight: "600",
                                  }}
                                >
                                  Редагувати
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </View>

                    {!isAddingService ? (
                      <PrimaryButton
                        title="Додати запис"
                        onPress={() => {
                          setIsAddingService(true);
                          setEditingServiceId(null);
                          setNewServiceType("");
                          setNewServiceDate("");
                          setNewServiceMileage("");
                          setNewServiceWork("");
                          setNewServiceParts("");
                          setNewServiceResponsible("");
                          setNewServiceNext("");
                          setNewServiceComment("");
                          setNewServicePhoto("");
                        }}
                      />
                    ) : (
                      <View style={{ marginTop: 12 }}>
                        <LabeledInput
                          label="Тип обслуговування"
                          value={newServiceType}
                          onChangeText={setNewServiceType}
                          placeholder="Наприклад, Планове ТО"
                        />
                        <LabeledInput
                          label="Дата виконання"
                          value={newServiceDate}
                          onChangeText={setNewServiceDate}
                          placeholder="Наприклад, 20.11.2025"
                        />
                        <LabeledInput
                          label="Пробіг / мотогодини"
                          value={newServiceMileage}
                          onChangeText={setNewServiceMileage}
                          placeholder="Наприклад, 120000 км / 400 м/г"
                        />
                        <LabeledInput
                          label="Список робіт"
                          value={newServiceWork}
                          onChangeText={setNewServiceWork}
                          multiline
                          style={{ height: 70, textAlignVertical: "top" }}
                          placeholder="Які роботи виконані"
                        />
                        <LabeledInput
                          label="Список запчастин"
                          value={newServiceParts}
                          onChangeText={setNewServiceParts}
                          multiline
                          style={{ height: 70, textAlignVertical: "top" }}
                          placeholder="Які запчастини використано"
                        />
                        <LabeledInput
                          label="Відповідальний / виконавець"
                          value={newServiceResponsible}
                          onChangeText={setNewServiceResponsible}
                        />
                        <LabeledInput
                          label="Наступна дата/пробіг ТО"
                          value={newServiceNext}
                          onChangeText={setNewServiceNext}
                          placeholder="Напр., через 10 000 км або дата"
                        />
                        <LabeledInput
                          label="Фото (посилання) + коментар"
                          value={newServicePhoto}
                          onChangeText={setNewServicePhoto}
                          placeholder="Посилання на фото або опис"
                        />
                        <LabeledInput
                          label="Додатковий коментар"
                          value={newServiceComment}
                          onChangeText={setNewServiceComment}
                          multiline
                          style={{ height: 70, textAlignVertical: "top" }}
                        />

                        <View
                          style={{
                            flexDirection: "row",
                            marginTop: 8,
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 4 }}>
                            <PrimaryButton
                              title="Скасувати"
                              variant="secondary"
                              onPress={() => {
                                setIsAddingService(false);
                                setEditingServiceId(null);
                                setNewServiceType("");
                                setNewServiceDate("");
                                setNewServiceMileage("");
                                setNewServiceWork("");
                                setNewServiceParts("");
                                setNewServiceResponsible("");
                                setNewServiceNext("");
                                setNewServiceComment("");
                                setNewServicePhoto("");
                              }}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: 4 }}>
                            <PrimaryButton
                              title={
                                editingServiceId ? "Зберегти зміни" : "Зберегти"
                              }
                              onPress={() => {
                                if (
                                  !newServiceType.trim() ||
                                  !newServiceDate.trim()
                                ) {
                                  Alert.alert(
                                    "Помилка",
                                    "Вкажіть хоча б тип обслуговування і дату"
                                  );
                                  return;
                                }

                                const id =
                                  editingServiceId ?? Date.now().toString();

                                const rec: AssetServiceRecord = {
                                  id,
                                  serviceType: newServiceType.trim(),
                                  date: newServiceDate.trim(),
                                  mileageHours: newServiceMileage.trim(),
                                  workList: newServiceWork.trim(),
                                  partsList: newServiceParts.trim(),
                                  responsible: newServiceResponsible.trim(),
                                  nextService: newServiceNext.trim(),
                                  comment: newServiceComment.trim(),
                                  photoUri: newServicePhoto.trim() || undefined,
                                };

                                if (editingServiceId) {
                                  updateCurrentItem((item) => ({
                                    ...item,
                                    serviceHistory: (
                                      item.serviceHistory ?? []
                                    ).map((s) =>
                                      s.id === editingServiceId ? rec : s
                                    ),
                                  }));
                                } else {
                                  updateCurrentItem((item) => ({
                                    ...item,
                                    serviceHistory: [
                                      ...(item.serviceHistory ?? []),
                                      rec,
                                    ],
                                  }));
                                }

                                setIsAddingService(false);
                                setEditingServiceId(null);
                                setNewServiceType("");
                                setNewServiceDate("");
                                setNewServiceMileage("");
                                setNewServiceWork("");
                                setNewServiceParts("");
                                setNewServiceResponsible("");
                                setNewServiceNext("");
                                setNewServiceComment("");
                                setNewServicePhoto("");
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </>
            );
          }

          return null;
        }

        case "AI-помічник":
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
                AI-помічник (ChatGPT)
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  marginBottom: 12,
                  fontSize: 14,
                }}
              >
                Тут ви можете поставити питання щодо експлуатації та
                обслуговування техніки, пошуку активів, планування ТО тощо.
                AI-помічник використовує узагальнену інформацію з розділу
                «Активи» та модель {OPENAI_MODEL}.
              </Text>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  backgroundColor: colors.inputBg,
                  marginBottom: 12,
                  maxHeight: 360,
                }}
              >
                {chatMessages.length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 14 }}>
                    Почніть діалог, наприклад:
                    {"\n"}• "Що потрібно перевірити при ТО генератора?"
                    {"\n"}• "Як краще організувати облік комп’ютерної техніки?"
                    {"\n"}• "Скільки активів у мене в базі та які категорії?"
                  </Text>
                ) : (
                  <ScrollView>
                    {chatMessages.map((m) => (
                      <View
                        key={m.id}
                        style={{
                          alignSelf:
                            m.role === "user" ? "flex-end" : "flex-start",
                          backgroundColor:
                            m.role === "user" ? colors.primary : colors.card,
                          borderRadius: 16,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          marginBottom: 8,
                          maxWidth: "85%",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: m.role === "user" ? colors.bg : colors.muted,
                            marginBottom: 2,
                            fontWeight: "600",
                          }}
                        >
                          {m.role === "user" ? "Ви" : "AI"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: m.role === "user" ? colors.bg : colors.text,
                          }}
                        >
                          {m.text}
                        </Text>
                      </View>
                    ))}

                    {isChatLoading && (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: colors.card,
                          borderRadius: 16,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          marginBottom: 8,
                          maxWidth: "85%",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.muted,
                          }}
                        >
                          AI друкує відповідь...
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: colors.inputBg,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: colors.text,
                    paddingVertical: 6,
                  }}
                  placeholder="Ваше питання..."
                  placeholderTextColor={colors.muted}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleSendChatMessage}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={handleSendChatMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{
                    marginLeft: 8,
                    opacity: isChatLoading || !chatInput.trim() ? 0.5 : 1,
                  }}
                >
                  <Ionicons name="send" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          );

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
              <Text
                style={{
                  color: colors.muted,
                  marginBottom: 12,
                }}
              >
                Створіть звернення до служби підтримки та відстежуйте його
                статус. Звернення також буде сформоване як лист на пошту.
              </Text>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 16,
                  backgroundColor: colors.inputBg,
                }}
              >
                <LabeledInput
                  label="Тема звернення"
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                  placeholder="Наприклад, Помилка в обліку активів"
                />
                <LabeledInput
                  label="Категорія"
                  value={ticketCategory}
                  onChangeText={setTicketCategory}
                  placeholder="Наприклад, Технічна проблема / Пропозиція"
                />
                <LabeledInput
                  label="Опис проблеми"
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                  multiline
                  style={{ height: 100, textAlignVertical: "top" }}
                  placeholder="Опишіть проблему або питання"
                />
                <PrimaryButton
                  title="Надіслати звернення"
                  onPress={handleCreateTicket}
                />
              </View>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Мої звернення
              </Text>

              {tickets.length === 0 ? (
                <Text style={{ color: colors.muted }}>
                  Ви ще не створювали звернень до підтримки.
                </Text>
              ) : (
                tickets.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => toggleTicketStatus(t.id)}
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 10,
                      marginBottom: 8,
                      backgroundColor: colors.inputBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {t.subject}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                    >
                      {t.createdAt} • {t.category}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {t.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color:
                          t.status === "Закрито"
                            ? "#6EE7B7"
                            : t.status === "В роботі"
                            ? "#FACC15"
                            : "#F97373",
                        marginTop: 4,
                      }}
                    >
                      Статус: {t.status} (натисніть, щоб змінити)
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          );

        case "Адміністрування":
          if (!user || user.role !== "admin") {
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
                  Цей розділ доступний лише адміністраторам. Зверніться до
                  адміністратора системи.
                </Text>
              </>
            );
          }

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
              <Text style={{ color: colors.muted, marginBottom: 12 }}>
                Ви увійшли як адміністратор ({user.username}). Тут можна
                переглядати всіх користувачів, змінювати їх ролі та видаляти
                акаунти.
              </Text>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 12,
                  backgroundColor: colors.inputBg,
                }}
              >
                <PrimaryButton
                  title="Оновити список користувачів"
                  onPress={refreshUsers}
                />
              </View>

              {allUsers.length === 0 ? (
                <Text style={{ color: colors.muted }}>
                  Користувачів ще немає.
                </Text>
              ) : (
                allUsers.map((u) => (
                  <View
                    key={u.username}
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 10,
                      marginBottom: 8,
                      backgroundColor: colors.inputBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.text,
                      }}
                    >
                      {u.username}
                      {u.username.toLowerCase() === "bilous"
                        ? " (головний адмін)"
                        : ""}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginTop: 2,
                      }}
                    >
                      Роль:{" "}
                      {u.role === "admin" ? "Адміністратор" : "Користувач"}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 8,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 4 }}>
                        <PrimaryButton
                          title={
                            u.role === "admin"
                              ? "Зробити користувачем"
                              : "Зробити адміністратором"
                          }
                          onPress={async () => {
                            const newRole =
                              u.role === "admin" ? "user" : "admin";
                            await setUserRole(u.username, newRole);
                          }}
                          variant="secondary"
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <PrimaryButton
                          title="Видалити акаунт"
                          onPress={async () => {
                            Alert.alert(
                              "Підтвердження",
                              `Видалити акаунт користувача "${u.username}"?`,
                              [
                                { text: "Скасувати", style: "cancel" },
                                {
                                  text: "Видалити",
                                  style: "destructive",
                                  onPress: async () => {
                                    await deleteUserByAdmin(u.username);
                                  },
                                },
                              ]
                            );
                          }}
                          variant="danger"
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          );

        case "Друк": {
          const flatAssets = assetCategories.flatMap((cat) =>
            cat.items.map((item) => ({
              id: item.id,
              name: item.name,
              inventoryNumber: item.inventoryNumber,
              catTitle: cat.title,
            }))
          );

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
                Друк / Експорт
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  marginBottom: 12,
                }}
              >
                Згенеруйте CSV-файл (відкривається в Excel) з переліком активів.
                Якщо нічого не обрано — будуть експортовані всі активи.
              </Text>

              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  marginBottom: 12,
                  backgroundColor: colors.inputBg,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Вибір активів для експорту
                </Text>

                {flatAssets.length === 0 ? (
                  <Text style={{ color: colors.muted }}>
                    Активи відсутні. Додайте їх у розділі "Активи".
                  </Text>
                ) : (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 4 }}>
                        <PrimaryButton
                          title="Обрати всі"
                          onPress={selectAllAssetsForExport}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 4 }}>
                        <PrimaryButton
                          title="Очистити вибір"
                          variant="secondary"
                          onPress={clearExportSelection}
                        />
                      </View>
                    </View>

                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        marginBottom: 6,
                      }}
                    >
                      Обрано: {selectedExportAssetIds.length} з{" "}
                      {flatAssets.length} активів
                    </Text>

                    <View style={{ maxHeight: 240 }}>
                      <ScrollView>
                        {assetCategories.map((cat) => (
                          <View key={cat.id} style={{ marginBottom: 8 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: colors.text,
                                marginBottom: 4,
                              }}
                            >
                              {cat.title} ({cat.items.length})
                            </Text>

                            {cat.items.map((item) => {
                              const isSelected =
                                selectedExportAssetIds.includes(item.id);
                              return (
                                <TouchableOpacity
                                  key={item.id}
                                  onPress={() => toggleExportAsset(item.id)}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingVertical: 4,
                                  }}
                                >
                                  <Ionicons
                                    name={
                                      isSelected
                                        ? "checkbox-outline"
                                        : "square-outline"
                                    }
                                    size={18}
                                    color={
                                      isSelected ? colors.primary : colors.muted
                                    }
                                  />
                                  <View
                                    style={{
                                      marginLeft: 8,
                                      flex: 1,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 13,
                                        color: colors.text,
                                      }}
                                      numberOfLines={1}
                                    >
                                      {item.name}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: colors.muted,
                                      }}
                                      numberOfLines={1}
                                    >
                                      Інв. № {item.inventoryNumber}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>

              <PrimaryButton
                title="Експорт в Excel (CSV)"
                onPress={handleExportToExcel}
              />
            </>
          );
        }

        case "Сканер":
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
                Сканер QR-кодів
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  marginBottom: 12,
                }}
              >
                Наведіть камеру на QR-код активу TechNest, щоб швидко відкрити
                його картку.
              </Text>

              {hasCameraPermission === "denied" && (
                <Text
                  style={{
                    color: colors.muted,
                    marginBottom: 12,
                  }}
                >
                  Доступ до камери заборонено. Дайте дозвіл у налаштуваннях
                  пристрою.
                </Text>
              )}

              {hasCameraPermission === "granted" && (
                <View
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                    marginBottom: 12,
                    backgroundColor: colors.inputBg,
                  }}
                >
                  <View style={{ height: 260 }}>
                    <BarCodeScanner
                      style={{ flex: 1 }}
                      onBarCodeScanned={
                        qrScanned
                          ? undefined
                          : ({ data }) => handleQrScanned(data)
                      }
                    />
                  </View>
                </View>
              )}

              <View style={{ marginBottom: 12 }}>
                <PrimaryButton
                  title={
                    qrScanned
                      ? "Сканувати ще раз"
                      : "Оновити дозвіл / сканувати"
                  }
                  onPress={async () => {
                    setQrScanned(false);
                    setLastScannedValue(null);
                    try {
                      const { status } =
                        await BarCodeScanner.requestPermissionsAsync();
                      setHasCameraPermission(
                        status === "granted" ? "granted" : "denied"
                      );
                    } catch (e) {
                      console.warn("Помилка запиту камери:", e);
                      setHasCameraPermission("denied");
                    }
                  }}
                  variant="secondary"
                />
              </View>

              {lastScannedValue && (
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Останнє відскановане значення: {lastScannedValue}
                </Text>
              )}
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
                  value={newPasswordAcc}
                  onChangeText={setNewPasswordAcc}
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
                    variant="danger"
                  />
                </View>

                <PrimaryButton
                  title="Вийти з акаунта"
                  onPress={logout}
                  variant="secondary"
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
        {/* хедер */}
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
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={{
              marginLeft: 12,
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            TechNest
          </Text>

          {activeSection === "Активи" && !selectedItemId && (
            <TouchableOpacity
              style={{ marginLeft: "auto" }}
              onPress={() => {
                if (selectedCategoryId) {
                  setAssetModalMode("addItem");
                  setAssetItemNameInput("");
                  setAssetItemInvInput("");
                  setAssetItemDescInput("");
                } else {
                  setAssetModalMode("addCategory");
                  setAssetTitleInput("");
                }
                setEditingItemIdModal(null);
                setIsAssetModalOpen(true);
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={26}
                color={colors.text}
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
              shadowOpacity: 0.4,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }}
          >
            {renderSectionContent()}
          </View>
        </ScrollView>

        {/* сайд-меню */}
        {isMenuOpen && (
          <View style={StyleSheet.absoluteFillObject}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
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
                backgroundColor: colors.card,
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
                        setSelectedItemId(null);
                        setIsEditingAsset(false);
                        setIsAddingService(false);
                        setEditingServiceId(null);
                        setAssetEditBackup(null);
                        setShowAssetQr(false);
                      }
                      if (item !== "Сканер") {
                        setQrScanned(false);
                        setLastScannedValue(null);
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

        {/* модалка для пунктів/підпунктів */}
        {isAssetModalOpen && assetModalMode && (
          <View style={StyleSheet.absoluteFillObject}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
              activeOpacity={1}
              onPress={closeAssetModal}
            />
            <View
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                top: "25%",
                backgroundColor: colors.card,
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
                    label="Короткий опис (необов'язково)"
                    value={assetItemDescInput}
                    onChangeText={setAssetItemDescInput}
                    placeholder="Стан, місце розташування тощо"
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
                      : handleSaveItemModal
                  }
                />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ================= ЛОГІН / РЕЄСТРАЦІЯ =================
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
              color: colors.text,
              letterSpacing: 1,
            }}
          >
            TechNest
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
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
            shadowOpacity: 0.4,
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
            {mode === "login" ? "Вхід до системи" : "Реєстрація користувача"}
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
              <PrimaryButton title="Зареєструватися" onPress={handleRegister} />
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
