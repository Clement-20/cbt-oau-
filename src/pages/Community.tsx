import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Send, User, Star, Quote, Users } from "lucide-react";
import { toast } from "../components/Toast";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  rating: number;
  timestamp: any;
}

export default function Community({ user }: { user: any }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(collection(db, "community_reviews"), orderBy("timestamp", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const fetchedReviews: Review[] = [];
        snapshot.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
        });
        setReviews(fetchedReviews);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "community_reviews");
      }
    };
    fetchReviews();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to leave a review");
      return;
    }
    if (!newReview.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "community_reviews"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous Student",
        userPhoto: user.photoURL || null,
        text: newReview,
        rating,
        timestamp: serverTimestamp()
      });
      setNewReview("");
      toast("Review posted! Thanks for sharing.");
      
      // Refresh reviews locally
      const q = query(collection(db, "community_reviews"), orderBy("timestamp", "desc"), limit(50));
      const snapshot = await getDocs(q);
      const fetchedReviews: Review[] = [];
      snapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(fetchedReviews);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "community_reviews");
      toast("Failed to post review. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8">
      <Helmet>
        <title>Community Hub | Digital Nexus - OAU Student Network</title>
        <meta name="description" content="Connect with OAU students in the Community Hub. Share reviews and connect with the community." />
        <meta name="keywords" content="OAU community, OAU student reviews, Obafemi Awolowo University" />
        <link rel="canonical" href={`${import.meta.env.VITE_BASE_URL || 'https://oau.cbt.icepab.name.ng'}/community`} />
      </Helmet>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter flex items-center justify-center gap-3">
          <Users className="text-blue-500" size={40} /> Community Hub
        </h1>
        <p className="text-lg text-[var(--foreground)]/60">
          Connect and share your experiences with fellow OAU students.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl space-y-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <p className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)]/50">Your Rating:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-all ${rating >= star ? "text-amber-500 scale-110" : "text-gray-300 dark:text-gray-700"}`}
                >
                  <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Share your experience with Digital Nexus..."
              className="w-full p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 text-lg"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !newReview.trim()}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </form>

        <div className="space-y-4 mt-8" ref={scrollRef}>
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <Quote className="text-blue-500" /> Recent Reviews
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-[var(--foreground)]/50 font-medium">
              No reviews yet. Be the first to share your thoughts!
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <Link to={`/profile/${review.userId}`} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                      {review.userPhoto ? (
                        <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={20} className="group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold group-hover:text-blue-500 transition-colors">{review.userName}</p>
                      <p className="text-xs text-[var(--foreground)]/50">
                        {review.timestamp?.toDate().toLocaleDateString() || "Just now"}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < review.rating ? "text-amber-500" : "text-gray-300 dark:text-gray-700"} fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-[var(--foreground)]/80 leading-relaxed">{review.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
