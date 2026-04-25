import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Trash2, Loader2, Sparkles, User, Calendar } from "lucide-react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/errorHandling";
import { toast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useAuthState } from "react-firebase-hooks/auth";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  rating: number;
  timestamp: any;
}

export default function Reviews() {
  const [user] = useAuthState(auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const path = "community_reviews";
    const q = query(collection(db, path), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReview.trim()) return;

    setSubmitting(true);
    const path = "community_reviews";
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        userName: user.displayName || "Anonymous Student",
        userPhoto: user.photoURL || "",
        text: newReview.trim(),
        rating,
        timestamp: serverTimestamp()
      });
      setNewReview("");
      setRating(5);
      toast("Thank you for your feedback! ❤️");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const path = `community_reviews/${id}`;
    try {
      await deleteDoc(doc(db, "community_reviews", id));
      toast("Review deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pt-24 pb-24 md:pb-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-black tracking-tighter flex items-center justify-center gap-3">
          <Sparkles className="text-amber-500" /> Nexus Wall of Love
        </h1>
        <p className="text-[var(--foreground)]/60 max-w-lg mx-auto">
          Share your experience with Digital Nexus. We use your feedback to build the future of OAU study tools.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Review Form */}
        <div className="md:col-span-1">
          <div className="glass-panel p-6 rounded-3xl sticky top-24 border border-[var(--border)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-500" /> Rate Us
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      size={28}
                      fill={star <= rating ? "#f59e0b" : "none"}
                      className={star <= rating ? "text-amber-500" : "text-[var(--foreground)]/20"}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="What do you love about Nexus?"
                className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                maxLength={1000}
                required
              />

              <button
                type="submit"
                disabled={submitting || !newReview.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Submit Review</>}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-blue-500" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border-2 border-dashed border-[var(--border)]">
              <User className="mx-auto mb-4 opacity-20" size={48} />
              <p className="font-bold opacity-40">No reviews yet. Be the first!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="glass-panel p-6 rounded-3xl border border-[var(--border)] hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full border border-blue-500/20" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm">{review.userName}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--foreground)]/40">
                        <Calendar size={10} />
                        {review.timestamp?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < review.rating ? "#f59e0b" : "none"}
                        className={i < review.rating ? "text-amber-500" : "text-[var(--foreground)]/20"}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                  {review.text}
                </p>

                {user && (user.uid === review.userId || user.email === "banmekeifeoluwa@gmail.com") && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end">
                    <button
                      onClick={() => setDeleteTarget(review.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Review"
        message="Are you sure you want to remove your feedback?"
      />
    </div>
  );
}
