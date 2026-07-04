import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  MotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface ScrollStep {
  step: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface ScrollStepsPathProps {
  steps: ScrollStep[];
  rtl?: boolean;
}

function StepCard({
  step,
  index,
  total,
  progress,
  reduceMotion,
}: {
  step: ScrollStep;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const start = (index / total) * 0.7;
  const end = start + 0.3;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [36, 0]);
  const iconScale = useTransform(progress, [start + 0.08, end], [0.6, 1]);
  const Icon = step.icon;

  return (
    <motion.div
      style={reduceMotion ? undefined : { opacity, y }}
      className="bg-card rounded-2xl p-6 shadow-card relative"
    >
      <span className="absolute top-4 right-4 text-xs font-extrabold text-muted-foreground/30">
        {step.step}
      </span>
      <motion.div
        style={reduceMotion ? undefined : { scale: iconScale }}
        className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center mb-4"
      >
        <Icon className="w-5 h-5 text-primary-foreground" />
      </motion.div>
      <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
    </motion.div>
  );
}

export default function ScrollStepsPath({ steps, rtl = false }: ScrollStepsPathProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.85", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const pathLength = reduceMotion ? 1 : progress;

  return (
    <div ref={sectionRef} className="relative">
      {/* Horizontal connector — desktop; sits at icon-row height, behind cards */}
      <svg
        aria-hidden="true"
        data-connector="horizontal"
        className="hidden sm:block absolute top-[46px] left-0 w-full h-1 pointer-events-none text-primary/40"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        style={rtl ? { transform: "scaleX(-1)" } : undefined}
      >
        <motion.path
          d="M 0 1 H 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ pathLength }}
        />
      </svg>
      {/* Vertical connector — mobile; centered, behind cards, visible in gaps */}
      <svg
        aria-hidden="true"
        data-connector="vertical"
        className="sm:hidden absolute left-1/2 top-4 -ml-px h-[calc(100%-2rem)] w-0.5 pointer-events-none text-primary/40"
        viewBox="0 0 2 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 1 0 V 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ pathLength }}
        />
      </svg>

      <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <StepCard
            key={step.step}
            step={step}
            index={i}
            total={steps.length}
            progress={progress}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
}
