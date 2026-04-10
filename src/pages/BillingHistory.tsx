import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Receipt, Download, Filter, CheckCircle2, XCircle, Clock, CreditCard, Crown, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";

type TransactionStatus = "completed" | "pending" | "failed" | "refunded";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: TransactionStatus;
  type: "subscription" | "boost" | "extra";
  icon: React.ElementType;
}

const mockTransactions: Transaction[] = [
  {
    id: "txn_001",
    date: "2026-04-08",
    description: "Gold Plan – Monthly",
    amount: "₪29.00",
    status: "completed",
    type: "subscription",
    icon: Crown,
  },
  {
    id: "txn_002",
    date: "2026-04-05",
    description: "Profile Boost × 3",
    amount: "₪30.00",
    status: "completed",
    type: "boost",
    icon: Zap,
  },
  {
    id: "txn_003",
    date: "2026-03-08",
    description: "Gold Plan – Monthly",
    amount: "₪29.00",
    status: "completed",
    type: "subscription",
    icon: Crown,
  },
  {
    id: "txn_004",
    date: "2026-03-01",
    description: "Instant Message",
    amount: "₪5.00",
    status: "refunded",
    type: "extra",
    icon: Star,
  },
  {
    id: "txn_005",
    date: "2026-02-08",
    description: "Gold Plan – Monthly",
    amount: "₪29.00",
    status: "completed",
    type: "subscription",
    icon: Crown,
  },
  {
    id: "txn_006",
    date: "2026-02-02",
    description: "Listing Boost",
    amount: "₪10.00",
    status: "failed",
    type: "boost",
    icon: Zap,
  },
  {
    id: "txn_007",
    date: "2026-01-08",
    description: "Gold Plan – Monthly",
    amount: "₪29.00",
    status: "completed",
    type: "subscription",
    icon: Crown,
  },
];

const statusConfig: Record<TransactionStatus, { label: string; icon: React.ElementType; color: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40" },
  refunded: { label: "Refunded", icon: XCircle, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" },
};

const typeColors: Record<string, string> = {
  subscription: "bg-primary/10 text-primary",
  boost: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  extra: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupByMonth(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return groups;
}

type FilterType = "all" | "subscription" | "boost" | "extra";

export default function BillingHistory() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all" ? mockTransactions : mockTransactions.filter((tx) => tx.type === filter);
  const grouped = groupByMonth(filtered);

  const totalSpent = mockTransactions
    .filter((tx) => tx.status === "completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount.replace("₪", "")), 0);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "subscription", label: "Subscriptions" },
    { key: "boost", label: "Boosts" },
    { key: "extra", label: "Extras" },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Billing History</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-5 shadow-elevated"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/70 text-xs font-medium mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-primary-foreground">₪{totalSpent.toFixed(2)}</p>
              <p className="text-primary-foreground/50 text-xs mt-1">
                {mockTransactions.filter((tx) => tx.status === "completed").length} transactions
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
              <Receipt size={28} className="text-primary-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === f.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {Object.keys(grouped).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Receipt size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">No transactions found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Your billing history will appear here</p>
          </motion.div>
        ) : (
          Object.entries(grouped).map(([month, txns], gi) => (
            <motion.section
              key={month}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {month}
              </h3>
              <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30 overflow-hidden">
                {txns.map((tx, i) => {
                  const status = statusConfig[tx.status];
                  const StatusIcon = status.icon;
                  const TxIcon = tx.icon;

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.05 + i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[tx.type]}`}>
                        <TxIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(tx.date)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-sm font-bold ${tx.status === "refunded" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {tx.amount}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                          <StatusIcon size={10} />
                          {status.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          ))
        )}

        {/* Payment method info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Payment Method</p>
            <p className="text-xs text-muted-foreground">Visa •••• 4242</p>
          </div>
          <button className="text-xs font-semibold text-primary cursor-pointer">Change</button>
        </motion.div>
      </div>
    </div>
  );
}
