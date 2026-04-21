export function getSquadStatusColor(status: string): string {
  if (status === "active") return "bg-accent/20 text-accent";
  if (status === "forming") return "bg-primary/20 text-primary";
  return "bg-secondary text-muted-foreground";
}
