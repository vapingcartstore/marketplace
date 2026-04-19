import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Globe } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const router = useRouter();
  const { t, locale, toggleLocale } = useLocale();
  const { colors } = useTheme();
  const { loginAsGuest } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode] = useState("+237");

  const handleSendOTP = () => {
    if (phoneNumber.length < 9) {
      Alert.alert(t("error"), t("enterValidPhone"));
      return;
    }
    router.push({
      pathname: "/verify",
      params: { phone: countryCode + phoneNumber },
    });
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.languageToggle}
              onPress={toggleLocale}
            >
              <Globe color="#fff" size={20} />
              <Text style={styles.languageText}>
                {locale === "en" ? "FR" : "EN"}
              </Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: 'https://r2-pub.rork.com/generated-images/d124d4ce-7532-4a78-85ce-3c160a2bea53.png' }} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>CentralMarket</Text>
              <Text style={styles.subtitle}>{t("welcomeMessage")}</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>{t("phoneNumber")}</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCode}>{countryCode}</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder={t("phonePlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={9}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSendOTP}
              >
                <Text style={styles.buttonText}>{t("sendOTP")}</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t("or")}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleGuestLogin}
              >
                <Text style={styles.secondaryButtonText}>
                  {t("continueAsGuest")}
                </Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>{t("loginDisclaimer")}</Text>
              <Text style={styles.poweredBy}>Powered by Kunshort</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  languageToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  languageText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  countryCodeContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 12,
    marginRight: 8,
  },
  countryCode: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#fff",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    fontSize: 14,
  },
  disclaimer: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  poweredBy: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});