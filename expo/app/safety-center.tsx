import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Phone,
  MessageCircle,
  ChevronRight,
  Lock,
  Eye,
  UserCheck,
  CreditCard,
  AlertOctagon,
} from "lucide-react-native";

export default function SafetyCenterScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();

  const safetyTips = [
    {
      id: "1",
      title: t("meetInPublic"),
      description: t("safetyTip1"),
      icon: Eye,
    },
    {
      id: "2",
      title: t("inspectBeforeBuying"),
      description: t("safetyTip2"),
      icon: CheckCircle,
    },
    {
      id: "3",
      title: t("avoidPrepayment"),
      description: t("safetyTip3"),
      icon: CreditCard,
    },
    {
      id: "4",
      title: t("keepConversationsOnPlatform"),
      description: t("safetyTip4"),
      icon: MessageCircle,
    },
    {
      id: "5",
      title: t("trustYourInstincts"),
      description: t("safetyTip5"),
      icon: AlertOctagon,
    },
    {
      id: "6",
      title: t("bringAFriend"),
      description: t("safetyTip6"),
      icon: UserCheck,
    },
    {
      id: "7",
      title: t("verifySellerIdentity"),
      description: t("safetyTip7"),
      icon: Shield,
    },
  ];

  const emergencyContacts = [
    {
      id: "police",
      title: t("police"),
      number: "17",
      icon: Shield,
    },
    {
      id: "ambulance",
      title: t("ambulance"),
      number: "18",
      icon: Phone,
    },
    {
      id: "support",
      title: t("customerSupport"),
      number: "+237 6XX XXX XXX",
      icon: MessageCircle,
    },
  ];

  const handleCallEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("safetyCenter"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Shield size={48} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t("safetyCenter")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t("safetyCenterDescription")}
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("emergencyContacts")}
              </Text>
            </View>
            <View style={styles.emergencyContactsContainer}>
              {emergencyContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.emergencyContact, { backgroundColor: colors.background }]}
                  onPress={() => handleCallEmergency(contact.number)}
                >
                  <View style={styles.contactInfo}>
                    <contact.icon size={20} color={colors.primary} />
                    <View>
                      <Text style={[styles.contactTitle, { color: colors.text }]}>
                        {contact.title}
                      </Text>
                      <Text style={[styles.contactNumber, { color: colors.primary }]}>
                        {contact.number}
                      </Text>
                    </View>
                  </View>
                  <Phone size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Info size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("safetyTips")}
              </Text>
            </View>
            <View style={styles.tipsContainer}>
              {safetyTips.map((tip) => (
                <View key={tip.id} style={[styles.tipCard, { backgroundColor: colors.background }]}>
                  <View style={styles.tipHeader}>
                    <tip.icon size={20} color={colors.primary} />
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                      {tip.title}
                    </Text>
                  </View>
                  <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                    {tip.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Lock size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("secureTrading")}
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              {t("secureTradingDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.learnMoreButton, { borderColor: colors.primary }]}
              onPress={() => {
                // In a real app, this would navigate to a secure trading info page
                console.log("Navigate to secure trading info");
              }}
            >
              <Text style={[styles.learnMoreText, { color: colors.primary }]}>
                {t("learnMore")}
              </Text>
              <ExternalLink size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <AlertOctagon size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("reportScam")}
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              {t("reportScamDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                // In a real app, this would open the scam report form
                console.log("Open scam report form");
              }}
            >
              <Text style={styles.reportButtonText}>
                {t("reportScamButton")}
              </Text>
              <ChevronRight size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emergencyContactsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  emergencyContact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  tipsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  tipCard: {
    padding: 16,
    borderRadius: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});