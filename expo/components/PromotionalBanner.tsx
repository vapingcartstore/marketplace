import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Linking,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { ExternalLink } from 'lucide-react-native';

export interface PromotionalBannerProps {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  backgroundImage: string;
  link?: string;
  onPress?: () => void;
}

export function PromotionalBanner({
  title,
  subtitle,
  description,
  buttonText,
  backgroundImage,
  link,
  onPress,
}: PromotionalBannerProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (link) {
      Linking.openURL(link);
    }
  };

  return (
    <View style={[styles.container, { marginHorizontal: 16 }]}>
      <TouchableOpacity
        style={styles.bannerContainer}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
        >
          <View style={styles.overlay} />
          <View style={styles.content}>
            <View style={styles.textContent}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              <Text style={styles.description}>{description}</Text>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.secondary }]}
                onPress={handlePress}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
                <ExternalLink size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageSection}>
              <View style={[styles.productHighlight, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
                <Text style={[styles.productLabel, { color: colors.primary }]}>KITCHEN</Text>
                <Text style={[styles.productSubLabel, { color: colors.text }]}>FACTORY STORAGE HOME</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  bannerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backgroundImage: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
  },
  backgroundImageStyle: {
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flex: 1,
  },
  textContent: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 11,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHighlight: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  productLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productSubLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});