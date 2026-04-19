import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'webp' | 'jpeg';
  targetSizeKB: number;
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number; // in bytes
  format: string;
  hash?: string; // SHA-256 hash for deduplication
  originalSize?: number;
  compressionRatio?: number;
}

export interface ImageUploadResult {
  key: string;
  url: string;
  size: number;
  hash: string;
  wasReused: boolean; // true if existing image was reused
}

export interface ImageMetadata {
  id: string;
  key: string;
  url: string;
  size: number; // bytes
  hash: string; // SHA-256 hash for deduplication
  createdAt: Date;
  refCount: number;
  lastAccessedAt: Date;
  contentType: string;
  originalFilename?: string;
  uploadedBy?: string;
}

export interface ImageCleanupStats {
  totalImages: number;
  orphanedImages: number;
  totalSize: number;
  orphanedSize: number;
  cleanedUp: number;
  errors: string[];
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
  format: Platform.OS === 'web' ? 'webp' : 'jpeg',
  targetSizeKB: 350,
};

// Calculate dimensions maintaining aspect ratio
function calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

// Get image file size (approximation for web)
function getImageSize(uri: string): Promise<number> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // For web, estimate size based on dimensions and quality
      const img = new Image();
      img.onload = () => {
        // Rough estimation: width * height * 3 (RGB) * quality factor
        const estimatedSize = img.width * img.height * 3 * 0.3;
        resolve(estimatedSize);
      };
      img.onerror = () => resolve(0);
      img.src = uri;
    } else {
      // For native, we'll get actual file size from the file system
      // This is a simplified version - in real app you'd use expo-file-system
      resolve(0); // Placeholder
    }
  });
}

// Compute SHA-256 hash of image data
async function computeImageHash(uri: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      // For web, fetch the image data and compute hash
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Array.from(new Uint8Array(arrayBuffer)).map(b => String.fromCharCode(b)).join(''),
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return digest;
    } else {
      // For native, use the URI directly with expo-crypto
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        uri,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return digest;
    }
  } catch (error) {
    console.error('Failed to compute image hash:', error);
    // Fallback to timestamp-based hash if crypto fails
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Compress image with progressive quality reduction
export async function compressImage(
  uri: string,
  options: Partial<ImageCompressionOptions> = {},
  onProgress?: (progress: number) => void
): Promise<ProcessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    onProgress?.(0.1);
    
    // Get original image info
    const originalInfo = await ImageManipulator.manipulateAsync(uri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });
    
    const originalSize = await getImageSize(uri);
    
    onProgress?.(0.3);
    
    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      originalInfo.width,
      originalInfo.height,
      opts.maxWidth,
      opts.maxHeight
    );
    
    onProgress?.(0.5);
    
    // Start with high quality and reduce if needed
    let quality = opts.quality;
    let result: ImageManipulator.ImageResult;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      attempts++;
      
      const manipulateOptions = {
        compress: quality,
        format: opts.format === 'webp' && Platform.OS !== 'web' 
          ? ImageManipulator.SaveFormat.WEBP 
          : ImageManipulator.SaveFormat.JPEG,
      };
      
      result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width, height } }],
        manipulateOptions
      );
      
      const currentSize = await getImageSize(result.uri);
      const targetSizeBytes = opts.targetSizeKB * 1024;
      
      onProgress?.(0.5 + (attempts / maxAttempts) * 0.4);
      
      if (currentSize <= targetSizeBytes || quality <= 0.3 || attempts >= maxAttempts) {
        break;
      }
      
      // Reduce quality for next attempt
      quality = Math.max(0.3, quality - 0.15);
    } while (attempts < maxAttempts);
    
    onProgress?.(0.9);
    
    const finalSize = await getImageSize(result.uri);
    
    // Compute hash for deduplication
    const hash = await computeImageHash(result.uri);
    
    onProgress?.(1.0);
    
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      size: finalSize,
      format: opts.format,
      hash,
      originalSize,
      compressionRatio: originalSize > 0 ? finalSize / originalSize : 1,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

// Request pre-signed upload URL from backend
export async function requestUploadUrl(hash: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
  // SWAP WITH BACKEND HERE
  // This is a placeholder - replace with actual backend call
  console.log('Requesting upload URL for hash:', hash, contentType);
  
  // Mock response for development - simulate successful request
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  // Use hash-based key pattern for deduplication
  const extension = contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = `images/${hash}.${extension}`;
  
  return {
    uploadUrl: 'mock://upload-url', // Mock URL that won't cause fetch errors
    key,
  };
}

