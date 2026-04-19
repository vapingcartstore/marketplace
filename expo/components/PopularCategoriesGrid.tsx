import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { CATEGORIES } from '@/constants/categories';

const { width } = Dimensions.get('window');
const GRID_SPACING = 8;
const GRID_COLUMNS = 4;
const CARD_WIDTH = (width - 48 - (GRID_SPACING * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

// Use the app's existing categories

export const PopularCategoriesGrid = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to search with the selected category
    router.push({
      pathname: '/search',
      params: { category: categoryId }
    } as any);
  };

  // Get the first 8 categories for the grid
  const popularCategories = CATEGORIES.slice(0, 8);
  
  // Create rows of categories (4 per row)
  const rows = [];
  for (let i = 0; i < popularCategories.length; i += GRID_COLUMNS) {
    rows.push(popularCategories.slice(i, i + GRID_COLUMNS));
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categoriesNearYou')}</Text>
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={() => handleCategoryPress(category.id)}
                testID={`popular-category-${category.id}`}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                <Text style={[styles.categoryText, { color: colors.text }]}>{t(category.nameKey)}</Text>
              </TouchableOpacity>
            ))}
            {/* Fill empty spaces in incomplete rows */}
            {row.length < GRID_COLUMNS && Array.from({ length: GRID_COLUMNS - row.length }).map((_, emptyIndex) => (
              <View key={`empty-${rowIndex}-${emptyIndex}`} style={{ width: CARD_WIDTH }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  gridContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING * 2,
  },
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});