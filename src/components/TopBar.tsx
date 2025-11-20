"use client";

import { Search, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { saveProfile, getProfile, getUserStats } from "@/lib/data";

interface TopBarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
}

export default function TopBar({ onSearch, searchValue, onSearchChange }: TopBarProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; isLoggedIn: boolean }>({
    name: "Visitor",
    isLoggedIn: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [stats, setStats] = useState({ toiletsAdded: 0, reviewsWritten: 0, favoritesCount: 0 });
  
  // Use external value if provided, otherwise use internal state
  const searchQuery = searchValue !== undefined ? searchValue : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

  useEffect(() => {
      // Load profile on mount
      const loadProfile = async () => {
          const profile = await getProfile();
          if (profile) {
              setUser({ name: profile.display_name, isLoggedIn: true });
              // Load stats
              const userStats = await getUserStats();
              setStats(userStats);
          }
      };
      loadProfile();
  }, []);

  useEffect(() => {
      // Reload stats when modal opens
      if (isAuthOpen) {
          getUserStats().then(setStats);
      }
  }, [isAuthOpen]);

  useEffect(() => {
      // Debounce search
      const timer = setTimeout(() => {
          onSearch?.(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleSaveProfile = async () => {
      setIsSaving(true);
      const success = await saveProfile(user.name);
      setIsSaving(false);
      
      if (success) {
          setUser(prev => ({ ...prev, isLoggedIn: true }));
          setIsAuthOpen(false);
      } else {
          alert("Failed to save profile. Please try again.");
      }
  };

  return (
    <>
      <div className="absolute left-0 right-0 top-0 z-20 flex flex-col gap-2 bg-white/95 backdrop-blur-sm px-4 pb-3 pt-safe shadow-sm border-b border-gray-100">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">KL Toilet Finder</h1>
          </div>
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 pl-3 pr-1.5 py-1.5 transition-all hover:bg-gray-100 active:scale-95"
          >
            <span className="text-xs font-bold text-gray-700 max-w-[80px] truncate">{user.name}</span>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${user.isLoggedIn ? "bg-blue-600 text-white" : "bg-white text-gray-400"}`}>
              <User className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm shadow-inner transition-all"
            placeholder="Search toilets..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
               <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <User className="h-8 w-8" />
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Display Name</label>
                  <input 
                    type="text" 
                    value={user.name}
                    onChange={(e) => setUser({...user, name: e.target.value})}
                    className="mt-1 block w-full border-b-2 border-gray-200 py-1 text-lg font-bold text-gray-900 focus:border-blue-600 focus:outline-none"
                  />
               </div>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-xl bg-blue-50 p-3">
                <span className="text-2xl font-bold text-blue-600">{stats.toiletsAdded}</span>
                <span className="text-xs text-gray-600 mt-1">Added</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-green-50 p-3">
                <span className="text-2xl font-bold text-green-600">{stats.reviewsWritten}</span>
                <span className="text-xs text-gray-600 mt-1">Reviews</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-red-50 p-3">
                <span className="text-2xl font-bold text-red-600">{stats.favoritesCount}</span>
                <span className="text-xs text-gray-600 mt-1">Saved</span>
              </div>
            </div>

            <div className="mb-8 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
               This name will appear on your reviews. No password required!
            </div>
            
            <div className="flex items-center justify-between gap-4">
               <button 
                 onClick={() => setIsAuthOpen(false)} 
                 className="flex-1 rounded-xl py-3 font-bold text-gray-500 hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSaveProfile}
                 disabled={isSaving}
                 className="flex-1 rounded-xl bg-[#5B5FEF] py-3 font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-[#4a4ecf] active:scale-95 transition-all disabled:opacity-50"
               >
                 {isSaving ? "Saving..." : "Save"}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

