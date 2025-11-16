// src/screens/Home/HomeScreen.tsx
import React from "react";
import { View, Text, Button } from "react-native";

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 16 }}>
        Головний екран
      </Text>
      <Text>
        Тут потім буде список обладнання / технічної документації щодо МТЗ.
      </Text>

      <View style={{ marginTop: 24 }}>
        <Button
          title="Перейти до налаштувань"
          onPress={() => navigation.navigate("Settings")}
        />
      </View>
    </View>
  );
};
