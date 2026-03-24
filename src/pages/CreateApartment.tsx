import { motion } from "framer-motion";
import { Users, Home, Search } from "lucide-react";

const modes = [
  { icon: Search, title: "Find a Room", desc: "Browse available rooms in shared apartments", color: "gradient-primary" },
  { icon: Users, title: "Find Roommates", desc: "Post your apartment and find matching roommates", color: "bg-accent" },
  { icon: Home, title: "Start Fresh", desc: "Create a new apartment group from scratch", color: "bg-foreground" },
];

export default function CreateApartment() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Create</h1>
          <p className="text-muted-foreground mb-8">What are you looking for?</p>
        </motion.div>

        <div className="space-y-4">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="w-full flex items-center gap-4 p-5 bg-card rounded-2xl shadow-card hover:shadow-elevated transition-shadow text-left"
              >
                <div className={`${mode.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-card-foreground">{mode.title}</h3>
                  <p className="text-muted-foreground text-sm">{mode.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
