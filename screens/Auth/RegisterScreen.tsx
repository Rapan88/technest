// src/screens/Auth/RegisterScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../../auth/AuthContext";

export const RegisterScreen: React.FC<any> = ({ navigation }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const handleRegister = async () => {
    if (!username || !password || !password2) {
      Alert.alert("Помилка", "Заповніть всі поля");
      return;
    }
    if (password !== password2) {
      Alert.alert("Помилка", "Паролі не співпадають");
      return;
    }

    const success = await register(username, password);
    if (!success) {
      Alert.alert(
        "Помилка",
        "Не вдалося зареєструвати (можливо, логін уже існує)"
      );
      return;
    }

    // Якщо все ок — AuthContext вже залогінить і тебе перекине на Main
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 24 }}>
        Реєстрація
      </Text>

      <Text>Логін</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 8,
          marginBottom: 12,
        }}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <Text>Пароль</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 8,
          marginBottom: 12,
        }}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text>Повторіть пароль</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 8,
          marginBottom: 12,
        }}
        value={password2}
        onChangeText={setPassword2}
        secureTextEntry
      />

      <Button title="Зареєструватися" onPress={handleRegister} />
    </View>
  );
};
