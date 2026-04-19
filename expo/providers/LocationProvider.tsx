import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CAMEROON_LOCATIONS, RegionKey } from "@/data/cameroonLocations";
// We'll use the locale provider in the LocationPicker component

interface LocationState {
  region: RegionKey | null;
  city: string | null;
}

interface LocationContextType {
  location: LocationState;
  setLocation: (location: LocationState) => Promise<void>;
  clearLocation: () => Promise<void>;
  clearCity: () => Promise<void>;
  availableRegions: RegionKey[];
  availableCities: string[];
  isLoading: boolean;
}

export const [LocationProvider, useLocation] = createContextHook<LocationContextType>(() => {
  // Using useMemo to memoize the return value
  // We'll use the locale provider in the LocationPicker component
  const [location, setLocationState] = useState<LocationState>({ region: null, city: null });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load location from AsyncStorage on mount - simplified for performance
  useEffect(() => {
    const loadLocation = async () => {
      try {
        setIsLoading(true);
        const storedLocation = await AsyncStorage.getItem('userLocation');
        
        if (storedLocation) {
          try {
            const parsedLocation = JSON.parse(storedLocation) as LocationState;
            setLocationState(parsedLocation);
          } catch (parseError) {
            console.error('Failed to parse location data:', parseError);
            setLocationState({ region: null, city: null });
          }
        } else {
          // Try to load from legacy storage - simplified
          const selectedRegion = await AsyncStorage.getItem('selectedRegion') as RegionKey | null;
          if (selectedRegion) {
            const newLocation: LocationState = { region: selectedRegion, city: null };
            setLocationState(newLocation);
            await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
          }
        }
      } catch (error) {
        console.error('Failed to load location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocation();
  }, []);

  // Set location and persist to AsyncStorage
  const setLocation = useCallback(async (newLocation: LocationState) => {
    try {
      setIsLoading(true);
      console.log('Setting location to:', newLocation);
      
      // Validate the new location
      if (newLocation.region && !Object.keys(CAMEROON_LOCATIONS).includes(newLocation.region)) {
        console.error('Invalid region:', newLocation.region);
        throw new Error('Invalid region');
      }
      
      if (newLocation.region && newLocation.city && 
          !CAMEROON_LOCATIONS[newLocation.region as RegionKey].includes(newLocation.city)) {
        console.error('Invalid city for the selected region:', newLocation.city, 'in', newLocation.region);
        throw new Error('Invalid city for the selected region');
      }
      
      // Update state
      setLocationState(newLocation);
      
      // Persist to AsyncStorage
      await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log('Saved location to AsyncStorage:', newLocation);
      
      // Also update the selectedRegion for backward compatibility with ListingsProvider
      if (newLocation.region) {
        await AsyncStorage.setItem('selectedRegion', newLocation.region);
        
        // Store city separately for easier access
        if (newLocation.city) {
          await AsyncStorage.setItem('selectedCity', newLocation.city);
        } else {
          await AsyncStorage.removeItem('selectedCity');
        }
      } else {
        await AsyncStorage.removeItem('selectedRegion');
        await AsyncStorage.removeItem('selectedCity');
      }
      
      console.log('Location updated successfully:', newLocation);
    } catch (error) {
      console.error('Failed to set location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear location
  const clearLocation = useCallback(async () => {
    try {
      console.log('Clearing all location data');
      setIsLoading(true);
      setLocationState({ region: null, city: null });
      await AsyncStorage.removeItem('userLocation');
      await AsyncStorage.removeItem('selectedRegion');
      await AsyncStorage.removeItem('selectedCity');
      console.log('Location cleared successfully');
    } catch (error) {
      console.error('Failed to clear location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear only the city, keeping the region
  const clearCity = useCallback(async () => {
    if (!location.region) {
      console.log('Cannot clear city: no region selected');
      return;
    }
    
    try {
      console.log('Clearing city but keeping region:', location.region);
      setIsLoading(true);
      const newLocation = { region: location.region, city: null };
      setLocationState(newLocation);
      await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
      await AsyncStorage.removeItem('selectedCity');
      console.log('City cleared successfully, region kept:', location.region);
    } catch (error) {
      console.error('Failed to clear city:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location.region]);

  // Get available regions
  const availableRegions = useMemo<RegionKey[]>(() => {
    const regions = Object.keys(CAMEROON_LOCATIONS) as RegionKey[];
    console.log('Available regions:', regions);
    return regions;
  }, []);

  // Get available cities for the selected region
  const availableCities = useMemo<string[]>(() => {
    if (!location.region) return [];
    const cities = CAMEROON_LOCATIONS[location.region] || [];
    console.log(`Available cities for ${location.region}:`, cities);
    return cities;
  }, [location.region]);

  return useMemo(() => ({
    location,
    setLocation,
    clearLocation,
    clearCity,
    availableRegions,
    availableCities,
    isLoading
  }), [location, setLocation, clearLocation, clearCity, availableRegions, availableCities, isLoading]);
});