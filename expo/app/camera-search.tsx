import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { X, Camera, RotateCcw, Check, Search } from 'lucide-react-native';

export default function CameraSearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // Request camera permission when component mounts
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleClose = () => {
    router.back();
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      console.log('Photo captured:', photo.uri);
      setCapturedImage(photo.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSearchWithImage = async () => {
    if (!capturedImage) return;

    try {
      setIsProcessing(true);
      
      // Here you would typically:
      // 1. Upload the image to your backend
      // 2. Use AI/ML service to analyze the image
      // 3. Search for similar products
      // 4. Navigate to search results
      
      console.log('Searching with image:', capturedImage);
      
      // For now, simulate processing and navigate to search with a generic query
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to search page with visual search indicator
      router.push({
        pathname: '/search',
        params: { visualSearch: 'true', imageUri: capturedImage }
      } as any);
      
    } catch (error) {
      console.error('Error processing image search:', error);
      Alert.alert('Error', 'Failed to process image search. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ 
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false
        }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ 
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false
        }} />
        <View style={styles.permissionContainer}>
          <Camera size={64} color={colors.textSecondary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.permissionMessage, { color: colors.textSecondary }]}>
            We need access to your camera to help you search for products by taking photos.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#111827' }]}>
        <Stack.Screen options={{ 
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#fff',
          headerTitle: 'Image Preview',
          headerShadowVisible: false
        }} />
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            
            <Text style={styles.previewTitle}>Search for similar items?</Text>
            <Text style={styles.previewSubtitle}>
              We&apos;ll help you find products that match this image
            </Text>
          </View>
          
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              disabled={isProcessing}
            >
              <RotateCcw color="#fff" size={24} />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.searchButton, isProcessing && styles.searchButtonDisabled]}
              onPress={handleSearchWithImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size={24} />
              ) : (
                <Search color="#fff" size={24} />
              )}
              <Text style={styles.searchButtonText}>
                {isProcessing ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#111827' }]}>
      <Stack.Screen options={{ 
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#fff',
        headerTitle: 'Camera Search',
        headerShadowVisible: false
      }} />
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      >
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Visual Search</Text>
            <Text style={styles.instructionText}>
              Point your camera at an item to find similar products
            </Text>
          </View>
        </View>
        
        <View style={styles.cameraControls}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <RotateCcw color="#fff" size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={handleTakePicture}
              disabled={isProcessing}
            >
              <View style={styles.captureButtonInner}>
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size={32} />
                ) : (
                  <Check color="#fff" size={32} />
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  permissionMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  instructionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 56,
    height: 56,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 8,
  },
  previewSubtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    gap: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});