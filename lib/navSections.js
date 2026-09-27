import {
  LayoutDashboard,
  CheckSquare,
  Flame,
  Trophy,
  Headphones,
  Users,
  BarChart3,
  User,
  Settings,
  GraduationCap,
  Library,
  LineChart,
  Building2,
  Mic2,
  Truck,
  Sparkles,
  ShieldCheck,
  Languages,
  Sprout,
} from "lucide-react";

// Structure only — labels come from the dictionary so the same config
// drives the sidebar, the mobile drawer, and the command palette in
// both languages.
const RAW_GROUPS = [
  {
    groupKey: null,
    items: [
      { href: "/dashboard", icon: LayoutDashboard, key: "home" },
      { href: "/ai", icon: Sparkles, key: "ai" },
    ],
  },
  {
    groupKey: "areas",
    items: [
      { href: "/learning", icon: GraduationCap, key: "learning" },
      { href: "/business-operations", icon: Building2, key: "businessOps" },
      { href: "/trading", icon: LineChart, key: "trading" },
      { href: "/creator", icon: Mic2, key: "creator" },
    ],
  },
  {
    groupKey: "organize",
    items: [
      { href: "/tasks", icon: CheckSquare, key: "tasks" },
    ],
  },
  {
    groupKey: "growth",
    items: [
      { href: "/growth", icon: Sprout, key: "growth" },
    ],
  },
  {
    groupKey: "world",
    items: [
      { href: "/world", icon: Headphones, key: "world" },
    ],
  },
  {
    groupKey: "together",
    items: [
      { href: "/partner", icon: Users, key: "partner" },
    ],
  },
  {
    groupKey: "account",
    items: [
      { href: "/about", icon: User, key: "about" },
      { href: "/settings", icon: Settings, key: "settings" },
      { href: "/privacy", icon: ShieldCheck, key: "privacy" },
    ],
  },
];

export function getNavGroups(strings) {
  return RAW_GROUPS.map((g) => ({
    label: g.groupKey ? strings.groups[g.groupKey] : null,
    items: g.items.map((item) => ({
      ...item,
      label: strings.nav[item.key],
      keywords: item.key,
    })),
  }));
}

export function getNavItems(strings) {
  return getNavGroups(strings).flatMap((g) => g.items);
}
