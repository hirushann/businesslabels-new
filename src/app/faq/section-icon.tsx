import {
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  LifeBuoy,
  Package,
  Printer,
  RotateCcw,
  Settings,
  ShieldCheck,
  Tag,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Mirrors `config/faq.php → section_icons` on the Laravel side. The CMS
 * stores a kebab-case icon name; this maps it to the matching lucide icon
 * so editors and the frontend stay in sync via that single config key.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  "help-circle": HelpCircle,
  truck: Truck,
  "credit-card": CreditCard,
  package: Package,
  "rotate-ccw": RotateCcw,
  settings: Settings,
  wrench: Wrench,
  "shield-check": ShieldCheck,
  printer: Printer,
  tag: Tag,
  "file-text": FileText,
  "life-buoy": LifeBuoy,
  user: User,
  globe: Globe,
};

export function sectionIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return ICON_MAP[name] ?? HelpCircle;
}
