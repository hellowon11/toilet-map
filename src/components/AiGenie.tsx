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

export default function AiGenie({ toilets = [], userLocation, onSearch, onFilter, onSelectToilet }: AiGenieProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; action?: string }[]>([
    { role: "ai", text: "Hi! I'm your Toilet Genie ✨. I can help you find toilets by rating, price, facilities, or distance. Try asking: 'Find the cleanest toilet' or 'Show me free toilets with bidet'" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setMessages((prev) => [...prev, { role: "ai", text: response.text, action: response.action }]);
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

  const generateResponse = (query: string): { text: string; action?: string } => {
    const lowerQuery = query.toLowerCase();
    let filteredToilets = [...toilets];

    // Calculate distances if user location is available
    if (userLocation) {
      filteredToilets = filteredToilets.map(t => ({
        ...t,
        distance: calculateDistance(userLocation.lat, userLocation.lng, t.location.lat, t.location.lng)
      }));
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
    if (lowerQuery.match(/\b(bidet|washlet)\b/)) conditions.tags.push("Bidet");
    if (lowerQuery.match(/\b(accessible|wheelchair|disabled|handicap)\b/)) conditions.tags.push("Accessible");
    if (lowerQuery.match(/\b(baby|changing|diaper|infant)\b/)) conditions.tags.push("Baby Changing");
    if (lowerQuery.match(/\b(premium|luxury|fancy|high end)\b/)) conditions.tags.push("Premium");
    if (lowerQuery.match(/\b(prayer|wudu|ablution)\b/)) conditions.tags.push("Prayer Room");
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
      onFilter?.(filters);

      if (filteredToilets.length === 1) {
        const toilet = filteredToilets[0];
        const dist = (toilet as any).distance;
        const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`) : "";
        onSelectToilet?.(toilet);
        return {
          text: `Perfect match! **${toilet.name}** (${toilet.cleanlinessRating}⭐${toilet.price === 0 ? ', Free' : `, RM${toilet.price}`})${distText ? `, ${distText}` : ""} ✨`,
          action: "select"
        };
      }

      const top3 = filteredToilets.slice(0, 3);
      let response = `I found ${filteredToilets.length} toilet${filteredToilets.length > 1 ? 's' : ''} matching your criteria:\n\n`;
      top3.forEach((t, idx) => {
        const dist = (t as any).distance;
        const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : "?";
        response += `${idx + 1}. **${t.name}** - ${t.cleanlinessRating}⭐${t.price === 0 ? ', Free' : `, RM${t.price}`}${distText !== "?" ? `, ${distText} away` : ""}\n`;
      });
      if (filteredToilets.length > 3) {
        response += `\n...and ${filteredToilets.length - 3} more! Check the list for details.`;
      }
      if (top3.length > 0) {
        onSelectToilet?.(top3[0]);
      }
      return { text: response, action: "filter" };
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
      const best = sorted[0];
      if (best) {
        const dist = (best as any).distance;
        const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`) : "";
        onSelectToilet?.(best);
        return { 
          text: `The cleanest toilet is **${best.name}** with a ${best.cleanlinessRating}⭐ rating${distText ? `, ${distText}` : ""}! ✨`,
          action: "select"
        };
      }
      return { text: "I couldn't find any toilets nearby. Try adding some locations first!" };
    }

    // Free toilets
    if (lowerQuery.includes("free") || lowerQuery.includes("cheap") || lowerQuery.includes("no cost")) {
      const free = filteredToilets.filter(t => t.price === 0);
      if (free.length > 0) {
        onFilter?.({ price: "free" });
        const nearest = userLocation ? free.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        })[0] : free[0];
        return { 
          text: `I found ${free.length} free toilet${free.length > 1 ? 's' : ''}! The nearest is **${nearest.name}**. 💰`,
          action: "filter"
        };
      }
      return { text: "I couldn't find any free toilets nearby. Most toilets cost around RM 0.50-2.00." };
    }

    // Paid toilets
    if (lowerQuery.includes("paid") || lowerQuery.includes("cost money")) {
      const paid = filteredToilets.filter(t => t.price > 0);
      if (paid.length > 0) {
        onFilter?.({ price: "paid" });
        return { 
          text: `I found ${paid.length} paid toilet${paid.length > 1 ? 's' : ''}. Prices range from RM${Math.min(...paid.map(t => t.price))} to RM${Math.max(...paid.map(t => t.price))}.`,
          action: "filter"
        };
      }
      return { text: "All nearby toilets are free!" };
    }

    // Bidet
    if (lowerQuery.includes("bidet")) {
      const bidet = filteredToilets.filter(t => t.tags.includes("Bidet"));
      if (bidet.length > 0) {
        onFilter?.({ tags: ["Bidet"] });
        const nearest = userLocation ? bidet.sort((a, b) => {
          const aDist = (a as any).distance || Infinity;
          const bDist = (b as any).distance || Infinity;
          return aDist - bDist;
        })[0] : bidet[0];
        return { 
          text: `Yes! I found ${bidet.length} toilet${bidet.length > 1 ? 's' : ''} with bidet. The nearest is **${nearest.name}**. 💦`,
          action: "filter"
        };
      }
      return { text: "Sorry, I don't see any toilets with bidets nearby." };
    }

    // Accessible / Wheelchair
    if (lowerQuery.includes("accessible") || lowerQuery.includes("wheelchair") || lowerQuery.includes("disabled")) {
      const accessible = filteredToilets.filter(t => t.tags.includes("Accessible"));
      if (accessible.length > 0) {
        onFilter?.({ tags: ["Accessible"] });
        return { 
          text: `I found ${accessible.length} accessible toilet${accessible.length > 1 ? 's' : ''} nearby! ♿`,
          action: "filter"
        };
      }
      return { text: "I couldn't find any accessible toilets nearby." };
    }

    // Baby changing
    if (lowerQuery.includes("baby") || lowerQuery.includes("changing") || lowerQuery.includes("diaper")) {
      const baby = filteredToilets.filter(t => t.tags.includes("Baby Changing"));
      if (baby.length > 0) {
        onFilter?.({ tags: ["Baby Changing"] });
        return { 
          text: `I found ${baby.length} toilet${baby.length > 1 ? 's' : ''} with baby changing facilities! 👶`,
          action: "filter"
        };
      }
      return { text: "I couldn't find any toilets with baby changing facilities nearby." };
    }

    // Premium
    if (lowerQuery.includes("premium") || lowerQuery.includes("luxury") || lowerQuery.includes("fancy")) {
      const premium = filteredToilets.filter(t => t.tags.includes("Premium"));
      if (premium.length > 0) {
        onFilter?.({ tags: ["Premium"] });
        return { 
          text: `I found ${premium.length} premium toilet${premium.length > 1 ? 's' : ''} nearby! 💎`,
          action: "filter"
        };
      }
      return { text: "I couldn't find any premium toilets nearby." };
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
      const nearest = sorted[0];
      if (nearest) {
        const dist = (nearest as any).distance;
        const distText = dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`;
        onSelectToilet?.(nearest);
        return { 
          text: `The nearest toilet is **${nearest.name}**, ${distText}! 📍`,
          action: "select"
        };
      }
      return { text: "I couldn't find any toilets nearby." };
    }

    // High rating (4+)
    if (lowerQuery.includes("4") || lowerQuery.includes("four") || lowerQuery.includes("good rating")) {
      const highRated = filteredToilets.filter(t => t.cleanlinessRating >= 4);
      if (highRated.length > 0) {
        onFilter?.({ rating: 4 });
        return { 
          text: `I found ${highRated.length} highly rated toilet${highRated.length > 1 ? 's' : ''} (4⭐+) nearby! ⭐`,
          action: "filter"
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
              "**Simple queries:**\n" +
              "• 'Find the cleanest toilet'\n" +
              "• 'Show me free toilets'\n" +
              "• 'Nearest accessible toilet'\n\n" +
              "**Combined queries:**\n" +
              "• 'Free toilets with bidet within 1km'\n" +
              "• 'Top 3 cleanest premium toilets'\n" +
              "• '4 star toilets with baby changing'\n\n" +
              "**Search by name:**\n" +
              "• 'KLCC' or 'Pavilion'\n\n" +
              "Just ask naturally and I'll help! 😊"
      };
    }

    // Comparison queries
    if (lowerQuery.match(/\b(compare|difference|which is better|vs|versus)\b/)) {
      if (filteredToilets.length >= 2) {
        const top2 = filteredToilets.slice(0, 2);
        let comparison = "**Comparison:**\n\n";
        top2.forEach((t, idx) => {
          const dist = (t as any).distance;
          const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : "?";
          comparison += `${idx + 1}. **${t.name}**\n`;
          comparison += `   Rating: ${t.cleanlinessRating}⭐ | Price: ${t.price === 0 ? 'Free' : `RM${t.price}`} | Distance: ${distText}\n`;
          comparison += `   Facilities: ${t.tags.join(", ") || "Basic"}\n\n`;
        });
        return { text: comparison };
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
        accessible: toilets.filter(t => t.tags.includes("Accessible")).length
      };
      return {
        text: `**Toilet Statistics:**\n\n` +
              `📊 Total: ${stats.total} toilets\n` +
              `💰 Free: ${stats.free} | Paid: ${stats.paid}\n` +
              `⭐ High rated (4+): ${stats.highRated}\n` +
              `💦 With bidet: ${stats.withBidet}\n` +
              `♿ Accessible: ${stats.accessible}`
      };
    }

    // Recommendation queries
    if (lowerQuery.match(/\b(recommend|suggest|what do you suggest|advice)\b/)) {
      if (filteredToilets.length > 0) {
        const recommended = filteredToilets[0];
        const dist = (recommended as any).distance;
        const distText = dist < Infinity ? (dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`) : "";
        onSelectToilet?.(recommended);
        return {
          text: `I recommend **${recommended.name}**! 🎯\n\n` +
                `⭐ Rating: ${recommended.cleanlinessRating}/5\n` +
                `💰 Price: ${recommended.price === 0 ? 'Free' : `RM${recommended.price}`}\n` +
                `${distText ? `📍 Distance: ${distText}\n` : ''}` +
                `🏷️ Features: ${recommended.tags.join(", ") || "Basic"}\n\n` +
                `This is the best match based on your preferences!`,
          action: "select"
        };
      }
    }

    // Default helpful response with examples
    return { 
      text: "I can help you find toilets! Try asking:\n\n" +
            "**Examples:**\n" +
            "• 'Find free toilets with bidet within 500m'\n" +
            "• 'Show me the top 3 cleanest toilets'\n" +
            "• '4 star accessible toilets near me'\n" +
            "• 'Compare the nearest premium toilets'\n" +
            "• 'How many free toilets are there?'\n" +
            "• 'Recommend a toilet for me'\n\n" +
            "Or just search by name like 'KLCC' or 'Pavilion'! 🔍✨"
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
              <div
                key={idx}
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