// Upload image directly to object storage
export async function uploadImageToStorage(
  processedImage: ProcessedImage,
  onProgress?: (progress: number) => void,
  uploadedBy?: string
): Promise<ImageUploadResult> {
  try {
    if (!processedImage.hash) {
      throw new Error('Image hash is required for upload');
    }
    
    const contentType = processedImage.format === 'webp' ? 'image/webp' : 'image/jpeg';
    
    onProgress?.(0.1);
    
    // Check if image with this hash already exists
    const manager = ImageLifecycleManager.getInstance();
    const existingImage = await manager.findImageByHash(processedImage.hash);
    
    if (existingImage) {
      console.log(`Reusing existing image with hash: ${processedImage.hash}`);
      
      // Increment reference count for existing image
      await manager.incrementRefCount(existingImage.key);
      
      onProgress?.(1.0);
      
      return {
        key: existingImage.key,
        url: existingImage.url,
        size: existingImage.size,
        hash: processedImage.hash,
        wasReused: true,
      };
    }
    
    // Get pre-signed upload URL using hash-based key
    const { uploadUrl, key } = await requestUploadUrl(processedImage.hash, contentType);
    
    onProgress?.(0.3);
    
    // SWAP WITH BACKEND HERE
    // For development, simulate upload without actual network request
    if (uploadUrl === 'mock://upload-url') {
      console.log('Mock upload simulation for:', key);
      
      // Simulate upload progress
      onProgress?.(0.5);
      await new Promise(resolve => setTimeout(resolve, 800));
      onProgress?.(0.8);
      await new Promise(resolve => setTimeout(resolve, 400));
      onProgress?.(1.0);
      
      const result = {
        key,
        url: processedImage.uri, // Use local URI for development
        size: processedImage.size,
        hash: processedImage.hash,
        wasReused: false,
      };
      
      // Track the uploaded image
      await manager.trackImage(result, uploadedBy);
      
      return result;
    }
    
    // Real upload logic for production
    const formData = new FormData();
    const filename = key.split('/').pop() || 'image.jpg';
    
    if (Platform.OS === 'web') {
      // Web upload
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
    } else {
      // Native upload
      formData.append('file', {
        uri: processedImage.uri,
        type: contentType,
        name: filename,
      } as any);
    }
    
    onProgress?.(0.7);
    
    // Upload to object storage
    // IMPORTANT: Don't set Content-Type header manually for FormData
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Let the browser/native set Content-Type automatically for FormData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown error');
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }
    
    onProgress?.(1.0);
    
    const result = {
      key,
      url: `https://your-cdn.com/${key}`, // SWAP WITH BACKEND HERE
      size: processedImage.size,
      hash: processedImage.hash,
      wasReused: false,
    };
    
    // Track the uploaded image
    await manager.trackImage(result, uploadedBy);
    
    return result;
  } catch (error) {
    console.error('Image upload failed:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to upload service');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
}

// Pick image from gallery or camera
export async function pickImage(source: 'gallery' | 'camera' = 'gallery'): Promise<string | null> {
  try {
    let result: ImagePicker.ImagePickerResult;
    
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Camera permission denied');
      }
      
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Gallery permission denied');
      }
      
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    }
    
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Image picking failed:', error);
    throw error;
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  IMAGE_METADATA: 'image_metadata',
  CLEANUP_LOG: 'cleanup_log',
} as const;

// Image lifecycle management
export class ImageLifecycleManager {
  private static instance: ImageLifecycleManager;
  private imageMetadata: Map<string, ImageMetadata> = new Map();
  private initialized = false;

