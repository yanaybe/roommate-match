import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";

export default function Welcome() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const city = searchParams.get("city") ?? "";
  const name = searchParams.get("name") ?? "";
  const targetCount = parseInt(searchParams.get("count") ?? "0", 10);
  const [displayCount, setDisplayCount] = useState(0);

  // Animate counter up to targetCount over ~1.2s
  useEffect(() => {
    if (targetCount === 0) { setDisplayCount(0); return; }
    const duration = 1200;
    const steps = Math.min(targetCount, 60);
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += Math.ceil(targetCount / steps);
      if (current >= targetCount) {
        setDisplayCount(targetCount);
        clearInterval(timer);
      } else {
        setDisplayCount(current);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [targetCount]);

  // If no params, redirect home
  if (!city && targetCount === 0) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <Users className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-foreground mb-3"
        >
          {targetCount > 0 ? (
            <>
              We found{" "}
              <span className="text-primary">{displayCount}</span>{" "}
              potential roommates
              {city && <> in <span className="text-primary">{city}</span></>}!
            </>
          ) : (
            <>
              Your profile is ready
              {name && <>, {name}</>}!
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-muted-foreground text-sm mb-8"
        >
          {targetCount > 0
            ? "Start swiping to find your perfect match. Your compatibility score is calculated across 14 lifestyle factors."
            : "Start browsing apartments and roommates to find your perfect match."}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onClick={() => navigate("/roommates", { replace: true })}
          className="w-full gradient-primary text-primary-foreground font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          See your matches
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          onClick={() => navigate("/", { replace: true })}
          className="mt-3 w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse apartments first
        </motion.button>
      </motion.div>
    </div>
  );
}
