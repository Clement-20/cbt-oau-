import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc, limit } from "firebase/firestore";
import { db } from "../firebase";
import { BadgeCheck, ShoppingBag, Plus, MessageCircle, Search } from "lucide-react";
import AddHustleModal from "./AddHustleModal";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { Helmet } from "react-helmet-async";

interface Listing {
  id: string;
  itemName: string;
  category: string;
  price: number;
  whatsappNumber: string;
  location: string;
  imageUrl: string;
  vendorName: string;
  vendorUid: string;
  createdAt: number;
  isVerified?: boolean;
}

export default function FlexStore({ user }: { user: any }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const q = query(collection(db, "flex_store_listings"), orderBy("createdAt", "desc"), limit(60));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedListings: Listing[] = [];
      const vendorUids = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Listing, 'id'>;
        fetchedListings.push({ id: doc.id, ...data });
        vendorUids.add(data.vendorUid);
      });

      // Fetch vendor verification status in parallel
      const vendorStatusMap = new Map<string, boolean>();
      await Promise.all(
        Array.from(vendorUids).map(async (uid) => {
          try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              vendorStatusMap.set(uid, userSnap.data().isVerified || false);
            }
          } catch (error) {
            console.error("Error fetching vendor status:", error);
          }
        })
      );

      // Attach verification status
      const listingsWithStatus = fetchedListings.map(listing => ({
        ...listing,
        isVerified: vendorStatusMap.get(listing.vendorUid) || false
      }));

      setListings(listingsWithStatus);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "flex_store_listings");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBuy = (listing: Listing) => {
    const message = encodeURIComponent(`Hi, I saw your ${listing.itemName} on the Digital Nexus...`);
    const formattedNumber = listing.whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
  };

  const filteredListings = listings.filter(listing => {
    const searchLower = searchQuery.toLowerCase();
    return (
      listing.itemName.toLowerCase().includes(searchLower) ||
      listing.vendorName.toLowerCase().includes(searchLower) ||
      listing.category.toLowerCase().includes(searchLower) ||
      (listing.location || "Onsite").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": ${JSON.stringify(listings.map((listing, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": listing.itemName,
                  "image": listing.imageUrl,
                  "description": `${listing.itemName} available on ICEPAB Nexus Flex Store.`,
                  "offers": {
                    "@type": "Offer",
                    "price": listing.price,
                    "priceCurrency": "NGN",
                    "availability": "https://schema.org/InStock"
                  },
                  "brand": {
                    "@type": "Brand",
                    "name": listing.vendorName
                  }
                }
              })))}
            }
          `}
        </script>
      </Helmet>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="text-blue-500" /> Flex Store
        </h2>
        <div className="flex flex-1 w-full md:max-w-md gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Search items, vendors, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40" />
          </div>
          {user && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-md shrink-0"
            >
              <Plus size={18} /> Add Hustle
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-10 glass-panel rounded-2xl">
          <ShoppingBag size={48} className="mx-auto text-[var(--foreground)]/20 mb-4" />
          <p className="text-[var(--foreground)]/60 font-medium">No matches found for "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <div key={listing.id} className="glass-panel rounded-2xl overflow-hidden flex flex-col transition-transform hover:scale-[1.02]">
              <div className="h-48 overflow-hidden bg-black/5 dark:bg-white/5 relative">
                <img 
                  src={listing.imageUrl} 
                  alt={listing.itemName} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                    {listing.category}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                    {listing.location || "Onsite"}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg line-clamp-1">{listing.itemName}</h3>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                  ₦{listing.price.toLocaleString()}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]/70">
                    <span className="truncate">{listing.vendorName}</span>
                    {listing.isVerified && (
                      <BadgeCheck size={16} className="text-blue-500 shrink-0" />
                    )}
                  </div>
                  <button 
                    onClick={() => handleBuy(listing)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-colors"
                  >
                    <MessageCircle size={18} /> Buy via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddHustleModal user={user} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
