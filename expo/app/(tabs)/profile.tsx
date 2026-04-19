import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  User,
  Settings,
  Heart,
  Package,
  Shield,
  Globe,
  Moon,
  LogOut,
  ChevronRight,
  Star,
  Store,
  Camera,
  Edit3,
} from "lucide-react-native";
import { VerificationBadge } from "@/components/VerificationBadge";

export default function ProfileScreen() {
  const router = useRouter();
  const { t, locale, toggleLocale } = useLocale();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();

  // Debug user state
  React.useEffect(() => {
    console.log('ProfileScreen - user state changed:', user);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const handleProfilePhotoPress = () => {
    Alert.alert(
      t("profilePhoto"),
      t("selectProfilePhotoOption"),
      [
        {
          text: t("takePhoto"),
          onPress: () => {
            // Mock photo capture
            const newPhoto = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
            updateProfile({ avatar: newPhoto });
          }
        },
        {
          text: t("selectFromGallery"),
          onPress: () => {
            // Mock gallery selection
            const newPhoto = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
            updateProfile({ avatar: newPhoto });
          }
        },
        {
          text: t("removePhoto"),
          style: "destructive",
          onPress: () => {
            updateProfile({ avatar: undefined });
          }
        },
        {
          text: t("cancel"),
          style: "cancel"
        }
      ]
    );
  };

  const menuItems = [
    {
      icon: Edit3,
      label: t("editProfile"),
      onPress: () => router.push("/edit-profile" as any),
    },
    {
      icon: Package,
      label: t("myListings"),
      onPress: () => router.push("/my-listings" as any),
    },
    {
      icon: Heart,
      label: t("favorites"),
      onPress: () => router.push("/favorites" as any),
    },
    {
      icon: Star,
      label: t("reviews"),
      onPress: () => router.push("/reviews" as any),
    },
    {
      icon: Store,
      label: t("myShopfronts"),
      onPress: () => {
        console.log('My Shopfront pressed - user:', user);
        
        // Check if user exists and is not a guest
        if (!user) {
          console.log('Cannot navigate - user is null/undefined');
          Alert.alert(
            t("error"),
            "Please log in to access your shopfront.",
            [
              {
                text: t("ok"),
                onPress: () => router.replace("/(auth)/login")
              }
            ]
          );
          return;
        }
        
        if (user.isGuest) {
          console.log('Cannot navigate - user is guest');
          Alert.alert(
            t("loginRequired"),
            "Please create an account to access shopfront features.",
            [
              {
                text: t("cancel"),
                style: "cancel"
              },
              {
                text: t("login"),
                onPress: () => {
                  logout();
                  router.replace("/(auth)/login");
                }
              }
            ]
          );
          return;
        }
        
        if (!user.id) {
          console.log('Cannot navigate - user.id is missing:', user);
          Alert.alert(
            t("error"),
            "User ID is missing. Please try logging out and logging back in.",
            [
              {
                text: t("logout"),
                onPress: () => {
                  logout();
                  router.replace("/(auth)/login");
                }
              }
            ]
          );
          return;
        }
        
        console.log('Navigating to my shopfronts', user.id, user.shopfronts);
        router.push('/my-shopfronts');
      },
    },
    {
      icon: Shield,
      label: t("safetyCenter"),
      onPress: () => router.push("/safety-center" as any),
    },
    {
      icon: Settings,
      label: t("settings"),
      onPress: () => router.push("/settings" as any),
    },
  ];

  const settingsItems = [
    {
      icon: Globe,
      label: t("language"),
      value: locale === "en" ? "English" : "Français",
      onPress: toggleLocale,
    },
    {
      icon: Moon,
      label: t("darkMode"),
      toggle: true,
      value: isDark,
      onPress: toggleTheme,
    },
    {
      icon: Store,
      label: t("enableShopfront"),
      toggle: true,
      value: user?.shopfrontData?.enabled || false,
      onPress: () => {
        console.log('Enable Shopfront toggle pressed - user:', user);
        if (user) {
          const enabled = user.shopfrontData?.enabled || false;
          if (!enabled) {
            // If enabling shopfront for the first time, navigate to editor
            console.log('Navigating to shopfront editor from toggle');
            router.push('/shopfront-editor');
          } else {
            // If disabling, just toggle the enabled state
            console.log('Disabling shopfront');
            updateProfile({
              shopfrontData: {
                ...user.shopfrontData,
                id: user.shopfrontData?.id || 'main',
                enabled: false,
                isShopfront: false
              }
            });
          }
        } else {
          console.log('Cannot toggle shopfront - user is null/undefined');
        }
      },
    },
  ];

  if (user?.isGuest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestContainer}>
          <User color={colors.textSecondary} size={48} />
          <Text style={[styles.guestTitle, { color: colors.text }]}>
            {t("guestUser")}
          </Text>
          <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
            {t("loginToAccess")}
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              logout(); // Clear guest session first
              router.replace("/(auth)/login");
            }}
          >
            <Text style={styles.loginButtonText}>{t("login")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.avatarContainer, { backgroundColor: colors.primary }]}
            onPress={handleProfilePhotoPress}
          >
            {user?.avatar ? (
              <View style={styles.avatarImageContainer}>
                <View style={[styles.avatarImage, { backgroundColor: colors.surface }]} />
                <View style={[styles.editPhotoOverlay, { backgroundColor: colors.primary + '80' }]}>
                  <Camera color="#fff" size={16} />
                </View>
              </View>
            ) : (
              <>
                <User color="#fff" size={32} />
                <View style={[styles.editPhotoOverlay, { backgroundColor: colors.primary + '80' }]}>
                  <Camera color="#fff" size={16} />
                </View>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
            {user?.verificationLevel === "full" && (
              <VerificationBadge size="small" />
            )}
          </View>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>
            {user?.phone}
          </Text>
        </View>

        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface }]}
              onPress={item.onPress}
            >
              <item.icon color={colors.primary} size={20} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("settings")}
          </Text>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface }]}
              onPress={item.onPress}
            >
              <item.icon color={colors.primary} size={20} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              {item.toggle ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onPress}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              ) : (
                <>
                  <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
                    {item.value}
                  </Text>
                  <ChevronRight color={colors.textSecondary} size={20} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <LogOut color={colors.error} size={20} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t("logout")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push("/admin" as any)}
        >
          <Settings color={colors.textSecondary} size={16} />
          <Text style={[styles.adminText, { color: colors.textSecondary }]}>
            Admin Panel
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.poweredBy, { color: colors.textSecondary }]}>
          Powered by Kunshort
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    padding: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  avatarImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editPhotoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    marginBottom: 12,
  },
  verifiedBadgeContainer: {
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuValue: {
    fontSize: 14,
    marginRight: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
    marginBottom: 24,
  },
  adminText: {
    fontSize: 14,
  },
  poweredBy: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
});