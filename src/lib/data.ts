import { Toilet } from "./types";
import { supabase } from "./supabase";

export const MOCK_TOILETS: Toilet[] = []; // Keep empty array as fallback or deprecate

export async function fetchToilets(): Promise<Toilet[]> {
  const { data, error } = await supabase
    .from('toilets')
    .select('*');

  if (error) {
    console.error('Error fetching toilets:', error);
    return [];
  }

  // Transform raw data if necessary (e.g., ensuring lat/lng structure matches Toilet type)
  return data.map((t: any) => ({
    ...t,
    location: { lat: t.lat, lng: t.lng }, // Database stores flat lat/lng, app uses object
    reviewCount: t.review_count || 0, // Map review_count to reviewCount
    cleanlinessRating: t.cleanliness_rating || 0, // Ensure cleanliness_rating is mapped
    images: Array.isArray(t.images) ? t.images : (t.images ? [t.images] : []), // Ensure images is always an array
    status: t.status || "open", // Default to "open" if not set
  }));
}

export async function addToilet(toilet: Omit<Toilet, "id" | "reviewCount" | "reviews">): Promise<Toilet | null> {
  const { data, error } = await supabase
    .from('toilets')
    .insert([
      {
        name: toilet.name,
        lat: toilet.location.lat,
        lng: toilet.location.lng,
        address: toilet.address,
        price: toilet.price,
        cleanliness_rating: toilet.cleanlinessRating,
        tags: toilet.tags,
        images: toilet.images
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding toilet:', error);
    return null;
  }

  return {
      ...data,
      location: { lat: data.lat, lng: data.lng }
  };
}

// --- Profile & Auth Helpers ---

export function getUserId(): string {
    if (typeof window === 'undefined') return "";
    
    let id = localStorage.getItem('toilet_user_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('toilet_user_id', id);
    }
    return id;
}

export async function saveProfile(displayName: string): Promise<boolean> {
    const id = getUserId();
    if (!id) return false;

    const { error } = await supabase
        .from('profiles')
        .upsert({ id, display_name: displayName }, { onConflict: 'id' });

    if (error) {
        console.error('Error saving profile:', error);
        return false;
    }
    return true;
}

export async function getProfile(): Promise<{ display_name: string } | null> {
    const id = getUserId();
    if (!id) return null;

    const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', id)
        .single();
        
    return data;
}

// --- Reviews ---

export async function addReview(review: { toiletId: string; rating: number; comment: string; images?: string[] }): Promise<boolean> {
    const profileId = getUserId();
    if (!profileId) {
        console.error('No user ID found');
        return false;
    }

    // 1. Add the review
    // Try with images first, if that fails and images field doesn't exist, try without
    let reviewData: any = {
        toilet_id: review.toiletId,
        profile_id: profileId,
        rating: review.rating,
        comment: review.comment
    };

    // Only add images if provided
    if (review.images && review.images.length > 0) {
        reviewData.images = review.images;
    }

    const { error: reviewError } = await supabase
        .from('reviews')
        .insert(reviewData);

    if (reviewError) {
        console.error('Error adding review:', reviewError);
        // If error is about images column not existing, try without images
        if (reviewError.message && reviewError.message.includes('images') && review.images && review.images.length > 0) {
            console.warn('Images field may not exist, retrying without images...');
            const { error: retryError } = await supabase
                .from('reviews')
                .insert({
                    toilet_id: review.toiletId,
                    profile_id: profileId,
                    rating: review.rating,
                    comment: review.comment
                });
            
            if (retryError) {
                console.error('Error adding review without images:', retryError);
                return false;
            }
            // Continue with rating update even if images failed
        } else {
            return false;
        }
    }

    // 2. Recalculate average rating and update toilet
    const { data: allReviews, error: fetchError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('toilet_id', review.toiletId);

    if (fetchError) {
        console.error('Error fetching reviews for calculation:', fetchError);
        return true; // Review was added, but couldn't update rating
    }

    // Calculate average rating
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;
    const reviewCount = allReviews.length;

    // Update toilet with new average rating and count
    const { error: updateError } = await supabase
        .from('toilets')
        .update({
            cleanliness_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            review_count: reviewCount
        })
        .eq('id', review.toiletId);

    if (updateError) {
        console.error('Error updating toilet rating:', updateError);
        // Still return true because review was added successfully
    }

    return true;
}

export async function fetchReviews(toiletId: string) {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            images,
            created_at,
            profiles ( display_name )
        `)
        .eq('toilet_id', toiletId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return data.map((r: any) => ({
        id: r.id,
        userName: r.profiles?.display_name || 'Anonymous',
        rating: r.rating,
        comment: r.comment,
        images: Array.isArray(r.images) ? r.images : (r.images ? [r.images] : []),
        date: new Date(r.created_at).toLocaleDateString(),
        timeAgo: getTimeAgo(new Date(r.created_at))
    }));
}

function getTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// --- Storage ---

export async function uploadToiletImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('toilet-images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
    }

    const { data } = supabase.storage.from('toilet-images').getPublicUrl(filePath);
    return data.publicUrl;
}

// --- Favorites ---

export async function toggleFavorite(toiletId: string): Promise<boolean> {
    const profileId = getUserId();
    if (!profileId) {
        console.error('No user ID found');
        return false;
    }

    // Get current favorites
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', profileId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', fetchError);
    }

    // Handle both TEXT[] and JSONB formats
    let currentFavorites: string[] = [];
    if (profile?.favorites) {
        if (Array.isArray(profile.favorites)) {
            currentFavorites = profile.favorites;
        } else if (typeof profile.favorites === 'string') {
            try {
                currentFavorites = JSON.parse(profile.favorites);
            } catch {
                currentFavorites = [];
            }
        }
    }
    
    const isFavorite = currentFavorites.includes(toiletId);
    const newFavorites = isFavorite
        ? currentFavorites.filter(id => id !== toiletId)
        : [...currentFavorites, toiletId];

    const { error } = await supabase
        .from('profiles')
        .upsert({ 
            id: profileId, 
            favorites: newFavorites 
        }, { onConflict: 'id' });

    if (error) {
        console.error('Error toggling favorite:', error);
        return false;
    }
    return true;
}

export async function getFavorites(): Promise<string[]> {
    const profileId = getUserId();
    if (!profileId) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('favorites')
        .eq('id', profileId)
        .single();

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }

    // Handle both TEXT[] and JSONB formats
    if (!data?.favorites) return [];
    if (Array.isArray(data.favorites)) return data.favorites;
    if (typeof data.favorites === 'string') {
        try {
            return JSON.parse(data.favorites);
        } catch {
            return [];
        }
    }
    return [];
}

// --- History ---

export function addToHistory(toiletId: string): void {
    if (typeof window === 'undefined') return;
    
    const history = getHistory();
    // Remove if already exists
    const filtered = history.filter(id => id !== toiletId);
    // Add to front
    const newHistory = [toiletId, ...filtered].slice(0, 10); // Keep last 10
    localStorage.setItem('toilet_history', JSON.stringify(newHistory));
}

export function getHistory(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
        const history = localStorage.getItem('toilet_history');
        return history ? JSON.parse(history) : [];
    } catch {
        return [];
    }
}

export function clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('toilet_history');
}

// --- Toilet Status ---

export async function updateToiletStatus(toiletId: string, status: "open" | "closed" | "maintenance"): Promise<boolean> {
    const { error } = await supabase
        .from('toilets')
        .update({ status })
        .eq('id', toiletId);

    if (error) {
        console.error('Error updating toilet status:', error);
        return false;
    }
    return true;
}

// --- Statistics ---

export async function getUserStats(): Promise<{
    toiletsAdded: number;
    reviewsWritten: number;
    favoritesCount: number;
}> {
    const profileId = getUserId();
    if (!profileId) return { toiletsAdded: 0, reviewsWritten: 0, favoritesCount: 0 };

    // Count toilets added by user (assuming toilets have a created_by field, or use a different method)
    // For now, we'll count reviews and favorites
    const { data: reviews } = await supabase
        .from('reviews')
        .select('id')
        .eq('profile_id', profileId);

    const favorites = await getFavorites();

    // Note: Toilets added count would require a created_by field in toilets table
    // For now, we'll return 0 and you can add this field later if needed

    return {
        toiletsAdded: 0, // TODO: Add created_by field to toilets table
        reviewsWritten: reviews?.length || 0,
        favoritesCount: favorites.length
    };
}
