import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
// No notification provider needed
import {
  User,
  Save,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
} from "lucide-react-native";
import { REGIONS } from "@/constants/regions";
// Notification component removed

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  // No notification provider needed

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    region: user?.region || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  // Notification states removed
  // Removed isSaving state

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        region: user.region || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert(t("error"), t("enterName"));
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert(t("error"), t("enterValidPhone"));
      return;
    }

    // Basic email validation if provided
    if (formData.email && !isValidEmail(formData.email)) {
      Alert.alert(t("error"), t("invalidEmail"));
      return;
    }

    setIsLoading(true);
    // Removed setIsSaving
    
    try {
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        region: formData.region,
      });

      // Notification code removed
      
      // Navigate back after a delay
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Error notification code removed
    } finally {
      setIsLoading(false);
      // Removed setIsSaving
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getRegionName = (regionKey: string) => {
    const region = REGIONS.find((r: any) => r.id === regionKey);
    return region ? t(region.nameKey) : regionKey;
  };

  const RegionPicker = () => {
    if (!showRegionPicker) return null;

    return (
      <View style={[styles.regionPicker, { backgroundColor: colors.surface }]}>
        <ScrollView style={styles.regionList}>
          {REGIONS.map((region: any) => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.regionItem,
                formData.region === region.id && {
                  backgroundColor: colors.primary + "20",
                },
              ]}
              onPress={() => {
                setFormData({ ...formData, region: region.id });
                setShowRegionPicker(false);
              }}
            >
              <Text
                style={[
                  styles.regionText,
                  { color: colors.text },
                  formData.region === region.id && {
                    color: colors.primary,
                    fontWeight: "600",
                  },
                ]}
              >
                {t(region.nameKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t("editProfile"),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isLoading && { opacity: 0.6 },
              ]}
            >
              <Save color="#fff" size={16} />
              <Text style={styles.saveButtonText}>
                {isLoading ? t("saving") : t("save")}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("personalInformation")}
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <User color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("fullName")}
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                maxLength={50}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Phone color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("phoneNumber")}
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Mail color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("emailOptional")}
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={100}
              />
            </View>

            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.surface }]}
              onPress={() => setShowRegionPicker(!showRegionPicker)}
            >
              <MapPin color={colors.textSecondary} size={20} />
              <Text
                style={[
                  styles.input,
                  { color: formData.region ? colors.text : colors.textSecondary },
                ]}
              >
                {formData.region ? getRegionName(formData.region) : t("selectRegion")}
              </Text>
            </TouchableOpacity>

            <RegionPicker />
          </View>

          <View style={styles.section}>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              {t("profileEditHelpText")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Notification component removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerButton: {
    padding: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  regionPicker: {
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
  },
  regionList: {
    maxHeight: 200,
  },
  regionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  regionText: {
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});