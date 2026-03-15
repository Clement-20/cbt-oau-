import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { MessageSquare, Send, User, Star, Quote } from "lucide-react";
import { toast } from "../components/Toast";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";

interface Review {
  id: string;
  userId: string;
  userName: string;
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
    const q = query(collection(db, "community_reviews"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews: Review[] = [];
      snapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(fetchedReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "community_reviews");
    });

    return () => unsubscribe();
  }, []);

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
        text: newReview,
        rating,
        timestamp: serverTimestamp()
      });
      setNewReview("");
      toast("Review posted! Thanks for sharing.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "community_reviews");
      toast("Failed to post review. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <Helmet>
        <title>Community Hub | ICEPAB Digital Nexus</title>
      </Helmet>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter flex items-center justify-center gap-3">
          <MessageSquare className="text-blue-500" size={40} /> Community Hub
        </h1>
        <p className="text-lg text-[var(--foreground)]/60">
          Share your thoughts, reviews, and experiences with fellow students.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl space-y-6">
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
              placeholder="What's on your mind? Share your feedback about the app..."
              className="w-full p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none text-lg"
              maxLength={500}
            />
            <div className="absolute bottom-4 right-4 text-xs text-[var(--foreground)]/40">
              {newReview.length}/500
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newReview.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : <><Send size={20} /> Post Review</>}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Quote className="text-blue-500" /> Recent Reviews
        </h2>
        <div className="grid gap-6">
          {reviews.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl opacity-50">
              <p>No reviews yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="glass-panel p-6 rounded-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold">{review.userName}</h4>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={12} className={review.rating >= star ? "text-amber-500" : "text-gray-300 dark:text-gray-700"} fill={review.rating >= star ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--foreground)]/40">
                    {review.timestamp?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[var(--foreground)]/80 leading-relaxed italic">"{review.text}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
