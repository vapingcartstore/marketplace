import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { login } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit)) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    // Mock verification
    if (code === "123456") {
      await login({
        id: "mock-user-id",
        phone: phone || "",
        name: "",
        avatar: null,
        isGuest: false,
        phoneVerified: true,
        verificationLevel: 'phone',
        shopfrontData: {
          enabled: false,
          isShopfront: false,
          brandName: "",
          logoImage: null,
          bannerImage: null,
          about: "",
          shopAddress: "",
          shopPhone: phone || "",
          website: "",
          email: "",
          fullAddress: "",
          socialMedia: {
            facebook: "",
            instagram: "",
            twitter: "",
            whatsapp: ""
          },
          hours: {
            mon: { closed: false, open: "09:00", close: "17:00" },
            tue: { closed: false, open: "09:00", close: "17:00" },
            wed: { closed: false, open: "09:00", close: "17:00" },
            thu: { closed: false, open: "09:00", close: "17:00" },
            fri: { closed: false, open: "09:00", close: "17:00" },
            sat: { closed: true, open: "09:00", close: "17:00" },
            sun: { closed: true, open: "09:00", close: "17:00" }
          },
          shopVerifiedLevel: "phone",
          rating: 5.0
        }
      });
      router.push("/(tabs)" as any);
    } else {
      Alert.alert(t("error"), t("invalidOTP"));
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(60);
      Alert.alert(t("success"), t("otpResent"));
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>{t("verifyPhone")}</Text>
          <Text style={styles.subtitle}>
            {t("otpSentTo")} {phone}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.resendButton, timer > 0 && styles.resendDisabled]}
            onPress={handleResend}
            disabled={timer > 0}
          >
            <Text style={styles.resendText}>
              {timer > 0 ? `${t("resendIn")} ${timer}s` : t("resendOTP")}
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>{t("otpHint")}</Text>
        </View>
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
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    position: "absolute",
    bottom: 40,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});