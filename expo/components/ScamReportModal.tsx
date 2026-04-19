import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { X, Camera, Video, Image as ImageIcon, AlertTriangle } from 'lucide-react-native';

interface ScamReportModalProps {
  visible: boolean;
  onClose: () => void;
  listingId?: string;
  sellerId?: string;
}

export default function ScamReportModal({ visible, onClose, listingId, sellerId }: ScamReportModalProps) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEvidence = (type: 'photo' | 'video' | 'gallery') => {
    // Mock evidence addition
    const mockEvidence = `https://picsum.photos/300/200?random=${Date.now()}`;
    setEvidence([...evidence, mockEvidence]);
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t('error'), 'Please describe the scam or suspicious activity');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mock API call to submit report
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        t('reportSubmitted'),
        t('reportSubmittedDescription'),
        [{ text: t('ok'), onPress: onClose }]
      );
      
      // Reset form
      setDescription('');
      setEvidence([]);
    } catch {
      Alert.alert(t('error'), 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('reportScam')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <AlertTriangle color="#F59E0B" size={20} />
            <Text style={[styles.warningText, { color: '#92400E' }]}>
              {t('scamReportSafetyTips')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('reportDetails')}
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder={t('describeScam')}
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Evidence (Optional)
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Add photos or videos as evidence
            </Text>
            
            <View style={styles.evidenceButtons}>
              <TouchableOpacity
                style={[styles.evidenceButton, { backgroundColor: colors.surface }]}
                onPress={() => handleAddEvidence('photo')}
              >
                <Camera color={colors.primary} size={24} />
                <Text style={[styles.evidenceButtonText, { color: colors.text }]}>
                  {t('takePhoto')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.evidenceButton, { backgroundColor: colors.surface }]}
                onPress={() => handleAddEvidence('video')}
              >
                <Video color={colors.primary} size={24} />
                <Text style={[styles.evidenceButtonText, { color: colors.text }]}>
                  {t('takeVideo')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.evidenceButton, { backgroundColor: colors.surface }]}
                onPress={() => handleAddEvidence('gallery')}
              >
                <ImageIcon color={colors.primary} size={24} />
                <Text style={[styles.evidenceButtonText, { color: colors.text }]}>
                  {t('selectFromGallery')}
                </Text>
              </TouchableOpacity>
            </View>

            {evidence.length > 0 && (
              <View style={styles.evidenceGrid}>
                {evidence.map((item, index) => (
                  <View key={index} style={styles.evidenceItem}>
                    <Image source={{ uri: item }} style={styles.evidenceImage} />
                    <TouchableOpacity
                      style={styles.removeEvidence}
                      onPress={() => removeEvidence(index)}
                    >
                      <X color="#fff" size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : t('submitReport')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
  },
  evidenceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  evidenceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  evidenceButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  evidenceItem: {
    position: 'relative',
  },
  evidenceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeEvidence: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});