  static getInstance(): ImageLifecycleManager {
    if (!ImageLifecycleManager.instance) {
      ImageLifecycleManager.instance = new ImageLifecycleManager();
    }
    return ImageLifecycleManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load existing metadata from storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.IMAGE_METADATA);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, metadata]: [string, any]) => {
          this.imageMetadata.set(key, {
            ...metadata,
            createdAt: new Date(metadata.createdAt),
            lastAccessedAt: new Date(metadata.lastAccessedAt),
            // Ensure hash exists for backward compatibility
            hash: metadata.hash || `legacy_${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
          });
        });
      }
      this.initialized = true;
      console.log(`Loaded ${this.imageMetadata.size} image metadata records`);
    } catch (error) {
      console.error('Failed to initialize ImageLifecycleManager:', error);
      this.initialized = true; // Continue with empty state
    }
  }

  async saveMetadata(): Promise<void> {
    try {
      const data = Object.fromEntries(this.imageMetadata.entries());
      await AsyncStorage.setItem(STORAGE_KEYS.IMAGE_METADATA, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save image metadata:', error);
    }
  }

  async trackImage(uploadResult: ImageUploadResult, uploadedBy?: string): Promise<void> {
    await this.initialize();
    
    // Don't track if image was reused (already exists)
    if (uploadResult.wasReused) {
      console.log(`Image reused, not tracking again: ${uploadResult.key}`);
      return;
    }
    
    const metadata: ImageMetadata = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: uploadResult.key,
      url: uploadResult.url,
      size: uploadResult.size,
      hash: uploadResult.hash,
      createdAt: new Date(),
      refCount: 1, // Start with 1 reference
      lastAccessedAt: new Date(),
      contentType: uploadResult.key.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
      uploadedBy,
    };
    
    this.imageMetadata.set(uploadResult.key, metadata);
    await this.saveMetadata();
    
    console.log(`Tracked new image: ${uploadResult.key} (${formatFileSize(uploadResult.size)}) [${uploadResult.hash.substring(0, 8)}...]`);
  }

  async incrementRefCount(imageKey: string): Promise<void> {
    await this.initialize();
    
    const metadata = this.imageMetadata.get(imageKey);
    if (metadata) {
      metadata.refCount++;
      metadata.lastAccessedAt = new Date();
      await this.saveMetadata();
      console.log(`Incremented ref count for ${imageKey}: ${metadata.refCount}`);
    }
  }

  async decrementRefCount(imageKey: string): Promise<void> {
    await this.initialize();
    
    const metadata = this.imageMetadata.get(imageKey);
    if (metadata) {
      metadata.refCount = Math.max(0, metadata.refCount - 1);
      metadata.lastAccessedAt = new Date();
      await this.saveMetadata();
      console.log(`Decremented ref count for ${imageKey}: ${metadata.refCount}`);
    }
  }

  async updateImageReferences(oldImageKeys: string[], newImageKeys: string[]): Promise<void> {
    await this.initialize();
    
    // Decrement ref count for removed images
    const removedKeys = oldImageKeys.filter(key => !newImageKeys.includes(key));
    for (const key of removedKeys) {
      await this.decrementRefCount(key);
    }
    
    // Increment ref count for new images
    const addedKeys = newImageKeys.filter(key => !oldImageKeys.includes(key));
    for (const key of addedKeys) {
      await this.incrementRefCount(key);
    }
  }

  async getOrphanedImages(): Promise<ImageMetadata[]> {
    await this.initialize();
    
    return Array.from(this.imageMetadata.values()).filter(metadata => metadata.refCount === 0);
  }

  async getImageStats(): Promise<{
    total: number;
    totalSize: number;
    orphaned: number;
    orphanedSize: number;
    oldImages: number; // > 30 days
    inactiveImages: number; // > 180 days
  }> {
    await this.initialize();
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const allImages = Array.from(this.imageMetadata.values());
    const orphanedImages = allImages.filter(img => img.refCount === 0);
    const oldImages = allImages.filter(img => img.createdAt < thirtyDaysAgo);
    const inactiveImages = allImages.filter(img => img.lastAccessedAt < oneEightyDaysAgo);
    
    return {
      total: allImages.length,
      totalSize: allImages.reduce((sum, img) => sum + img.size, 0),
      orphaned: orphanedImages.length,
      orphanedSize: orphanedImages.reduce((sum, img) => sum + img.size, 0),
      oldImages: oldImages.length,
      inactiveImages: inactiveImages.length,
    };
  }

  async cleanupOrphanedImages(): Promise<ImageCleanupStats> {
    await this.initialize();
    
    const orphanedImages = await this.getOrphanedImages();
    const stats: ImageCleanupStats = {
      totalImages: this.imageMetadata.size,
      orphanedImages: orphanedImages.length,
      totalSize: Array.from(this.imageMetadata.values()).reduce((sum, img) => sum + img.size, 0),
      orphanedSize: orphanedImages.reduce((sum, img) => sum + img.size, 0),
      cleanedUp: 0,
      errors: [],
    };
    
    console.log(`Starting cleanup of ${orphanedImages.length} orphaned images`);
    
    for (const image of orphanedImages) {
      try {
        // SWAP WITH BACKEND HERE - Delete from object storage
        // await deleteFromObjectStorage(image.key);
        console.log(`Mock deletion of orphaned image: ${image.key}`);
        
        // Remove from local metadata
        this.imageMetadata.delete(image.key);
        stats.cleanedUp++;
        
        console.log(`Cleaned up orphaned image: ${image.key} (${formatFileSize(image.size)})`);
      } catch (error) {
        const errorMsg = `Failed to delete ${image.key}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }
    
    await this.saveMetadata();
    
    // Log cleanup activity
    await this.logCleanupActivity(stats);
    
    console.log(`Cleanup completed: ${stats.cleanedUp}/${stats.orphanedImages} images cleaned`);
    return stats;
  }

  private async logCleanupActivity(stats: ImageCleanupStats): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        stats,
      };
      
      const existingLog = await AsyncStorage.getItem(STORAGE_KEYS.CLEANUP_LOG);
      const log = existingLog ? JSON.parse(existingLog) : [];
      
      log.push(logEntry);
      
      // Keep only last 50 entries
      if (log.length > 50) {
        log.splice(0, log.length - 50);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.CLEANUP_LOG, JSON.stringify(log));
    } catch (error) {
      console.error('Failed to log cleanup activity:', error);
    }
  }

  async getCleanupHistory(): Promise<{ timestamp: string; stats: ImageCleanupStats }[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CLEANUP_LOG);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get cleanup history:', error);
      return [];
    }
  }

  async findImageByHash(hash: string): Promise<ImageMetadata | null> {
    await this.initialize();
    
    // Find image with matching hash
    for (const metadata of this.imageMetadata.values()) {
      if (metadata.hash === hash) {
        return metadata;
      }
    }
    
    return null;
  }

  async getImagesByHash(): Promise<Map<string, ImageMetadata[]>> {
    await this.initialize();
    
    const hashMap = new Map<string, ImageMetadata[]>();
    
    for (const metadata of this.imageMetadata.values()) {
      const hash = metadata.hash;
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash)!.push(metadata);
    }
    
    return hashMap;
  }

  async getDuplicateImages(): Promise<{ hash: string; images: ImageMetadata[]; totalSize: number }[]> {
    const hashMap = await this.getImagesByHash();
    const duplicates: { hash: string; images: ImageMetadata[]; totalSize: number }[] = [];
    
    for (const [hash, images] of hashMap.entries()) {
      if (images.length > 1) {
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        duplicates.push({ hash, images, totalSize });
      }
    }
    
    return duplicates.sort((a, b) => b.totalSize - a.totalSize);
  }
}

