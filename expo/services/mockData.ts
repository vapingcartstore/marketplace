import { Listing, User } from "@/providers/ListingsProvider";
import { CATEGORIES } from "@/constants/categories";
import { REGIONS } from "@/constants/regions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockTitles = {
  en: [
    "iPhone 13 Pro Max 256GB",
    "Toyota Corolla 2019",
    "3 Bedroom Apartment in Douala",
    "Samsung 55\" Smart TV",
    "Nike Air Max Shoes",
    "Gaming Laptop HP Omen",
    "Mountain Bike Shimano",
    "Office Desk and Chair",
    "PlayStation 5 Console",
    "Canon DSLR Camera",
    "Generator 5KVA",
    "Sofa Set - 7 Seater",
    "MacBook Pro M1",
    "Honda CBR Motorcycle",
    "Studio Apartment Yaounde",
  ],
  fr: [
    "iPhone 13 Pro Max 256GB",
    "Toyota Corolla 2019",
    "Appartement 3 chambres à Douala",
    "Smart TV Samsung 55\"",
    "Chaussures Nike Air Max",
    "Ordinateur portable gaming HP Omen",
    "VTT Shimano",
    "Bureau et chaise de bureau",
    "Console PlayStation 5",
    "Appareil photo Canon DSLR",
    "Générateur 5KVA",
    "Salon 7 places",
    "MacBook Pro M1",
    "Moto Honda CBR",
    "Studio à Yaoundé",
  ]
};

const mockDescriptions = {
  en: [
    "Excellent condition, barely used. Comes with original box and accessories.",
    "Well maintained, single owner. All documents complete.",
    "Spacious and modern. Close to amenities and public transport.",
    "Brand new, still in warranty. Reason for selling: relocation.",
    "Genuine product, purchased from official store.",
  ],
  fr: [
    "Excellent état, peu utilisé. Livré avec boîte d'origine et accessoires.",
    "Bien entretenu, propriétaire unique. Tous les documents complets.",
    "Spacieux et moderne. Proche des commodités et transports publics.",
    "Neuf, encore sous garantie. Raison de la vente : déménagement.",
    "Produit authentique, acheté en magasin officiel.",
  ]
};

const mockCities = [
  "Douala", "Yaounde", "Bamenda", "Bafoussam", "Garoua",
  "Maroua", "Ngaoundere", "Bertoua", "Ebolowa", "Kribi",
];

const mockUserNames = {
  en: [
    "Jean Paul", "Marie Claire", "Emmanuel K.", "Fatima B.",
    "Patrick N.", "Alice M.", "Samuel T.", "Grace O.",
  ],
  fr: [
    "Jean Paul", "Marie Claire", "Emmanuel K.", "Fatima B.",
    "Patrick N.", "Alice M.", "Samuel T.", "Grace O.",
  ]
};

const mockTags = {
  en: [
    "brand new", "urgent sale", "negotiable", "original box", "warranty",
    "excellent condition", "barely used", "quick sale", "moving sale", "genuine",
    "imported", "local", "durable", "affordable", "premium", "vintage",
    "modern", "stylish", "functional", "compact"
  ],
  fr: [
    "neuf", "vente urgente", "négociable", "boîte d'origine", "garantie",
    "excellent état", "peu utilisé", "vente rapide", "vente déménagement", "authentique",
    "importé", "local", "durable", "abordable", "premium", "vintage",
    "moderne", "élégant", "fonctionnel", "compact"
  ]
};

async function getLocale(): Promise<'en' | 'fr'> {
  try {
    const stored = await AsyncStorage.getItem("locale");
    return (stored as 'en' | 'fr') || 'en';
  } catch {
    return 'en';
  }
}

function generateMockSeller(userId: string, locale: 'en' | 'fr' = 'en'): User {
  const verificationLevel = Math.random() > 0.7 ? 'full' : Math.random() > 0.5 ? 'phone' : 'none';
  return {
    id: userId,
    name: mockUserNames[locale][Math.floor(Math.random() * mockUserNames[locale].length)],
    phone: `+2376${Math.floor(Math.random() * 100000000)}`,
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
    isGuest: false,
    verificationLevel,
    phoneVerified: verificationLevel !== 'none',
    idVerified: verificationLevel === 'full',
    shopfrontData: Math.random() > 0.5 ? {
      enabled: true,
      isShopfront: true,
      brandName: `Shop ${userId.substring(0, 5)}`,
      logoImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      bannerImage: `https://picsum.photos/800/300?random=${userId}`,
      about: "We sell high-quality products at affordable prices. Customer satisfaction is our priority.",
      shopAddress: "Main Street, City Center",
      website: "https://www.example.com",
      rating: (4 + Math.random()).toFixed(1)
    } : undefined
  };
}

