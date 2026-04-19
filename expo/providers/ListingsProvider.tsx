import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateMockListings } from "@/services/mockData";
import { useLocale } from "@/providers/LocaleProvider";

export interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  region: string;
  city: string;
  address?: string;
  condition: string;
  description: string;
  images: string[];
  tags?: string[];
  phoneNumber?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isVerified: boolean;
  createdAt: Date;
  expiresAt?: Date;
  views: number;
  favorites: number;
  status: "available" | "reserved" | "sold" | "expired";
  reviewStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  sponsored?: boolean;
  seller?: User;
  listingType: 'sale' | 'barter';
  // Shopfront-specific fields
  sellerId: string;
  isFromShopfront?: boolean;
  // Barter-specific fields
  offerTitle?: string;
  offerCategory?: string;
  offerEstimatedValue?: number;
  wantCategories?: string[];
  wantNotes?: string;
  allowCashTopUp?: boolean;
  // Trust indicators
  securedTrading?: boolean;
  audited?: boolean;
  // Price range and quantity
  priceRange?: { min: number; max: number };
  moq?: number; // Minimum Order Quantity
  unit?: string; // Unit of measurement (Pieces, Kg, etc.)
}

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isGuest: boolean;
  verificationLevel?: 'none' | 'phone' | 'full';
  phoneVerified?: boolean;
  idVerified?: boolean;
  shopfrontData?: {
    enabled: boolean;
    isShopfront?: boolean;
    brandName?: string;
    logoImage?: string;
    bannerImage?: string;
    about?: string;
    shopAddress?: string;
    shopPhone?: string;
    website?: string;
    email?: string;
    fullAddress?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      whatsapp?: string;
    };
    hours?: {
      mon?: { closed?: boolean, open?: string, close?: string };
      tue?: { closed?: boolean, open?: string, close?: string };
      wed?: { closed?: boolean, open?: string, close?: string };
      thu?: { closed?: boolean, open?: string, close?: string };
      fri?: { closed?: boolean, open?: string, close?: string };
      sat?: { closed?: boolean, open?: string, close?: string };
      sun?: { closed?: boolean, open?: string, close?: string };
    };
    shopVerifiedLevel?: "none" | "phone" | "full";
    isVerified?: boolean;
    rating?: string;
  };
}

interface ListingsContextType {
  listings: Listing[];
  featuredListings: Listing[];
  pendingListings: Listing[];
  isLoading: boolean;
  selectedRegion: string | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
  createListing: (data: any) => Promise<void>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  renewListing: (id: string) => Promise<void>;
  approveListing: (id: string) => Promise<void>;
  rejectListing: (id: string, reason: string) => Promise<void>;
  getSeller: (id: string) => User | null;
  getSellerListings: (sellerId: string) => Listing[];
  getRelatedListings: (category: string, region: string, excludeId: string) => Listing[];
  getExpiredListings: () => Listing[];
  getPendingListings: () => Listing[];
  getListingsByLocation: (region?: string | null, city?: string | null) => Listing[];
  getListingsByCategory: (category: string, region?: string | null, city?: string | null) => Listing[];
}

