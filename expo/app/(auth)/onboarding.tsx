import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { Camera, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { REGIONS } from "@/constants/regions";

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert(t("error"), t("enterName"));
      return;
    }
    if (!selectedRegion) {
      Alert.alert(t("error"), t("selectRegion"));
      return;
    }

    await updateProfile({
      name: name.trim(),
      region: selectedRegion,
      avatar: null,
      // Preserve existing shopfrontData if it exists
      shopfrontData: user?.shopfrontData || {
        enabled: false,
        logo: null,
        banner: null,
        about: "",
        address: "",
        workingHours: "",
        website: "",
        rating: 5.0
      }
    });

    router.replace("/(tabs)");
  };

  const themedStyles = styles(colors);

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={themedStyles.gradient}
    >
      <SafeAreaView style={themedStyles.container}>
        <ScrollView
          contentContainerStyle={themedStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={themedStyles.title}>{t("completeProfile")}</Text>
          <Text style={themedStyles.subtitle}>{t("profileSubtitle")}</Text>

          <TouchableOpacity style={themedStyles.avatarContainer}>
            <View style={themedStyles.avatarPlaceholder}>
              <User color="rgba(255,255,255,0.5)" size={40} />
            </View>
            <View style={themedStyles.cameraIcon}>
              <Camera color="#fff" size={16} />
            </View>
          </TouchableOpacity>

          <View style={themedStyles.formContainer}>
            <Text style={themedStyles.label}>{t("fullName")}</Text>
            <TextInput
              style={themedStyles.input}
              placeholder={t("namePlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={name}
              onChangeText={setName}
            />

            <Text style={themedStyles.label}>{t("preferredRegion")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={themedStyles.regionScroll}
            >
              {REGIONS.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={[
                    themedStyles.regionChip,
                    selectedRegion === region.id && themedStyles.regionChipSelected,
                  ]}
                  onPress={() => setSelectedRegion(region.id)}
                >
                  <Text
                    style={[
                      themedStyles.regionText,
                      selectedRegion === region.id &&
                        themedStyles.regionTextSelected,
                    ]}
                  >
                    {t(region.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={themedStyles.completeButton}
              onPress={handleComplete}
            >
              <Text style={themedStyles.completeButtonText}>{t("getStarted")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = (colors: any) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 32,
    textAlign: "center",
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2563EB",
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 24,
  },
  regionScroll: {
    marginBottom: 32,
    maxHeight: 40,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  regionChipSelected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  regionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  regionTextSelected: {
    color: "#2563EB",
  },
  completeButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },
});