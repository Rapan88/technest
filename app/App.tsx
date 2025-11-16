import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SQLiteProvider } from "expo-sqlite";

import { initDb } from "../db/database";
import { AuthProvider } from "../auth/AuthContext";
import { AppNavigator } from "../navigation/AppNavigator";

export default function App() {
  return (
    <SQLiteProvider databaseName="mtd_docs.db" onInit={initDb}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SQLiteProvider>
  );
}
