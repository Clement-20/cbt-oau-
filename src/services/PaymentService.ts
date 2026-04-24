import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "../components/Toast";

/**
 * PaymentService handles the production-grade integration with Paystack
 * for student verification fees.
 */
export const PaymentService = {
  /**
   * Updates the user's verification status in Firestore after a successful payment.
   * @param uid The unique identifier of the student
   */
  async verifyStudent(uid: string) {
    const userRef = doc(db, "users", uid);
    try {
      await updateDoc(userRef, {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        badgeType: "Verified Student" // Grant the verified badge automatically
      });
      toast("Congratulations! Your student status has been verified. 🎓");
      return true;
    } catch (error) {
      console.error("Firestore Update Error (Verification):", error);
      toast("Payment successful, but we encountered an error updating your profile. Please contact support.");
      return false;
    }
  },

  /**
   * Initializes the native Paystack popup.
   */
  handlePayment(config: any) {
    if (!(window as any).PaystackPop) {
      console.error("Paystack SDK not loaded.");
      toast("Payment service is currently unavailable. Please refresh and try again.");
      return;
    }
    
    const handler = (window as any).PaystackPop.setup({
      ...config,
      callback: (response: any) => config.onSuccess(response),
      onClose: () => config.onClose(),
    });
    handler.openIframe();
  },

  /**
   * Configuration for Paystack integration
   */
  getPaystackConfig(email: string, amount: number, onSuccess: (reference: any) => void, onClose: () => void) {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      console.error("Paystack Public Key is missing in environment variables.");
    }

    return {
      reference: (new Date()).getTime().toString(),
      email,
      amount: amount * 100, // Paystack expects amount in Kobo
      publicKey,
      onSuccess,
      onClose,
    };
  }
};
