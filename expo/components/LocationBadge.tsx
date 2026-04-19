import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocation } from '@/providers/LocationProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { MapPin } from 'lucide-react-native';
import LocationPicker from './LocationPicker';

interface LocationBadgeProps {
  compact?: boolean;
}

const LocationBadge: React.FC<LocationBadgeProps> = ({ compact = false }) => {
  const { t } = useLocale();
  const { location } = useLocation();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  
  // Log location state for debugging
  React.useEffect(() => {
    console.log('LocationBadge location state:', location);
  }, [location]);
  
  const openPicker = useCallback(() => {
    console.log('Opening location picker');
    setIsPickerVisible(true);
  }, []);
  
  const closePicker = useCallback(() => {
    console.log('Closing location picker');
    setIsPickerVisible(false);
  }, []);
  
  // If no location is selected, show a default message
  if (!location.region) {
    return (
      <>
        <TouchableOpacity 
          style={[styles.container, compact && styles.compactContainer]} 
          onPress={openPicker}
          testID="location-badge-default"
        >
          <MapPin size={compact ? 16 : 20} color="#0066cc" />
          <Text style={[styles.text, compact && styles.compactText]} numberOfLines={1} ellipsizeMode="tail">
            {t('allRegions')}
          </Text>
        </TouchableOpacity>
        <LocationPicker isVisible={isPickerVisible} onClose={closePicker} />
      </>
    );
  }
  
  // If only region is selected (no city)
  if (location.region && !location.city) {
    return (
      <>
        <TouchableOpacity 
          style={[styles.container, compact && styles.compactContainer]} 
          onPress={openPicker}
          testID="location-badge-region"
        >
          <MapPin size={compact ? 16 : 20} color="#0066cc" />
          <Text style={[styles.text, compact && styles.compactText]} numberOfLines={1} ellipsizeMode="tail">
            {location.region}
          </Text>
        </TouchableOpacity>
        <LocationPicker isVisible={isPickerVisible} onClose={closePicker} />
      </>
    );
  }
  
  // If both region and city are selected
  return (
    <>
      <TouchableOpacity 
        style={[styles.container, compact && styles.compactContainer]} 
        onPress={openPicker}
        testID="location-badge-city"
      >
        <MapPin size={compact ? 16 : 20} color="#0066cc" />
        <Text style={[styles.text, compact && styles.compactText]} numberOfLines={1} ellipsizeMode="tail">
          {compact ? location.city : `${location.city}, ${location.region}`}
        </Text>
      </TouchableOpacity>
      <LocationPicker isVisible={isPickerVisible} onClose={closePicker} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '100%',
    minWidth: 100,
  },
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  text: {
    marginLeft: 6,
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 12,
  },
});

export default LocationBadge;