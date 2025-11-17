
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Зелений фон */}
        <View style={styles.container}>
          {/* "Картка" з формою */}
          <View style={styles.card}>
            <Text style={styles.logoText}>TechNest</Text>
            <Text style={styles.subtitle}>Увійди в свій акаунт</Text>

            <View style={styles.inputsWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Пароль</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Увійти</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.secondaryText}>
                Ще немає акаунта? <Text style={styles.linkText}>Зареєструватися</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F9D58', // зелений фон
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 16,
    // тінь для iOS
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    // тінь для Android
    elevation: 6,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputsWrapper: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  primaryButton: {
    marginTop: 20,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981', // зелена кнопка
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
  },
  linkText: {
    fontWeight: '600',
    color: '#059669',
  },
});
