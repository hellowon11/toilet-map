import { Toilet } from "@/lib/types";
import { Star, MapPin } from "lucide-react";

interface ToiletListProps {
  toilets: (Toilet & { distance?: number })[];
  onSelect: (toilet: Toilet) => void;
  hasHistory?: boolean;
  filtersExpanded?: boolean;
}

export default function ToiletList({ toilets, onSelect, hasHistory = false, filtersExpanded = false }: ToiletListProps) {
  // Adjust padding-top based on whether history section and filters are present
  // TopBar: 6.5rem
  // Filter: ~3.5rem (collapsed) or ~12rem (expanded)
  // History: ~6rem (if present, including all padding and content)
  let paddingTop = 'pt-[10rem]'; // Base: TopBar + Filter collapsed
  
  if (filtersExpanded && hasHistory) {
    paddingTop = 'pt-[25rem]'; // TopBar + Filter expanded + History
  } else if (filtersExpanded) {
    paddingTop = 'pt-[19rem]'; // TopBar + Filter expanded
  } else if (hasHistory) {
    paddingTop = 'pt-[16.5rem]'; // TopBar + Filter collapsed + History
  }
  
  return (
    <div className={`h-full overflow-y-auto bg-gray-50 p-3 pb-20 ${paddingTop}`}>
      {toilets.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-sm font-medium">No toilets found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {toilets.map((toilet) => (
            <div
              key={toilet.id}
              onClick={() => onSelect(toilet)}
              className="relative flex overflow-hidden rounded-xl bg-white p-2.5 shadow-sm transition-all active:scale-[0.98] active:bg-gray-50"
            >
               {/* Image Thumbnail */}
               <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                  {toilet.images && toilet.images.length > 0 ? (
                      <img 
                          src={toilet.images[0]} 
                          alt={toilet.name} 
                          className="h-full w-full object-cover"
                      />
                  ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <span className="text-[10px]">No Photo</span>
                      </div>
                  )}
               </div>

               {/* Content */}
              <div className="flex flex-1 flex-col justify-between pl-3 py-0.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{toilet.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-2.5 w-2.5" />
                          <span className="line-clamp-1">{toilet.address.split(",")[0]}</span>
                        </div>
                        {toilet.distance !== undefined && (
                          <span className="text-blue-600 font-bold">
                            {toilet.distance < 1 
                              ? `${Math.round(toilet.distance * 1000)}m` 
                              : `${toilet.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex h-5 min-w-[2rem] items-center justify-center rounded-md px-1 text-[10px] font-bold ${
                        toilet.cleanlinessRating >= 4.0
                          ? "bg-green-100 text-green-700"
                          : toilet.cleanlinessRating >= 3.0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {toilet.cleanlinessRating}
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {toilet.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                          tag === "Premium"
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-gray-50 text-gray-600 border border-gray-100"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

