import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useLocale } from "@/providers/LocaleProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useShopfront } from "@/providers/ShopfrontProvider";
import { ShopfrontData } from "@/providers/AuthProvider";
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  X,
  ShoppingBag,
  Tag,
  Calendar,
  Star,
} from "lucide-react-native";
import { CATEGORIES } from "@/constants/categories";

export default function MyShopfrontsScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { shopfronts, createShopfront, deleteShopfront, setActiveShopfront } = useShopfront();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShopfrontData, setNewShopfrontData] = useState<{
    brandName: string;
    category: string;
  }>({
    brandName: "",
    category: "",
  });

  // Filter shopfronts based on search query
  const filteredShopfronts = shopfronts.filter(
    (shopfront) =>
      shopfront.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shopfront.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateShopfront = async () => {
    if (!newShopfrontData.brandName.trim()) {
      Alert.alert(t("error"), t("brandNameRequired"));
      return;
    }

    try {
      await createShopfront({
        brandName: newShopfrontData.brandName,
        category: newShopfrontData.category || undefined,
      });
      
      setNewShopfrontData({
        brandName: "",
        category: "",
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create shopfront:", error);
      Alert.alert(t("error"), t("failedToCreateShopfront"));
    }
  };

  const handleDeleteShopfront = (shopfront: ShopfrontData) => {
    Alert.alert(
      t("deleteShopfront"),
      `${t("deleteShopfrontConfirm")} ${shopfront.brandName || ''}`,
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteShopfront(shopfront.id);
            } catch (error) {
              console.error("Failed to delete shopfront:", error);
              Alert.alert(t("error"), t("failedToDeleteShopfront"));
            }
          },
        },
      ]
    );
  };

  const handleSelectShopfront = async (shopfront: ShopfrontData) => {
    try {
      await setActiveShopfront(shopfront.id);
      router.push("/shopfront-editor");
    } catch (error) {
      console.error("Failed to select shopfront:", error);
      Alert.alert(t("error"), t("failedToSelectShopfront"));
    }
  };

  const renderShopfrontItem = ({ item }: { item: ShopfrontData }) => {
    const categoryObj = CATEGORIES.find(cat => cat.id === item.category);
    const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
    
    return (
      <TouchableOpacity
        style={[styles.shopfrontCard, { backgroundColor: colors.surface }]}
        onPress={() => handleSelectShopfront(item)}
        testID={`shopfront-card-${item.id}`}
      >
        <View style={styles.shopfrontHeader}>
          <View style={styles.logoContainer}>
            {item.logoImage ? (
              <Image
                source={{ uri: item.logoImage }}
                style={styles.logoImage}
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                <Store color="#fff" size={24} />
              </View>
            )}
          </View>
          <View style={styles.shopfrontInfo}>
            <Text style={[styles.shopfrontName, { color: colors.text }]}>
              {item.brandName || t("unnamed")}
            </Text>
            {item.category && (
              <View style={styles.categoryContainer}>
                <Tag color={colors.primary} size={14} />
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {categoryObj ? t(categoryObj.nameKey) : item.category}
                </Text>
              </View>
            )}
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Calendar color={colors.textSecondary} size={12} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {createdDate.toLocaleDateString()}
                </Text>
              </View>
              {item.rating && (
                <View style={styles.metaItem}>
                  <Star color={colors.primary} size={12} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.rating}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
              onPress={() => handleSelectShopfront(item)}
            >
              <Edit color={colors.primary} size={16} />
            </TouchableOpacity>
            {shopfronts.length > 1 && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error + '10' }]}
                onPress={() => handleDeleteShopfront(item)}
              >
                <Trash2 color={colors.error} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={[styles.shopfrontFooter, { borderTopColor: colors.border }]}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: item.enabled ? "#10B981" : colors.textSecondary,
                },
              ]}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {item.enabled ? t("active") : t("inactive")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/shopfront/${item.id}`)}
          >
            <Text style={[styles.viewButtonText, { color: colors.primary }]}>
              {t("view")}
            </Text>
            <ArrowRight color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("myShopfronts"),
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <View style={styles.header}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t("searchShopfronts")}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {shopfronts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag color={colors.textSecondary} size={64} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("noShopfronts")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t("createShopfrontDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus color="#fff" size={20} />
              <Text style={styles.createButtonText}>{t("createShopfront")}</Text>
            </TouchableOpacity>
          </View>
        ) : filteredShopfronts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search color={colors.textSecondary} size={64} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("noResults")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t("noResultsDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setSearchQuery("")}
            >
              <X color="#fff" size={20} />
              <Text style={styles.createButtonText}>{t("clearSearch")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredShopfronts}
            renderItem={renderShopfrontItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Create Shopfront Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t("createNewShopfront")}
                </Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X color={colors.text} size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  {t("brandName")} <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder={t("enterBrandName")}
                  placeholderTextColor={colors.textSecondary}
                  value={newShopfrontData.brandName}
                  onChangeText={(text) =>
                    setNewShopfrontData({ ...newShopfrontData, brandName: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  {t("category")}
                </Text>
                <View style={[styles.categoryPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <FlatList
                    data={CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.categoryChip,
                          newShopfrontData.category === item.id && [
                            styles.categoryChipSelected,
                            { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
                          ],
                          { borderColor: colors.border },
                        ]}
                        onPress={() =>
                          setNewShopfrontData({
                            ...newShopfrontData,
                            category: item.id,
                          })
                        }
                      >
                        <Text style={styles.categoryIcon}>{item.icon}</Text>
                        <Text
                          style={[
                            styles.categoryChipText,
                            {
                              color:
                                newShopfrontData.category === item.id
                                  ? colors.primary
                                  : colors.text,
                            },
                          ]}
                        >
                          {t(item.nameKey)}
                        </Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateShopfront}
              >
                <Text style={styles.submitButtonText}>{t("createShopfront")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  shopfrontCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  shopfrontHeader: {
    flexDirection: "row",
    padding: 16,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    marginRight: 12,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  shopfrontInfo: {
    flex: 1,
    justifyContent: "center",
  },
  shopfrontName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  categoryText: {
    fontSize: 14,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  actionsContainer: {
    justifyContent: "center",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  shopfrontFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryPicker: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryChipSelected: {
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});