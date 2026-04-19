import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator,
  SafeAreaView,
  FlatList
} from 'react-native';
import { useLocation } from '@/providers/LocationProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { CAMEROON_LOCATIONS, RegionKey } from '@/data/cameroonLocations';
import { X, ChevronDown, ChevronUp, Check, MapPin } from 'lucide-react-native';

interface LocationPickerProps {
  isVisible: boolean;
  onClose: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ isVisible, onClose }) => {
  const { t } = useLocale();
  const { 
    location, 
    setLocation, 
    clearLocation,
    availableRegions, 
    isLoading 
  } = useLocation();
  
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(location.region);
  const [selectedCity, setSelectedCity] = useState<string | null>(location.city);
  const [showRegionDropdown, setShowRegionDropdown] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setSelectedRegion(location.region);
      setSelectedCity(location.city);
      setShowRegionDropdown(false);
      setShowCityDropdown(false);
      console.log('LocationPicker opened with:', { region: location.region, city: location.city });
    }
  }, [isVisible, location]);
  
  // Update filtered cities when region changes
  useEffect(() => {
    if (selectedRegion) {
      const cities = CAMEROON_LOCATIONS[selectedRegion] || [];
      setFilteredCities(cities);
      console.log('Updated filtered cities for region:', selectedRegion, 'Cities count:', cities.length);
    } else {
      setFilteredCities([]);
    }
  }, [selectedRegion]);
  
  // Toggle region dropdown
  const toggleRegionDropdown = useCallback(() => {
    setShowRegionDropdown(prev => !prev);
    if (showCityDropdown) setShowCityDropdown(false);
  }, [showCityDropdown]);
  
  // Toggle city dropdown
  const toggleCityDropdown = useCallback(() => {
    if (!selectedRegion) {
      // If no region is selected, show region dropdown first
      setShowRegionDropdown(true);
      return;
    }
    setShowCityDropdown(prev => !prev);
    if (showRegionDropdown) setShowRegionDropdown(false);
    console.log('City dropdown toggled, now:', !showCityDropdown, 'for region:', selectedRegion);
  }, [selectedRegion, showRegionDropdown, showCityDropdown]);
  
  // Handle region selection
  const handleRegionSelect = useCallback((region: RegionKey) => {
    setSelectedRegion(region);
    setSelectedCity(null);
    setLocation({ region, city: null });
    setShowRegionDropdown(false);
    
    // Immediately show city dropdown after region selection
    setShowCityDropdown(true);
    console.log('Opening city dropdown for region:', region, 'with cities:', CAMEROON_LOCATIONS[region]);
    console.log('Selected region:', region);
  }, [setLocation]);
  
  // Handle city selection
  const handleCitySelect = useCallback((city: string) => {
    if (!selectedRegion) return;
    
    setSelectedCity(city);
    setShowCityDropdown(false);
    console.log('Selected city:', city, 'in region:', selectedRegion);
    
    // Update location and close modal with a slight delay to show selection
    setTimeout(() => {
      setLocation({ region: selectedRegion, city }).then(() => {
        setTimeout(() => {
          onClose();
        }, 200);
      });
    }, 300);
  }, [selectedRegion, setLocation, onClose]);
  
  // Clear all selections
  const handleClearAll = useCallback(() => {
    clearLocation().then(() => {
      setSelectedRegion(null);
      setSelectedCity(null);
      onClose();
    });
  }, [clearLocation, onClose]);
  
  // Render region item
  const renderRegionItem = useCallback(({ item }: { item: RegionKey }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, selectedRegion === item && styles.selectedDropdownItem]}
      onPress={() => handleRegionSelect(item)}
      testID={`region-${item}`}
      activeOpacity={0.7}
    >
      <Text style={[styles.dropdownItemText, selectedRegion === item && styles.selectedDropdownItemText]}>
        {item}
      </Text>
      {selectedRegion === item && <Check size={18} color="#fff" />}
    </TouchableOpacity>
  ), [selectedRegion, handleRegionSelect]);

  // Render city item
  const renderCityItem = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, selectedCity === item && styles.selectedDropdownItem]}
      onPress={() => handleCitySelect(item)}
      testID={`city-${item}`}
      activeOpacity={0.7}
    >
      <Text style={[styles.dropdownItemText, selectedCity === item && styles.selectedDropdownItemText]}>
        {item}
      </Text>
      {selectedCity === item && <Check size={18} color="#fff" />}
    </TouchableOpacity>
  ), [selectedCity, handleCitySelect]);
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('changeLocation')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="close-button">
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
          </View>
        ) : (
          <View style={styles.content}>
            {/* All Regions option */}
            <TouchableOpacity
              style={[styles.allRegionsButton, !selectedRegion && styles.selectedAllRegions]}
              onPress={handleClearAll}
              testID="all-regions-button"
              activeOpacity={0.7}
            >
              <Text style={[styles.allRegionsText, !selectedRegion && styles.selectedAllRegionsText]}>
                {t('allRegions')}
              </Text>
              {!selectedRegion && <Check size={20} color="#0066cc" />}
            </TouchableOpacity>
            
            {/* Region Selector */}
            <View style={styles.selectorContainer}>
              <Text style={styles.selectorLabel}>{t('region')}</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={toggleRegionDropdown}
                testID="region-dropdown-button"
                activeOpacity={0.7}
              >
                <Text style={styles.selectorButtonText}>
                  {selectedRegion || t('selectRegion')}
                </Text>
                {showRegionDropdown ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </TouchableOpacity>
              
              {showRegionDropdown && (
                <View style={styles.dropdownContainer} testID="region-dropdown">
                  <FlatList
                    data={availableRegions}
                    renderItem={renderRegionItem}
                    keyExtractor={(item) => item}
                    style={styles.dropdown}
                    contentContainerStyle={styles.dropdownContent}
                    showsVerticalScrollIndicator={true}
                    initialNumToRender={10}
                  />
                </View>
              )}
            </View>
            
            {/* City Selector */}
            <View style={[styles.selectorContainer, !selectedRegion && styles.disabledSelector]}>
              <Text style={styles.selectorLabel}>{t('city')}</Text>
              <TouchableOpacity 
                style={[styles.selectorButton, !selectedRegion && styles.disabledButton, selectedRegion && !selectedCity && styles.activeCitySelector]}
                onPress={toggleCityDropdown}
                disabled={!selectedRegion}
                testID="city-dropdown-button"
                activeOpacity={0.7}
              >
                <Text style={[styles.selectorButtonText, !selectedCity && !selectedRegion && styles.placeholderText]}>
                  {selectedCity || (selectedRegion ? t('selectCity') : t('selectRegionFirst'))}
                </Text>
                {selectedRegion && (
                  showCityDropdown ? (
                    <ChevronUp size={20} color="#666" />
                  ) : (
                    <ChevronDown size={20} color="#666" />
                  )
                )}
              </TouchableOpacity>
              
              {showCityDropdown && selectedRegion && (
                <View 
                  style={[styles.dropdownContainer, styles.cityDropdownContainer]} 
                  testID="city-dropdown"
                  pointerEvents="auto"
                >
                  <Text style={styles.cityDropdownTitle}>Select a city in {selectedRegion}</Text>
                  {filteredCities.length > 0 ? (
                    <FlatList
                      data={filteredCities}
                      renderItem={renderCityItem}
                      keyExtractor={(item) => item}
                      style={styles.dropdown}
                      contentContainerStyle={styles.dropdownContent}
                      showsVerticalScrollIndicator={true}
                      initialNumToRender={10}
                    />
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>No cities available for this region</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {/* Current Selection */}
            {(selectedRegion || selectedCity) && (
              <View style={styles.selectionContainer}>
                <MapPin size={18} color="#0066cc" />
                <Text style={styles.selectionText}>
                  {selectedCity ? `${selectedCity}, ${selectedRegion}` : selectedRegion}
                </Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    position: 'relative', // For proper z-index stacking
  },
  allRegionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  selectedAllRegions: {
    backgroundColor: '#e6f0ff',
  },
  allRegionsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedAllRegionsText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  selectorContainer: {
    marginBottom: 20,
    position: 'relative', // For absolute positioning of dropdown
    zIndex: 10, // Ensure dropdowns appear above other content
    marginTop: 10,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  disabledSelector: {
    opacity: 0.8,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  dropdownContainer: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 60, // Position below the selector button
  },
  cityDropdownContainer: {
    zIndex: 999, // Ensure city dropdown appears below region dropdown if both are open
    top: 60, // Position below the city selector button
    borderColor: '#0066cc', // Highlight the city dropdown with a different color
    borderWidth: 2,
    backgroundColor: '#f8f9ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  dropdown: {
    maxHeight: 250,
    width: '100%',
    backgroundColor: '#fff',
  },
  dropdownContent: {
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedDropdownItem: {
    backgroundColor: '#0066cc',
  },
  dropdownItemText: {
    fontSize: 15,
  },
  selectedDropdownItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  selectionText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#0066cc',
    fontWeight: '500',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  cityDropdownTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0066cc',
    padding: 10,
    backgroundColor: '#e6f0ff',
    borderBottomWidth: 1,
    borderBottomColor: '#cce0ff',
    textAlign: 'center',
  },
  activeCitySelector: {
    borderColor: '#0066cc',
    borderWidth: 2,
    backgroundColor: '#f0f7ff',
  },
});

export default LocationPicker;