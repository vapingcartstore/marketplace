import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

import { useTheme } from '@/providers/ThemeProvider';
import { X, Check, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const CONTROL_HEIGHT = 100;
const ACTION_BUTTON_SIZE = 56;

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onCrop: (croppedUri: string) => void;
  aspectRatio?: number; // width/height, e.g. 1 for square, 4/3, 16/9, etc.
  quality?: number; // 0 to 1
  testID?: string;
}

export function ImageCropper({
  visible,
  imageUri,
  onClose,
  onCrop,
  aspectRatio = 1,
  quality = 0.8,
  testID,
}: ImageCropperProps) {
  const { colors } = useTheme();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 });
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialImageSize, setInitialImageSize] = useState({ width: 0, height: 0 });

  // Calculate crop area dimensions based on screen size and aspect ratio
  useEffect(() => {
    if (visible && imageUri) {
      // Get image dimensions
      Image.getSize(
        imageUri,
        (width, height) => {
          setInitialImageSize({ width, height });
          
          // Calculate container size (accounting for padding and controls)
          const containerWidth = SCREEN_WIDTH - CONTAINER_PADDING * 2;
          const containerHeight = Dimensions.get('window').height - CONTAINER_PADDING * 2 - CONTROL_HEIGHT;
          
          // Calculate crop area size based on aspect ratio and container constraints
          let cropWidth, cropHeight;
          
          if (aspectRatio >= 1) {
            // Landscape or square
            cropWidth = Math.min(containerWidth, containerHeight * aspectRatio);
            cropHeight = cropWidth / aspectRatio;
          } else {
            // Portrait
            cropHeight = Math.min(containerHeight, containerWidth / aspectRatio);
            cropWidth = cropHeight * aspectRatio;
          }
          
          setCropSize({ width: cropWidth, height: cropHeight });
          
          // Calculate scale to fit image in crop area while maintaining aspect ratio
          const imageAspect = width / height;
          let scaledWidth, scaledHeight;
          
          if (imageAspect >= aspectRatio) {
            // Image is wider than crop area (relative to aspect ratios)
            scaledHeight = cropHeight;
            scaledWidth = scaledHeight * imageAspect;
          } else {
            // Image is taller than crop area (relative to aspect ratios)
            scaledWidth = cropWidth;
            scaledHeight = scaledWidth / imageAspect;
          }
          
          setImageSize({ width: scaledWidth, height: scaledHeight });
          
          // Center the image in the crop area
          setCropPosition({
            x: (cropWidth - scaledWidth) / 2,
            y: (cropHeight - scaledHeight) / 2,
          });
        },
        (error) => console.error('Error getting image size:', error)
      );
    }
  }, [visible, imageUri, aspectRatio]);

  // Create a pan responder for direct image dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Optional: Add visual feedback when dragging starts
      },
      onPanResponderMove: (_, gestureState) => {
        setCropPosition(prev => ({
          x: Math.min(0, Math.max(cropSize.width - imageSize.width * scale, prev.x + gestureState.dx)),
          y: Math.min(0, Math.max(cropSize.height - imageSize.height * scale, prev.y + gestureState.dy)),
        }));
      },
      onPanResponderRelease: () => {
        // Optional: Add any logic needed when the user stops dragging
      },
    })
  ).current;



  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleCrop = async () => {
    if (!imageUri) return;
    
    setIsProcessing(true);
    
    try {
      // Calculate crop coordinates in original image space
      const { width: originalWidth, height: originalHeight } = initialImageSize;
      const { width: cropWidth, height: cropHeight } = cropSize;
      
      // Calculate scale factor between original image and displayed image
      const scaleFactor = rotation % 180 === 0 
        ? originalWidth / (imageSize.width * scale)
        : originalHeight / (imageSize.width * scale);
      
      // Calculate crop origin in original image coordinates
      const cropOriginX = -cropPosition.x * scaleFactor;
      const cropOriginY = -cropPosition.y * scaleFactor;
      
      // Calculate crop size in original image coordinates
      const originalCropWidth = cropWidth * scaleFactor;
      const originalCropHeight = cropHeight * scaleFactor;
      
      // Prepare operations
      const operations = [];
      
      // Add rotation if needed
      if (rotation !== 0) {
        operations.push({ rotate: rotation });
      }
      
      // Add crop operation
      operations.push({
        crop: {
          originX: Math.max(0, Math.round(cropOriginX)),
          originY: Math.max(0, Math.round(cropOriginY)),
          width: Math.min(originalWidth, Math.round(originalCropWidth)),
          height: Math.min(originalHeight, Math.round(originalCropHeight)),
        },
      });
      
      // Perform the manipulation
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        operations,
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      onCrop(result.uri);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Crop Image</Text>
        </View>
        
        <View style={styles.cropContainer}>
          <View 
            style={[
              styles.cropArea, 
              { 
                width: cropSize.width, 
                height: cropSize.height,
                borderColor: colors.primary 
              }
            ]}
          >
            {/* Grid overlay */}
            <View style={styles.gridOverlay}>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
            </View>
            
            <View style={styles.gestureContainer} {...panResponder.panHandlers}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.image,
                    {
                      width: imageSize.width * scale,
                      height: imageSize.height * scale,
                      transform: [
                        { translateX: cropPosition.x },
                        { translateY: cropPosition.y },
                        { rotate: `${rotation}deg` },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.surface }]} 
            onPress={handleZoomOut}
          >
            <ZoomOut color={colors.text} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.surface }]} 
            onPress={handleZoomIn}
          >
            <ZoomIn color={colors.text} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.surface }]} 
            onPress={handleRotate}
          >
            <RotateCcw color={colors.text} size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.primary + '30' }]}
            activeOpacity={0.7}
          >
            <Move color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
          >
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleCrop} 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Check color="#fff" size={24} />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.instructions, { color: colors.textSecondary }]}>
          Drag image to position • Use zoom controls to resize • Rotate as needed
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: CONTAINER_PADDING,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropArea: {
    borderWidth: 2,
    borderStyle: 'solid',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    opacity: 0.5,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gestureContainer: {
    width: '100%',
    height: '100%',
    zIndex: 5,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    height: 60,
    gap: 16,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  instructions: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
  },
});