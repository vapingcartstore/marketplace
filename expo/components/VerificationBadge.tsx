import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCircle } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface VerificationBadgeProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
  style?: object;
  onPress?: () => void;
}

export function VerificationBadge({ 
  size = "medium", 
  showText = false,
  style,
  onPress
}: VerificationBadgeProps) {
  const { colors } = useTheme();
  
  const getBadgeSize = () => {
    switch (size) {
      case "small": return { badge: 20, icon: 13 };
      case "large": return { badge: 32, icon: 22 };
      default: return { badge: 26, icon: 18 };
    }
  };
  
  const badgeSize = getBadgeSize();
  
  const Badge = () => (
    <View 
      style={[
        styles.badge, 
        { 
          width: badgeSize.badge, 
          height: badgeSize.badge, 
          borderRadius: badgeSize.badge / 2,
          backgroundColor: "#1D9BF0" // Twitter blue color for verification
        },
        style
      ]}
      testID="verification-badge"
    >
      <CheckCircle color="#fff" size={badgeSize.icon} />
    </View>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Badge />
        {showText && (
          <Text style={[styles.text, { color: colors.text }]}>Verified</Text>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={styles.container}>
      <Badge />
      {showText && (
        <Text style={[styles.text, { color: colors.text }]}>Verified</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});