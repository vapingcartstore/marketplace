import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import {
  Store,
  Image as ImageIcon,
  MapPin,
  Clock,
  Globe,
  Info,
  Save,
  AlertTriangle,
  Phone,
  X,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
} from "lucide-react-native";

interface DayHours {
  closed?: boolean;
  open?: string;
  close?: string;
}

interface WeekHours {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
}

export default function ShopfrontEditorScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();

  const defaultHours: WeekHours = {
    mon: { closed: false, open: "09:00", close: "17:00" },
    tue: { closed: false, open: "09:00", close: "17:00" },
    wed: { closed: false, open: "09:00", close: "17:00" },
    thu: { closed: false, open: "09:00", close: "17:00" },
    fri: { closed: false, open: "09:00", close: "17:00" },
    sat: { closed: true, open: "09:00", close: "17:00" },
    sun: { closed: true, open: "09:00", close: "17:00" },
  };

  const [shopfrontData, setShopfrontData] = useState({
    enabled: user?.shopfrontData?.enabled || false,
    isShopfront: user?.shopfrontData?.isShopfront || false,
    brandName: user?.shopfrontData?.brandName || "",
    logoImage: user?.shopfrontData?.logoImage || user?.avatar || null,
    bannerImage: user?.shopfrontData?.bannerImage || null,
    about: user?.shopfrontData?.about || "",
    shopAddress: user?.shopfrontData?.shopAddress || "",
    shopPhone: user?.shopfrontData?.shopPhone || user?.phone || "",
    website: user?.shopfrontData?.website || "",
    email: user?.shopfrontData?.email || "",
    fullAddress: user?.shopfrontData?.fullAddress || "",
    socialMedia: {
      facebook: user?.shopfrontData?.socialMedia?.facebook || "",
      instagram: user?.shopfrontData?.socialMedia?.instagram || "",
      twitter: user?.shopfrontData?.socialMedia?.twitter || "",
      whatsapp: user?.shopfrontData?.socialMedia?.whatsapp || "",
    },
    hours: user?.shopfrontData?.hours || defaultHours,
    shopVerifiedLevel: user?.shopfrontData?.shopVerifiedLevel || "none",
  });
  
  const [errors, setErrors] = useState<{
    brandName?: string;
    about?: string;
    website?: string;
    email?: string;
    hours?: { [key: string]: string };
  }>({});
  
  const [aboutCharCount, setAboutCharCount] = useState(shopfrontData.about.length);
  
  useEffect(() => {
    console.log('Shopfront editor loaded with user data:', user);
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: {
      brandName?: string;
      about?: string;
      website?: string;
      email?: string;
      hours?: { [key: string]: string };
    } = {};
    let isValid = true;

    // Validate brandName (required, 3-40 chars)
    if (!shopfrontData.brandName) {
      newErrors.brandName = t("brandNameRequired");
      isValid = false;
    } else if (shopfrontData.brandName.length < 3 || shopfrontData.brandName.length > 40) {
      newErrors.brandName = t("brandNameLength");
      isValid = false;
    }

    // Validate about (max 400 chars)
    if (shopfrontData.about.length > 400) {
      newErrors.about = t("aboutTooLong");
      isValid = false;
    }

    // Validate website (must start with http:// or https://)
    if (shopfrontData.website && !shopfrontData.website.match(/^https?:\/\//)) {
      newErrors.website = t("websiteProtocol");
      isValid = false;
    }

    // Validate email (basic email format)
    if (shopfrontData.email && !shopfrontData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = t("invalidEmail");
      isValid = false;
    }

    // Validate hours (if not closed, open < close)
    const hourErrors: { [key: string]: string } = {};
    Object.entries(shopfrontData.hours).forEach(([day, hours]) => {
      if (!hours.closed) {
        if (!hours.open || !hours.close) {
          hourErrors[day] = t("hoursRequired");
          isValid = false;
        } else if (hours.open >= hours.close) {
          hourErrors[day] = t("hoursInvalid");
          isValid = false;
        }
      }
    });

    if (Object.keys(hourErrors).length > 0) {
      newErrors.hours = hourErrors;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = () => {
    if (!user) return;

    if (!validateForm()) {
      Alert.alert(t("error"), t("pleaseFixErrors"));
      return;
    }

    updateProfile({
      shopfrontData: {
        ...shopfrontData,
        enabled: true,
        isShopfront: true,
      },
    });

    Alert.alert(
      t("shopfrontUpdated"),
      t("shopfrontUpdatedDescription"),
      [
        {
          text: t("viewShopfront"),
          onPress: () => router.push(`/shopfront/${user.id}`),
        },
        {
          text: t("ok"),
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleDisableShopfront = () => {
    if (!user) return;

    Alert.alert(
      t("disableShopfront"),
      t("disableShopfrontConfirm"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("disable"),
          style: "destructive",
          onPress: () => {
            updateProfile({
              shopfrontData: {
                ...shopfrontData,
                enabled: false,
                isShopfront: false,
              },
            });
            router.back();
          },
        },
      ]
    );
  };

  const handleChange = (field: string, value: any) => {
    setShopfrontData({
      ...shopfrontData,
      [field]: value,
    });

    // Reset error for this field
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleAboutChange = (text: string) => {
    setAboutCharCount(text.length);
    handleChange("about", text);
  };

  const handleHoursChange = (day: keyof WeekHours, field: keyof DayHours, value: any) => {
    setShopfrontData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value,
        },
      },
    }));

    // Reset error for this day
    if (errors.hours && errors.hours[day]) {
      const updatedHours = { ...errors.hours };
      delete updatedHours[day];
      
      setErrors(prev => ({
        ...prev,
        hours: Object.keys(updatedHours).length > 0 ? updatedHours : undefined,
      }));
    }
  };

  // Mock image selection
  const selectImage = (type: "logoImage" | "bannerImage") => {
    // In a real app, you would use expo-image-picker here
    const mockImages = [
      "https://picsum.photos/800/300?random=1",
      "https://picsum.photos/800/300?random=2",
      "https://picsum.photos/800/300?random=3",
      "https://picsum.photos/800/300?random=4",
    ];
    
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    
    setShopfrontData({
      ...shopfrontData,
      [type]: randomImage,
    });
  };
  
  const getDayName = (day: string): string => {
    const days: { [key: string]: string } = {
      mon: t("monday"),
      tue: t("tuesday"),
      wed: t("wednesday"),
      thu: t("thursday"),
      fri: t("friday"),
      sat: t("saturday"),
      sun: t("sunday"),
    };
    return days[day] || day;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("editShopfront"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave}>
              <Save color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Store color={colors.primary} size={32} />
              <Text style={[styles.title, { color: colors.text }]}>
                {t("shopfrontSettings")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t("shopfrontSettingsDescription")}
              </Text>
            </View>

            {/* Brand Name */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <Store color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("brandName")} <Text style={{ color: colors.error }}>*</Text>
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.brandName ? colors.error : colors.border,
                  },
                ]}
                value={shopfrontData.brandName}
                onChangeText={(text) => handleChange("brandName", text)}
                placeholder={t("brandNamePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                maxLength={40}
              />
              {errors.brandName && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.brandName}
                </Text>
              )}
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {shopfrontData.brandName.length}/40 {t("characters")}
              </Text>
            </View>

            {/* Banner Image */}
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("bannerImage")}
              </Text>
              <TouchableOpacity
                style={[styles.imagePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => selectImage("bannerImage")}
              >
                {shopfrontData.bannerImage ? (
                  <Image source={{ uri: shopfrontData.bannerImage }} style={styles.bannerImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <ImageIcon color={colors.textSecondary} size={32} />
                    <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                      {t("tapToSelectBanner")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Logo Image */}
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("logoImage")}
              </Text>
              <TouchableOpacity
                style={[styles.logoPickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => selectImage("logoImage")}
              >
                {shopfrontData.logoImage ? (
                  <Image source={{ uri: shopfrontData.logoImage }} style={styles.logoImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <ImageIcon color={colors.textSecondary} size={24} />
                    <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                      {t("tapToSelectLogo")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* About */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <Info color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("about")}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.about ? colors.error : colors.border,
                  },
                ]}
                value={shopfrontData.about}
                onChangeText={handleAboutChange}
                placeholder={t("aboutPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={400}
              />
              {errors.about && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.about}
                </Text>
              )}
              <Text 
                style={[styles.helperText, { 
                  color: aboutCharCount > 400 ? colors.error : colors.textSecondary 
                }]}
              >
                {aboutCharCount}/400 {t("characters")}
              </Text>
            </View>

            {/* Shop Address */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <MapPin color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("shopAddress")}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={shopfrontData.shopAddress}
                onChangeText={(text) => handleChange("shopAddress", text)}
                placeholder={t("shopAddressPlaceholder")}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Shop Phone */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <Phone color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("shopPhone")}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={shopfrontData.shopPhone}
                onChangeText={(text) => handleChange("shopPhone", text)}
                placeholder={t("shopPhonePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("shopPhoneHelp")}
              </Text>
            </View>

            {/* Website */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <Globe color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("website")}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.website ? colors.error : colors.border,
                  },
                ]}
                value={shopfrontData.website}
                onChangeText={(text) => handleChange("website", text)}
                placeholder={t("websitePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.website && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.website}
                </Text>
              )}
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("websiteHelp")}
              </Text>
            </View>

            {/* Email */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <Mail color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("email")}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.email ? colors.error : colors.border,
                  },
                ]}
                value={shopfrontData.email}
                onChangeText={(text) => handleChange("email", text)}
                placeholder={t("emailPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.email}
                </Text>
              )}
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("emailHelp")}
              </Text>
            </View>

            {/* Full Address */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <MapPin color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("fullAddress")}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={shopfrontData.fullAddress}
                onChangeText={(text) => handleChange("fullAddress", text)}
                placeholder={t("fullAddressPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("fullAddressHelp")}
              </Text>
            </View>

            {/* Social Media */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("socialMedia")}
              </Text>
              
              {/* Facebook */}
              <View style={styles.socialInputContainer}>
                <View style={styles.inputHeader}>
                  <Facebook color={colors.primary} size={20} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Facebook
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={shopfrontData.socialMedia.facebook}
                  onChangeText={(text) => handleChange("socialMedia", { ...shopfrontData.socialMedia, facebook: text })}
                  placeholder={t("facebookPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Instagram */}
              <View style={styles.socialInputContainer}>
                <View style={styles.inputHeader}>
                  <Instagram color={colors.primary} size={20} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Instagram
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={shopfrontData.socialMedia.instagram}
                  onChangeText={(text) => handleChange("socialMedia", { ...shopfrontData.socialMedia, instagram: text })}
                  placeholder={t("instagramPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              {/* Twitter */}
              <View style={styles.socialInputContainer}>
                <View style={styles.inputHeader}>
                  <Twitter color={colors.primary} size={20} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Twitter
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={shopfrontData.socialMedia.twitter}
                  onChangeText={(text) => handleChange("socialMedia", { ...shopfrontData.socialMedia, twitter: text })}
                  placeholder={t("twitterPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              {/* WhatsApp */}
              <View style={styles.socialInputContainer}>
                <View style={styles.inputHeader}>
                  <MessageCircle color={colors.primary} size={20} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    WhatsApp
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={shopfrontData.socialMedia.whatsapp}
                  onChangeText={(text) => handleChange("socialMedia", { ...shopfrontData.socialMedia, whatsapp: text })}
                  placeholder={t("whatsappPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
              
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("socialMediaHelp")}
              </Text>
            </View>

            {/* Working Hours */}
            <View style={styles.formSection}>
              <View style={styles.inputHeader}>
                <Clock color={colors.primary} size={20} />
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  {t("workingHours")}
                </Text>
              </View>
              
              {Object.entries(shopfrontData.hours).map(([day, hours]) => (
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayName, { color: colors.text }]}>
                      {getDayName(day)}
                    </Text>
                    <View style={styles.closedToggle}>
                      <Text style={{ color: colors.textSecondary, marginRight: 8 }}>
                        {t("closed")}
                      </Text>
                      <Switch
                        value={hours.closed}
                        onValueChange={(value) => handleHoursChange(day as keyof WeekHours, "closed", value)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : hours.closed ? '#fff' : '#f4f3f4'}
                      />
                    </View>
                  </View>
                  
                  {!hours.closed && (
                    <View style={styles.hoursInputContainer}>
                      <View style={styles.timeInputWrapper}>
                        <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
                          {t("open")}
                        </Text>
                        <TextInput
                          style={[
                            styles.timeInput,
                            {
                              backgroundColor: colors.surface,
                              color: colors.text,
                              borderColor: errors.hours && errors.hours[day] ? colors.error : colors.border,
                            },
                          ]}
                          value={hours.open}
                          onChangeText={(text) => handleHoursChange(day as keyof WeekHours, "open", text)}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                      
                      <View style={styles.timeInputWrapper}>
                        <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
                          {t("close")}
                        </Text>
                        <TextInput
                          style={[
                            styles.timeInput,
                            {
                              backgroundColor: colors.surface,
                              color: colors.text,
                              borderColor: errors.hours && errors.hours[day] ? colors.error : colors.border,
                            },
                          ]}
                          value={hours.close}
                          onChangeText={(text) => handleHoursChange(day as keyof WeekHours, "close", text)}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>
                  )}
                  
                  {errors.hours && errors.hours[day] && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.hours[day]}
                    </Text>
                  )}
                </View>
              ))}
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                {t("hoursHelp")}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              testID="save-shopfront-button"
            >
              <Save color="#fff" size={20} />
              <Text style={styles.saveButtonText}>{t("saveShopfront")}</Text>
            </TouchableOpacity>

            <View style={styles.dangerZone}>
              <View style={styles.dangerHeader}>
                <AlertTriangle color={colors.error} size={20} />
                <Text style={[styles.dangerTitle, { color: colors.error }]}>
                  {t("dangerZone")}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.disableButton, { borderColor: colors.error }]}
                onPress={handleDisableShopfront}
                testID="disable-shopfront-button"
              >
                <X color={colors.error} size={20} />
                <Text style={[styles.disableButtonText, { color: colors.error }]}>
                  {t("disableShopfront")}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.dangerText, { color: colors.textSecondary }]}>
                {t("disableShopfrontWarning")}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  imageSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  imagePicker: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  logoPickerContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  formSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  dayRow: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "500",
  },
  closedToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  hoursInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeInputWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerZone: {
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffcccc",
    borderRadius: 12,
    backgroundColor: "#fff5f5",
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  disableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  disableButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dangerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  socialInputContainer: {
    marginBottom: 16,
  },
});