// Mock nightly cleanup job
export async function runNightlyCleanup(): Promise<ImageCleanupStats> {
  console.log('🧹 Starting nightly image cleanup job...');
  
  const manager = ImageLifecycleManager.getInstance();
  const stats = await manager.cleanupOrphanedImages();
  
  console.log('🧹 Nightly cleanup completed:', {
    cleaned: stats.cleanedUp,
    errors: stats.errors.length,
    sizeSaved: formatFileSize(stats.orphanedSize),
  });
  
  return stats;
}

// Helper function to simulate cloud lifecycle policies
export function getCloudLifecyclePolicies(): {
  infrequentAccess: { days: number; description: string };
  archive: { days: number; description: string };
  delete: { days: number; description: string };
} {
  return {
    infrequentAccess: {
      days: 30,
      description: 'Move original images to infrequent access storage after 30 days of inactivity',
    },
    archive: {
      days: 180,
      description: 'Archive or delete images after 180 days of inactivity',
    },
    delete: {
      days: 365,
      description: 'Permanently delete archived images after 1 year',
    },
  };
}

// Generate CDN URLs for different sizes (future-ready)
export function getCDNImageUrl(key: string, size: 'thumb' | 'card' | 'detail' | 'original' = 'original'): string {
  // SWAP WITH BACKEND HERE - implement your CDN resizing logic
  const baseUrl = 'https://your-cdn.com';
  
  const sizeParams = {
    thumb: '?w=150&h=150&fit=crop',
    card: '?w=400&h=400&fit=crop',
    detail: '?w=800&h=800&fit=inside',
    original: '',
  };
  
  // Update last accessed time when image is accessed
  const manager = ImageLifecycleManager.getInstance();
  manager.initialize().then(() => {
    const metadata = manager['imageMetadata'].get(key);
    if (metadata) {
      metadata.lastAccessedAt = new Date();
      manager.saveMetadata();
    }
  }).catch(console.error);
  
  return `${baseUrl}/${key}${sizeParams[size]}`;
}

// Validate image constraints
export function validateImageConstraints(images: ProcessedImage[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check max number of images
  if (images.length > 8) {
    errors.push('Maximum 8 photos allowed per listing');
  }
  
  // Check individual file sizes
  const maxSizeBytes = 2 * 1024 * 1024; // 2MB
  images.forEach((image, index) => {
    if (image.size > maxSizeBytes) {
      errors.push(`Image ${index + 1} exceeds 2MB limit (${formatFileSize(image.size)})`);
    }
  });
  
  // Check total size
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const maxTotalSize = 10 * 1024 * 1024; // 10MB total
  if (totalSize > maxTotalSize) {
    errors.push(`Total images size exceeds 10MB limit (${formatFileSize(totalSize)})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}