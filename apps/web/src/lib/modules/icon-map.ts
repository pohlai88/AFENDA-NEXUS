/**
 * Canonical icon registry for the Afenda ERP shell.
 *
 * Every component that needs to resolve a string icon name (e.g. from
 * `NavItem.icon` or `ModuleSpec.iconName`) should import from here
 * instead of maintaining a local duplicate map.
 */

import type { LucideIcon } from 'lucide-react';
import {
  // Module-level icons
  Home,
  Landmark,
  Users,
  Handshake,
  MessageSquare,
  Settings,
  ShieldCheck,

  // Navigation / domain icons
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  List,
  Calendar,
  BarChart3,
  ArrowLeftRight,
  ArrowRightLeft,
  RefreshCw,
  Receipt,
  HandCoins,
  CheckCircle,
  CreditCard,
  Shield,
  FileSpreadsheet,
  GitMerge,
  Settings2,
  FileCheck,
  Hash,
  FileSignature,
  Award,
  Package,
  Building,
  TrendingDown,
  Sparkles,
  Trash2,
  Wallet,
  User,
  FolderKanban,
  PieChart,
  Workflow,
  Vault,
  TrendingUp,
  FileWarning,
  Network,
  Calculator,
  Key,
  AlertCircle,
  Banknote,
  Umbrella,
  Clock,
  GitBranch,
  Building2,
  MinusCircle,
  Star,
  Target,
  Copy,
  Zap,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

/**
 * Master icon map — every icon name used in nav configs, module specs,
 * and command palette items must be registered here.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // Module icons
  Home,
  Landmark,
  Users,
  Handshake,
  MessageSquare,
  Settings,
  ShieldCheck,

  // Navigation icons
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  List,
  Calendar,
  BarChart3,
  ArrowLeftRight,
  ArrowRightLeft,
  RefreshCw,
  Receipt,
  HandCoins,
  CheckCircle,
  CreditCard,
  Shield,
  FileSpreadsheet,
  GitMerge,
  Settings2,
  FileCheck,
  Hash,
  FileSignature,
  Award,
  Package,
  Building,
  TrendingDown,
  Sparkles,
  Trash2,
  Wallet,
  User,
  FolderKanban,
  PieChart,
  Workflow,
  Vault,
  TrendingUp,
  FileWarning,
  Network,
  Calculator,
  Key,
  AlertCircle,
  Banknote,
  Umbrella,
  Clock,
  GitBranch,
  Building2,
  MinusCircle,
  Star,
  Target,
  Copy,
  Zap,
  Sun,
  Moon,
  Monitor,
};

/**
 * Resolve an icon name to its component.
 * Falls back to `FileText` if the name is not registered.
 */
export function getIcon(name: string, fallback: LucideIcon = FileText): LucideIcon {
  return ICON_MAP[name] ?? fallback;
}
