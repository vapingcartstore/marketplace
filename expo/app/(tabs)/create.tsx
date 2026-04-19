import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useListings } from "@/providers/ListingsProvider";
import { Camera, X, MapPin, Phone, Eye } from "lucide-react-native";
import { CATEGORIES } from "@/constants/categories";
import { REGIONS } from "@/constants/regions";
import { ImageUploader } from "@/components/ImageUploader";
import { ProcessedImage, ImageUploadResult, validateImageConstraints } from "@/utils/imageUtils";

export default function CreateScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { createListing } = useListings();

  const [activeTab, setActiveTab] = useState<'listing' | 'barter'>('listing');
  
  // Common fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState(user?.region || "");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [condition, setCondition] = useState("new");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [showPhone, setShowPhone] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  
  // Separate image states for each form type
  const [listingImages, setListingImages] = useState<ProcessedImage[]>([]);
  const [barterImages, setBarterImages] = useState<ProcessedImage[]>([]);
  const [listingUploadedImages, setListingUploadedImages] = useState<ImageUploadResult[]>([]);
  const [barterUploadedImages, setBarterUploadedImages] = useState<ImageUploadResult[]>([]);
  
  // Barter-specific fields
  const [offerTitle, setOfferTitle] = useState("");
  const [offerCategory, setOfferCategory] = useState("");
  const [offerEstimatedValue, setOfferEstimatedValue] = useState("");
  const [wantCategories, setWantCategories] = useState<string[]>([]);
  const [wantNotes, setWantNotes] = useState("");
  const [allowCashTopUp, setAllowCashTopUp] = useState(false);

  const conditions = [
    { id: "new", label: t("new") },
    { id: "like-new", label: t("likeNew") },
    { id: "good", label: t("good") },
    { id: "fair", label: t("fair") },
  ];

  const handleSubmit = async () => {
    const currentImages = activeTab === 'listing' ? listingImages : barterImages;
    const currentUploadedImages = activeTab === 'listing' ? listingUploadedImages : barterUploadedImages;
    
    // Validate images
    const validation = validateImageConstraints(currentImages);
    if (!validation.isValid) {
      Alert.alert(t("error"), validation.errors.join('\n'));
      return;
    }
    
    // Check if all images are uploaded
    if (currentImages.length !== currentUploadedImages.length) {
      Alert.alert(t("error"), "Please wait for all images to finish uploading");
      return;
    }

    if (activeTab === 'listing') {
      if (!title || !price || !category || !region || !description) {
        Alert.alert(t("error"), t("fillRequiredFields"));
        return;
      }

      const listing = {
        title,
        price: parseFloat(price),
        category,
        region,
        city,
        address,
        condition,
        description,
        phoneNumber: showPhone ? phoneNumber : "",
        images: currentUploadedImages.map(img => img.key), // Store image keys
        tags,
        listingType: 'sale',
      };

      await createListing(listing);
    } else {
      if (!offerTitle || !offerCategory || !region || !description || wantCategories.length === 0) {
        Alert.alert(t("error"), t("fillRequiredFields"));
        return;
      }

      const listing = {
        title: offerTitle,
        price: 0, // Not used for barter
        category: offerCategory,
        region,
        city,
        address,
        condition,
        description,
        phoneNumber: showPhone ? phoneNumber : "",
        images: currentUploadedImages.map(img => img.key), // Store image keys
        tags,
        listingType: 'barter',
        offerTitle,
        offerCategory,
        offerEstimatedValue: offerEstimatedValue ? parseFloat(offerEstimatedValue) : undefined,
        wantCategories,
        wantNotes,
        allowCashTopUp,
      };

      await createListing(listing);
    }
    
    Alert.alert(t("success"), t("listingSubmittedForReview"));
    router.replace("/(tabs)");
  };



  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const addTag = () => {
    if (!currentTag.trim()) return;
    if (tags.length >= 10) {
      Alert.alert(t("error"), "Maximum 10 tags allowed");
      return;
    }
    if (tags.includes(currentTag.trim().toLowerCase())) {
      Alert.alert(t("error"), "Tag already exists");
      return;
    }
    setTags([...tags, currentTag.trim().toLowerCase()]);
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };



  if (user?.isGuest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestContainer}>
          <Text style={[styles.guestTitle, { color: colors.text }]}>
            {t("loginToSell")}
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.loginButtonText}>{t("login")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function renderListingForm() {
    return (
      <>
        <ImageUploader
          images={listingImages}
          onImagesChange={setListingImages}
          uploadedImages={listingUploadedImages}
          onUploadedImagesChange={setListingUploadedImages}
          maxImages={8}
          testID="listing-image-uploader"
        />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("title")} *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("titlePlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("price")} (XAF) *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("category")} *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  category === cat.id && styles.categoryChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: category === cat.id ? colors.primary : colors.text },
                  ]}
                >
                  {t(cat.nameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("condition")} *
          </Text>
          <View style={styles.conditionContainer}>
            {conditions.map((cond) => (
              <TouchableOpacity
                key={cond.id}
                style={[
                  styles.conditionChip,
                  condition === cond.id && styles.conditionChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setCondition(cond.id)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    { color: condition === cond.id ? colors.primary : colors.text },
                  ]}
                >
                  {cond.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("region")} *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {REGIONS.map((reg) => (
              <TouchableOpacity
                key={reg.id}
                style={[
                  styles.regionChip,
                  region === reg.id && styles.regionChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setRegion(reg.id)}
              >
                <Text
                  style={[
                    styles.regionText,
                    { color: region === reg.id ? colors.primary : colors.text },
                  ]}
                >
                  {t(reg.nameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t("city")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("cityPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t("address")}</Text>
          <View style={[styles.addressContainer, { backgroundColor: colors.surface }]}>
            <MapPin color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.addressInput, { color: colors.text }]}
              placeholder={t("addressPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("description")} *
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("descriptionPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t("contactPhone")}</Text>
          <View style={[styles.phoneContainer, { backgroundColor: colors.surface }]}>
            <Phone color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder={t("phonePlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setShowPhone(!showPhone)}
          >
            <View style={[styles.checkbox, showPhone && styles.checkboxActive]} />
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
              {t("showPhoneOnListing")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("keywordTags")}
          </Text>
          <Text style={[styles.tagHint, { color: colors.textSecondary }]}>
            {t("tagHint")}
          </Text>
          <View style={[styles.tagInputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.tagInput, { color: colors.text }]}
              placeholder={t("addKeywordTag")}
              placeholderTextColor={colors.textSecondary}
              value={currentTag}
              onChangeText={setCurrentTag}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: colors.primary }]}
              onPress={addTag}
            >
              <Text style={styles.addTagButtonText}>{t("add")}</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tagChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                  <Text style={[styles.tagRemove, { color: colors.primary }]}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{activeTab === 'barter' ? t("postTrade") : t("postListing")}</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderBarterForm() {
    return (
      <>
        <ImageUploader
          images={barterImages}
          onImagesChange={setBarterImages}
          uploadedImages={barterUploadedImages}
          onUploadedImagesChange={setBarterUploadedImages}
          maxImages={8}
          testID="barter-image-uploader"
        />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("offerTitle")} *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("offerTitlePlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={offerTitle}
            onChangeText={setOfferTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("offerCategory")} *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  offerCategory === cat.id && styles.categoryChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setOfferCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: offerCategory === cat.id ? colors.primary : colors.text },
                  ]}
                >
                  {t(cat.nameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("offerEstimatedValue")}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={offerEstimatedValue}
            onChangeText={setOfferEstimatedValue}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("condition")} *
          </Text>
          <View style={styles.conditionContainer}>
            {conditions.map((cond) => (
              <TouchableOpacity
                key={cond.id}
                style={[
                  styles.conditionChip,
                  condition === cond.id && styles.conditionChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setCondition(cond.id)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    { color: condition === cond.id ? colors.primary : colors.text },
                  ]}
                >
                  {cond.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("region")} *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {REGIONS.map((reg) => (
              <TouchableOpacity
                key={reg.id}
                style={[
                  styles.regionChip,
                  region === reg.id && styles.regionChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => setRegion(reg.id)}
              >
                <Text
                  style={[
                    styles.regionText,
                    { color: region === reg.id ? colors.primary : colors.text },
                  ]}
                >
                  {t(reg.nameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t("city")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("cityPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t("address")}</Text>
          <View style={[styles.addressContainer, { backgroundColor: colors.surface }]}>
            <MapPin color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.addressInput, { color: colors.text }]}
              placeholder={t("addressPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("description")} *
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("descriptionPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("wantCategories")} *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  wantCategories.includes(cat.id) && styles.categoryChipActive,
                  { borderColor: colors.border },
                ]}
                onPress={() => {
                  if (wantCategories.includes(cat.id)) {
                    setWantCategories(wantCategories.filter(c => c !== cat.id));
                  } else {
                    setWantCategories([...wantCategories, cat.id]);
                  }
                }}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: wantCategories.includes(cat.id) ? colors.primary : colors.text },
                  ]}
                >
                  {t(cat.nameKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("wantNotes")}
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={t("wantNotesPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={wantNotes}
            onChangeText={setWantNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Removed "allow top up cash" option as requested */}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t("contactPhone")}</Text>
          <View style={[styles.phoneContainer, { backgroundColor: colors.surface }]}>
            <Phone color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder={t("phonePlaceholder")}
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setShowPhone(!showPhone)}
          >
            <View style={[styles.checkbox, showPhone && styles.checkboxActive]} />
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
              {t("showPhoneOnListing")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t("keywordTags")}
          </Text>
          <Text style={[styles.tagHint, { color: colors.textSecondary }]}>
            {t("tagHint")}
          </Text>
          <View style={[styles.tagInputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.tagInput, { color: colors.text }]}
              placeholder={t("addKeywordTag")}
              placeholderTextColor={colors.textSecondary}
              value={currentTag}
              onChangeText={setCurrentTag}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: colors.primary }]}
              onPress={addTag}
            >
              <Text style={styles.addTagButtonText}>{t("add")}</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tagChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                  <Text style={[styles.tagRemove, { color: colors.primary }]}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{activeTab === 'barter' ? t("postTrade") : t("postListing")}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {activeTab === 'listing' ? t("createListing") : t("tradeByBarter")}
            </Text>
            
            {/* Segmented Control */}
            <View style={[styles.segmentedControl, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  activeTab === 'listing' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setActiveTab('listing')}
              >
                <Text style={[
                  styles.segmentText,
                  { color: activeTab === 'listing' ? '#fff' : colors.text }
                ]}>
                  {t('listing')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  activeTab === 'barter' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setActiveTab('barter')}
              >
                <Text style={[
                  styles.segmentText,
                  { color: activeTab === 'barter' ? '#fff' : colors.text }
                ]}>
                  {t('tradeByBarter')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.form}>
            {activeTab === 'listing' ? renderListingForm() : renderBarterForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 16,
    fontWeight: "600",
  },
  form: {
    padding: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  inputGroup: {
    marginBottom: 20,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563EB",
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  conditionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  conditionChipActive: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563EB",
  },
  conditionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  regionChipActive: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "#2563EB",
  },
  regionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  checkboxActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  checkboxLabel: {
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tagHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  tagInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  addTagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTagButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagRemove: {
    fontSize: 16,
    fontWeight: "bold",
  },
});