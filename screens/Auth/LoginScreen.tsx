// src/screens/Auth/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../../auth/AuthContext";

export const LoginScreen: React.FC<any> = ({ navigation }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Помилка", "Введіть логін і пароль");
      return;
    }

    const success = await login(username, password);
    if (!success) {
      Alert.alert("Помилка", "Невірний логін або пароль");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 24 }}>
        Вхід до системи
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

      <Button title="Увійти" onPress={handleLogin} />

      <View style={{ marginTop: 16 }}>
        <Button
          title="Немає акаунта? Зареєструватися"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </View>
  );
};
