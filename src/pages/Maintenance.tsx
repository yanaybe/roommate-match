import { Wrench } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <Wrench className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-2">We'll be right back</h1>
      <p className="text-muted-foreground max-w-sm">
        RooMatch is undergoing scheduled maintenance. We'll be back shortly — check back in a few minutes.
      </p>
      <p className="text-xs text-muted-foreground/60 mt-8">© {new Date().getFullYear()} RooMatch</p>
    </div>
  );
}
