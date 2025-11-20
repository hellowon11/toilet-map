export interface Toilet {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  cleanlinessRating: number; // 1-5
  reviewCount: number;
  price: number; // 0 for free
  tags: string[]; // e.g., "Accessible", "Baby Changing", "Bidet"
  images: string[]; // Array of image URLs
  reviews?: Review[];
  status?: "open" | "closed" | "maintenance"; // Real-time status
}

export interface Review {
  id: string;
  toiletId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
  timeAgo?: string;
}

