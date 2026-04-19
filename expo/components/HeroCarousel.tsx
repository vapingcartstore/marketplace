import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/providers/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Listing } from "@/providers/ListingsProvider";

const { width: screenWidth } = Dimensions.get("window");

interface HeroCarouselProps {
  listings: Listing[];
}

export function HeroCarousel({ listings }: HeroCarouselProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = screenWidth - 32;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
  };

  if (listings.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {listings.map((listing) => (
          <TouchableOpacity
            key={listing.id}
            style={styles.slide}
            onPress={() => router.push(`/listing/${listing.id}` as any)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: listing.images[0] }} style={styles.image} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.gradient}
            >
              <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.price}>
                  {listing.price.toLocaleString()} XAF
                </Text>
              </View>
            </LinearGradient>
            <View style={styles.sponsoredTag}>
              <Text style={styles.sponsoredText}>FEATURED</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {listings.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex && styles.activeDot,
              { backgroundColor: index === activeIndex ? colors.primary : "rgba(255,255,255,0.5)" },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  slide: {
    width: screenWidth - 32,
    height: 180,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    justifyContent: "flex-end",
  },
  content: {
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  price: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sponsoredTag: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sponsoredText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
  },
});