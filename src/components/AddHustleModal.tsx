import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from './Toast';

export default function AddHustleModal({ user, onClose }: { user: any, onClose: () => void }) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Product');
  const [price, setPrice] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [location, setLocation] = useState('Onsite');
  const [image, setImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast("Please select an image for your hustle.");
      return;
    }

    setIsUploading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', image);
      const cloudName = import.meta.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'nexus-oau';
      const uploadPreset = import.meta.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'nexus_preset';

      formData.append('upload_preset', uploadPreset);
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error("Cloudinary upload failed");
      
      const data = await res.json();
      const imageUrl = data.secure_url;

      await addDoc(collection(db, 'flex_store_listings'), {
        itemName,
        category,
        price: Number(price),
        whatsappNumber,
        location,
        imageUrl,
        vendorName: user.displayName || 'Anonymous',
        vendorUid: user.uid,
        createdAt: Date.now()
      });
      
      toast("Hustle added successfully! 🚀");
      onClose();
    } catch (error) {
      console.error("Error adding hustle:", error);
      toast("Failed to add hustle. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="glass-panel p-6 rounded-3xl w-full max-w-md space-y-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Add Your Hustle</h2>
          <p className="text-sm text-[var(--foreground)]/60">Reach thousands of OAU students instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50 ml-1">Item Name</label>
            <input 
              required
              placeholder="e.g. iPhone 13 Pro Max" 
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none" 
              onChange={e => setItemName(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50 ml-1">Category</label>
              <select 
                className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setCategory(e.target.value)}
              >
                <option>Product</option>
                <option>Service</option>
                <option>Digital</option>
                <option>Food</option>
                <option>Fashion</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50 ml-1">Price (₦)</label>
              <input 
                required
                type="number" 
                placeholder="5000" 
                className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setPrice(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50 ml-1">WhatsApp Number</label>
              <input 
                required
                placeholder="+2348123456789" 
                className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setWhatsappNumber(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50 ml-1">Location</label>
              <select 
                className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:ring-2 focus:ring-blue-500 outline-none" 
                onChange={e => setLocation(e.target.value)}
              >
                <option value="Onsite">Onsite (Campus/Hostels)</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Off-K">Off-K</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50 ml-1">Product Image</label>
            <div className="relative group">
              <input 
                required
                type="file" 
                accept="image/*"
                className="hidden" 
                id="hustle-image"
                onChange={e => setImage(e.target.files?.[0] || null)} 
              />
              <label 
                htmlFor="hustle-image"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border)] rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              >
                {image ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold text-blue-500 truncate max-w-[200px]">{image.name}</span>
                    <span className="text-xs text-[var(--foreground)]/40">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[var(--foreground)]/40">
                    <Upload size={24} />
                    <span className="text-sm font-medium">Upload Image</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button 
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white p-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              "Launch Hustle 🚀"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