export async function generateMockListings(count: number, targetRegion?: string | null): Promise<Listing[]> {
  console.log(`Generating ${count} mock listings for region: ${targetRegion || 'all'}`);
  const locale = await getLocale();
  const listings: Listing[] = [];
  
  for (let i = 0; i < count; i++) {
    const isSponsored = Math.random() > 0.8;
    const isVerified = Math.random() > 0.6;
    const userId = `user-${Math.floor(Math.random() * 100)}`;
    const seller = generateMockSeller(userId, locale);
    
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isExpired = expiresAt < new Date();
    
    // Generate random tags
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags
    const selectedTags: string[] = [];
    for (let j = 0; j < numTags; j++) {
      const tag = mockTags[locale][Math.floor(Math.random() * mockTags[locale].length)];
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }
    
    // Determine review status - most listings are approved, some pending, few rejected
    const reviewStatusRandom = Math.random();
    let reviewStatus: "pending" | "approved" | "rejected";
    let rejectionReason: string | undefined;
    
    if (reviewStatusRandom > 0.85) {
      reviewStatus = "pending";
    } else if (reviewStatusRandom > 0.05) {
      reviewStatus = "approved";
    } else {
      reviewStatus = "rejected";
      rejectionReason = ["Inappropriate content", "Prohibited item", "Duplicate listing", "Incomplete information"][Math.floor(Math.random() * 4)];
    }
    
    // Determine region based on targetRegion parameter
    let selectedRegion: string;
    if (targetRegion && targetRegion !== 'all') {
      selectedRegion = targetRegion;
      console.log(`Using specified region: ${selectedRegion} for listing ${i}`);
    } else {
      selectedRegion = REGIONS[Math.floor(Math.random() * (REGIONS.length - 1)) + 1].id;
      console.log(`Using random region: ${selectedRegion} for listing ${i}`);
    }
    
    // Generate price range for some listings
    const hasRange = Math.random() > 0.7;
    const basePrice = Math.floor(Math.random() * 1000000) + 10000;
    const priceRange = hasRange ? { 
      min: basePrice, 
      max: basePrice + Math.floor(Math.random() * 100000) + 10000 
    } : undefined;
    
    // Generate MOQ for some listings
    const hasMoq = Math.random() > 0.6;
    const moq = hasMoq ? Math.floor(Math.random() * 100) + 1 : undefined;
    const unit = hasMoq ? ['Pieces', 'Kg', 'Sets', 'Units'][Math.floor(Math.random() * 4)] : undefined;
    
    listings.push({
      id: `listing-${Date.now()}-${i}`,
      title: mockTitles[locale][Math.floor(Math.random() * mockTitles[locale].length)],
      price: basePrice,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id,
      region: selectedRegion,
      city: mockCities[Math.floor(Math.random() * mockCities.length)],
      address: Math.random() > 0.5 ? "Near City Center, Main Street" : undefined,
      condition: ["new", "like-new", "good", "fair"][Math.floor(Math.random() * 4)],
      description: mockDescriptions[locale][Math.floor(Math.random() * mockDescriptions[locale].length)],
      images: [
        `https://picsum.photos/400/400?random=${Date.now()}-${i}`,
        `https://picsum.photos/400/400?random=${Date.now()}-${i}-2`,
      ],
      tags: selectedTags,
      phoneNumber: `+2376${Math.floor(Math.random() * 100000000)}`,
      userId,
      userName: seller.name,
      userAvatar: seller.avatar,
      seller,
      sellerId: userId,
      isVerified,
      createdAt,
      expiresAt,
      views: Math.floor(Math.random() * 1000),
      favorites: Math.floor(Math.random() * 50),
      status: isExpired ? "expired" : "available",
      reviewStatus,
      rejectionReason,
      sponsored: isSponsored,
      listingType: Math.random() > 0.7 ? 'barter' : 'sale',
      // Trust indicators removed
      securedTrading: false,
      audited: false,
      // Price range and quantity
      priceRange,
      moq,
      unit,
      // Barter fields (populated if barter type)
      offerTitle: Math.random() > 0.7 ? mockTitles[locale][Math.floor(Math.random() * mockTitles[locale].length)] : undefined,
      offerCategory: Math.random() > 0.7 ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id : undefined,
      offerEstimatedValue: Math.random() > 0.5 ? Math.floor(Math.random() * 500000) + 50000 : undefined,
      wantCategories: Math.random() > 0.7 ? [CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id] : undefined,
      wantNotes: Math.random() > 0.7 ? (locale === 'en' ? "Looking for similar value items or cash top-up" : "Recherche articles de valeur similaire ou complément en espèces") : undefined,
      allowCashTopUp: Math.random() > 0.5,
    });
  }
  
  console.log(`Generated ${listings.length} listings with categories:`, 
    listings.reduce((acc, listing) => {
      acc[listing.category] = (acc[listing.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
  return listings;
}

export interface MockShop {
  id: string;
  brandName: string;
  logo: string;
  banner: string;
  rating: string;
  reviewCount: number;
  verificationLevel: 'none' | 'phone' | 'full';
  category: string;
  listingCount: number;
  region: string;
  city: string;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  backgroundImage: string;
  link?: string;
  isActive: boolean;
  priority: number;
}

export async function generatePromotionalBanners(): Promise<PromotionalBanner[]> {
  const locale = await getLocale();
  
  const banners = {
    en: [
      {
        id: 'anniversary-sale',
        title: '10-YEAR ANNIVERSARY SALE',
        subtitle: 'FACTORY DIRECT FROM CHINA • FREE SHIPPING',
        description: '• FREE SHIPPING •\n• UP TO 70% OFF',
        buttonText: 'CLICK TO BUY',
        backgroundImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
        link: 'https://example.com/anniversary-sale',
        isActive: true,
        priority: 1,
      },
      {
        id: 'electronics-deal',
        title: 'MEGA ELECTRONICS SALE',
        subtitle: 'SMARTPHONES • LAPTOPS • GADGETS',
        description: '• GENUINE PRODUCTS •\n• WARRANTY INCLUDED',
        buttonText: 'SHOP NOW',
        backgroundImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
        link: 'https://example.com/electronics',
        isActive: true,
        priority: 2,
      },
      {
        id: 'fashion-week',
        title: 'FASHION WEEK SPECIAL',
        subtitle: 'TRENDING STYLES • LATEST COLLECTIONS',
        description: '• NEW ARRIVALS •\n• DESIGNER BRANDS',
        buttonText: 'EXPLORE',
        backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
        link: 'https://example.com/fashion',
        isActive: true,
        priority: 3,
      },
    ],
    fr: [
      {
        id: 'anniversary-sale',
        title: 'VENTE 10ÈME ANNIVERSAIRE',
        subtitle: 'DIRECT USINE DE CHINE • LIVRAISON GRATUITE',
        description: '• LIVRAISON GRATUITE •\n• JUSQU\'À 70% DE RÉDUCTION',
        buttonText: 'CLIQUEZ POUR ACHETER',
        backgroundImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
        link: 'https://example.com/anniversary-sale',
        isActive: true,
        priority: 1,
      },
      {
        id: 'electronics-deal',
        title: 'MÉGA VENTE ÉLECTRONIQUE',
        subtitle: 'SMARTPHONES • ORDINATEURS • GADGETS',
        description: '• PRODUITS AUTHENTIQUES •\n• GARANTIE INCLUSE',
        buttonText: 'ACHETER MAINTENANT',
        backgroundImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
        link: 'https://example.com/electronics',
        isActive: true,
        priority: 2,
      },
      {
        id: 'fashion-week',
        title: 'SPÉCIAL SEMAINE MODE',
        subtitle: 'STYLES TENDANCE • DERNIÈRES COLLECTIONS',
        description: '• NOUVEAUTÉS •\n• MARQUES DE CRÉATEURS',
        buttonText: 'EXPLORER',
        backgroundImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
        link: 'https://example.com/fashion',
        isActive: true,
        priority: 3,
      },
    ],
  };
  
  return banners[locale].filter(banner => banner.isActive).sort((a, b) => a.priority - b.priority);
}

export async function generateMockShops(count: number, targetRegion?: string | null): Promise<MockShop[]> {
  const locale = await getLocale();
  const shops: MockShop[] = [];
  
  const shopNames = {
    en: [
      "TechHub Cameroon", "Fashion Forward", "Home & Garden", "Auto Parts Plus",
      "Electronics World", "Style Central", "Kitchen Essentials", "Sports Zone",
      "Beauty Corner", "Book Haven", "Gadget Galaxy", "Furniture Palace"
    ],
    fr: [
      "TechHub Cameroun", "Mode Avancée", "Maison & Jardin", "Pièces Auto Plus",
      "Monde Électronique", "Centre Style", "Essentiels Cuisine", "Zone Sport",
      "Coin Beauté", "Havre Livres", "Galaxie Gadgets", "Palais Meubles"
    ]
  };
  
  const categories = [
    "Electronics", "Fashion", "Furniture", "Automotive", "Sports", "Beauty", "Books", "Kitchen"
  ];
  
  for (let i = 0; i < count; i++) {
    // Determine region based on targetRegion parameter
    let selectedRegion: string;
    if (targetRegion && targetRegion !== 'all') {
      selectedRegion = targetRegion;
    } else {
      selectedRegion = REGIONS[Math.floor(Math.random() * (REGIONS.length - 1)) + 1].id;
    }
    
    shops.push({
      id: `shop-${Date.now()}-${i}`,
      brandName: shopNames[locale][Math.floor(Math.random() * shopNames[locale].length)],
      logo: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      banner: `https://picsum.photos/800/300?random=${Date.now()}-${i}`,
      rating: (4 + Math.random()).toFixed(1),
      reviewCount: Math.floor(Math.random() * 300) + 20,
      verificationLevel: Math.random() > 0.7 ? 'full' : Math.random() > 0.5 ? 'phone' : 'none',
      category: categories[Math.floor(Math.random() * categories.length)],
      listingCount: Math.floor(Math.random() * 80) + 10,
      region: selectedRegion,
      city: mockCities[Math.floor(Math.random() * mockCities.length)]
    });
  }
  
  return shops;
}