import { motion, useReducedMotion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{title}</h2>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="text-center mb-10">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="text-2xl sm:text-3xl font-extrabold text-foreground"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-muted-foreground mt-2"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
