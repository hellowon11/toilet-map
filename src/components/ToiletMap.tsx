"use client";

import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Toilet } from "@/lib/types";
import { fetchToilets, addToilet, fetchReviews, addReview, deleteReview, uploadToiletImage, toggleFavorite, getFavorites, addToHistory, getHistory, clearHistory } from "@/lib/data";
import { Navigation, Star, X, Loader2, Crosshair, Check, Send, Camera, Upload, MapPin, ChevronLeft, ChevronRight, Heart, Filter, Share2, Trash2 } from "lucide-react";
import BottomNav from "./BottomNav";
import ToiletList from "./ToiletList";
import TopBar from "./TopBar";
import AiGenie from "./AiGenie";

const MALAYSIA_CENTER = { lat: 3.140853, lng: 101.693207 }; // Kuala Lumpur

// Internal component to access map instance
function MapControls({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
    const map = useMap();

    const handleRecenter = useCallback(() => {
        if (map && userLocation) {
            map.panTo(userLocation);
            map.setZoom(16);
        } else if (map) {
           // If no user location, just reset to KL Center or try getting location again
           navigator.geolocation.getCurrentPosition((pos) => {
               const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
               map.panTo(newPos);
               map.setZoom(16);
           });
        }
    }, [map, userLocation]);

    return (
        <button
            onClick={handleRecenter}
            className="fixed bottom-44 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg ring-1 ring-black/5 hover:bg-gray-50 active:scale-95 transition-transform"
        >
            <Crosshair className="h-6 w-6" />
        </button>
    );
}

// Internal component to pan map to selected toilet
function PanToLocation({ location }: { location: { lat: number; lng: number } | null }) {
    const map = useMap();

    useEffect(() => {
        if (map && location) {
            map.panTo(location);
            map.setZoom(16);
        }
    }, [map, location]);

    return null;
}

export default function ToiletMap() {
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<"map" | "list" | "favorites" | "add">("map");
  const [toilets, setToilets] = useState<Toilet[]>([]); // State for real data
  
  // New States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [panToLocation, setPanToLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Add Form States
  const [newToiletName, setNewToiletName] = useState("");
  const [newToiletPrice, setNewToiletPrice] = useState("");
  const [newToiletTags, setNewToiletTags] = useState<string[]>([]);
  const [newToiletRating, setNewToiletRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addToiletLocation, setAddToiletLocation] = useState<{ lat: number; lng: number } | null>(null); // Location for the toilet being added
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  // Review States
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  
  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterPrice, setFilterPrice] = useState<"free" | "paid" | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Favorite States
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // History States
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  
  // Image Viewer State
  const [viewingImages, setViewingImages] = useState<{ urls: string[]; currentIndex: number } | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Share Menu State
  const [showShareMenu, setShowShareMenu] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyC_kK6pS-MqXfntWGXW-DBpT43THUDiLEc";

  // Fetch toilets on mount
  const loadToilets = async () => {
      const data = await fetchToilets();
      setToilets(data);
  };
  
  // Load favorites and history on mount
  useEffect(() => {
      const loadFavorites = async () => {
          const favs = await getFavorites();
          setFavorites(new Set(favs));
      };
      loadFavorites();
      
      // Load history
      setHistoryIds(getHistory());
  }, []);
    
  useEffect(() => {
      loadToilets();
  }, []);

  // Handle URL parameters for sharing
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const toiletId = params.get('toilet');
      if (toiletId && toilets.length > 0) {
          const toilet = toilets.find(t => t.id === toiletId);
          if (toilet) {
              setSelectedToilet(toilet);
              setCurrentTab("map");
              // Clean URL
              window.history.replaceState({}, '', window.location.pathname);
          }
      }
  }, [toilets]);

  // Handle keyboard for image viewer
  useEffect(() => {
      if (!viewingImages) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              setViewingImages(null);
          } else if (e.key === 'ArrowLeft' && viewingImages.currentIndex > 0) {
              setViewingImages({
                  ...viewingImages,
                  currentIndex: viewingImages.currentIndex - 1
              });
          } else if (e.key === 'ArrowRight' && viewingImages.currentIndex < viewingImages.urls.length - 1) {
              setViewingImages({
                  ...viewingImages,
                  currentIndex: viewingImages.currentIndex + 1
              });
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when image viewer is open
      document.body.style.overflow = 'hidden';

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = '';
      };
  }, [viewingImages]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
  };

  // Filter and sort toilets
  const filteredToilets = useMemo(() => {
      return toilets
          .map(toilet => ({
              ...toilet,
              distance: userLocation 
                  ? calculateDistance(userLocation.lat, userLocation.lng, toilet.location.lat, toilet.location.lng)
                  : null
          }))
          .filter(toilet => {
              // Search filter
              if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  const matchesName = toilet.name.toLowerCase().includes(query);
                  const matchesAddress = toilet.address.toLowerCase().includes(query);
                  if (!matchesName && !matchesAddress) return false;
              }
              
              // Rating filter
              if (filterRating !== null && toilet.cleanlinessRating < filterRating) {
                  return false;
              }
              
              // Price filter
              if (filterPrice === "free" && toilet.price > 0) return false;
              if (filterPrice === "paid" && toilet.price === 0) return false;
              
              // Tags filter
              if (filterTags.length > 0) {
                  const hasAllTags = filterTags.every(tag => toilet.tags.includes(tag));
                  if (!hasAllTags) return false;
              }
              
              return true;
          })
          .sort((a, b) => {
              // Sort by distance if available, otherwise by rating
              if (a.distance !== null && b.distance !== null) {
                  return a.distance - b.distance;
              }
              return b.cleanlinessRating - a.cleanlinessRating;
          });
  }, [toilets, userLocation, searchQuery, filterRating, filterPrice, filterTags]);

  // Handle search
  const handleSearch = (query: string) => {
      setSearchQuery(query);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (toiletId: string) => {
      try {
          const success = await toggleFavorite(toiletId);
          if (success) {
              const favs = await getFavorites();
              setFavorites(new Set(favs));
          } else {
              console.error('Failed to toggle favorite');
              alert('Failed to save favorite. Please try again.');
          }
      } catch (error) {
          console.error('Error toggling favorite:', error);
          alert('An error occurred. Please check the console.');
      }
  };

  // Load reviews when a toilet is selected
  useEffect(() => {
      if (selectedToilet) {
          setReviews([]); // Clear previous reviews
          setCurrentImageIndex(0); // Reset image index
          setImageLoading(true); // Reset loading state
          fetchReviews(selectedToilet.id).then(data => setReviews(data));
          
          // Add to history
          addToHistory(selectedToilet.id);
          setHistoryIds(getHistory());
      }
  }, [selectedToilet]);

  // ... geolocation useEffect ...
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Auto-set addToiletLocation when switching to "add" tab and userLocation is available
  useEffect(() => {
    if (currentTab === "add" && userLocation && !addToiletLocation) {
      setAddToiletLocation(userLocation);
    }
  }, [currentTab, userLocation, addToiletLocation]);

  const handleNavigate = () => {
    if (selectedToilet) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedToilet.location.lat},${selectedToilet.location.lng}`;
      window.open(url, "_blank");
    }
  };

  const handleShare = async () => {
      if (!selectedToilet) return;
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?toilet=${selectedToilet.id}`;
      const shareText = `Check out ${selectedToilet.name} on Toilet Finder 🚽! Rating: ${selectedToilet.cleanlinessRating}⭐`;

      // Try Web Share API first (mobile - shows native share menu)
      if (navigator.share) {
          try {
              await navigator.share({
                  title: selectedToilet.name,
                  text: shareText,
                  url: shareUrl,
              });
              return; // Successfully shared
          } catch (err: any) {
              // User cancelled (err.name === 'AbortError') or error
              if (err.name !== 'AbortError') {
                  console.error('Error sharing:', err);
              }
              // Don't show fallback menu if user cancelled
              if (err.name === 'AbortError') return;
          }
      }

      // Fallback: Show custom share menu for desktop or unsupported browsers
      setShowShareMenu(true);
  };

  const shareToApp = (app: string) => {
      if (!selectedToilet) return;
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?toilet=${selectedToilet.id}`;
      const shareText = `Check out ${selectedToilet.name} on Toilet Finder 🚽! Rating: ${selectedToilet.cleanlinessRating}⭐`;
      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(shareUrl);

      let shareLink = '';

      switch (app) {
          case 'whatsapp':
              shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
              break;
          case 'line':
              shareLink = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
              break;
          case 'facebook':
              shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
              break;
          case 'twitter':
              shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
              break;
          case 'instagram':
              // Instagram doesn't support direct URL sharing, open app or copy link
              shareLink = `https://www.instagram.com/`;
              alert('Instagram doesn\'t support direct link sharing. Please copy the link and paste it in your Instagram story or post.');
              navigator.clipboard.writeText(shareUrl);
              setShowShareMenu(false);
              return;
          case 'copy':
              navigator.clipboard.writeText(shareUrl);
              alert('Link copied to clipboard! 📋');
              setShowShareMenu(false);
              return;
          default:
              return;
      }

      window.open(shareLink, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
  };

  const handleSummarize = () => {
    setIsSummarizing(true);
    // Simulate AI request
    setTimeout(() => {
      if (selectedToilet) {
          const keywords = selectedToilet.tags.join(", ");
          const rating = selectedToilet.cleanlinessRating;
          let text = "";
          if (rating >= 4.5) text = `Highly recommended! Users love the <b>${keywords}</b>. Spotless and well-maintained.`;
          else if (rating >= 3.5) text = `Decent option. Good availability of <b>${keywords}</b>, but could be cleaner during peak hours.`;
          else text = `Use only if necessary. Users report issues with cleanliness. <b>${keywords}</b> available but check condition first.`;
          
          setAiSummary(text);
      }
      setIsSummarizing(false);
    }, 1500);
  };

  useEffect(() => {
      if (!isReviewOpen) {
          setAiSummary(null);
          // Clear review form when modal closes
          setReviewRating(0);
          setReviewComment("");
          setReviewImages([]);
          setReviewImagePreviews([]);
      }
  }, [isReviewOpen, selectedToilet]);

  const handleReviewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const files = Array.from(e.target.files);
          if (reviewImages.length + files.length > 3) {
              alert("Maximum 3 images allowed per review");
              return;
          }
          setReviewImages([...reviewImages, ...files]);
          const previews = files.map(file => URL.createObjectURL(file));
          setReviewImagePreviews([...reviewImagePreviews, ...previews]);
      }
  };

  const removeReviewImage = (index: number) => {
      setReviewImages(reviewImages.filter((_, i) => i !== index));
      setReviewImagePreviews(reviewImagePreviews.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async () => {
      if (!selectedToilet) return;
      if (reviewRating === 0) {
          alert("Please verify your rating!");
          return;
      }

      setIsReviewSubmitting(true);

      try {
          // Upload images first
          let imageUrls: string[] = [];
          if (reviewImages.length > 0) {
              for (const file of reviewImages) {
                  try {
                      const url = await uploadToiletImage(file);
                      if (url) {
                          imageUrls.push(url);
                      } else {
                          console.warn("Failed to upload image:", file.name);
                      }
                  } catch (error) {
                      console.error("Error uploading image:", error);
                      // Continue with other images even if one fails
                  }
              }
          }

          const success = await addReview({
              toiletId: selectedToilet.id,
              rating: reviewRating,
              comment: reviewComment,
              images: imageUrls
          });

          if (success) {
              // Refresh reviews
              const updatedReviews = await fetchReviews(selectedToilet.id);
              setReviews(updatedReviews);
              
              // Refresh toilets list to update rating on map markers
              await loadToilets();
              
              // Update selected toilet with new rating
              const updatedToilets = await fetchToilets();
              const updatedToilet = updatedToilets.find(t => t.id === selectedToilet.id);
              if (updatedToilet) {
                  setSelectedToilet(updatedToilet);
              }
              
              // Close modal and reset form
              setIsReviewOpen(false);
              setReviewRating(0);
              setReviewComment("");
              setReviewImages([]);
              setReviewImagePreviews([]);
          } else {
              alert("Failed to submit review. Please check:\n1. Database has 'images' field in reviews table\n2. Check browser console for details");
          }
      } catch (error) {
          console.error("Error submitting review:", error);
          alert(`Failed to submit review: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsReviewSubmitting(false);
      }
  };
  
  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Use addToiletLocation if set, otherwise fall back to userLocation
      const locationToUse = addToiletLocation || userLocation;
      
      if (!locationToUse) {
          alert("Please select a location on the map!");
          return;
      }
      
      if (newToiletRating === 0) {
          alert("Please give it a rating!");
          return;
      }

      setIsSubmitting(true);

      let imageUrl = "";
      if (selectedImage) {
          const url = await uploadToiletImage(selectedImage);
          if (url) imageUrl = url;
      }

      const newToilet = await addToilet({
          name: newToiletName,
          location: locationToUse, // Use selected location (from map or GPS)
          address: "User Added Location", // Ideally reverse geocode this
          price: parseFloat(newToiletPrice) || 0,
          cleanlinessRating: newToiletRating,
          tags: newToiletTags,
          images: imageUrl ? [imageUrl] : []
      });

      setIsSubmitting(false);

      if (newToilet) {
          // Success!
          setNewToiletName("");
          setNewToiletPrice("");
          setNewToiletTags([]);
          setNewToiletRating(0);
          setSelectedImage(null);
          setImagePreview(null);
          setAddToiletLocation(null); // Reset location for next time
          
          // Refresh map and switch tab
          await loadToilets();
          setCurrentTab("map");
          
          // Optional: Select the new toilet to show it off
          // setSelectedToilet(newToilet); 
      } else {
          alert("Failed to add toilet. Please try again.");
      }
  };

  const toggleTag = (tag: string) => {
      if (newToiletTags.includes(tag)) {
          setNewToiletTags(newToiletTags.filter(t => t !== tag));
      } else {
          setNewToiletTags([...newToiletTags, tag]);
      }
  };

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 p-4 text-center">
        <div>
          <h2 className="text-xl font-bold text-red-500">Missing API Key</h2>
          <p className="mt-2 text-gray-600">
            Please check your source code.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative flex h-full w-full flex-col bg-gray-50">
      <APIProvider apiKey={apiKey}>
        {/* ... rest of the component ... */}
        
        {/* Top Search Bar (Hidden when viewing toilet details) */}
        {!selectedToilet && (
          <TopBar 
            onSearch={handleSearch} 
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Search Results Dropdown */}
        {!selectedToilet && searchQuery.trim().length > 0 && filteredToilets.length > 0 && (
          <div className="absolute top-[7.5rem] left-0 right-0 z-20 px-4 animate-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl bg-white shadow-xl border border-gray-200 max-h-[60vh] overflow-y-auto">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">
                  {filteredToilets.length} {filteredToilets.length === 1 ? 'result' : 'results'}
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredToilets.slice(0, 5).map((toilet) => (
                  <button
                    key={toilet.id}
                    onClick={() => {
                      setPanToLocation(toilet.location);
                      setCurrentTab("map");
                      setSearchQuery("");
                      // Clear location after a short delay to allow re-panning
                      setTimeout(() => setPanToLocation(null), 100);
                    }}
                    className="w-full p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{toilet.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{toilet.address.split(",")[0]}</span>
                        </div>
                        {toilet.distance !== null && toilet.distance !== undefined && (
                          <div className="mt-1 text-xs text-blue-600 font-bold">
                            {toilet.distance < 1 
                              ? `${Math.round(toilet.distance * 1000)}m away` 
                              : `${toilet.distance.toFixed(1)}km away`}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                          toilet.cleanlinessRating >= 4.0
                            ? "bg-green-100 text-green-700"
                            : toilet.cleanlinessRating >= 3.0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {toilet.cleanlinessRating} ⭐
                        </div>
                        {toilet.price === 0 ? (
                          <span className="text-xs text-green-600 font-bold">Free</span>
                        ) : (
                          <span className="text-xs text-gray-600">RM{toilet.price}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {filteredToilets.length > 5 && (
                <div className="p-3 text-center text-xs text-gray-500 border-t border-gray-100">
                  + {filteredToilets.length - 5} more results
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!selectedToilet && searchQuery.trim().length > 0 && filteredToilets.length === 0 && (
          <div className="absolute top-[7.5rem] left-0 right-0 z-20 px-4 animate-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">
                    No toilets found for "{searchQuery}"
                  </span>
                </div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Genie Floating Button (Hidden when viewing details) */}
        {!selectedToilet && (
          <AiGenie 
            toilets={toilets}
            userLocation={userLocation}
            onSearch={(query) => {
              setSearchQuery(query);
              setCurrentTab("list");
            }}
            onFilter={(filters) => {
              if (filters.rating) setFilterRating(filters.rating);
              if (filters.price) setFilterPrice(filters.price);
              if (filters.tags) setFilterTags(filters.tags);
              setCurrentTab("list");
            }}
            onSelectToilet={(toilet) => {
              setSelectedToilet(toilet);
              setCurrentTab("map");
            }}
          />
        )}
        
        {/* Recenter Button (Only visible in Map Mode AND when no toilet selected) */}
        {currentTab === "map" && !selectedToilet && (
            <MapControls userLocation={userLocation} />
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentTab === "map" && (
            <Map
              defaultCenter={MALAYSIA_CENTER}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              className="h-full w-full outline-none hide-map-controls"
              disableDefaultUI={true}
              clickableIcons={false}
              gestureHandling="greedy"
              mapTypeControl={false}
              fullscreenControl={false}
              zoomControl={false}
              streetViewControl={false}
              rotateControl={false}
              scaleControl={false}
            >
              {/* Auto-pan to selected toilet or search result */}
              {(selectedToilet || panToLocation) && (
                <PanToLocation location={selectedToilet?.location || panToLocation} />
              )}
              
              {filteredToilets.map((toilet) => (
                <AdvancedMarker
                  key={toilet.id}
                  position={toilet.location}
                  onClick={() => {
                    setSelectedToilet(toilet);
                    setIsReviewOpen(false);
                  }}
                >
                   {/* Custom HTML Marker */}
                  <div className="relative group">
                    <div 
                        className={`
                            flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-110
                            ${toilet.cleanlinessRating >= 4.0 ? "bg-green-500" : toilet.cleanlinessRating >= 3.0 ? "bg-yellow-500" : "bg-red-500"}
                        `}
                    >
                        <span className="text-lg">🚽</span>
                    </div>
                    {/* Rating Badge on Marker */}
                    <div className="absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white shadow-sm">
                        {toilet.cleanlinessRating}
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* User Location Marker */}
              {userLocation && (
                  <AdvancedMarker position={userLocation}>
                      <div className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md">
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                          <div className="absolute -inset-4 animate-ping rounded-full bg-blue-500/30"></div>
                      </div>
                  </AdvancedMarker>
              )}
            </Map>
          )}

          {currentTab === "list" && (
            <>
              {/* Filter Bar */}
              <div className="absolute top-[6.5rem] left-0 right-0 z-[20] bg-white/95 backdrop-blur-sm px-4 py-2 border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      showFilters || filterRating || filterPrice || filterTags.length > 0
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                  </button>
                  
                  {(filterRating || filterPrice || filterTags.length > 0) && (
                    <button
                      onClick={() => {
                        setFilterRating(null);
                        setFilterPrice(null);
                        setFilterTags([]);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-3 space-y-3 pb-2">
                    {/* Rating Filter */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">Min Rating</label>
                      <div className="flex gap-2">
                        {[4, 3, 2, 1].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              filterRating === rating
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {rating}+ ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Price Filter */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">Price</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFilterPrice(filterPrice === "free" ? null : "free")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            filterPrice === "free"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          Free
                        </button>
                        <button
                          onClick={() => setFilterPrice(filterPrice === "paid" ? null : "paid")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            filterPrice === "paid"
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          Paid
                        </button>
                      </div>
                    </div>
                    
                    {/* Tags Filter */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-1.5 block">Facilities</label>
                      <div className="flex flex-wrap gap-2">
                        {["Bidet", "Accessible", "Baby Changing", "Prayer Room", "Premium"].map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              if (filterTags.includes(tag)) {
                                setFilterTags(filterTags.filter(t => t !== tag));
                              } else {
                                setFilterTags([...filterTags, tag]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                              filterTags.includes(tag)
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* History Quick Access */}
              {historyIds.length > 0 && !searchQuery && (
                <div className={`absolute left-0 right-0 z-[18] bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 shadow-sm ${
                  showFilters ? 'top-[calc(6.5rem+12rem)]' : 'top-[calc(6.5rem+3.5rem)]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500">Recent</span>
                    <button
                      onClick={() => {
                        clearHistory();
                        setHistoryIds([]);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {historyIds.slice(0, 5).map(id => {
                      const toilet = toilets.find(t => t.id === id);
                      if (!toilet) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            setSelectedToilet(toilet);
                            setCurrentTab("map");
                          }}
                          className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 hover:bg-gray-200 transition-colors active:scale-95"
                        >
                          {toilet.images && toilet.images.length > 0 ? (
                            <img src={toilet.images[0]} alt={toilet.name} className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-300 flex items-center justify-center text-xs">🚽</div>
                          )}
                          <span className="text-xs font-medium text-gray-700 line-clamp-1 max-w-[100px]">{toilet.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <ToiletList 
                toilets={filteredToilets.map(t => ({ ...t, distance: t.distance || undefined }))} 
                onSelect={(toilet) => {
                  setSelectedToilet(toilet);
                  setCurrentTab("map"); // Switch to map to show location
                }}
                hasHistory={historyIds.length > 0 && !searchQuery}
                filtersExpanded={showFilters}
              />
            </>
          )}

          {currentTab === "favorites" && (
            <div className="h-full overflow-y-auto bg-gray-50 pt-[6.5rem] pb-20">
              {favorites.size === 0 ? (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="text-center text-gray-400">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium">No saved toilets yet</p>
                    <p className="text-xs mt-1">Tap the heart icon on any toilet to save it</p>
                  </div>
                </div>
              ) : (
                <ToiletList 
                  toilets={filteredToilets
                    .filter(t => favorites.has(t.id))
                    .map(t => ({ ...t, distance: t.distance || undefined }))} 
                  onSelect={(toilet) => {
                    setSelectedToilet(toilet);
                    setCurrentTab("map");
                  }}
                />
              )}
            </div>
          )}

           {currentTab === "add" && (
             <div className="flex h-full flex-col items-center bg-gray-50 pt-safe overflow-hidden">
                
                {/* Map Preview for Manual Location Picking */}
                <div className="relative h-[35%] w-full bg-gray-200 shrink-0">
                    <Map
                        defaultCenter={addToiletLocation || userLocation || MALAYSIA_CENTER}
                        defaultZoom={15}
                        className="h-full w-full hide-map-controls"
                        mapId="ADD_LOCATION_MAP"
                        disableDefaultUI={true}
                        mapTypeControl={false}
                        fullscreenControl={false}
                        zoomControl={false}
                        streetViewControl={false}
                        rotateControl={false}
                        scaleControl={false}
                        onCameraChanged={(ev) => {
                            // Update location when map is dragged
                            setAddToiletLocation({
                                lat: ev.detail.center.lat,
                                lng: ev.detail.center.lng
                            });
                        }}
                    >
                        {/* Auto-pan to GPS location when first detected (only if addToiletLocation is not set) */}
                        {!addToiletLocation && userLocation && (
                            <PanToLocation location={userLocation} />
                        )}
                        
                        {/* Center Pin */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="relative -mt-8">
                                <div className="h-8 w-8 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
                                    <div className="h-2 w-2 bg-white rounded-full" />
                                </div>
                                <div className="absolute left-1/2 top-full h-4 w-0.5 -translate-x-1/2 bg-red-500" />
                            </div>
                        </div>
                    </Map>
                    
                    {/* Overlay Text */}
                    <div className="absolute top-4 left-0 right-0 text-center pointer-events-none z-20">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                            {addToiletLocation || userLocation ? "Drag map to adjust location" : "Drag map to pin location"}
                        </span>
                    </div>
                    
                    {/* GPS Status Indicator */}
                    {userLocation && (
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-20">
                            <div className="bg-green-500/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium text-center">
                                ✓ GPS Location Detected
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full overflow-y-auto bg-white rounded-t-3xl -mt-4 z-10 shadow-lg">
                    <div className="p-6 space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900">Add Details</h2>
                        <form className="space-y-4" onSubmit={handleAddSubmit}>
                            {/* Image Upload */}
                            <div className="flex justify-center">
                                <label className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Camera className="mb-2 h-8 w-8 text-gray-400" />
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-bold">Click to upload</span> photo</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                </label>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="mb-1 block text-sm font-bold text-gray-700">Location Name</label>
                                <input 
                                    type="text" 
                                    value={newToiletName}
                                    onChange={(e) => setNewToiletName(e.target.value)}
                                    placeholder="e.g. KLCC Level 2" 
                                    className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors" 
                                    required 
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="mb-1 block text-sm font-bold text-gray-700">Fee (RM)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={newToiletPrice}
                                    onChange={(e) => setNewToiletPrice(e.target.value)}
                                    placeholder="0.00" 
                                    className="w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors" 
                                    required 
                                />
                            </div>
                            
                            {/* Tags */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">Facilities</label>
                                <div className="flex flex-wrap gap-2">
                                    {["Bidet", "Tissue", "Accessible", "Baby Changing", "Prayer Room"].map(tag => (
                                        <button 
                                            key={tag} 
                                            type="button" 
                                            onClick={() => toggleTag(tag)}
                                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                                newToiletTags.includes(tag) 
                                                    ? "bg-blue-50 text-blue-600 border-blue-200" 
                                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700">Cleanliness</label>
                                <div className="flex justify-center gap-4 rounded-xl bg-gray-50 p-4">
                                     {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            type="button" 
                                            onClick={() => setNewToiletRating(star)}
                                            className="hover:scale-110 transition-transform"
                                        >
                                            <Star 
                                                className={`h-8 w-8 ${
                                                    star <= newToiletRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="mt-4 w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Adding..." : "Submit Location"}
                            </button>
                        </form>
                        <div className="h-20"></div>
                    </div>
                </div>
             </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Full Screen Modal for Selected Toilet (Map Mode Only) */}
        {currentTab === "map" && selectedToilet && !isReviewOpen && (
          <div className="fixed inset-0 z-[60] flex h-full flex-col bg-white shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            
            {/* Dark Header */}
            <div className="relative bg-[#1e2130] p-0 pb-0 shrink-0 overflow-hidden">
               {/* Image Header */}
               <div className="relative h-48 md:h-80 w-full bg-gray-800">
                   {selectedToilet.images && selectedToilet.images.length > 0 ? (
                       <>
                           {/* Image with loading state */}
                           <div className="relative h-full w-full">
                               {imageLoading && (
                                   <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                       <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                                   </div>
                               )}
                               <img 
                                   src={selectedToilet.images[currentImageIndex]} 
                                   alt={selectedToilet.name} 
                                   className={`h-full w-full object-cover transition-opacity duration-300 ${
                                       imageLoading ? 'opacity-0' : 'opacity-100'
                                   }`}
                                   onLoad={() => setImageLoading(false)}
                                   onError={() => setImageLoading(false)}
                               />
                           </div>
                           
                           {/* Image Navigation (if multiple images) */}
                           {selectedToilet.images.length > 1 && (
                               <>
                                   <button
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           setCurrentImageIndex((prev) => 
                                               prev === 0 ? selectedToilet.images.length - 1 : prev - 1
                                           );
                                           setImageLoading(true);
                                       }}
                                       className="absolute left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 backdrop-blur-md p-2 text-white hover:bg-black/60 transition-all"
                                   >
                                       <ChevronLeft className="h-5 w-5" />
                                   </button>
                                   <button
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           setCurrentImageIndex((prev) => 
                                               prev === selectedToilet.images.length - 1 ? 0 : prev + 1
                                           );
                                           setImageLoading(true);
                                       }}
                                       className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 backdrop-blur-md p-2 text-white hover:bg-black/60 transition-all"
                                   >
                                       <ChevronRight className="h-5 w-5" />
                                   </button>
                                   
                                   {/* Image Indicators */}
                                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                                       {selectedToilet.images.map((_, idx) => (
                                           <button
                                               key={idx}
                                               onClick={(e) => {
                                                   e.stopPropagation();
                                                   setCurrentImageIndex(idx);
                                                   setImageLoading(true);
                                               }}
                                               className={`h-2 rounded-full transition-all ${
                                                   idx === currentImageIndex 
                                                       ? 'w-6 bg-white' 
                                                       : 'w-2 bg-white/50 hover:bg-white/75'
                                               }`}
                                           />
                                       ))}
                                   </div>
                               </>
                           )}
                       </>
                   ) : (
                       <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a2e40] to-[#1e2130] text-gray-400">
                           <div className="flex flex-col items-center gap-3">
                               <Camera className="h-12 w-12 opacity-50" />
                               <span className="text-sm uppercase tracking-wider font-bold">No Image Available</span>
                           </div>
                       </div>
                   )}
                   
                   {/* Enhanced Gradient Overlay */}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#1e2130] via-[#1e2130]/30 to-transparent pointer-events-none"></div>
                   
                   <button
                      onClick={() => setSelectedToilet(null)}
                      className="absolute left-3 md:left-4 top-3 md:top-12 z-30 rounded-full bg-black/40 backdrop-blur-md p-2 md:p-2.5 text-white hover:bg-black/60 transition-all active:scale-95"
                    >
                      <X className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (selectedToilet) {
                          console.log('Toggling favorite for:', selectedToilet.id);
                          handleToggleFavorite(selectedToilet.id);
                        }
                      }}
                      className="absolute right-3 md:right-4 top-3 md:top-12 z-30 rounded-full bg-black/40 backdrop-blur-md p-2 md:p-2.5 text-white hover:bg-black/60 transition-all pointer-events-auto active:scale-95"
                    >
                      <Heart 
                        className={`h-5 w-5 transition-all ${
                          selectedToilet && favorites.has(selectedToilet.id)
                            ? "fill-red-500 text-red-500"
                            : ""
                        }`} 
                      />
                    </button>
               </div>

               <div className="px-4 md:px-6 pb-6 md:pb-10 -mt-16 md:-mt-24 relative z-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white pr-8 drop-shadow-lg leading-tight">
                        {selectedToilet.name}
                    </h2>
                    <div className="mt-1.5 md:mt-2 flex items-center text-gray-200 text-xs md:text-sm drop-shadow-md font-medium">
                        <MapPin className="mr-1 h-3 w-3 md:h-3.5 md:w-3.5 text-blue-400" />
                        {selectedToilet.address?.split(",")[0] || "No address"}
                    </div>
               </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 md:px-5 py-4 md:py-6 -mt-4 md:-mt-6 rounded-t-3xl relative z-20">
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8">
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</span>
                        <span className="text-xl font-bold text-[#22c55e]">{selectedToilet.cleanlinessRating}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Distance</span>
                        <span className="text-xl font-bold text-gray-900">
                            {userLocation 
                                ? (() => {
                                    const dist = calculateDistance(
                                        userLocation.lat, 
                                        userLocation.lng, 
                                        selectedToilet.location.lat, 
                                        selectedToilet.location.lng
                                    );
                                    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
                                  })()
                                : "—"
                            }
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fee</span>
                        <span className="text-xl font-bold text-gray-900">
                             {selectedToilet.price === 0 ? "Free" : `RM${selectedToilet.price}`}
                        </span>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {selectedToilet.tags.map(tag => (
                        <span key={tag} className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            tag === 'Premium' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            tag === 'Bidet' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-green-50 text-green-600 border-green-100'
                        }`}>
                            {tag}
                        </span>
                    ))}
                </div>

                {/* AI Verdict */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[#5B5FEF]">✨</span>
                            <span className="font-bold text-gray-900">AI Verdict</span>
                        </div>
                        <button 
                            onClick={handleSummarize}
                            disabled={isSummarizing || !!aiSummary}
                            className="flex items-center gap-1 rounded-full bg-[#5B5FEF]/10 px-3 py-1 text-xs font-bold text-[#5B5FEF] disabled:opacity-50"
                        >
                            {isSummarizing ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Summarize"
                            )}
                        </button>
                    </div>
                    
                    {/* Default State: Hidden until summarized */}
                    {aiSummary ? (
                         <div className="text-sm text-gray-500 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                            <span dangerouslySetInnerHTML={{ __html: aiSummary }} />
                         </div>
                    ) : (
                         <div className="text-xs italic text-gray-400">
                            Tap Summarize to get an AI analysis of all user reviews.
                         </div>
                    )}
                </div>

                {/* Reviews Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 text-lg">Reviews ({reviews.length})</h3>
                        <button 
                            onClick={() => setIsReviewOpen(true)}
                            className="text-sm font-bold text-[#4F46E5]"
                        >
                            + Add Review
                        </button>
                    </div>
                    
                    {reviews.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl">
                            No reviews yet. Be the first to review!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="rounded-2xl bg-white p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-gray-900">{review.userName}</h4>
                                                {review.isOwnReview && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!selectedToilet) return;
                                                            if (confirm("Are you sure you want to delete this review?")) {
                                                                const success = await deleteReview(review.id, selectedToilet.id);
                                                                if (success) {
                                                                    // Refresh reviews
                                                                    const updatedReviews = await fetchReviews(selectedToilet.id);
                                                                    setReviews(updatedReviews);
                                                                    
                                                                    // Refresh toilets list to update rating
                                                                    await loadToilets();
                                                                    
                                                                    // Update selected toilet with new rating
                                                                    const updatedToilets = await fetchToilets();
                                                                    const updatedToilet = updatedToilets.find(t => t.id === selectedToilet.id);
                                                                    if (updatedToilet) {
                                                                        setSelectedToilet(updatedToilet);
                                                                    }
                                                                } else {
                                                                    alert("Failed to delete review. Please try again.");
                                                                }
                                                            }
                                                        }}
                                                        className="ml-2 p-1.5 rounded-lg text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                                                        title="Delete review"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-0.5 text-yellow-400 mt-0.5">
                                                {[1,2,3,4,5].map(i => (
                                                    <Star key={i} className={`h-3 w-3 ${i <= review.rating ? "fill-current" : "text-gray-200"}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 ml-2">{review.timeAgo}</span>
                                    </div>
                                    {review.comment && <p className="text-sm text-gray-600 mb-2">{review.comment}</p>}
                                    {review.images && review.images.length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {review.images.map((imageUrl: string, idx: number) => (
                                                <img
                                                    key={idx}
                                                    src={imageUrl}
                                                    alt={`Review photo ${idx + 1}`}
                                                    className="h-20 w-20 rounded-lg object-cover cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity"
                                                    onClick={() => {
                                                        setViewingImages({
                                                            urls: review.images || [],
                                                            currentIndex: idx
                                                        });
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Action */}
            <div className="border-t border-gray-100 bg-white p-4 pb-8 space-y-3">
                <div className="flex gap-3">
                    <button 
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        <Share2 className="h-5 w-5" />
                        Share
                    </button>
                    <button 
                        onClick={handleNavigate}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 font-bold text-white shadow-lg hover:bg-[#4338ca] active:scale-95 transition-all"
                    >
                        <Navigation className="h-5 w-5" />
                        Navigate
                    </button>
                </div>
            </div>

          </div>
        )}

        {/* Share Menu Modal */}
        {showShareMenu && selectedToilet && (
            <div 
                className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={() => setShowShareMenu(false)}
            >
                <div 
                    className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Share Toilet</h3>
                        <button
                            onClick={() => setShowShareMenu(false)}
                            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* WhatsApp */}
                        <button
                            onClick={() => shareToApp('whatsapp')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
                                WA
                            </div>
                            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
                        </button>

                        {/* LINE */}
                        <button
                            onClick={() => shareToApp('line')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-[#00C300] flex items-center justify-center text-white text-lg font-bold">
                                LINE
                            </div>
                            <span className="text-xs font-medium text-gray-700">LINE</span>
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={() => shareToApp('facebook')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xl font-bold">
                                f
                            </div>
                            <span className="text-xs font-medium text-gray-700">Facebook</span>
                        </button>

                        {/* Twitter/X */}
                        <button
                            onClick={() => shareToApp('twitter')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold">
                                X
                            </div>
                            <span className="text-xs font-medium text-gray-700">Twitter</span>
                        </button>

                        {/* Instagram */}
                        <button
                            onClick={() => shareToApp('instagram')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                                IG
                            </div>
                            <span className="text-xs font-medium text-gray-700">Instagram</span>
                        </button>

                        {/* Copy Link */}
                        <button
                            onClick={() => shareToApp('copy')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                <Share2 className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">Copy Link</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Review Modal Overlay */}
        {isReviewOpen && selectedToilet && (
            <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 pb-24">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Rate Experience</h3>
                         <button
                          onClick={() => setIsReviewOpen(false)}
                          className="rounded-full bg-gray-100 p-2 text-gray-500"
                        >
                          <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                        How clean was <strong>{selectedToilet.name}</strong>?
                    </p>

                    <div className="flex justify-center gap-3 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                                key={star} 
                                onClick={() => setReviewRating(star)}
                                className="p-1 hover:scale-110 transition-transform"
                            >
                                <Star className={`h-8 w-8 ${
                                    star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`} />
                            </button>
                        ))}
                    </div>

                    <textarea 
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share details (e.g. No soap, broken lock...)" 
                        className="w-full rounded-xl border-0 bg-gray-50 p-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 mb-4 resize-none"
                        rows={3}
                    />

                    {/* Image Upload */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 mb-2">Add Photos (Optional, max 3)</label>
                        {reviewImagePreviews.length > 0 && (
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {reviewImagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img src={preview} alt={`Preview ${index + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                                        <button
                                            onClick={() => removeReviewImage(index)}
                                            className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {reviewImagePreviews.length < 3 && (
                            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                                <Camera className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-600 font-medium">Add Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleReviewImageSelect}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <button 
                        onClick={handleReviewSubmit}
                        disabled={isReviewSubmitting}
                        className="w-full rounded-xl bg-black py-4 font-bold text-white shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {isReviewSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </div>
        )}

        {/* Full Screen Image Viewer */}
        {viewingImages && (
            <div 
                className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
                onClick={() => setViewingImages(null)}
            >
                {/* Close Button - Moved to Left */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setViewingImages(null);
                    }}
                    className="absolute top-4 left-4 z-10 rounded-full bg-black/60 backdrop-blur-md p-3 text-white hover:bg-black/80 transition-all active:scale-95"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Image Counter */}
                {viewingImages.urls.length > 1 && (
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-black/60 backdrop-blur-md px-4 py-2 text-white text-sm font-medium">
                        {viewingImages.currentIndex + 1} / {viewingImages.urls.length}
                    </div>
                )}

                {/* Main Image Container */}
                <div 
                    className="relative w-full h-full flex items-center justify-center px-4"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => {
                        setTouchStart(e.targetTouches[0].clientX);
                    }}
                    onTouchMove={(e) => {
                        setTouchEnd(e.targetTouches[0].clientX);
                    }}
                    onTouchEnd={() => {
                        if (!touchStart || !touchEnd) return;
                        
                        const distance = touchStart - touchEnd;
                        const minSwipeDistance = 50;
                        const isLeftSwipe = distance > minSwipeDistance;
                        const isRightSwipe = distance < -minSwipeDistance;

                        if (isLeftSwipe && viewingImages.currentIndex < viewingImages.urls.length - 1) {
                            setViewingImages({
                                ...viewingImages,
                                currentIndex: viewingImages.currentIndex + 1
                            });
                        }
                        if (isRightSwipe && viewingImages.currentIndex > 0) {
                            setViewingImages({
                                ...viewingImages,
                                currentIndex: viewingImages.currentIndex - 1
                            });
                        }

                        setTouchStart(null);
                        setTouchEnd(null);
                    }}
                >
                    <img
                        key={viewingImages.currentIndex}
                        src={viewingImages.urls[viewingImages.currentIndex]}
                        alt={`Image ${viewingImages.currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain select-none transition-opacity duration-200"
                        draggable={false}
                        onLoad={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '1';
                        }}
                        style={{ opacity: 0 }}
                    />
                </div>

                {/* Navigation Arrows - Hidden on mobile, shown on desktop */}
                {viewingImages.urls.length > 1 && (
                    <>
                        {/* Previous Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (viewingImages.currentIndex > 0) {
                                    setViewingImages({
                                        ...viewingImages,
                                        currentIndex: viewingImages.currentIndex - 1
                                    });
                                }
                            }}
                            disabled={viewingImages.currentIndex === 0}
                            className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-10 rounded-full bg-black/60 backdrop-blur-md p-3 text-white hover:bg-black/80 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        {/* Next Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (viewingImages.currentIndex < viewingImages.urls.length - 1) {
                                    setViewingImages({
                                        ...viewingImages,
                                        currentIndex: viewingImages.currentIndex + 1
                                    });
                                }
                            }}
                            disabled={viewingImages.currentIndex === viewingImages.urls.length - 1}
                            className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-10 rounded-full bg-black/60 backdrop-blur-md p-3 text-white hover:bg-black/80 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}

                {/* Touch Swipe Indicators (Mobile) */}
                {viewingImages.urls.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                        {viewingImages.urls.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${
                                    idx === viewingImages.currentIndex
                                        ? 'bg-white w-6'
                                        : 'bg-white/40 w-1.5'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

      </APIProvider>
    </div>
  );
}
