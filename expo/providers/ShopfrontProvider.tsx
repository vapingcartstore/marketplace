import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
// AsyncStorage is used indirectly through AuthProvider
import { useAuth, ShopfrontData } from "@/providers/AuthProvider";

interface ShopfrontContextType {
  shopfronts: ShopfrontData[];
  activeShopfront: ShopfrontData | null;
  isLoading: boolean;
  createShopfront: (data: Partial<ShopfrontData>) => Promise<ShopfrontData>;
  updateShopfront: (id: string, updates: Partial<ShopfrontData>) => Promise<void>;
  deleteShopfront: (id: string) => Promise<void>;
  setActiveShopfront: (id: string) => Promise<void>;
  getShopfront: (id: string) => ShopfrontData | null;
}

export const [ShopfrontProvider, useShopfront] = createContextHook<ShopfrontContextType>(() => {
  const { user, updateProfile } = useAuth();
  const [shopfronts, setShopfronts] = useState<ShopfrontData[]>([]);
  const [activeShopfront, setActiveShopfrontState] = useState<ShopfrontData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize shopfronts from user data
  useEffect(() => {
    if (user) {
      // Initialize with existing shopfronts or create an empty array
      const existingShopfronts = user.shopfronts || [];
      
      // If there's a main shopfrontData but no shopfronts array, migrate it
      if (user.shopfrontData && existingShopfronts.length === 0) {
        // Ensure the main shopfront has an ID
        const mainShopfront: ShopfrontData = {
          ...user.shopfrontData,
          id: user.shopfrontData.id || 'main',
          createdAt: user.shopfrontData.createdAt || new Date()
        };
        
        setShopfronts([mainShopfront]);
        setActiveShopfrontState(mainShopfront);
        
        // Update the user profile to include the shopfronts array
        updateProfile({
          shopfronts: [mainShopfront]
        });
      } else {
        setShopfronts(existingShopfronts);
        
        // Set active shopfront to the first one if available
        if (existingShopfronts.length > 0) {
          setActiveShopfrontState(existingShopfronts[0]);
        }
      }
    }
    setIsLoading(false);
  }, [user]);

  // Create a new shopfront
  const createShopfront = useCallback(async (data: Partial<ShopfrontData>): Promise<ShopfrontData> => {
    if (!user) throw new Error("User must be logged in to create a shopfront");
    
    const newShopfront: ShopfrontData = {
      id: Date.now().toString(),
      enabled: true,
      isShopfront: true,
      createdAt: new Date(),
      ...data
    };
    
    const updatedShopfronts = [...shopfronts, newShopfront];
    setShopfronts(updatedShopfronts);
    
    // If this is the first shopfront, set it as active
    if (updatedShopfronts.length === 1) {
      setActiveShopfrontState(newShopfront);
    }
    
    // Update user profile
    await updateProfile({
      shopfronts: updatedShopfronts,
      // Keep the main shopfrontData in sync with the active shopfront for backward compatibility
      shopfrontData: activeShopfront || newShopfront
    });
    
    return newShopfront;
  }, [user, shopfronts, activeShopfront, updateProfile]);

  // Update an existing shopfront
  const updateShopfront = useCallback(async (id: string, updates: Partial<ShopfrontData>) => {
    if (!user) return;
    
    const updatedShopfronts = shopfronts.map(shopfront => 
      shopfront.id === id ? { ...shopfront, ...updates } : shopfront
    );
    
    setShopfronts(updatedShopfronts);
    
    // If the updated shopfront is the active one, update activeShopfront state
    if (activeShopfront && activeShopfront.id === id) {
      const updated = { ...activeShopfront, ...updates };
      setActiveShopfrontState(updated);
      
      // Update the main shopfrontData for backward compatibility
      await updateProfile({
        shopfronts: updatedShopfronts,
        shopfrontData: updated
      });
    } else {
      await updateProfile({
        shopfronts: updatedShopfronts
      });
    }
  }, [user, shopfronts, activeShopfront, updateProfile]);

  // Delete a shopfront
  const deleteShopfront = useCallback(async (id: string) => {
    if (!user) return;
    
    // Don't allow deleting the last shopfront
    if (shopfronts.length <= 1) {
      throw new Error("Cannot delete the only shopfront");
    }
    
    const updatedShopfronts = shopfronts.filter(shopfront => shopfront.id !== id);
    setShopfronts(updatedShopfronts);
    
    // If the deleted shopfront was active, set the first remaining one as active
    if (activeShopfront && activeShopfront.id === id) {
      const newActive = updatedShopfronts[0];
      setActiveShopfrontState(newActive);
      
      await updateProfile({
        shopfronts: updatedShopfronts,
        shopfrontData: newActive
      });
    } else {
      await updateProfile({
        shopfronts: updatedShopfronts
      });
    }
  }, [user, shopfronts, activeShopfront, updateProfile]);

  // Set a shopfront as active
  const setActiveShopfront = useCallback(async (id: string) => {
    const shopfront = shopfronts.find(s => s.id === id);
    if (!shopfront) return;
    
    setActiveShopfrontState(shopfront);
    
    // Update the main shopfrontData for backward compatibility
    await updateProfile({
      shopfrontData: shopfront
    });
  }, [shopfronts, updateProfile]);

  // Get a specific shopfront by ID
  const getShopfront = useCallback((id: string): ShopfrontData | null => {
    return shopfronts.find(s => s.id === id) || null;
  }, [shopfronts]);

  return useMemo(() => ({
    shopfronts,
    activeShopfront,
    isLoading,
    createShopfront,
    updateShopfront,
    deleteShopfront,
    setActiveShopfront,
    getShopfront
  }), [shopfronts, activeShopfront, isLoading, createShopfront, updateShopfront, deleteShopfront, setActiveShopfront, getShopfront]);
});