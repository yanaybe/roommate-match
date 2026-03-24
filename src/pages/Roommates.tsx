import { Search, SlidersHorizontal } from "lucide-react";
import RoommateCard from "@/components/RoommateCard";
import { mockUsers } from "@/data/mockData";

const matchPercents = [92, 87, 78, 85, 71, 64];

export default function Roommates() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <h1 className="text-xl font-extrabold text-foreground mb-3">Find Roommates</h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or lifestyle..."
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="bg-secondary p-2.5 rounded-xl">
              <SlidersHorizontal className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {mockUsers.map((user, i) => (
            <RoommateCard key={user.id} user={user} matchPercent={matchPercents[i]} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
