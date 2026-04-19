import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLocale } from '@/providers/LocaleProvider';

const { width } = Dimensions.get('window');
const AD_WIDTH = width - 32;
const AD_HEIGHT = 120;

interface Ad {
  id: string;
  title: string;
  description: string;
  image: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  onPress?: () => void;
}

const MOCK_ADS: Ad[] = [
  {
    id: '1',
    title: 'Special Offer!',
    description: 'Get 20% off on all electronics',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
    backgroundColor: '#FF6B6B',
    textColor: '#FFFFFF',
    buttonText: 'Shop Now',
  },
  {
    id: '2',
    title: 'New Arrivals',
    description: 'Fresh fashion items just arrived',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop',
    backgroundColor: '#4ECDC4',
    textColor: '#FFFFFF',
    buttonText: 'Explore',
  },
  {
    id: '3',
    title: 'Local Deals',
    description: 'Best prices in your area',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
    backgroundColor: '#45B7D1',
    textColor: '#FFFFFF',
    buttonText: 'View Deals',
  },
  {
    id: '4',
    title: 'Premium Services',
    description: 'Upgrade your experience today',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&h=200&fit=crop',
    backgroundColor: '#96CEB4',
    textColor: '#2C3E50',
    buttonText: 'Learn More',
  },
];

export function AdsCarousel() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % MOCK_ADS.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (AD_WIDTH + 16),
        animated: true,
      });
    }, 4000); // Change ad every 4 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (AD_WIDTH + 16));
    setCurrentIndex(index);
  };

  const renderAd = (ad: Ad) => (
    <TouchableOpacity
      key={ad.id}
      style={[
        styles.adCard,
        { backgroundColor: ad.backgroundColor },
      ]}
      onPress={ad.onPress}
      activeOpacity={0.8}
    >
      <View style={styles.adContent}>
        <View style={styles.adTextContainer}>
          <Text style={[styles.adTitle, { color: ad.textColor }]}>
            {ad.title}
          </Text>
          <Text style={[styles.adDescription, { color: ad.textColor }]}>
            {ad.description}
          </Text>
          <TouchableOpacity
            style={[
              styles.adButton,
              {
                backgroundColor: ad.textColor === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                borderColor: ad.textColor,
              },
            ]}
            onPress={ad.onPress}
          >
            <Text style={[styles.adButtonText, { color: ad.textColor }]}>
              {ad.buttonText}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.adImageContainer}>
          <Image
            source={{ uri: ad.image }}
            style={styles.adImage}
            resizeMode="cover"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={AD_WIDTH + 16}
        decelerationRate="fast"
      >
        {MOCK_ADS.map(renderAd)}
      </ScrollView>
      
      {/* Pagination dots */}
      <View style={styles.pagination}>
        {MOCK_ADS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex ? colors.primary : colors.border,
                opacity: index === currentIndex ? 1 : 0.5,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  adCard: {
    width: AD_WIDTH,
    height: AD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  adTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 12,
  },
  adButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  adButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adImageContainer: {
    width: 80,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});