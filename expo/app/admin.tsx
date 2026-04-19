import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useTheme } from "@/providers/ThemeProvider";
import { useListings, Listing } from "@/providers/ListingsProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { Database, Users, Shield, Flag, BarChart, Settings, Store, CheckCircle, XCircle, Eye, Clock } from "lucide-react-native";

export default function AdminScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { pendingListings, approveListing, rejectListing } = useListings();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const adminSections = [
    {
      title: "Data Management",
      icon: Database,
      items: [
        { label: "Seed Demo Data", action: () => console.log("Seeding data") },
        { label: "Clear Cache", action: () => console.log("Clearing cache") },
        { label: "Export Data", action: () => console.log("Exporting data") },
      ],
    },
    {
      title: "User Management",
      icon: Users,
      items: [
        { label: "Verify Sellers", action: () => console.log("Verify sellers") },
        { label: "Manage Users", action: () => console.log("Manage users") },
        { label: "Block List", action: () => console.log("Block list") },
      ],
    },
    {
      title: "Content Moderation",
      icon: Flag,
      items: [
        { label: `${t("pendingReviews")} (${pendingListings.length})`, action: () => setActiveSection("reviews") },
        { label: "Reports Queue (12)", action: () => console.log("Reports") },
        { label: "Flagged Content", action: () => console.log("Flagged") },
        { label: "Prohibited Items", action: () => console.log("Prohibited") },
      ],
    },
    {
      title: "Analytics",
      icon: BarChart,
      items: [
        { label: "View Statistics", action: () => console.log("Statistics") },
        { label: "Ad Performance", action: () => console.log("Ad performance") },
        { label: "User Activity", action: () => console.log("User activity") },
      ],
    },
    {
      title: "Shopfront Management",
      icon: Store,
      items: [
        { label: "Featured Shops", action: () => console.log("Featured shops") },
        { label: "Shopfront Applications", action: () => console.log("Shopfront applications") },
        { label: "Shop Verification", action: () => console.log("Shop verification") },
      ],
    },
  ];

  async function handleApproveListing(listingId: string) {
    try {
      await approveListing(listingId);
      Alert.alert(t("success"), t("listingApproved"));
    } catch (error) {
      Alert.alert(t("error"), t("failedToApproveListing"));
    }
  }
  
  async function handleRejectListing(listingId: string, reason: string) {
    try {
      await rejectListing(listingId, reason);
      setShowRejectModal(false);
      setSelectedListing(null);
      setRejectionReason("");
      Alert.alert(t("success"), t("listingRejected"));
    } catch (error) {
      Alert.alert(t("error"), t("failedToRejectListing"));
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: "modal",
          title: "Admin Panel",
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Shield color={colors.primary} size={32} />
            <Text style={[styles.title, { color: colors.text }]}>Admin Panel</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your marketplace
            </Text>
          </View>

          {adminSections.map((section, index) => (
            <View key={index} style={styles.section}>
              <View style={styles.sectionHeader}>
                <section.icon color={colors.primary} size={20} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
              </View>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.item, { backgroundColor: colors.surface }]}
                  onPress={item.action}
                >
                  <Text style={[styles.itemLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Settings color={colors.primary} size={20} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Settings
              </Text>
            </View>
            <View style={[styles.item, { backgroundColor: colors.surface }]}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Maintenance Mode
              </Text>
              <Switch value={false} />
            </View>
            <View style={[styles.item, { backgroundColor: colors.surface }]}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Auto-Approve Listings
              </Text>
              <Switch value={false} />
            </View>
            <View style={[styles.item, { backgroundColor: colors.surface }]}>
              <Text style={[styles.itemLabel, { color: colors.text }]}>
                Auto-Approve Shopfronts
              </Text>
              <Switch value={false} />
            </View>
          </View>
        </ScrollView>
        
        {/* Review Modal */}
        {activeSection === "reviews" && (
          <Modal
            visible={true}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setActiveSection(null)}
          >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setActiveSection(null)}>
                  <Text style={[styles.modalCloseButton, { color: colors.primary }]}>
                    {t("cancel")}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t("pendingReviews")} ({pendingListings.length})
                </Text>
                <View style={{ width: 60 }} />
              </View>
              
              <ScrollView style={styles.reviewsList}>
                {pendingListings.map((listing) => (
                  <View key={listing.id} style={[styles.reviewItem, { backgroundColor: colors.surface }]}>
                    <View style={styles.reviewItemHeader}>
                      <Text style={[styles.reviewItemTitle, { color: colors.text }]} numberOfLines={2}>
                        {listing.title}
                      </Text>
                      <View style={styles.reviewItemMeta}>
                        <Clock color={colors.textSecondary} size={14} />
                        <Text style={[styles.reviewItemDate, { color: colors.textSecondary }]}>
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[styles.reviewItemDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                      {listing.description}
                    </Text>
                    
                    <View style={styles.reviewItemDetails}>
                      <Text style={[styles.reviewItemPrice, { color: colors.primary }]}>
                        {listing.listingType === 'sale' ? `${listing.price.toLocaleString()} XAF` : t("tradeByBarter")}
                      </Text>
                      <Text style={[styles.reviewItemCategory, { color: colors.textSecondary }]}>
                        {t(listing.category)}
                      </Text>
                    </View>
                    
                    <View style={styles.reviewItemActions}>
                      <TouchableOpacity
                        style={[styles.reviewActionButton, styles.viewButton, { borderColor: colors.border }]}
                        onPress={() => setSelectedListing(listing)}
                      >
                        <Eye color={colors.textSecondary} size={16} />
                        <Text style={[styles.reviewActionText, { color: colors.textSecondary }]}>
                          {t("view")}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.reviewActionButton, styles.approveButton]}
                        onPress={() => handleApproveListing(listing.id)}
                      >
                        <CheckCircle color="#10B981" size={16} />
                        <Text style={[styles.reviewActionText, { color: "#10B981" }]}>
                          {t("approve")}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.reviewActionButton, styles.rejectButton]}
                        onPress={() => {
                          setSelectedListing(listing);
                          setShowRejectModal(true);
                        }}
                      >
                        <XCircle color="#EF4444" size={16} />
                        <Text style={[styles.reviewActionText, { color: "#EF4444" }]}>
                          {t("reject")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                {pendingListings.length === 0 && (
                  <View style={styles.emptyState}>
                    <CheckCircle color={colors.textSecondary} size={48} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      {t("noPendingReviews")}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
        
        {/* Listing Detail Modal */}
        {selectedListing && !showRejectModal && (
          <Modal
            visible={true}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setSelectedListing(null)}
          >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedListing(null)}>
                  <Text style={[styles.modalCloseButton, { color: colors.primary }]}>
                    {t("close")}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t("reviewListing")}
                </Text>
                <View style={{ width: 60 }} />
              </View>
              
              <ScrollView style={styles.listingDetail}>
                <Text style={[styles.listingDetailTitle, { color: colors.text }]}>
                  {selectedListing.title}
                </Text>
                
                <View style={styles.listingDetailMeta}>
                  <Text style={[styles.listingDetailPrice, { color: colors.primary }]}>
                    {selectedListing.listingType === 'sale' 
                      ? `${selectedListing.price.toLocaleString()} XAF` 
                      : t("tradeByBarter")}
                  </Text>
                  <Text style={[styles.listingDetailCategory, { color: colors.textSecondary }]}>
                    {t(selectedListing.category)} • {t(selectedListing.region)}
                  </Text>
                </View>
                
                <Text style={[styles.listingDetailDescription, { color: colors.text }]}>
                  {selectedListing.description}
                </Text>
                
                {selectedListing.tags && selectedListing.tags.length > 0 && (
                  <View style={styles.listingDetailTags}>
                    <Text style={[styles.listingDetailTagsTitle, { color: colors.text }]}>
                      {t("keywordTags")}:
                    </Text>
                    <View style={styles.tagsContainer}>
                      {selectedListing.tags.map((tag, index) => (
                        <View key={index} style={[styles.tagChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                          <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                <View style={styles.listingDetailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.approveButton, { backgroundColor: "#10B981" }]}
                    onPress={() => {
                      handleApproveListing(selectedListing.id);
                      setSelectedListing(null);
                    }}
                  >
                    <CheckCircle color="#fff" size={20} />
                    <Text style={[styles.detailActionText, { color: "#fff" }]}>
                      {t("approveListing")}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.rejectButton, { backgroundColor: "#EF4444" }]}
                    onPress={() => setShowRejectModal(true)}
                  >
                    <XCircle color="#fff" size={20} />
                    <Text style={[styles.detailActionText, { color: "#fff" }]}>
                      {t("rejectListing")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
        
        {/* Reject Modal */}
        {showRejectModal && selectedListing && (
          <Modal
            visible={true}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowRejectModal(false)}
          >
            <View style={styles.rejectModalOverlay}>
              <View style={[styles.rejectModalContent, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rejectModalTitle, { color: colors.text }]}>
                  {t("rejectListing")}
                </Text>
                
                <Text style={[styles.rejectModalSubtitle, { color: colors.textSecondary }]}>
                  {t("rejectListingReason")}
                </Text>
                
                <TextInput
                  style={[styles.rejectReasonInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder={t("enterRejectionReason")}
                  placeholderTextColor={colors.textSecondary}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                
                <View style={styles.rejectModalActions}>
                  <TouchableOpacity
                    style={[styles.rejectModalButton, { backgroundColor: colors.background }]}
                    onPress={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                  >
                    <Text style={[styles.rejectModalButtonText, { color: colors.text }]}>
                      {t("cancel")}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.rejectModalButton, { backgroundColor: "#EF4444" }]}
                    onPress={() => handleRejectListing(selectedListing.id, rejectionReason)}
                    disabled={!rejectionReason.trim()}
                  >
                    <Text style={[styles.rejectModalButtonText, { color: "#fff" }]}>
                      {t("rejectListing")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  reviewsList: {
    flex: 1,
    padding: 16,
  },
  reviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  reviewItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewItemDate: {
    fontSize: 12,
  },
  reviewItemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewItemPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  reviewItemCategory: {
    fontSize: 14,
  },
  reviewItemActions: {
    flexDirection: "row",
    gap: 8,
  },
  reviewActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  viewButton: {
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  rejectButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  reviewActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  listingDetail: {
    flex: 1,
    padding: 16,
  },
  listingDetailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listingDetailMeta: {
    marginBottom: 16,
  },
  listingDetailPrice: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  listingDetailCategory: {
    fontSize: 14,
  },
  listingDetailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  listingDetailTags: {
    marginBottom: 24,
  },
  listingDetailTagsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listingDetailActions: {
    gap: 12,
  },
  detailActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  detailActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rejectModalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  rejectModalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  rejectModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  rejectModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  rejectModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});