import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AcademicState {
  followedUploaders: string[]; // Array of userIds
  likedResources: string[]; // Array of resourceIds
  dislikedResources: string[]; // Array of resourceIds
  aiExplanationsUsed: number;
  followUploader: (userId: string) => void;
  unfollowUploader: (userId: string) => void;
  toggleLike: (resourceId: string) => void;
  toggleDislike: (resourceId: string) => void;
  incrementAIUsage: () => void;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set) => ({
      followedUploaders: [],
      likedResources: [],
      dislikedResources: [],
      aiExplanationsUsed: 0,
      followUploader: (userId) => 
        set((state) => ({ 
          followedUploaders: state.followedUploaders.includes(userId) 
            ? state.followedUploaders 
            : [...state.followedUploaders, userId] 
        })),
      unfollowUploader: (userId) => 
        set((state) => ({ 
          followedUploaders: state.followedUploaders.filter(id => id !== userId) 
        })),
      toggleLike: (resourceId) => 
        set((state) => {
          const isLiked = state.likedResources.includes(resourceId);
          return {
            likedResources: isLiked 
              ? state.likedResources.filter(id => id !== resourceId)
              : [...state.likedResources, resourceId],
            // Remove from dislikes if liked
            dislikedResources: state.dislikedResources.filter(id => id !== resourceId)
          };
        }),
      toggleDislike: (resourceId) => 
        set((state) => {
          const isDisliked = state.dislikedResources.includes(resourceId);
          return {
            dislikedResources: isDisliked 
              ? state.dislikedResources.filter(id => id !== resourceId)
              : [...state.dislikedResources, resourceId],
            // Remove from likes if disliked
            likedResources: state.likedResources.filter(id => id !== resourceId)
          };
        }),
      incrementAIUsage: () => 
        set((state) => ({ aiExplanationsUsed: state.aiExplanationsUsed + 1 })),
    }),
    {
      name: 'nexus-academic-store',
    }
  )
);
