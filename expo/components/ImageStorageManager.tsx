import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Trash2, BarChart3, Clock, HardDrive, AlertTriangle, CheckCircle, Copy, Hash } from 'lucide-react-native';
import {
  ImageLifecycleManager,
  ImageCleanupStats,
  ImageMetadata,
  runNightlyCleanup,
  formatFileSize,
  getCloudLifecyclePolicies,
} from '@/utils/imageUtils';

export interface ImageStorageManagerProps {
  testID?: string;
}

interface StorageStats {
  total: number;
  totalSize: number;
  orphaned: number;
  orphanedSize: number;
  oldImages: number;
  inactiveImages: number;
}

interface DuplicateGroup {
  hash: string;
  images: ImageMetadata[];
  totalSize: number;
}

export function ImageStorageManager({ testID }: ImageStorageManagerProps) {
  const { colors } = useTheme();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [cleanupHistory, setCleanupHistory] = useState<{ timestamp: string; stats: ImageCleanupStats }[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const manager = ImageLifecycleManager.getInstance();
      const imageStats = await manager.getImageStats();
      const history = await manager.getCleanupHistory();
      const duplicateImages = await manager.getDuplicateImages();
      
      setStats(imageStats);
      setCleanupHistory(history);
      setDuplicates(duplicateImages);
    } catch (error) {
      console.error('Failed to load image storage stats:', error);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const handleCleanup = useCallback(async () => {
    Alert.alert(
      'Cleanup Orphaned Images',
      `This will permanently delete ${stats?.orphaned || 0} orphaned images (${formatFileSize(stats?.orphanedSize || 0)}). This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsCleaningUp(true);
            try {
              const cleanupStats = await runNightlyCleanup();
              await loadStats();
              
              Alert.alert(
                'Cleanup Complete',
                `Successfully cleaned up ${cleanupStats.cleanedUp} images, saving ${formatFileSize(cleanupStats.orphanedSize)}.`
              );
            } catch (error) {
              console.error('Cleanup failed:', error);
              Alert.alert('Cleanup Failed', 'An error occurred during cleanup. Please try again.');
            } finally {
              setIsCleaningUp(false);
            }
          },
        },
      ]
    );
  }, [stats, loadStats]);

  useEffect(() => {
    setIsLoading(true);
    loadStats().finally(() => setIsLoading(false));
  }, [loadStats]);

  const lifecyclePolicies = getCloudLifecyclePolicies();

  if (isLoading && !stats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading storage stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      testID={testID}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Storage Overview */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <HardDrive color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Storage Overview</Text>
        </View>
        
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Images</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatFileSize(stats.totalSize)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Size</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats.orphaned > 0 ? colors.error : colors.text }]}>
                {stats.orphaned}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orphaned</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats.orphaned > 0 ? colors.error : colors.text }]}>
                {formatFileSize(stats.orphanedSize)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orphaned Size</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: duplicates.length > 0 ? '#F59E0B' : colors.text }]}>
                {duplicates.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duplicate Groups</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: duplicates.length > 0 ? '#F59E0B' : colors.text }]}>
                {duplicates.reduce((sum, group) => sum + (group.images.length - 1), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duplicate Images</Text>
            </View>
          </View>
        )}
      </View>

      {/* Lifecycle Policies */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Clock color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cloud Lifecycle Policies</Text>
        </View>
        
        <View style={styles.policyList}>
          <View style={styles.policyItem}>
            <View style={[styles.policyIndicator, { backgroundColor: '#F59E0B' }]} />
            <View style={styles.policyContent}>
              <Text style={[styles.policyTitle, { color: colors.text }]}>Infrequent Access</Text>
              <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>
                {lifecyclePolicies.infrequentAccess.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.policyItem}>
            <View style={[styles.policyIndicator, { backgroundColor: '#8B5CF6' }]} />
            <View style={styles.policyContent}>
              <Text style={[styles.policyTitle, { color: colors.text }]}>Archive</Text>
              <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>
                {lifecyclePolicies.archive.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.policyItem}>
            <View style={[styles.policyIndicator, { backgroundColor: '#EF4444' }]} />
            <View style={styles.policyContent}>
              <Text style={[styles.policyTitle, { color: colors.text }]}>Delete</Text>
              <Text style={[styles.policyDescription, { color: colors.textSecondary }]}>
                {lifecyclePolicies.delete.description}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Duplicate Detection */}
      {duplicates.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Copy color={colors.primary} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Duplicate Images</Text>
          </View>
          
          <Text style={[styles.duplicateDescription, { color: colors.textSecondary }]}>
            Found {duplicates.length} groups of duplicate images. These images have identical content but may be referenced multiple times.
          </Text>
          
          <View style={styles.duplicateList}>
            {duplicates.slice(0, 3).map((group, index) => (
              <View key={group.hash} style={[styles.duplicateItem, { borderColor: colors.border }]}>
                <View style={styles.duplicateHeader}>
                  <Hash color={colors.textSecondary} size={14} />
                  <Text style={[styles.duplicateHash, { color: colors.textSecondary }]}>
                    {group.hash.substring(0, 12)}...
                  </Text>
                  <Text style={[styles.duplicateCount, { color: '#F59E0B' }]}>
                    {group.images.length} copies
                  </Text>
                </View>
                
                <View style={styles.duplicateStats}>
                  <Text style={[styles.duplicateSize, { color: colors.text }]}>
                    Total: {formatFileSize(group.totalSize)}
                  </Text>
                  <Text style={[styles.duplicateSavings, { color: '#10B981' }]}>
                    Could save: {formatFileSize(group.totalSize - group.images[0].size)}
                  </Text>
                </View>
              </View>
            ))}
            
            {duplicates.length > 3 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                +{duplicates.length - 3} more duplicate groups
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Cleanup Actions */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Trash2 color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cleanup Actions</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.cleanupButton,
            {
              backgroundColor: stats?.orphaned ? colors.error : colors.border,
              opacity: stats?.orphaned ? 1 : 0.5,
            },
          ]}
          onPress={handleCleanup}
          disabled={!stats?.orphaned || isCleaningUp}
        >
          {isCleaningUp ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Trash2 color="#fff" size={16} />
          )}
          <Text style={styles.cleanupButtonText}>
            {isCleaningUp ? 'Cleaning up...' : `Clean up ${stats?.orphaned || 0} orphaned images`}
          </Text>
        </TouchableOpacity>
        
        {stats?.orphaned === 0 && (
          <View style={styles.noOrphanedContainer}>
            <CheckCircle color="#10B981" size={16} />
            <Text style={[styles.noOrphanedText, { color: '#10B981' }]}>No orphaned images found</Text>
          </View>
        )}
      </View>

      {/* Cleanup History */}
      {cleanupHistory.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <BarChart3 color={colors.primary} size={20} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Cleanup History</Text>
          </View>
          
          <View style={styles.historyList}>
            {cleanupHistory.slice(0, 5).map((entry, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyDate, { color: colors.text }]}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                
                <View style={styles.historyStats}>
                  <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                    Cleaned: {entry.stats.cleanedUp}/{entry.stats.orphanedImages} images
                  </Text>
                  <Text style={[styles.historyStatText, { color: colors.textSecondary }]}>
                    Saved: {formatFileSize(entry.stats.orphanedSize)}
                  </Text>
                  {entry.stats.errors.length > 0 && (
                    <View style={styles.historyErrors}>
                      <AlertTriangle color={colors.error} size={12} />
                      <Text style={[styles.historyErrorText, { color: colors.error }]}>
                        {entry.stats.errors.length} errors
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  policyList: {
    gap: 12,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  policyIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginTop: 2,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  cleanupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noOrphanedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noOrphanedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 12,
  },
  historyStats: {
    gap: 4,
  },
  historyStatText: {
    fontSize: 12,
  },
  historyErrors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historyErrorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  duplicateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  duplicateList: {
    gap: 12,
  },
  duplicateItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(249, 158, 11, 0.05)',
  },
  duplicateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  duplicateHash: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  duplicateCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  duplicateStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duplicateSize: {
    fontSize: 12,
    fontWeight: '500',
  },
  duplicateSavings: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});