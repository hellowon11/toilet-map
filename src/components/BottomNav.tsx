import { Map, List, PlusCircle, Heart } from "lucide-react";

interface BottomNavProps {
  currentTab: "map" | "list" | "favorites" | "add";
  onTabChange: (tab: "map" | "list" | "favorites" | "add") => void;
}

export default function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white pb-safe pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 pb-1">
        <button
          onClick={() => onTabChange("list")}
          className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
            currentTab === "list" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <List className="h-5 w-5" strokeWidth={currentTab === "list" ? 2.5 : 2} />
          <span className="text-[9px] font-medium">List</span>
        </button>

        <button
          onClick={() => onTabChange("map")}
          className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
            currentTab === "map" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Map className="h-5 w-5" strokeWidth={currentTab === "map" ? 2.5 : 2} />
          <span className="text-[9px] font-medium">Map</span>
        </button>

        <button
          onClick={() => onTabChange("favorites")}
          className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
            currentTab === "favorites" ? "text-red-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Heart className={`h-5 w-5 ${currentTab === "favorites" ? "fill-current" : ""}`} strokeWidth={currentTab === "favorites" ? 2.5 : 2} />
          <span className="text-[9px] font-medium">Saved</span>
        </button>

        <button
          onClick={() => onTabChange("add")}
          className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
            currentTab === "add" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <PlusCircle className="h-5 w-5" strokeWidth={currentTab === "add" ? 2.5 : 2} />
          <span className="text-[9px] font-medium">Add</span>
        </button>
      </div>
    </div>
  );
}

