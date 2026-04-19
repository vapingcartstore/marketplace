import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { Camera, X, Eye, AlertCircle, CheckCircle, Upload, RefreshCw, Hash, Crop } from 'lucide-react-native';
import {
  ProcessedImage,
  ImageUploadResult,
  compressImage,
  uploadImageToStorage,
  pickImage,
  formatFileSize,
  validateImageConstraints,
  ImageLifecycleManager,
} from '@/utils/imageUtils';
import { ImageCropper } from './ImageCropper';

export interface ImageUploaderProps {
  images: ProcessedImage[];
  onImagesChange: (images: ProcessedImage[]) => void;
  uploadedImages: ImageUploadResult[];
  onUploadedImagesChange: (images: ImageUploadResult[]) => void;
  maxImages?: number;
  disabled?: boolean;
  testID?: string;
  userId?: string; // For tracking who uploaded the images
  listingId?: string; // For tracking which listing the images belong to
  onImageReferencesChange?: (oldKeys: string[], newKeys: string[]) => void;
}

interface ImageProcessingState {
  [key: string]: {
    isProcessing: boolean;
    isUploading: boolean;
    progress: number;
    error?: string;
  };
}

export function ImageUploader({
  images,
  onImagesChange,
  uploadedImages,
  onUploadedImagesChange,
  maxImages = 8,
  disabled = false,
  testID,
  userId,
  listingId,
  onImageReferencesChange,
}: ImageUploaderProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [processingState, setProcessingState] = useState<ImageProcessingState>({});
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);

  const updateProcessingState = useCallback((uri: string, update: Partial<ImageProcessingState[string]>) => {
    setProcessingState(prev => ({
      ...prev,
      [uri]: { ...prev[uri], ...update },
    }));
  }, []);

  const handleAddImage = useCallback(async (source: 'gallery' | 'camera' = 'gallery', skipCropping = false) => {
    if (disabled || images.length >= maxImages) {
      Alert.alert(t('error'), `Maximum ${maxImages} photos allowed`);
      return;
    }

    let uri: string | null = null;
    try {
      uri = await pickImage(source);
      
      // Show cropper if image was selected and cropping is not skipped
      if (uri && !skipCropping) {
        setCropImageUri(uri);
        setShowCropper(true);
        return;
      }
      if (!uri) return;

      updateProcessingState(uri, { isProcessing: true, progress: 0 });

      // Compress image
      const processedImage = await compressImage(
        uri,
        {},
        (progress) => updateProcessingState(uri!, { progress: progress * 0.7 })
      );

      // Add to images array
      const newImages = [...images, processedImage];
      onImagesChange(newImages);

      // Validate constraints
      const validation = validateImageConstraints(newImages);
      if (!validation.isValid) {
        Alert.alert(t('error'), validation.errors.join('\n'));
        onImagesChange(images); // Revert
        updateProcessingState(uri, { isProcessing: false, error: 'Validation failed' });
        return;
      }

      updateProcessingState(uri, { isProcessing: false, isUploading: true, progress: 0.7 });

      // Upload image
      const uploadResult = await uploadImageToStorage(
        processedImage,
        (progress) => updateProcessingState(uri!, { progress: 0.7 + progress * 0.3 }),
        userId
      );

      // Add to uploaded images
      onUploadedImagesChange([...uploadedImages, uploadResult]);
      updateProcessingState(uri, { isUploading: false, progress: 1 });

      console.log('Image processed and uploaded successfully:', {
        originalSize: processedImage.originalSize,
        finalSize: processedImage.size,
        compressionRatio: processedImage.compressionRatio,
        uploadKey: uploadResult.key,
        hash: uploadResult.hash,
        wasReused: uploadResult.wasReused,
      });
      
      // Show reuse notification if image was deduplicated
      if (uploadResult.wasReused) {
        Alert.alert(
          'Image Reused',
          `This image already exists in storage and was reused. Storage saved: ${formatFileSize(processedImage.size)}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Image processing failed:', error);
      const errorUri = uri || `error-${Date.now()}`;
      
      let errorMessage = 'Failed to process image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please allow access to photos.';
        } else if (error.message.includes('compress')) {
          errorMessage = 'Failed to compress image. The image may be corrupted.';
        } else if (error.message.includes('upload')) {
          errorMessage = 'Upload failed. Please try again later.';
        }
      }
      
      updateProcessingState(errorUri, { 
        isProcessing: false, 
        isUploading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      Alert.alert(t('error'), errorMessage);
    }
  }, [disabled, images, maxImages, onImagesChange, uploadedImages, onUploadedImagesChange, t, updateProcessingState, userId]);

  const handleCropComplete = useCallback((croppedUri: string) => {
    if (cropImageUri) {
      // If we're cropping an existing image
      if (cropImageIndex !== null && cropImageIndex >= 0) {
        const newImages = [...images];
        // Replace the image at the specified index
        newImages[cropImageIndex] = {
          ...newImages[cropImageIndex],
          uri: croppedUri
        };
        onImagesChange(newImages);
      } else {
        // Otherwise process the newly added image
        handleAddImage('gallery', true);
      }
    }
    setCropImageUri(null);
    setCropImageIndex(null);
    setShowCropper(false);
  }, [cropImageUri, cropImageIndex, images, onImagesChange, handleAddImage]);

  const handleCropImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCropImageUri(images[index].uri);
      setCropImageIndex(index);
      setShowCropper(true);
    }
  }, [images]);

  const handleRemoveImage = useCallback(async (index: number) => {
    const removedUploadedImage = uploadedImages[index];
    const newImages = images.filter((_, i) => i !== index);
    const newUploadedImages = uploadedImages.filter((_, i) => i !== index);
    
    // Update image references in lifecycle manager
    if (removedUploadedImage && onImageReferencesChange) {
      const oldKeys = uploadedImages.map(img => img.key);
      const newKeys = newUploadedImages.map(img => img.key);
      onImageReferencesChange(oldKeys, newKeys);
    }
    
    // Decrement reference count for removed image
    if (removedUploadedImage) {
      const manager = ImageLifecycleManager.getInstance();
      await manager.decrementRefCount(removedUploadedImage.key);
      console.log(`Decremented reference count for removed image: ${removedUploadedImage.key}`);
    }
    
    onImagesChange(newImages);
    onUploadedImagesChange(newUploadedImages);

    // Clean up processing state
    const removedImage = images[index];
    if (removedImage) {
      setProcessingState(prev => {
        const newState = { ...prev };
        delete newState[removedImage.uri];
        return newState;
      });
    }
  }, [images, uploadedImages, onImagesChange, onUploadedImagesChange, onImageReferencesChange]);

  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setShowPreview(true);
  }, []);

  const renderImageItem = useCallback((image: ProcessedImage, index: number) => {
    const state = processingState[image.uri];
    const isProcessing = state?.isProcessing || state?.isUploading;
    const progress = state?.progress || 0;
    const hasError = !!state?.error;

    return (
      <View key={`${image.uri}-${index}`} style={styles.imageContainer}>
        <TouchableOpacity
          onPress={() => handlePreview(index)}
          disabled={isProcessing}
          style={[styles.imageTouchable, hasError && styles.imageError]}
        >
          <Image 
            source={{ uri: image.uri }} 
            style={[styles.imageThumbnail, isProcessing && styles.imageProcessing]} 
            resizeMode="cover"
          />
          
          {/* Processing overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          )}

          {/* Error overlay */}
          {hasError && (
            <View style={styles.errorOverlay}>
              <AlertCircle color="#fff" size={20} />
            </View>
          )}

          {/* Success indicator */}
          {!isProcessing && !hasError && uploadedImages[index] && (
            <View style={styles.successOverlay}>
              <CheckCircle color="#10B981" size={16} />
            </View>
          )}
          
          {/* Crop button */}
          <TouchableOpacity
            style={styles.cropButton}
            onPress={() => handleCropImage(index)}
            disabled={isProcessing}
          >
            <Crop color="#fff" size={16} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Image info */}
        <View style={styles.imageInfo}>
          <Text style={[styles.imageSizeText, { color: colors.textSecondary }]}>
            {formatFileSize(image.size)}
          </Text>
          {image.compressionRatio && image.compressionRatio < 0.8 && (
            <Text style={[styles.compressionText, { color: '#10B981' }]}>
              -{Math.round((1 - image.compressionRatio) * 100)}%
            </Text>
          )}
          {uploadedImages[index]?.wasReused && (
            <View style={styles.reusedIndicator}>
              <RefreshCw color="#8B5CF6" size={8} />
              <Text style={[styles.reusedText, { color: '#8B5CF6' }]}>Reused</Text>
            </View>
          )}
          {image.hash && (
            <Text style={[styles.hashText, { color: colors.textSecondary }]}>
              #{image.hash.substring(0, 6)}
            </Text>
          )}
        </View>

        {/* Remove button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveImage(index)}
          disabled={isProcessing}
        >
          <X color="#fff" size={16} />
        </TouchableOpacity>
      </View>
    );
  }, [processingState, uploadedImages, colors, handlePreview, handleRemoveImage, handleCropImage]);

  const validation = validateImageConstraints(images);
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('photos')} ({images.length}/{maxImages})
          </Text>
          {totalSize > 0 && (
            <Text style={[styles.totalSizeText, { color: colors.textSecondary }]}>
              Total: {formatFileSize(totalSize)}
            </Text>
          )}
        </View>
        
        {images.length > 0 && (
          <TouchableOpacity 
            style={[styles.previewButton, { backgroundColor: colors.primary + '20' }]} 
            onPress={() => handlePreview(0)}
          >
            <Eye color={colors.primary} size={16} />
            <Text style={[styles.previewButtonText, { color: colors.primary }]}>
              {t('preview')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Validation errors */}
      {!validation.isValid && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
          <AlertCircle color={colors.error} size={16} />
          <View style={styles.errorTextContainer}>
            {validation.errors.map((error, index) => (
              <Text key={index} style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Images grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add image button */}
        {images.length < maxImages && (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={[styles.addImageButton, { borderColor: colors.border }]} 
              onPress={() => handleAddImage('gallery')}
              disabled={disabled}
            >
              <Camera color={colors.textSecondary} size={24} />
              <Text style={[styles.addImageText, { color: colors.textSecondary }]}>
                {t('addPhoto')}
              </Text>
            </TouchableOpacity>
            
            {/* Camera shortcut */}
            <TouchableOpacity 
              style={[styles.cameraButton, { backgroundColor: colors.primary }]} 
              onPress={() => handleAddImage('camera')}
              disabled={disabled}
            >
              <Camera color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Image items */}
        {images.map(renderImageItem)}
      </ScrollView>

      {/* Upload progress summary */}
      {Object.values(processingState).some(state => state.isProcessing || state.isUploading) && (
        <View style={[styles.uploadSummary, { backgroundColor: colors.surface }]}>
          <Upload color={colors.primary} size={16} />
          <Text style={[styles.uploadSummaryText, { color: colors.text }]}>
            Processing images...
          </Text>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      )}

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.previewModal, { backgroundColor: colors.background }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                Image Preview ({previewIndex + 1}/{images.length})
              </Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.previewContent}>
              {images.length > 0 && images[previewIndex] && (
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.previewImageContainer}>
                      <Image 
                        source={{ uri: image.uri }} 
                        style={styles.previewImage} 
                        resizeMode="contain"
                      />
                      <View style={styles.previewImageInfo}>
                        <Text style={[styles.previewImageSize, { color: colors.text }]}>
                          {image.width} × {image.height} • {formatFileSize(image.size)}
                        </Text>
                        {image.compressionRatio && (
                          <Text style={[styles.previewCompressionInfo, { color: '#10B981' }]}>
                            Compressed by {Math.round((1 - image.compressionRatio) * 100)}%
                          </Text>
                        )}
                        {uploadedImages[index]?.wasReused && (
                          <View style={styles.previewReusedInfo}>
                            <RefreshCw color="#8B5CF6" size={12} />
                            <Text style={[styles.previewReusedText, { color: '#8B5CF6' }]}>
                              Image was reused from storage
                            </Text>
                          </View>
                        )}
                        {image.hash && (
                          <View style={styles.previewHashInfo}>
                            <Hash color={colors.textSecondary} size={12} />
                            <Text style={[styles.previewHashText, { color: colors.textSecondary }]}>
                              {image.hash}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.closePreviewButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.closePreviewButtonText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Image Cropper Modal */}
      {cropImageUri && (
        <ImageCropper
          visible={showCropper}
          imageUri={cropImageUri}
          onClose={() => {
            setShowCropper(false);
            setCropImageUri(null);
            setCropImageIndex(null);
          }}
          onCrop={handleCropComplete}
          aspectRatio={1} // Default to square, can be made configurable
          quality={0.8}
        />
      )}
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalSizeText: {
    fontSize: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 18,
  },
  scrollContent: {
    paddingRight: 16,
  },
  addButtonContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  cameraButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imageTouchable: {
    position: 'relative',
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imageProcessing: {
    opacity: 0.7,
  },
  imageError: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  errorOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInfo: {
    marginTop: 4,
    alignItems: 'center',
  },
  imageSizeText: {
    fontSize: 10,
  },
  compressionText: {
    fontSize: 9,
    fontWeight: '600',
  },
  removeButton: {
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
  cropButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  uploadSummaryText: {
    flex: 1,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContent: {
    height: 300,
    marginBottom: 16,
  },
  previewImageContainer: {
    width: screenWidth - 72,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    borderRadius: 8,
  },
  previewImageInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewImageSize: {
    fontSize: 12,
  },
  previewCompressionInfo: {
    fontSize: 11,
    fontWeight: '600',
  },
  closePreviewButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closePreviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reusedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  reusedText: {
    fontSize: 8,
    fontWeight: '600',
  },
  hashText: {
    fontSize: 8,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  previewReusedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  previewReusedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewHashInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  previewHashText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});