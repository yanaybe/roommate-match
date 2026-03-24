import { Search, SlidersHorizontal, Map, List } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ApartmentCard from "@/components/ApartmentCard";
import { mockApartments } from "@/data/mockData";

export default function Index() {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Roo<span className="text-primary">match</span>
              </h1>
              <p className="text-muted-foreground text-sm">Find your perfect room</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === "list" ? "map" : "list")}
                className="bg-secondary p-2.5 rounded-xl"
              >
                {view === "list" ? <Map className="w-4 h-4 text-secondary-foreground" /> : <List className="w-4 h-4 text-secondary-foreground" />}
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by area or neighborhood..."
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="bg-secondary p-2.5 rounded-xl">
              <SlidersHorizontal className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        {view === "list" ? (
          <div className="space-y-4">
            {mockApartments.map((apt, i) => (
              <ApartmentCard key={apt.id} apartment={apt} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-secondary rounded-2xl h-[60vh] flex items-center justify-center"
          >
            <div className="text-center text-muted-foreground">
              <Map className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Map view coming soon</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
