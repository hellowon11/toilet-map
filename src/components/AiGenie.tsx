"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Toilet } from "@/lib/types";

interface AiGenieProps {
  toilets?: Toilet[];
  userLocation?: { lat: number; lng: number } | null;
  onSearch?: (query: string) => void;
  onFilter?: (filters: { rating?: number; price?: "free" | "paid"; tags?: string[] }) => void;
  onSelectToilet?: (toilet: Toilet) => void;
}

interface Message {
  role: "user" | "ai";
  text: string;
  action?: string;
  toilets?: Toilet[];
}

export default function AiGenie({ toilets = [], userLocation, onSearch, onFilter, onSelectToilet }: AiGenieProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm your Toilet Genie ✨. Try simple keywords like 'clean', 'near', or 'free'. Or combine them: 'clean or near', 'free and bidet'. Just ask naturally! 😊" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRecommendationRef = useRef<{ toilets: Toilet[]; topPick: Toilet | null; reason: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInputValue("");

    // Simulate AI thinking
    setTimeout(() => {
      const response = generateResponse(userText);
      setMessages((prev) => [...prev, { 
        role: "ai", 
        text: response.text, 
        action: response.action,
        toilets: response.toilets 
      }]);
    }, 500);
  };

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

  const generateResponse = (query: string): { text: string; action?: string; toilets?: Toilet[] } => {
    const lowerQuery = query.toLowerCase().trim();
    let filteredToilets = [...toilets];

    // Calculate distances if user location is available
    if (userLocation) {
      filteredToilets = filteredToilets.map(t => ({
        ...t,
        distance: calculateDistance(userLocation.lat, userLocation.lng, t.location.lat, t.location.lng)
      }));
    }

    // Handle "or" logic - split query by "or" and process each part
    if (lowerQuery.includes(" or ")) {
      const parts = lowerQuery.split(" or ").map(p => p.trim());
      let allResults: Toilet[] = [];
      const seenIds = new Set<string>();

      for (const part of parts) {
        const partResponse = generateResponse(part);
        // Get toilets matching this part
        const partToilets = filteredToilets.filter(t => {
          const partLower = part.toLowerCase();
          // Check if matches rating
          if (partLower.match(/\b(clean|cleanest|high rating|good rating|4|5|four|five)\b/)) {
            return t.cleanlinessRating >= 4;
          }
          // Check if matches distance
          if (partLower.match(/\b(near|nearby|nearest|closest|close)\b/)) {
            if (userLocation) {
              const dist = (t as any).distance || calculateDistance(userLocation.lat, userLocation.lng, t.location.lat, t.location.lng);
              return dist < 1; // Within 1km
            }
            return true;
          }
          // Check if matches price
          if (partLower.match(/\b(free|no cost)\b/)) {
            return t.price === 0;
          }
          // Check if matches facilities
          if (partLower.match(/\b(basic|clean|dirty|bidet|accessible|baby|premium|toilet paper|tissue|paper)\b/)) {
            if (partLower.includes("basic")) return t.tags.includes("Basic");
            if (partLower.includes("clean")) return t.tags.includes("Clean");
            if (partLower.includes("dirty")) return t.tags.includes("Dirty");
            if (partLower.includes("bidet")) return t.tags.includes("Bidet");
            if (partLower.includes("accessible") || partLower.includes("wheelchair")) return t.tags.includes("Accessible");
            if (partLower.includes("baby")) return t.tags.includes("Baby Changing");
            if (partLower.includes("premium")) return t.tags.includes("Premium");
            if (partLower.includes("toilet paper") || partLower.includes("tissue") || partLower.includes("paper")) return t.tags.includes("Toilet Paper Provided");
          }
          return false;
        });

        partToilets.forEach(t => {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            allResults.push(t);
          }
        });
      }

      if (allResults.length > 0) {
        // Sort by relevance (rating first, then distance)
        allResults.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          if (a.cleanlinessRating === b.cleanlinessRating) {
            return aDist - bDist;
          }
          return b.cleanlinessRating - a.cleanlinessRating;
        });

        const topResult = allResults[0];
        const dist = (topResult as any).distance;
        const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`) : "";

        // Return top 5 results for user to choose
        const topResults = allResults.slice(0, 5);
        // Don't apply filter - just show results
        return {
          text: `I found ${allResults.length} toilet${allResults.length > 1 ? 's' : ''} matching "${query}". Here are the top results:`,
          action: "filter",
          toilets: topResults
        };
      }
    }

    // Handle "and" logic - all conditions must be met
    if (lowerQuery.includes(" and ")) {
      const parts = lowerQuery.split(" and ").map(p => p.trim());
      let resultToilets = [...filteredToilets];

      for (const part of parts) {
        const partLower = part.toLowerCase();
        resultToilets = resultToilets.filter(t => {
          // Check rating
          if (partLower.match(/\b(clean|cleanest|high rating|good rating|4|5|four|five)\b/)) {
            return t.cleanlinessRating >= 4;
          }
          // Check distance
          if (partLower.match(/\b(near|nearby|nearest|closest|close)\b/)) {
            if (userLocation) {
              const dist = (t as any).distance || calculateDistance(userLocation.lat, userLocation.lng, t.location.lat, t.location.lng);
              return dist < 1; // Within 1km
            }
            return true;
          }
          // Check price
          if (partLower.match(/\b(free|no cost)\b/)) {
            return t.price === 0;
          }
          if (partLower.match(/\b(paid|cost money)\b/)) {
            return t.price > 0;
          }
          // Check facilities
          if (partLower.match(/\b(basic|simple|standard)\b/)) {
            return t.tags.includes("Basic");
          }
          if (partLower.match(/\b(clean|cleanliness|hygienic)\b/)) {
            return t.tags.includes("Clean");
          }
          if (partLower.match(/\b(dirty|messy|unclean)\b/)) {
            return t.tags.includes("Dirty");
          }
          if (partLower.match(/\b(bidet|washlet)\b/)) {
            return t.tags.includes("Bidet");
          }
          if (partLower.match(/\b(accessible|wheelchair|disabled)\b/)) {
            return t.tags.includes("Accessible");
          }
          if (partLower.match(/\b(baby|changing|diaper)\b/)) {
            return t.tags.includes("Baby Changing");
          }
          if (partLower.match(/\b(premium|luxury|fancy)\b/)) {
            return t.tags.includes("Premium");
          }
          if (partLower.match(/\b(toilet paper|tissue|paper provided)\b/)) {
            return t.tags.includes("Toilet Paper Provided");
          }
          // If no match, don't filter out (to handle other keywords)
          return true;
        });
      }

      if (resultToilets.length > 0) {
        // Sort by relevance
        resultToilets.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          if (a.cleanlinessRating === b.cleanlinessRating) {
            return aDist - bDist;
          }
          return b.cleanlinessRating - a.cleanlinessRating;
        });

        const topResult = resultToilets[0];
        const dist = (topResult as any).distance;
        const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`) : "";

        // Build filter object
        const filters: any = {};
        if (parts.some(p => p.match(/\b(clean|cleanest|high rating|good rating|4|5)\b/))) {
          filters.rating = 4;
        }
        if (parts.some(p => p.match(/\b(free|no cost)\b/))) {
          filters.price = "free";
        }
        if (parts.some(p => p.match(/\b(paid|cost money)\b/))) {
          filters.price = "paid";
        }
        const tags: string[] = [];
        if (parts.some(p => p.match(/\b(basic|simple|standard)\b/))) tags.push("Basic");
        if (parts.some(p => p.match(/\b(clean|cleanliness|hygienic)\b/))) tags.push("Clean");
        if (parts.some(p => p.match(/\b(dirty|messy|unclean)\b/))) tags.push("Dirty");
        if (parts.some(p => p.match(/\b(bidet|washlet)\b/))) tags.push("Bidet");
        if (parts.some(p => p.match(/\b(accessible|wheelchair)\b/))) tags.push("Accessible");
        if (parts.some(p => p.match(/\b(baby|changing)\b/))) tags.push("Baby Changing");
        if (parts.some(p => p.match(/\b(premium|luxury)\b/))) tags.push("Premium");
        if (parts.some(p => p.match(/\b(toilet paper|tissue|paper provided)\b/))) tags.push("Toilet Paper Provided");
        if (tags.length > 0) filters.tags = tags;

        // Don't apply filter - just show results
        // Return top 5 results for user to choose
        const topResults = resultToilets.slice(0, 5);
        return {
          text: `Found ${resultToilets.length} toilet${resultToilets.length > 1 ? 's' : ''} matching all criteria! Here are the top results:`,
          action: "filter",
          toilets: topResults
        };
      } else {
        return {
          text: `I couldn't find any toilets matching all criteria: "${query}". Try adjusting your search! 🔍`
        };
      }
    }

    // Parse multiple conditions
    const conditions = {
      rating: null as number | null,
      minRating: null as number | null,
      price: null as "free" | "paid" | null,
      tags: [] as string[],
      maxDistance: null as number | null,
      limit: null as number | null,
      sortBy: "rating" as "rating" | "distance" | "name"
    };

    // Extract rating requirements
    if (lowerQuery.match(/\b(5|five|five star)\b/)) conditions.minRating = 5;
    else if (lowerQuery.match(/\b(4|four|four star)\b/)) conditions.minRating = 4;
    else if (lowerQuery.match(/\b(3|three|three star)\b/)) conditions.minRating = 3;
    else if (lowerQuery.match(/\b(2|two|two star)\b/)) conditions.minRating = 2;
    else if (lowerQuery.match(/\b(1|one|one star)\b/)) conditions.minRating = 1;

    // Extract distance requirements
    const distanceMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*(km|m|meter|meters|kilometer|kilometers)/);
    if (distanceMatch) {
      const value = parseFloat(distanceMatch[1]);
      const unit = distanceMatch[2].toLowerCase();
      conditions.maxDistance = unit.startsWith('k') ? value : value / 1000;
    } else if (lowerQuery.match(/\b(within|less than|under|below)\s+(\d+)\s*(km|m|meter|meters|kilometer|kilometers)?/)) {
      const match = lowerQuery.match(/\b(within|less than|under|below)\s+(\d+)/);
      if (match) {
        const value = parseFloat(match[2]);
        conditions.maxDistance = value < 10 ? value / 1000 : value; // Assume km if > 10, m if < 10
      }
    }

    // Extract limit (top N, first N, show N)
    const limitMatch = lowerQuery.match(/\b(top|first|show|list)\s+(\d+)/);
    if (limitMatch) {
      conditions.limit = parseInt(limitMatch[2]);
    }

    // Extract price conditions
    if (lowerQuery.match(/\b(free|no cost|no charge|gratis)\b/)) conditions.price = "free";
    else if (lowerQuery.match(/\b(paid|cost money|not free)\b/)) conditions.price = "paid";

    // Extract facility tags
    if (lowerQuery.match(/\b(basic|simple|standard)\b/)) conditions.tags.push("Basic");
    if (lowerQuery.match(/\b(clean|cleanliness|hygienic)\b/)) conditions.tags.push("Clean");
    if (lowerQuery.match(/\b(dirty|messy|unclean)\b/)) conditions.tags.push("Dirty");
    if (lowerQuery.match(/\b(bidet|washlet)\b/)) conditions.tags.push("Bidet");
    if (lowerQuery.match(/\b(accessible|wheelchair|disabled|handicap)\b/)) conditions.tags.push("Accessible");
    if (lowerQuery.match(/\b(baby|changing|diaper|infant)\b/)) conditions.tags.push("Baby Changing");
    if (lowerQuery.match(/\b(premium|luxury|fancy|high end)\b/)) conditions.tags.push("Premium");
    if (lowerQuery.match(/\b(prayer|wudu|ablution)\b/)) conditions.tags.push("Prayer Room");
    if (lowerQuery.match(/\b(toilet paper|tissue|paper provided)\b/)) conditions.tags.push("Toilet Paper Provided");
    if (lowerQuery.match(/\b(cultural|heritage)\b/)) conditions.tags.push("Cultural");

    // Extract sort preference
    if (lowerQuery.match(/\b(nearest|closest|nearby|distance)\b/)) conditions.sortBy = "distance";
    else if (lowerQuery.match(/\b(cleanest|best|highest|top rated)\b/)) conditions.sortBy = "rating";
    else if (lowerQuery.match(/\b(name|alphabetical)\b/)) conditions.sortBy = "name";

    // Apply filters
    filteredToilets = filteredToilets.filter(t => {
      if (conditions.minRating && t.cleanlinessRating < conditions.minRating) return false;
      if (conditions.price === "free" && t.price > 0) return false;
      if (conditions.price === "paid" && t.price === 0) return false;
      if (conditions.tags.length > 0 && !conditions.tags.every(tag => t.tags.includes(tag))) return false;
      if (conditions.maxDistance && userLocation) {
        const dist = (t as any).distance || calculateDistance(userLocation.lat, userLocation.lng, t.location.lat, t.location.lng);
        if (dist > conditions.maxDistance) return false;
      }
      return true;
    });

    // Sort results
    filteredToilets.sort((a, b) => {
      if (conditions.sortBy === "distance" && userLocation) {
        const aDist = (a as any).distance || Infinity;
        const bDist = (b as any).distance || Infinity;
        return aDist - bDist;
      } else if (conditions.sortBy === "rating") {
        const aDist = (a as any).distance || Infinity;
        const bDist = (b as any).distance || Infinity;
        if (a.cleanlinessRating === b.cleanlinessRating && aDist < Infinity && bDist < Infinity) {
          return aDist - bDist;
        }
        return b.cleanlinessRating - a.cleanlinessRating;
      } else if (conditions.sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    // Apply limit
    if (conditions.limit) {
      filteredToilets = filteredToilets.slice(0, conditions.limit);
    }

    // Handle complex queries with multiple conditions
    if (conditions.minRating || conditions.price || conditions.tags.length > 0 || conditions.maxDistance || conditions.limit) {
      if (filteredToilets.length === 0) {
        let reason = "I couldn't find any toilets";
        if (conditions.minRating) reason += ` with ${conditions.minRating}+ star rating`;
        if (conditions.price) reason += ` that are ${conditions.price}`;
        if (conditions.tags.length > 0) reason += ` with ${conditions.tags.join(" and ")}`;
        if (conditions.maxDistance) reason += ` within ${conditions.maxDistance < 1 ? Math.round(conditions.maxDistance * 1000) + 'm' : conditions.maxDistance.toFixed(1) + 'km'}`;
        return { text: `${reason}. Try adjusting your search! 🔍` };
      }

      // Apply filters and show results
      const filters: any = {};
      if (conditions.minRating) filters.rating = conditions.minRating;
      if (conditions.price) filters.price = conditions.price;
      if (conditions.tags.length > 0) filters.tags = conditions.tags;
      // Don't apply filter - just show results

      // Return top 5 results for user to choose
      const topResults = filteredToilets.slice(0, 5);
      return {
        text: `I found ${filteredToilets.length} toilet${filteredToilets.length > 1 ? 's' : ''} matching your criteria. Here are the top results:`,
        action: "filter",
        toilets: topResults
      };
    }

    // Single keyword: "clean" - should match high-rated toilets OR toilets with "Clean" tag
    if (lowerQuery === "clean" || lowerQuery.match(/^\bclean\b$/)) {
      // Include both high-rated toilets (4+) AND toilets with "Clean" tag
      const clean = filteredToilets.filter(t => 
        t.cleanlinessRating >= 4 || t.tags.includes("Clean")
      );
      if (clean.length > 0) {
        const sorted = clean.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          // Prioritize high rating + Clean tag, then high rating, then Clean tag
          const aScore = (a.cleanlinessRating >= 4 ? 2 : 0) + (a.tags.includes("Clean") ? 1 : 0);
          const bScore = (b.cleanlinessRating >= 4 ? 2 : 0) + (b.tags.includes("Clean") ? 1 : 0);
          if (aScore !== bScore) {
            return bScore - aScore;
          }
          if (a.cleanlinessRating === b.cleanlinessRating && aDist < Infinity && bDist < Infinity) {
            return aDist - bDist;
          }
          return b.cleanlinessRating - a.cleanlinessRating;
        });
        const topResults = sorted.slice(0, 5);
        // Don't apply filter, just show results
        return {
          text: `I found ${clean.length} clean toilet${clean.length > 1 ? 's' : ''} nearby! These are either highly rated (4⭐+) or marked as "Clean". Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return {
        text: `I couldn't find any clean toilets nearby. Try adjusting your search! 🧹`
      };
    }

    // Single keyword: "near" - should match nearest toilets
    if (lowerQuery === "near" || lowerQuery.match(/^\b(near|nearby|close)\b$/)) {
      if (!userLocation) {
        return { text: "I need your location to find nearby toilets. Please enable location services! 📍" };
      }
      const sorted = filteredToilets.sort((a, b) => {
        const aDist = (a as any).distance || Infinity;
        const bDist = (b as any).distance || Infinity;
        return aDist - bDist;
      });
      const topResults = sorted.slice(0, 5);
      if (topResults.length > 0) {
        return {
          text: `I found ${sorted.length} nearby toilet${sorted.length > 1 ? 's' : ''}. Here are the closest ones:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets nearby." };
    }

    // Nice / Good toilets - match high-rated toilets
    if (lowerQuery.includes("nice") || lowerQuery.includes("good") || lowerQuery.match(/\b(nice|good)\s+toilet/)) {
      const nice = filteredToilets.filter(t => t.cleanlinessRating >= 3.5);
      if (nice.length > 0) {
        const sorted = nice.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          if (a.cleanlinessRating === b.cleanlinessRating && aDist < Infinity && bDist < Infinity) {
            return aDist - bDist;
          }
          return b.cleanlinessRating - a.cleanlinessRating;
        });
        const topResults = sorted.slice(0, 5);
        return {
          text: `I found ${nice.length} nice toilet${nice.length > 1 ? 's' : ''} nearby! These are well-rated (3.5⭐+) options. Here are the best ones:`,
          action: "filter",
          toilets: topResults
        };
      }
      return {
        text: `I couldn't find any nice toilets nearby. Try adjusting your search! 😊`
      };
    }

    // Cleanest / Best rating (simple query)
    if (lowerQuery.includes("cleanest") || lowerQuery.includes("best") || lowerQuery.includes("highest rating") || lowerQuery.includes("top rated")) {
      const sorted = filteredToilets.sort((a, b) => {
        const aDist = (a as any).distance || Infinity;
        const bDist = (b as any).distance || Infinity;
        if (aDist < Infinity && bDist < Infinity) {
          return a.cleanlinessRating === b.cleanlinessRating ? aDist - bDist : b.cleanlinessRating - a.cleanlinessRating;
        }
        return b.cleanlinessRating - a.cleanlinessRating;
      });
      const topResults = sorted.slice(0, 5);
      if (topResults.length > 0) {
        return { 
          text: `I found the cleanest toilets! Here are the top-rated ones:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets nearby. Try adding some locations first!" };
    }

    // Free toilets
    if (lowerQuery.includes("free") || lowerQuery.includes("cheap") || lowerQuery.includes("no cost")) {
      const free = filteredToilets.filter(t => t.price === 0);
      if (free.length > 0) {
        const sorted = userLocation ? free.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : free.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${free.length} free toilet${free.length > 1 ? 's' : ''}! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any free toilets nearby. Most toilets cost around RM 0.50-2.00." };
    }

    // Paid toilets
    if (lowerQuery.includes("paid") || lowerQuery.includes("cost money")) {
      const paid = filteredToilets.filter(t => t.price > 0);
      if (paid.length > 0) {
        const sorted = userLocation ? paid.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : paid.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${paid.length} paid toilet${paid.length > 1 ? 's' : ''}. Prices range from RM${Math.min(...paid.map(t => t.price))} to RM${Math.max(...paid.map(t => t.price))}. Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "All nearby toilets are free!" };
    }

    // Bidet
    if (lowerQuery.includes("bidet")) {
      const bidet = filteredToilets.filter(t => t.tags.includes("Bidet"));
      if (bidet.length > 0) {
        const sorted = userLocation ? bidet.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : bidet.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${bidet.length} toilet${bidet.length > 1 ? 's' : ''} with bidet! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "Sorry, I don't see any toilets with bidets nearby." };
    }

    // Accessible / Wheelchair
    if (lowerQuery.includes("accessible") || lowerQuery.includes("wheelchair") || lowerQuery.includes("disabled")) {
      const accessible = filteredToilets.filter(t => t.tags.includes("Accessible"));
      if (accessible.length > 0) {
        const sorted = userLocation ? accessible.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : accessible.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${accessible.length} accessible toilet${accessible.length > 1 ? 's' : ''} nearby! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any accessible toilets nearby." };
    }

    // Baby changing
    if (lowerQuery.includes("baby") || lowerQuery.includes("changing") || lowerQuery.includes("diaper")) {
      const baby = filteredToilets.filter(t => t.tags.includes("Baby Changing"));
      if (baby.length > 0) {
        const sorted = userLocation ? baby.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : baby.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${baby.length} toilet${baby.length > 1 ? 's' : ''} with baby changing facilities! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets with baby changing facilities nearby." };
    }

    // Basic
    if (lowerQuery.includes("basic") || lowerQuery.includes("simple") || lowerQuery.includes("standard")) {
      const basic = filteredToilets.filter(t => t.tags.includes("Basic"));
      if (basic.length > 0) {
        const sorted = userLocation ? basic.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : basic.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${basic.length} basic toilet${basic.length > 1 ? 's' : ''} nearby! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any basic toilets nearby." };
    }

    // Clean (as a facility tag, not rating) - only if query has multiple words or specific context
    if (lowerQuery.includes("clean") && lowerQuery.split(/\s+/).length > 1 && !lowerQuery.includes("cleanest") && !lowerQuery.includes("cleaner") && lowerQuery !== "clean") {
      const clean = filteredToilets.filter(t => t.tags.includes("Clean"));
      if (clean.length > 0) {
        const sorted = userLocation ? clean.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : clean.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${clean.length} toilet${clean.length > 1 ? 's' : ''} with "Clean" facility tag nearby! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets marked with 'Clean' facility tag nearby." };
    }

    // Dirty
    if (lowerQuery.includes("dirty") || lowerQuery.includes("messy") || lowerQuery.includes("unclean")) {
      const dirty = filteredToilets.filter(t => t.tags.includes("Dirty"));
      if (dirty.length > 0) {
        const sorted = userLocation ? dirty.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : dirty.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${dirty.length} toilet${dirty.length > 1 ? 's' : ''} marked as "Dirty" nearby. Here are the results:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets marked as 'Dirty' nearby." };
    }

    // Premium
    if (lowerQuery.includes("premium") || lowerQuery.includes("luxury") || lowerQuery.includes("fancy")) {
      const premium = filteredToilets.filter(t => t.tags.includes("Premium"));
      if (premium.length > 0) {
        const sorted = userLocation ? premium.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : premium.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${premium.length} premium toilet${premium.length > 1 ? 's' : ''} nearby! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any premium toilets nearby." };
    }

    // Toilet Paper Provided
    if (lowerQuery.includes("toilet paper") || lowerQuery.includes("tissue") || lowerQuery.includes("paper provided")) {
      const paper = filteredToilets.filter(t => t.tags.includes("Toilet Paper Provided"));
      if (paper.length > 0) {
        const sorted = userLocation ? paper.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        }) : paper.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${paper.length} toilet${paper.length > 1 ? 's' : ''} with toilet paper provided! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets with toilet paper provided nearby." };
    }

    // Nearest / Closest
    if (lowerQuery.includes("nearest") || lowerQuery.includes("closest") || lowerQuery.includes("nearby")) {
      if (!userLocation) {
        return { text: "I need your location to find the nearest toilet. Please enable location services! 📍" };
      }
      const sorted = filteredToilets.sort((a, b) => {
        const aDist = (a as any).distance || Infinity;
        const bDist = (b as any).distance || Infinity;
        return aDist - bDist;
      });
      const topResults = sorted.slice(0, 5);
      if (topResults.length > 0) {
        return { 
          text: `I found the nearest toilets! Here are the closest ones:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets nearby." };
    }

    // High rating (4+)
    if (lowerQuery.includes("4") || lowerQuery.includes("four") || lowerQuery.includes("good rating")) {
      const highRated = filteredToilets.filter(t => t.cleanlinessRating >= 4);
      if (highRated.length > 0) {
        const sorted = userLocation ? highRated.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          if (a.cleanlinessRating === b.cleanlinessRating) {
            return aDist - bDist;
          }
          return b.cleanlinessRating - a.cleanlinessRating;
        }) : highRated.sort((a, b) => b.cleanlinessRating - a.cleanlinessRating);
        const topResults = sorted.slice(0, 5);
        // Don't apply filter - just show results
        return { 
          text: `I found ${highRated.length} highly rated toilet${highRated.length > 1 ? 's' : ''} (4⭐+) nearby! Here are the best options:`,
          action: "filter",
          toilets: topResults
        };
      }
      return { text: "I couldn't find any toilets with 4+ star ratings nearby." };
    }

    // Search by name or location
    if (lowerQuery.length > 2) {
      const searchResults = filteredToilets.filter(t => 
        t.name.toLowerCase().includes(lowerQuery) || 
        t.address.toLowerCase().includes(lowerQuery)
      );
      if (searchResults.length > 0) {
        onSearch?.(query);
        return { 
          text: `I found ${searchResults.length} toilet${searchResults.length > 1 ? 's' : ''} matching "${query}". Check the list! 🔍`,
          action: "search"
        };
      }
    }

    // Greeting and help queries
    if (lowerQuery.match(/\b(hi|hello|hey|help|what can you do|how|what)\b/)) {
      return {
        text: "Hi! I'm your Toilet Genie 🚽✨. I can help you find toilets with:\n\n" +
              "**Simple keywords:**\n" +
              "• 'clean' - Find high-rated toilets\n" +
              "• 'near' - Find nearest toilets\n" +
              "• 'free' - Find free toilets\n" +
              "• 'bidet' - Find toilets with bidet\n\n" +
              "**Combined queries:**\n" +
              "• 'clean or near' - Clean toilets OR nearby ones\n" +
              "• 'free and bidet' - Free toilets WITH bidet\n" +
              "• 'Top 3 cleanest premium toilets'\n" +
              "• '4 star toilets within 500m'\n\n" +
              "**Search by name:**\n" +
              "• 'KLCC' or 'Pavilion'\n\n" +
              "Just ask naturally and I'll help! 😊"
      };
    }

    // Comparison queries - Enhanced comparison with insights
    if (lowerQuery.match(/\b(compare|difference|which is better|vs|versus|which one|what's the difference)\b/)) {
      if (filteredToilets.length >= 2) {
        const top2 = filteredToilets.slice(0, 2);
        let comparison = "**Detailed Comparison:**\n\n";
        
        top2.forEach((t, idx) => {
          const dist = (t as any).distance;
          const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : "Unknown";
          const valueScore = t.price === 0 ? "Excellent" : (t.cleanlinessRating / (t.price + 0.1) > 2 ? "Good" : "Fair");
          
          comparison += `**${idx + 1}. ${t.name}**\n`;
          comparison += `   ⭐ Rating: ${t.cleanlinessRating}/5 (${t.reviewCount || 0} reviews)\n`;
          comparison += `   💰 Price: ${t.price === 0 ? 'Free' : `RM${t.price}`} (Value: ${valueScore})\n`;
          comparison += `   📍 Distance: ${distText}\n`;
          comparison += `   🏷️ Facilities: ${t.tags.length > 0 ? t.tags.join(", ") : "Basic"}\n`;
          
          // Add insights
          if (t.cleanlinessRating >= 4.5) {
            comparison += `   ✨ Excellent quality\n`;
          } else if (t.cleanlinessRating >= 4) {
            comparison += `   👍 Good quality\n`;
          }
          if (t.price === 0) {
            comparison += `   💵 Free - great value\n`;
          }
          if (t.tags.includes("Premium")) {
            comparison += `   💎 Premium facilities\n`;
          }
          comparison += `\n`;
        });
        
        // Add winner recommendation
        const t1 = top2[0];
        const t2 = top2[1];
        const d1 = (t1 as any).distance || Infinity;
        const d2 = (t2 as any).distance || Infinity;
        
        let winner = "";
        if (t1.cleanlinessRating > t2.cleanlinessRating && d1 <= d2) {
          winner = `**Winner:** ${t1.name} - Better rating and closer!`;
        } else if (t2.cleanlinessRating > t1.cleanlinessRating && d2 <= d1) {
          winner = `**Winner:** ${t2.name} - Better rating and closer!`;
        } else if (t1.price === 0 && t2.price > 0) {
          winner = `**Winner:** ${t1.name} - Free and good quality!`;
        } else if (t2.price === 0 && t1.price > 0) {
          winner = `**Winner:** ${t2.name} - Free and good quality!`;
        } else if (d1 < d2) {
          winner = `**Winner:** ${t1.name} - Closer to you!`;
        } else if (d2 < d1) {
          winner = `**Winner:** ${t2.name} - Closer to you!`;
        } else {
          winner = `Both are good options - choose based on your priorities!`;
        }
        
        comparison += winner;
        
        return { text: comparison, toilets: top2 };
      }
    }

    // Statistics queries
    if (lowerQuery.match(/\b(how many|count|statistics|stats|total)\b/)) {
      const stats = {
        total: toilets.length,
        free: toilets.filter(t => t.price === 0).length,
        paid: toilets.filter(t => t.price > 0).length,
        highRated: toilets.filter(t => t.cleanlinessRating >= 4).length,
        withBidet: toilets.filter(t => t.tags.includes("Bidet")).length,
        accessible: toilets.filter(t => t.tags.includes("Accessible")).length,
        withPaper: toilets.filter(t => t.tags.includes("Toilet Paper Provided")).length
      };
      return {
        text: `**Toilet Statistics:**\n\n` +
              `📊 Total: ${stats.total} toilets\n` +
              `💰 Free: ${stats.free} | Paid: ${stats.paid}\n` +
              `⭐ High rated (4+): ${stats.highRated}\n` +
              `💦 With bidet: ${stats.withBidet}\n` +
              `♿ Accessible: ${stats.accessible}\n` +
              `🧻 With toilet paper: ${stats.withPaper}`
      };
    }

    // Recommendation queries - Enhanced smart recommendation algorithm
    if (lowerQuery.match(/\b(recommend|suggest|what do you suggest|advice|best option|what should i choose|which toilet|which one)\b/)) {
      if (filteredToilets.length > 0) {
        // Filter out low-quality options first (rating < 3.0)
        const qualityFiltered = filteredToilets.filter(t => t.cleanlinessRating >= 3.0);
        const candidates = qualityFiltered.length > 0 ? qualityFiltered : filteredToilets;
        
        // Enhanced smart recommendation: multi-factor scoring
        const sorted = candidates.map(t => {
          const dist = (t as any).distance || Infinity;
          
          // Factor 1: Rating (0-5, weight: 40%)
          const ratingScore = t.cleanlinessRating * 0.4;
          
          // Factor 2: Distance (0-5, weight: 30%) - closer is better
          const distanceScore = dist < Infinity 
            ? (dist < 0.5 ? 5 : dist < 1 ? 4 : dist < 2 ? 3 : dist < 5 ? 2 : 1) * 0.3
            : 1.5; // Default score if no location
          
          // Factor 3: Value (price vs rating, weight: 15%)
          const valueScore = t.price === 0 
            ? 5 * 0.15  // Free = max value
            : Math.max(0, (t.cleanlinessRating / (t.price + 0.1)) * 0.15);
          
          // Factor 4: Facilities bonus (weight: 10%)
          const facilityScore = (t.tags.length * 0.5) * 0.1;
          
          // Factor 5: Review count (more reviews = more reliable, weight: 5%)
          const reviewScore = Math.min(5, (t.reviewCount || 0) / 2) * 0.05;
          
          const totalScore = ratingScore + distanceScore + valueScore + facilityScore + reviewScore;
          
          return { toilet: t, score: totalScore, distance: dist };
        }).sort((a, b) => {
          // Primary sort: by score
          if (Math.abs(b.score - a.score) > 0.1) {
            return b.score - a.score;
          }
          // Secondary sort: by rating (if scores are close)
          if (b.toilet.cleanlinessRating !== a.toilet.cleanlinessRating) {
            return b.toilet.cleanlinessRating - a.toilet.cleanlinessRating;
          }
          // Tertiary sort: by distance
          return a.distance - b.distance;
        });
        
        // Only show high-quality recommendations (score >= 2.0 or top 3)
        const highQualityResults = sorted.filter(item => item.score >= 2.0 || sorted.indexOf(item) < 3);
        const topResults = (highQualityResults.length > 0 ? highQualityResults : sorted.slice(0, 3))
          .slice(0, 5)
          .map(item => item.toilet);
        
        // Generate personalized recommendation text with detailed reasoning
        const best = sorted[0];
        const reasons: string[] = [];
        
        if (best.toilet.cleanlinessRating >= 4.5) {
          reasons.push(`excellent ${best.toilet.cleanlinessRating}⭐ rating`);
        } else if (best.toilet.cleanlinessRating >= 4.0) {
          reasons.push(`high ${best.toilet.cleanlinessRating}⭐ rating`);
        }
        
        if (best.distance < Infinity) {
          if (best.distance < 0.5) {
            reasons.push(`very close (${Math.round(best.distance * 1000)}m away)`);
          } else if (best.distance < 1) {
            reasons.push(`close (${Math.round(best.distance * 1000)}m away)`);
          } else {
            reasons.push(`reasonable distance (${best.distance.toFixed(1)}km away)`);
          }
        }
        
        if (best.toilet.price === 0) {
          reasons.push(`free to use`);
        } else {
          const valueRatio = best.toilet.cleanlinessRating / (best.toilet.price + 0.1);
          if (valueRatio > 2) {
            reasons.push(`good value (RM${best.toilet.price})`);
          }
        }
        
        if (best.toilet.tags.length > 0) {
          const premiumTags = best.toilet.tags.filter(tag => ['Premium', 'Bidet', 'Accessible'].includes(tag));
          if (premiumTags.length > 0) {
            reasons.push(`premium facilities (${premiumTags.join(', ')})`);
          } else {
            reasons.push(`good facilities (${best.toilet.tags.slice(0, 2).join(', ')})`);
          }
        }
        
        // Generate more human-like recommendation text
        const openingPhrases = [
          "I'd go with",
          "I think you'll like",
          "My top pick is",
          "I'd recommend",
          "You should check out"
        ];
        const opening = openingPhrases[Math.floor(Math.random() * openingPhrases.length)];
        
        let reasonText = "";
        if (reasons.length > 0) {
          if (reasons.length === 1) {
            reasonText = `${opening} **${best.toilet.name}** - ${reasons[0]}.`;
          } else if (reasons.length === 2) {
            reasonText = `${opening} **${best.toilet.name}** - it's got ${reasons[0]} and ${reasons[1]}.`;
          } else {
            const lastReason = reasons.pop();
            reasonText = `${opening} **${best.toilet.name}** - ${reasons.join(', ')}, and ${lastReason}.`;
          }
        } else {
          reasonText = `${opening} **${best.toilet.name}** - it's a solid choice overall.`;
        }
        
        let recommendationText = `${reasonText}\n\n`;
        recommendationText += `**Here's the breakdown:**\n`;
        recommendationText += `⭐ ${best.toilet.cleanlinessRating}/5 rating - ${best.toilet.cleanlinessRating >= 4.5 ? 'really impressive!' : best.toilet.cleanlinessRating >= 4 ? 'pretty good!' : 'decent'}\n`;
        if (best.distance < Infinity) {
          const distText = best.distance < 1 ? `${Math.round(best.distance * 1000)}m away` : `${best.distance.toFixed(1)}km away`;
          recommendationText += `📍 ${distText} - ${best.distance < 0.5 ? 'super close!' : best.distance < 1 ? 'nice and close' : 'not too far'}\n`;
        }
        recommendationText += `💰 ${best.toilet.price === 0 ? 'Free!' : `RM${best.toilet.price}`} - ${best.toilet.price === 0 ? 'can\'t beat that!' : 'fair price'}\n`;
        if (best.toilet.tags.length > 0) {
          const facilitiesText = best.toilet.tags.slice(0, 3).join(', ');
          recommendationText += `🏷️ ${facilitiesText} - ${best.toilet.tags.includes('Premium') ? 'premium experience!' : 'good amenities'}\n`;
        }
        
        if (topResults.length > 1) {
          recommendationText += `\n**Other good options if you want to compare:**`;
        }
        
        // Store recommendation for "why" queries
        lastRecommendationRef.current = {
          toilets: topResults,
          topPick: best.toilet,
          reason: reasonText
        };
        
        return {
          text: recommendationText,
          action: "filter",
          toilets: topResults
        };
      }
    }
    
    // Why/Explanation queries - Explain the recommendation
    if (lowerQuery.match(/\b(why|explain|reason|how come|what makes|why did you|why this|why recommend)\b/)) {
      if (lastRecommendationRef.current && lastRecommendationRef.current.topPick) {
        const rec = lastRecommendationRef.current;
        const topPick = rec.topPick!; // Non-null assertion since we checked above
        const dist = (topPick as any).distance || Infinity;
        
        const openingPhrases = [
          "Sure! Here's why I think",
          "Great question! I picked",
          "Well, I chose",
          "Let me explain why"
        ];
        const opening = openingPhrases[Math.floor(Math.random() * openingPhrases.length)];
        
        let explanation = `${opening} **${topPick.name}** is a good choice:\n\n`;
        
        // Rating explanation - more conversational
        if (topPick.cleanlinessRating >= 4.5) {
          explanation += `⭐ **The rating is amazing (${topPick.cleanlinessRating}/5)** - People really love this place! Most users give it top marks, which means you're likely to have a great experience too.\n\n`;
        } else if (topPick.cleanlinessRating >= 4.0) {
          explanation += `⭐ **It's got a solid ${topPick.cleanlinessRating}/5 rating** - That's pretty good! Users consistently say it's clean and well-maintained, so you can trust it.\n\n`;
        } else if (topPick.cleanlinessRating >= 3.5) {
          explanation += `⭐ **Rating is ${topPick.cleanlinessRating}/5** - Not bad at all! It's above average, so you should be fine here.\n\n`;
        }
        
        // Distance explanation - more natural
        if (dist < Infinity) {
          if (dist < 0.5) {
            explanation += `📍 **It's super close (${Math.round(dist * 1000)}m away)** - Like, literally just around the corner! Super convenient when you need it.\n\n`;
          } else if (dist < 1) {
            explanation += `📍 **Only ${Math.round(dist * 1000)}m away** - That's a quick walk, no need to rush or worry about finding it.\n\n`;
          } else if (dist < 2) {
            explanation += `📍 **About ${dist.toFixed(1)}km away** - Not too far, definitely walkable if you're not in a huge hurry.\n\n`;
          } else {
            explanation += `📍 **${dist.toFixed(1)}km away** - A bit of a walk, but still manageable.\n\n`;
          }
        }
        
        // Price explanation - more friendly
        if (topPick.price === 0) {
          explanation += `💰 **It's FREE!** - Can't beat that, right? No need to worry about having change or paying anything.\n\n`;
        } else {
          const valueRatio = topPick.cleanlinessRating / (topPick.price + 0.1);
          if (valueRatio > 2) {
            explanation += `💰 **Only RM${topPick.price}** - That's pretty reasonable for what you get. Good value for money!\n\n`;
          } else {
            explanation += `💰 **RM${topPick.price}** - Fair price, though you might want to check if it's worth it for you.\n\n`;
          }
        }
        
        // Facilities explanation - more engaging
        if (topPick.tags.length > 0) {
          const premiumTags = topPick.tags.filter(tag => ['Premium', 'Bidet', 'Accessible', 'Baby Changing'].includes(tag));
          if (premiumTags.length > 0) {
            explanation += `🏷️ **Nice extras: ${premiumTags.join(', ')}** - These are the little things that make a difference! You'll have a more comfortable experience.\n\n`;
          } else {
            explanation += `🏷️ **Has ${topPick.tags.join(', ')}** - Covers the basics, which is what matters most.\n\n`;
          }
        }
        
        // Review count explanation - more relatable
        if (topPick.reviewCount && topPick.reviewCount > 0) {
          if (topPick.reviewCount >= 10) {
            explanation += `📊 **Lots of people have reviewed it (${topPick.reviewCount} reviews)** - When that many people take the time to review, you know it's worth checking out!\n\n`;
          } else if (topPick.reviewCount >= 5) {
            explanation += `📊 **Has ${topPick.reviewCount} reviews** - Enough feedback to get a good sense of what to expect.\n\n`;
          }
        }
        
        const closingPhrases = [
          "So yeah, that's why I think it's your best bet!",
          "All things considered, it's a solid choice.",
          "Bottom line: it ticks all the boxes.",
          "That's my reasoning - hope it helps!"
        ];
        const closing = closingPhrases[Math.floor(Math.random() * closingPhrases.length)];
        explanation += closing;
        
        return {
          text: explanation,
          toilets: [topPick] as Toilet[]
        };
      } else {
        return {
          text: "I haven't made a recommendation yet. Try asking me to recommend a toilet first, then I can explain why! 😊"
        };
      }
    }

    // Default helpful response with examples
    return { 
      text: "I can help you find toilets! Try asking:\n\n" +
            "**Simple keywords:**\n" +
            "• 'clean' or 'near' or 'free'\n\n" +
            "**Combined queries:**\n" +
            "• 'clean or near' - Either clean OR nearby\n" +
            "• 'free and bidet' - Free toilets WITH bidet\n" +
            "• 'Top 3 cleanest toilets'\n" +
            "• '4 star toilets within 500m'\n\n" +
            "**Other examples:**\n" +
            "• 'How many free toilets?'\n" +
            "• 'Recommend a toilet'\n" +
            "• 'KLCC' or 'Pavilion'\n\n" +
            "Just type naturally! 🔍✨"
    };
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5B5FEF] text-white shadow-xl shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95"
        >
          <div className="relative">
             <Bot className="h-7 w-7" strokeWidth={2.5} />
             <Sparkles className="absolute -right-2 -top-2 h-4 w-4 fill-yellow-400 text-yellow-400 animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-20 flex h-[450px] w-[85vw] max-w-[350px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-bottom-10 fade-in duration-200 sm:w-[350px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Toilet Genie</h3>
                <p className="text-[10px] opacity-80">Always here to help</p>
              </div>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/10 p-1.5 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 shadow-sm rounded-bl-none border border-gray-100"
                    }`}
                  >
                    {msg.role === "ai" ? (
                        <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ) : (
                        msg.text
                    )}
                  </div>
                </div>
                {/* Toilet Options List */}
                {msg.role === "ai" && msg.toilets && msg.toilets.length > 0 && (
                  <div className="space-y-2 ml-0">
                    {msg.toilets.map((toilet, toiletIdx) => {
                      const dist = (toilet as any).distance;
                      const distText = dist !== undefined && dist < Infinity 
                        ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`)
                        : null;
                      return (
                        <button
                          key={toiletIdx}
                          onClick={() => {
                            onSelectToilet?.(toilet);
                            setIsOpen(false);
                          }}
                          className="w-full text-left rounded-xl bg-white border border-gray-200 p-3 hover:bg-indigo-50 hover:border-indigo-300 transition-all active:scale-98 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">{toilet.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-yellow-500 text-xs">{"⭐".repeat(Math.round(toilet.cleanlinessRating))}</span>
                                <span className="text-gray-500 text-xs">{toilet.cleanlinessRating.toFixed(1)}</span>
                                {toilet.price === 0 ? (
                                  <span className="text-green-600 text-xs font-medium">Free</span>
                                ) : (
                                  <span className="text-gray-500 text-xs">RM{toilet.price}</span>
                                )}
                                {distText && (
                                  <span className="text-gray-400 text-xs">• {distText}</span>
                                )}
                              </div>
                              {toilet.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {toilet.tags.slice(0, 3).map((tag, tagIdx) => (
                                    <span key={tagIdx} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me..."
                className="flex-1 rounded-full border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