export const [ListingsProvider, useListings] = createContextHook<ListingsContextType>(() => {
  const { locale } = useLocale();
  const [listings, setListings] = useState<Listing[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Helper function to generate and save mock listings
  const generateAndSaveMockListings = async (currentRegion: string | null, storageKey: string) => {
    // Generate fewer listings initially for faster startup
    const mock = await generateMockListings(15, currentRegion);
    const approved = mock.filter(l => l.reviewStatus === 'approved');
    const pending = mock.filter(l => l.reviewStatus === 'pending');
    setListings(approved);
    setPendingListings(pending);
    setFeaturedListings(approved.filter(l => l.sponsored).slice(0, 5));
    await AsyncStorage.setItem(storageKey, JSON.stringify(mock));
  };

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentRegion = await AsyncStorage.getItem('selectedRegion');
      const storageKey = currentRegion ? `listings_${currentRegion}` : "listings";
      
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const approved = parsed.filter((l: Listing) => l.reviewStatus === 'approved');
          const pending = parsed.filter((l: Listing) => l.reviewStatus === 'pending');
          setListings(approved);
          setPendingListings(pending);
          setFeaturedListings(approved.filter((l: Listing) => l.sponsored).slice(0, 5));
        } catch (parseError) {
          console.error("Failed to parse listings:", parseError);
          // Generate new mock data if parsing fails
          await generateAndSaveMockListings(currentRegion, storageKey);
        }
      } else {
        // No stored listings, generate mock data
        await generateAndSaveMockListings(currentRegion, storageKey);
      }
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load selected region from AsyncStorage
  const loadSelectedRegion = useCallback(async () => {
    try {
      const savedRegion = await AsyncStorage.getItem('selectedRegion');
      if (savedRegion) {
        setSelectedRegion(savedRegion);
      }
    } catch (error) {
      console.error('Failed to load selected region:', error);
    }
  }, []);

  useEffect(() => {
    loadListings();
    loadSelectedRegion();
  }, [loadListings, loadSelectedRegion]);

  // Reload listings when locale changes to get localized content
  useEffect(() => {
    if (locale) {
      loadListings();
    }
  }, [locale, loadListings]);

  // Listen for region changes only when app is active
  useEffect(() => {
    const checkRegionChange = async () => {
      try {
        const savedRegion = await AsyncStorage.getItem('selectedRegion');
        if (savedRegion !== selectedRegion) {
          setSelectedRegion(savedRegion);
          // Don't call loadListings here to prevent infinite loop
          // The region change will be handled by the refresh function when needed
        }
      } catch (error) {
        console.error('Failed to check region change:', error);
      }
    };

    // Only check when component mounts
    if (selectedRegion === null) {
      checkRegionChange();
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(async () => {
      const currentRegion = await AsyncStorage.getItem('selectedRegion');
      const newListings = await generateMockListings(30, currentRegion);
      const approved = newListings.filter(l => l.reviewStatus === 'approved');
      setListings(prev => [...prev, ...approved]);
      setIsLoading(false);
    }, 1000);
  }, [isLoading]);

  const refresh = useCallback(async () => {
    console.log('Refreshing listings...');
    await loadListings();
  }, [loadListings]);

  const createListing = useCallback(async (data: any) => {
    const newListing: Listing = {
      id: Date.now().toString(),
      ...data,
      userId: "current-user",
      userName: "Current User",
      sellerId: "current-user",
      isVerified: false,
      createdAt: new Date(),
      expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      views: 0,
      favorites: 0,
      status: "available",
      reviewStatus: "pending",
      listingType: data.listingType || 'sale',
      tags: data.tags || [],
      securedTrading: data.securedTrading || Math.random() > 0.5,
      audited: data.audited || Math.random() > 0.7,
      priceRange: data.priceRange,
      moq: data.moq,
      unit: data.unit || 'Pieces',
    };
    
    // Get all listings from storage to update
    const stored = await AsyncStorage.getItem("listings");
    const allListings = stored ? JSON.parse(stored) : [];
    const updated = [newListing, ...allListings];
    
    // Update pending listings state
    setPendingListings(prev => [newListing, ...prev]);
    
    await AsyncStorage.setItem("listings", JSON.stringify(updated));
  }, []);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>) => {
    // Get all listings from storage
    const stored = await AsyncStorage.getItem("listings");
    const allListings = stored ? JSON.parse(stored) : [];
    const updated = allListings.map((l: Listing) => l.id === id ? { ...l, ...updates } : l);
    
    // Update state based on review status
    const approved = updated.filter((l: Listing) => l.reviewStatus === 'approved');
    const pending = updated.filter((l: Listing) => l.reviewStatus === 'pending');
    
    setListings(approved);
    setPendingListings(pending);
    // Filter featured listings by region if a specific region is selected
    const currentRegion = await AsyncStorage.getItem('selectedRegion');
    const featuredCandidates = approved.filter((l: Listing) => l.sponsored);
    const regionFilteredFeatured = currentRegion && currentRegion !== 'all' 
      ? featuredCandidates.filter((l: Listing) => l.region === currentRegion)
      : featuredCandidates;
    setFeaturedListings(regionFilteredFeatured.slice(0, 5));
    
    await AsyncStorage.setItem("listings", JSON.stringify(updated));
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    // Get all listings from storage
    const stored = await AsyncStorage.getItem("listings");
    const allListings = stored ? JSON.parse(stored) : [];
    const updated = allListings.filter((l: Listing) => l.id !== id);
    
    // Update state
    const approved = updated.filter((l: Listing) => l.reviewStatus === 'approved');
    const pending = updated.filter((l: Listing) => l.reviewStatus === 'pending');
    
    setListings(approved);
    setPendingListings(pending);
    // Filter featured listings by region if a specific region is selected
    const currentRegion = await AsyncStorage.getItem('selectedRegion');
    const featuredCandidates = approved.filter((l: Listing) => l.sponsored);
    const regionFilteredFeatured = currentRegion && currentRegion !== 'all' 
      ? featuredCandidates.filter((l: Listing) => l.region === currentRegion)
      : featuredCandidates;
    setFeaturedListings(regionFilteredFeatured.slice(0, 5));
    
    await AsyncStorage.setItem("listings", JSON.stringify(updated));
  }, []);

  const renewListing = useCallback(async (id: string) => {
    // Get all listings from storage
    const stored = await AsyncStorage.getItem("listings");
    const allListings = stored ? JSON.parse(stored) : [];
    const updated = allListings.map((l: Listing) => 
      l.id === id 
        ? { 
            ...l, 
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "available" as const,
            reviewStatus: "pending" as const // Renewed listings need re-approval
          }
        : l
    );
    
    // Update state
    const approved = updated.filter((l: Listing) => l.reviewStatus === 'approved');
    const pending = updated.filter((l: Listing) => l.reviewStatus === 'pending');
    
    setListings(approved);
    setPendingListings(pending);
    // Filter featured listings by region if a specific region is selected
    const currentRegion = await AsyncStorage.getItem('selectedRegion');
    const featuredCandidates = approved.filter((l: Listing) => l.sponsored);
    const regionFilteredFeatured = currentRegion && currentRegion !== 'all' 
      ? featuredCandidates.filter((l: Listing) => l.region === currentRegion)
      : featuredCandidates;
    setFeaturedListings(regionFilteredFeatured.slice(0, 5));
    
    await AsyncStorage.setItem("listings", JSON.stringify(updated));
  }, []);

  const getSeller = useCallback((id: string): User | null => {
    // Mock seller data for now
    // SWAP WITH BACKEND HERE
    return {
      id,
      name: `Seller ${id.substring(0, 5)}`,
      phone: `+2376${Math.floor(Math.random() * 100000000)}`,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      isGuest: false,
      verificationLevel: Math.random() > 0.7 ? 'full' : Math.random() > 0.5 ? 'phone' : 'none',
      phoneVerified: Math.random() > 0.5,
      idVerified: Math.random() > 0.7,
      shopfrontData: {
        enabled: true,
        isShopfront: true,
        brandName: `Shop ${id.substring(0, 5)}`,
        logoImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        bannerImage: `https://picsum.photos/800/300?random=${id}`,
        about: "We sell high-quality products at affordable prices. Customer satisfaction is our priority.",
        shopAddress: "Main Street, City Center",
        shopPhone: `+2376${Math.floor(Math.random() * 100000000)}`,
        website: "https://www.example.com",
        email: `shop${id.substring(0, 5)}@example.com`,
        fullAddress: "123 Main Street, City Center, Douala, Littoral Region",
        socialMedia: {
          facebook: "https://facebook.com/myshop",
          instagram: "@myshop",
          twitter: "@myshop",
          whatsapp: `+2376${Math.floor(Math.random() * 100000000)}`
        },
        hours: {
          mon: { closed: false, open: "09:00", close: "17:00" },
          tue: { closed: false, open: "09:00", close: "17:00" },
          wed: { closed: false, open: "09:00", close: "17:00" },
          thu: { closed: false, open: "09:00", close: "17:00" },
          fri: { closed: false, open: "09:00", close: "17:00" },
          sat: { closed: false, open: "10:00", close: "14:00" },
          sun: { closed: true }
        },
        shopVerifiedLevel: Math.random() > 0.7 ? 'full' : Math.random() > 0.5 ? 'phone' : 'none',
        isVerified: Math.random() > 0.3,
        rating: (4 + Math.random()).toFixed(1)
      }
    };
  }, []);

  const getSellerListings = useCallback((sellerId: string): Listing[] => {
    return listings.filter(listing => listing.userId === sellerId);
  }, [listings]);

  const getRelatedListings = useCallback((category: string, region: string, excludeId: string): Listing[] => {
    return listings
      .filter(listing => 
        listing.id !== excludeId && 
        listing.category === category && 
        listing.region === region &&
        listing.status !== "expired"
      )
      .slice(0, 10);
  }, [listings]);

  const getExpiredListings = useCallback((): Listing[] => {
    const now = new Date();
    return listings.filter(listing => 
      listing.expiresAt && 
      new Date(listing.expiresAt) < now &&
      listing.status !== "expired"
    );
  }, [listings]);

  const getPendingListings = useCallback((): Listing[] => {
    return pendingListings;
  }, [pendingListings]);

  const approveListing = useCallback(async (id: string) => {
    await updateListing(id, { reviewStatus: "approved" });
  }, [updateListing]);

  const rejectListing = useCallback(async (id: string, reason: string) => {
    await updateListing(id, { reviewStatus: "rejected", rejectionReason: reason });
  }, [updateListing]);

  const getListingsByLocation = useCallback((region?: string | null, city?: string | null): Listing[] => {
    let results = [...listings];
    
    if (region) {
      results = results.filter(listing => listing.region === region);
      
      if (city) {
        results = results.filter(listing => listing.city === city);
      }
    }
    
    return results;
  }, [listings]);

  const getListingsByCategory = useCallback((category: string, region?: string | null, city?: string | null): Listing[] => {
    let results = listings.filter(listing => listing.category === category);
    
    if (region) {
      results = results.filter(listing => listing.region === region);
      
      if (city) {
        results = results.filter(listing => listing.city === city);
      }
    }
    
    return results;
  }, [listings]);

  // Auto-expire listings - disabled to prevent infinite loops
  // This functionality can be moved to a background service or handled on app startup

  return useMemo(() => ({
    listings,
    featuredListings,
    pendingListings,
    isLoading,
    selectedRegion,
    loadMore,
    refresh,
    createListing,
    updateListing,
    deleteListing,
    renewListing,
    approveListing,
    rejectListing,
    getSeller,
    getSellerListings,
    getRelatedListings,
    getExpiredListings,
    getPendingListings,
    getListingsByLocation,
    getListingsByCategory
  }), [listings, featuredListings, pendingListings, isLoading, selectedRegion, loadMore, refresh, createListing, updateListing, deleteListing, renewListing, approveListing, rejectListing, getSeller, getSellerListings, getRelatedListings, getExpiredListings, getPendingListings, getListingsByLocation, getListingsByCategory]);
});