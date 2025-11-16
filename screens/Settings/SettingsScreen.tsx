// src/screens/Settings/SettingsScreen.tsx
import React from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../../auth/AuthContext";

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 16 }}>
        Налаштування
      </Text>

      {user && (
        <Text style={{ marginBottom: 12 }}>Ви увійшли як: {user.username}</Text>
      )}

      <Button title="Вийти з акаунта" onPress={logout} />
    </View>
  );
};
