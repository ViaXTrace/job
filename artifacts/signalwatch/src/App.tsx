import React, { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowRight, Bell, Check, CheckCircle2, ChevronDown, CircleAlert, CircleDot,
  Clock3, Copy, CreditCard, ExternalLink, Eye, EyeOff, FileText, Filter, Gauge,
  Globe2, Inbox, KeyRound, Layers3, Link2, LockKeyhole, LogOut, Menu, MessageSquare,
  MoreHorizontal, Pause, Pencil, Play, Plus, QrCode, RefreshCw, Search, Settings2,
  ShieldCheck, SlidersHorizontal, Sparkles, Star, Tag, Trash2, Unplug, UsersRound,
  X, Zap,
} from 'lucide-react';
import {
  getGetBillingStatusQueryKey, getGetConnectionStatusQueryKey, getGetDashboardSummaryQueryKey,
  getGetPreferencesQueryKey, getListAlertsQueryKey, getListBillingPlansQueryKey,
  getListGroupsQueryKey, getListRulesQueryKey, useArchiveAlert, useCreateConnectionQr,
  useCreatePixCheckout, useCreateRule, useDeleteRule, useDisconnectTelegram,
  useFavoriteAlert, useGetBillingStatus, useGetConnectionStatus, useGetDashboardSummary,
  useGetPreferences, useListAlerts, useListBillingPlans, useListGroups, useListRules,
  useMarkAlertRead, useRefreshConnection, useSyncGroups, useUpdateGroupMonitoring,
  useUpdatePreferences, useUpdateRule,
} from '@workspace/api-client-react';
import type {
  Alert, BillingPlan, BillingStatus, DashboardSummary, KeywordRule, TelegramConnection,
  TelegramGroup, UserPreference,
} from '@workspace/api-client-react';
import { ClerkProvider, Redirect, Show, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { Link, Redirect as WouterRedirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import Landing from '@/pages/Landing';

const queryClient = new QueryClient();

// ── Clerk setup ────────────────────────────────────────────────────────────────
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || '?';
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#116b68',
    colorForeground: '#12383a',
    colorMutedForeground: '#6d8984',
    colorDanger: '#de765f',
    colorBackground: '#edf7f3',
    colorInput: '#ffffff',
    colorInputForeground: '#12383a',
    colorNeutral: '#c4dfd6',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#12383a] font-[var(--app-font-serif)]',
    headerSubtitle: 'text-[#6d8984]',
    socialButtonsBlockButtonText: 'text-[#12383a] font-semibold',
    formFieldLabel: 'text-[#315c58] font-semibold text-sm',
    footerActionLink: 'text-[#116b68] font-bold',
    footerActionText: 'text-[#6d8984]',
    dividerText: 'text-[#9ab0ab] font-bold text-[11px] uppercase tracking-wider',
    identityPreviewEditButton: 'text-[#116b68]',
    formFieldSuccessText: 'text-[#116b68]',
    alertText: 'text-[#12383a]',
    logoBox: 'mb-2',
    logoImage: 'h-8 w-8',
    socialButtonsBlockButton: 'border border-[#c4dfd7] bg-[#fafffd] hover:bg-[#e3f4ed]',
    formButtonPrimary: 'bg-[#116b68] hover:bg-[#0d5754] text-white font-bold',
    formFieldInput: 'border-[#c4dfd6] bg-white text-[#12383a] focus:border-[#116b68]',
    footerAction: 'bg-[#f4fbf7]',
    dividerLine: 'bg-[#dceae5]',
    alert: 'bg-[#fff8f6] border-[#de765f]',
    otpCodeFieldInput: 'border-[#c4dfd6]',
    formFieldRow: 'gap-3',
    main: 'gap-5',
  },
};
// ──────────────────────────────────────────────────────────────────────────────

const fallbackConnection: TelegramConnection = {
  status: 'not_connected',
  accountLabel: null,
  authorizedAt: null,
  lastSyncAt: null,
  lastEventAt: null,
  availableGroups: 0,
  monitoringEnabled: false,
  connectorAvailable: false,
  message: 'O conector do Telegram ainda não está disponível neste ambiente.',
};
const fallbackAlerts: Alert[] = [
  { id: 'a-1', groupId: 'g-1', groupName: 'Comercial SP · oportunidades', ruleId: 'r-1', ruleName: 'Licitações de tecnologia', message: 'Empresa pública abre cotação para suporte de rede e segurança. Envio de propostas até sexta-feira.', author: 'Marina C.', matchedKeywords: ['cotação', 'segurança'], receivedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), status: 'unread', favorite: true, messageLink: null, deliveryStatus: 'internal' },
  { id: 'a-2', groupId: 'g-2', groupName: 'Negócios & Parcerias BR', ruleId: 'r-2', ruleName: 'Parcerias regionais', message: 'Busco parceiro no interior de Minas para distribuição de linha profissional. Operação recorrente.', author: 'Rafael M.', matchedKeywords: ['parceiro', 'distribuição'], receivedAt: new Date(Date.now() - 1000 * 60 * 74).toISOString(), status: 'unread', favorite: false, messageLink: null, deliveryStatus: 'internal' },
  { id: 'a-3', groupId: 'g-3', groupName: 'Fornecedores B2B Brasil', ruleId: 'r-1', ruleName: 'Licitações de tecnologia', message: 'Indicação de fornecedor para implantação de câmeras IP em três unidades. Alguém atende a região Sul?', author: 'João P.', matchedKeywords: ['fornecedor', 'câmeras IP'], receivedAt: new Date(Date.now() - 1000 * 60 * 133).toISOString(), status: 'read', favorite: false, messageLink: null, deliveryStatus: 'internal' },
];
const fallbackGroups: TelegramGroup[] = [
  { id: 'g-1', name: 'Comercial SP · oportunidades', username: 'comercial_sp', status: 'active', monitored: true, messageCount: 18742, lastEventAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(), appliedRules: 4 },
  { id: 'g-2', name: 'Negócios & Parcerias BR', username: 'negocios_parcerias', status: 'active', monitored: true, messageCount: 9360, lastEventAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(), appliedRules: 2 },
  { id: 'g-3', name: 'Fornecedores B2B Brasil', username: 'fornecedores_b2b', status: 'paused', monitored: false, messageCount: 4218, lastEventAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), appliedRules: 1 },
  { id: 'g-4', name: 'Varejo e expansão', username: 'varejo_expansao', status: 'unavailable', monitored: false, messageCount: 0, lastEventAt: null, appliedRules: 0 },
];
const fallbackRules: KeywordRule[] = [
  { id: 'r-1', name: 'Licitações de tecnologia', keywords: ['licitação', 'cotação', 'câmeras IP'], requiredKeywords: [], excludedKeywords: ['curso'], groupIds: ['g-1', 'g-3'], matchType: 'partial', active: true, priority: 82, cooldownMinutes: 60, matchedCount: 38, createdAt: '2025-02-03' },
  { id: 'r-2', name: 'Parcerias regionais', keywords: ['parceiro', 'distribuidor'], requiredKeywords: ['recorrente'], excludedKeywords: [], groupIds: ['g-1', 'g-2'], matchType: 'partial', active: true, priority: 61, cooldownMinutes: 180, matchedCount: 16, createdAt: '2025-01-28' },
  { id: 'r-3', name: 'Imóveis comerciais', keywords: ['ponto comercial', 'galpão'], requiredKeywords: [], excludedKeywords: [], groupIds: ['g-2'], matchType: 'exact', active: false, priority: 34, cooldownMinutes: 360, matchedCount: 7, createdAt: '2025-01-11' },
];
const fallbackSummary: DashboardSummary = { alertsToday: 24, unreadAlerts: 8, activeRules: 2, monitoredGroups: 2, connection: fallbackConnection, planUsage: { planName: 'Pulso', groupsUsed: 2, groupsLimit: 5, keywordsUsed: 6, keywordsLimit: 12, historyDays: 30 }, recentAlerts: fallbackAlerts };
const fallbackPlans: BillingPlan[] = [
  { id: 'pulse', name: 'Pulso', description: 'Para operações comerciais em movimento.', monthlyPriceCents: 7900, annualPriceCents: 75800, groupsLimit: 5, keywordsLimit: 12, destinationsLimit: 1, historyDays: 30, features: ['5 grupos monitorados', '12 palavras-chave', '30 dias de histórico'] },
  { id: 'radar', name: 'Radar', description: 'Para times que precisam cobrir mais terreno.', monthlyPriceCents: 16900, annualPriceCents: 162200, groupsLimit: 20, keywordsLimit: 50, destinationsLimit: 3, historyDays: 90, features: ['20 grupos monitorados', '50 palavras-chave', '90 dias de histórico'] },
  { id: 'sinal', name: 'Sinal', description: 'Inteligência compartilhada para equipes.', monthlyPriceCents: 32900, annualPriceCents: 315800, groupsLimit: 60, keywordsLimit: 160, destinationsLimit: 8, historyDays: 365, features: ['60 grupos monitorados', '160 palavras-chave', '365 dias de histórico'] },
];

function money(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function relativeDate(value?: string | null) {
  if (!value) return '—';
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  if (mins < 1440) return `há ${Math.round(mins / 60)} h`;
  return `há ${Math.round(mins / 1440)} d`;
}
function formatDay(value?: string | null) { return value ? new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }

function Logo({ inverse = false }: { inverse?: boolean }) {
  return <div className="flex items-center gap-2.5" data-testid="brand-logo">
    <div className={`relative grid h-9 w-9 place-items-center rounded-xl ${inverse ? 'bg-[#80f2d4] text-[#12383a]' : 'bg-[#116b68] text-[#e9fff8]'}`}>
      <span className="absolute h-4 w-4 rounded-full border-2 border-current" />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-current" />
      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#edb94b]" />
    </div>
    <span className={`sw-display text-xl font-bold tracking-[-.04em] ${inverse ? 'text-[#e9fff8]' : 'text-[#12383a]'}`}>SignalWatch</span>
  </div>;
}

function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = { primary: 'bg-[#116b68] text-[#f5fffb] hover:bg-[#0d5754] shadow-[0_7px_18px_rgba(17,107,104,.18)]', secondary: 'border border-[#b9d9d2] bg-[#f9fffc] text-[#175b59] hover:bg-[#e7f5f0]', ghost: 'text-[#51716e] hover:bg-[#dcefe9] hover:text-[#12383a]', danger: 'border border-[#ecc5be] bg-[#fff8f6] text-[#a84032] hover:bg-[#ffebe7]' };
  return <button className={`sw-transition inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
function Pill({ children, tone = 'teal' }: { children: ReactNode; tone?: 'teal' | 'amber' | 'red' | 'slate' | 'blue' }) {
  const colors = { teal: 'bg-[#ddf6eb] text-[#12685e]', amber: 'bg-[#fff0cd] text-[#936813]', red: 'bg-[#ffe3df] text-[#a94335]', slate: 'bg-[#e5eeeb] text-[#52706c]', blue: 'bg-[#dceff3] text-[#287281]' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[tone]}`}>{children}</span>;
}
function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-lg bg-[#dcebe7] ${className}`} />; }
function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Inbox; title: string; body: string; action?: ReactNode }) {
  return <div className="sw-card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e3f4ee] text-[#277b70]"><Icon size={22} /></div><h3 className="sw-display text-xl font-bold text-[#12383a]">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#62807c]">{body}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
function ErrorState({ onRetry, label = 'Não foi possível carregar estes dados.' }: { onRetry?: () => void; label?: string }) {
  return <div className="rounded-xl border border-[#eac7bf] bg-[#fff7f4] p-4 text-sm text-[#954b3e]"><div className="flex items-center gap-2 font-semibold"><CircleAlert size={17} /> {label}</div>{onRetry && <button onClick={onRetry} className="mt-2 font-bold underline" data-testid="button-retry">Tentar novamente</button>}</div>;
}

const navItems = [
  { href: '/app', label: 'Visão geral', icon: Gauge, exact: true },
  { href: '/app/alerts', label: 'Alertas', icon: Inbox },
  { href: '/app/rules', label: 'Regras', icon: SlidersHorizontal },
  { href: '/app/groups', label: 'Grupos', icon: UsersRound },
];
const utilityItems = [
  { href: '/app/connection', label: 'Conexão', icon: Link2 },
  { href: '/app/billing', label: 'Plano e cobrança', icon: CreditCard },
  { href: '/app/settings', label: 'Preferências', icon: Settings2 },
];

function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const userInitials = initials(user?.fullName ?? user?.firstName ?? '');
  const userName = user?.fullName ?? user?.firstName ?? 'Usuário';
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '';
  return <div className="sw-noise min-h-[100dvh] bg-[#edf7f3] text-[#12383a]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-[#12383a] px-4 py-5 text-[#d5eee8] transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-2"><Logo inverse /></div>
      <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#79aaa1]">Operação</div>
      <nav className="mt-3 space-y-1">{navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${location === item.href || (!item.exact && location.startsWith(item.href)) ? 'bg-[#23615f] text-[#effff9]' : 'text-[#a9ccc4] hover:bg-[#1b4d4d] hover:text-[#effff9]'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.label === 'Alertas' && <span className="ml-auto rounded-full bg-[#edbd54] px-1.5 py-0.5 text-[10px] font-extrabold text-[#244543]">8</span>}</Link>)}</nav>
      <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#79aaa1]">Configuração</div>
      <nav className="mt-3 space-y-1">{utilityItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${location.startsWith(item.href) ? 'bg-[#23615f] text-[#effff9]' : 'text-[#a9ccc4] hover:bg-[#1b4d4d] hover:text-[#effff9]'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.label === 'Conexão' && <span className="ml-auto h-2 w-2 rounded-full bg-[#edbd54]" />}</Link>)}</nav>
      <div className="mt-auto rounded-xl border border-[#356d69] bg-[#1a4a4a] p-3.5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#e6fff8]">Plano Pulso</span><Pill tone="amber">2 / 5 grupos</Pill></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#356d69]"><div className="h-full w-[42%] rounded-full bg-[#80e0c0]" /></div><Link href="/app/billing" className="mt-3 flex items-center justify-between text-xs font-semibold text-[#94d7c7] hover:text-[#effff9]" data-testid="link-sidebar-billing">Ver detalhes <ArrowRight size={13} /></Link></div>
      <div className="mt-4 flex items-center gap-3 border-t border-[#2a5c5b] px-2 pt-4">{user?.imageUrl ? <img src={user.imageUrl} className="h-8 w-8 rounded-full object-cover" alt="" /> : <div className="grid h-8 w-8 place-items-center rounded-full bg-[#edbd54] text-xs font-extrabold text-[#264847]">{userInitials}</div>}<div className="min-w-0"><div className="truncate text-xs font-bold text-[#effff9]">{userName}</div><div className="truncate text-[11px] text-[#86b2a8]">{userEmail}</div></div><button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="ml-auto text-[#86b2a8] hover:text-white" aria-label="Sair" data-testid="button-sign-out"><LogOut size={15} /></button></div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-[#12383a]/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" data-testid="button-close-menu" />}
    <div className="lg:pl-[252px]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#d2e8e1] bg-[#edf7f3]/90 px-5 backdrop-blur lg:px-9"><div className="flex items-center gap-3"><button className="rounded-lg p-2 text-[#386a66] hover:bg-[#dcefe9] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu" data-testid="button-open-menu"><Menu size={20} /></button><div className="hidden text-xs font-bold text-[#6a8985] sm:block">terça-feira, 18 de fevereiro de 2025</div><div className="text-sm font-semibold text-[#12383a] sm:hidden">terça, 18 fev</div></div><div className="flex items-center gap-2.5"><Link href="/app/connection" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#527b76] hover:bg-[#dcefe9] sm:flex" data-testid="link-header-connection"><span className="h-2 w-2 rounded-full bg-[#edbd54]" /> Telegram não conectado</Link><button className="relative rounded-lg p-2.5 text-[#4f7773] hover:bg-[#dcefe9]" aria-label="Notificações" data-testid="button-notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#de765f]" /></button>{user?.imageUrl ? <img src={user.imageUrl} className="h-8 w-8 rounded-full object-cover" alt="" /> : <div className="grid h-8 w-8 place-items-center rounded-full bg-[#d8b467] text-xs font-extrabold text-[#264847]">{userInitials}</div>}</div></header><main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-9 lg:py-9">{children}</main></div>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.17em] text-[#3a8b81]"><span className="h-1.5 w-1.5 rounded-full bg-[#edbd54]" />{eyebrow}</div><h1 className="sw-display text-[2.15rem] font-bold leading-none tracking-[-.045em] text-[#12383a] lg:text-[2.55rem]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#62807c]">{description}</p></div>{action}</div>;
}

function Metric({ label, value, note, icon: Icon, tone = 'teal' }: { label: string; value: string | number; note: string; icon: typeof Activity; tone?: 'teal' | 'amber' | 'blue' }) {
  const iconColor = { teal: 'bg-[#dcf4ea] text-[#2d8176]', amber: 'bg-[#fff0d0] text-[#9c741a]', blue: 'bg-[#dff2f3] text-[#3a7e87]' };
  return <div className="sw-card rounded-2xl p-5"><div className="flex items-start justify-between"><div className="text-xs font-bold uppercase tracking-[.09em] text-[#75928e]">{label}</div><div className={`grid h-9 w-9 place-items-center rounded-xl ${iconColor[tone]}`}><Icon size={17} /></div></div><div className="mt-5 sw-display text-4xl font-bold tracking-[-.05em] text-[#12383a]">{value}</div><div className="mt-1 text-xs font-medium text-[#76928e]">{note}</div></div>;
}

function AlertRow({ alert, onRead, onFavorite, onArchive }: { alert: Alert; onRead?: () => void; onFavorite?: () => void; onArchive?: () => void }) {
  return <article className={`sw-transition group relative rounded-xl border p-4 ${alert.status === 'unread' ? 'border-[#b5ded1] bg-[#fbfffd]' : 'border-[#d8e8e3] bg-[#f7fcfa]'}`} data-testid={`card-alert-${alert.id}`}><div className="flex gap-3"><div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${alert.status === 'unread' ? 'bg-[#e6b548]' : 'bg-[#c5d8d3]'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-[#347f76]">{alert.groupName}</span><span className="text-[11px] text-[#96aaa6]">· {relativeDate(alert.receivedAt)}</span>{alert.deliveryStatus === 'unavailable' && <Pill tone="amber">Entrega indisponível</Pill>}</div><p className="mt-2 text-sm leading-6 text-[#2d4f4e]">{alert.message}</p><div className="mt-3 flex flex-wrap items-center gap-1.5">{alert.matchedKeywords.map(k => <span key={k} className="rounded-md bg-[#e5f4ef] px-2 py-1 font-mono text-[10px] font-medium text-[#357c73]">#{k}</span>)}<span className="ml-1 text-[11px] text-[#819c97]">regra: {alert.ruleName}</span></div></div><div className="flex shrink-0 items-start gap-0.5 opacity-60 transition-opacity group-hover:opacity-100"><button onClick={onFavorite} className={`rounded-md p-2 hover:bg-[#e4f3ed] ${alert.favorite ? 'text-[#d29c27]' : 'text-[#73938e]'}`} aria-label="Favoritar alerta" data-testid={`button-favorite-${alert.id}`}><Star size={16} fill={alert.favorite ? 'currentColor' : 'none'} /></button><button onClick={onRead} className="rounded-md p-2 text-[#73938e] hover:bg-[#e4f3ed]" aria-label={alert.status === 'unread' ? 'Marcar como lido' : 'Marcar como não lido'} data-testid={`button-read-${alert.id}`}>{alert.status === 'unread' ? <Eye size={16} /> : <EyeOff size={16} />}</button><button onClick={onArchive} className="rounded-md p-2 text-[#73938e] hover:bg-[#e4f3ed]" aria-label="Arquivar alerta" data-testid={`button-archive-${alert.id}`}><MoreHorizontal size={16} /></button></div></div></article>;
}

function Dashboard() {
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { user } = useUser();
  const summary = summaryQuery.data ?? fallbackSummary;
  const health = summaryQuery.isError;
  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'você';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return <><PageHeader eyebrow="Pulso de hoje" title={`${greeting}, ${firstName}.`} description="Seu radar está de olho. Aqui está o que merece atenção agora." action={<Link href="/app/alerts" className="inline-flex items-center gap-2 rounded-lg bg-[#116b68] px-4 py-2.5 text-sm font-bold text-[#f5fffb] shadow-[0_7px_18px_rgba(17,107,104,.18)] hover:bg-[#0d5754]" data-testid="link-see-all-alerts">Abrir inbox <ArrowRight size={16} /></Link>} />
    {health && <div className="mb-5"><ErrorState onRetry={() => summaryQuery.refetch()} label="O servidor não respondeu. Exibindo o último panorama disponível." /></div>}
    {summaryQuery.isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Alertas hoje" value={summary.alertsToday} note={`${summary.unreadAlerts} ainda não lidos`} icon={Inbox} /><Metric label="Regras ativas" value={summary.activeRules} note="cobrindo seus temas" icon={Zap} tone="amber" /><Metric label="Grupos monitorados" value={summary.monitoredGroups} note={`${summary.connection.availableGroups} disponíveis`} icon={Layers3} tone="blue" /><Metric label="Conexão" value={summary.connection.status === 'connected' ? 'Ativa' : 'Pendente'} note={summary.connection.connectorAvailable ? 'Telegram autorizado' : 'conector indisponível'} icon={Activity} tone={summary.connection.status === 'connected' ? 'teal' : 'amber'} /></div>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]"><section className="sw-card rounded-2xl p-5 lg:p-6"><div className="flex items-center justify-between"><div><h2 className="sw-display text-xl font-bold text-[#12383a]">Sinais recentes</h2><p className="mt-1 text-xs text-[#75918c]">O que cruzou suas regras nas últimas horas.</p></div><Link href="/app/alerts" className="text-xs font-bold text-[#278078] hover:underline" data-testid="link-recent-alerts">Ver todos</Link></div><div className="mt-5 space-y-2">{summary.recentAlerts.length ? summary.recentAlerts.slice(0, 4).map(a => <AlertRow key={a.id} alert={a} />) : <EmptyState icon={Inbox} title="Nenhum sinal ainda" body="Quando uma mensagem cruzar suas regras, ela aparecerá neste espaço." />}</div></section><aside className="space-y-6"><section className="sw-card rounded-2xl p-5 lg:p-6"><div className="flex items-center justify-between"><div><h2 className="sw-display text-xl font-bold text-[#12383a]">Uso do plano</h2><p className="mt-1 text-xs text-[#75918c]">{summary.planUsage.planName}</p></div><Link href="/app/billing" className="text-xs font-bold text-[#278078] hover:underline" data-testid="link-usage-billing">Detalhes</Link></div><UsageBar label="Grupos" used={summary.planUsage.groupsUsed} limit={summary.planUsage.groupsLimit} /><UsageBar label="Palavras-chave" used={summary.planUsage.keywordsUsed} limit={summary.planUsage.keywordsLimit} /></section><section className="rounded-2xl bg-[#d8f2e8] p-5 lg:p-6"><div className="flex items-center gap-2 text-[#1d746b]"><CircleDot size={16} className="sw-scan" /><span className="text-xs font-bold uppercase tracking-[.15em]">Próximo passo</span></div><h3 className="sw-display mt-4 text-xl font-bold leading-tight text-[#164f4d]">{summary.connection.connectorAvailable ? 'Revise os alertas de maior intenção.' : 'Conecte seu Telegram para começar.'}</h3><p className="mt-2 text-sm leading-6 text-[#4d7770]">{summary.connection.connectorAvailable ? 'Comece pelos sinais não lidos e ajuste uma regra se o ruído aumentou.' : 'A integração está aguardando disponibilidade do conector. Você poderá autorizar sua conta sem compartilhar sua senha.'}</p><Link href={summary.connection.connectorAvailable ? '/app/alerts' : '/app/connection'} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#176b64] hover:gap-3" data-testid="link-next-step">{summary.connection.connectorAvailable ? 'Ir para inbox' : 'Ver conexão'} <ArrowRight size={15} /></Link></section></aside></div>
  </>;
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  return <div className="mt-5"><div className="flex justify-between text-xs font-semibold text-[#557773]"><span>{label}</span><span className="sw-mono text-[#2a6964]">{used} <span className="text-[#9ab2ad]">/ {limit}</span></span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dcebe6]"><div className={`h-full rounded-full ${pct > 80 ? 'bg-[#df9d45]' : 'bg-[#3ba88e]'}`} style={{ width: `${pct}%` }} /></div></div>;
}

function AlertsPage() {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const params = useMemo(() => ({ search: search || undefined, period, status: 'all' as const, limit: 50 }), [search, period]);
  const query = useListAlerts(params, { query: { queryKey: getListAlertsQueryKey(params) } });
  const alerts = query.data ?? fallbackAlerts.filter(a => !search || `${a.message} ${a.groupName} ${a.ruleName}`.toLowerCase().includes(search.toLowerCase()));
  const qc = useQueryClient();
  const mark = useMarkAlertRead(); const fav = useFavoriteAlert(); const archive = useArchiveAlert();
  const invalidate = () => qc.invalidateQueries({ queryKey: getListAlertsQueryKey(params) });
  const action = (mut: typeof mark, id: string, data: object, success: string) => mut.mutate({ alertId: id, data } as never, { onSuccess: () => { invalidate(); toast({ title: success }); }, onError: () => toast({ title: 'Ação não concluída', description: 'Tente novamente em instantes.', variant: 'destructive' }) });
  return <><PageHeader eyebrow="Caixa de entrada" title="Alertas" description="Oportunidades filtradas das conversas que você não tem tempo de acompanhar." action={<Button onClick={() => query.refetch()} variant="secondary" disabled={query.isFetching} data-testid="button-refresh-alerts"><RefreshCw size={15} className={query.isFetching ? 'animate-spin' : ''} /> Atualizar</Button>} /><div className="sw-card rounded-2xl p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-3.5 text-[#7e9c97]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por mensagem, grupo ou regra" className="h-11 w-full rounded-lg border border-[#c6dfd8] bg-[#fafffd] pl-10 pr-4 text-sm outline-none ring-[#64bfa6] placeholder:text-[#92aaa6] focus:ring-2" data-testid="input-search-alerts" /></div><div className="flex items-center gap-2 overflow-x-auto"><Filter size={15} className="text-[#6f8d88]" />{(['today', '7d', '30d', 'all'] as const).map(item => <button key={item} onClick={() => setPeriod(item)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold ${period === item ? 'bg-[#d9f2e8] text-[#126c63]' : 'text-[#668682] hover:bg-[#e5f2ed]'}`} data-testid={`button-period-${item}`}>{item === 'today' ? 'Hoje' : item === '7d' ? '7 dias' : item === '30d' ? '30 dias' : 'Tudo'}</button>)}</div></div></div><div className="mt-5 flex items-center justify-between"><div className="text-xs font-semibold text-[#6f8b87]"><span className="sw-mono text-[#246f69]">{alerts.length}</span> sinais encontrados</div><div className="flex gap-2"><Pill tone="teal"><span className="h-1.5 w-1.5 rounded-full bg-current" /> internos</Pill><Pill tone="amber">Telegram conectado: não</Pill></div></div><div className="mt-3 space-y-2">{query.isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="h-40" />) : query.isError && !query.data ? <ErrorState onRetry={() => query.refetch()} /> : alerts.length ? alerts.map(a => <AlertRow key={a.id} alert={a} onRead={() => action(mark, a.id, { read: a.status !== 'unread' }, a.status === 'unread' ? 'Alerta marcado como lido.' : 'Alerta marcado como não lido.')} onFavorite={() => action(fav, a.id, { favorite: !a.favorite }, a.favorite ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.')} onArchive={() => action(archive, a.id, { archived: true }, 'Alerta arquivado.')} />) : <EmptyState icon={Search} title="Nada cruzou esse filtro" body="Tente outra palavra ou amplie o período para encontrar um sinal." action={<Button variant="secondary" onClick={() => { setSearch(''); setPeriod('all'); }} data-testid="button-clear-alert-filters">Limpar filtros</Button>} />}</div></>;
}

type RuleForm = { name: string; keywords: string; requiredKeywords: string; excludedKeywords: string; groupIds: string[]; matchType: 'partial' | 'exact' | 'regex'; active: boolean; priority: number; cooldownMinutes: number };
const blankRule: RuleForm = { name: '', keywords: '', requiredKeywords: '', excludedKeywords: '', groupIds: ['g-1'], matchType: 'partial', active: true, priority: 50, cooldownMinutes: 60 };
function RuleModal({ initial, groups, onClose, onSaved }: { initial?: KeywordRule; groups: TelegramGroup[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<RuleForm>(initial ? { name: initial.name, keywords: initial.keywords.join(', '), requiredKeywords: (initial.requiredKeywords ?? []).join(', '), excludedKeywords: (initial.excludedKeywords ?? []).join(', '), groupIds: initial.groupIds, matchType: initial.matchType, active: initial.active, priority: initial.priority, cooldownMinutes: initial.cooldownMinutes } : blankRule);
  const create = useCreateRule(); const update = useUpdateRule(); const qc = useQueryClient();
  const save = () => { const payload = { name: form.name.trim(), keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean), requiredKeywords: form.requiredKeywords.split(',').map(s => s.trim()).filter(Boolean), excludedKeywords: form.excludedKeywords.split(',').map(s => s.trim()).filter(Boolean), groupIds: form.groupIds, matchType: form.matchType, active: form.active, priority: Number(form.priority), cooldownMinutes: Number(form.cooldownMinutes) }; if (!payload.name || !payload.keywords.length || !payload.groupIds.length) { toast({ title: 'Preencha nome, palavras e ao menos um grupo.', variant: 'destructive' }); return; } const options = { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRulesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); toast({ title: initial ? 'Regra atualizada.' : 'Regra criada.', description: 'O radar já pode usar esta configuração.' }); onSaved(); }, onError: () => toast({ title: 'Não foi possível salvar a regra.', variant: 'destructive' }) }; initial ? update.mutate({ ruleId: initial.id, data: payload }, options) : create.mutate({ data: payload }, options); };
  const set = (key: keyof RuleForm, value: string | boolean | string[] | number) => setForm(prev => ({ ...prev, [key]: value }));
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#12383a]/45 p-0 sm:items-center sm:p-5"><div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-[#f8fffc] p-5 shadow-2xl sm:rounded-2xl sm:p-7"><div className="flex items-start justify-between"><div><div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#398a80]">{initial ? 'Editar regra' : 'Nova regra'}</div><h2 className="sw-display mt-1 text-2xl font-bold text-[#12383a]">{initial ? initial.name : 'Dê um nome ao seu sinal'}</h2></div><button className="rounded-lg p-2 text-[#71908b] hover:bg-[#e4f3ed]" onClick={onClose} aria-label="Fechar formulário" data-testid="button-close-rule-modal"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nome da regra"><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Expansão no interior" className="form-input" data-testid="input-rule-name" /></Field><Field label="Tipo de correspondência"><select value={form.matchType} onChange={e => set('matchType', e.target.value)} className="form-input" data-testid="select-rule-match-type"><option value="partial">Parcial — encontra variações</option><option value="exact">Exata — termo completo</option><option value="regex">Regex — padrão avançado</option></select></Field><Field label="Palavras-chave" hint="Separe por vírgulas"><input value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="licitação, cotação, fornecedor" className="form-input" data-testid="input-rule-keywords" /></Field><Field label="Palavras obrigatórias"><input value={form.requiredKeywords} onChange={e => set('requiredKeywords', e.target.value)} placeholder="opcional" className="form-input" data-testid="input-rule-required" /></Field><Field label="Excluir palavras"><input value={form.excludedKeywords} onChange={e => set('excludedKeywords', e.target.value)} placeholder="curso, vaga" className="form-input" data-testid="input-rule-excluded" /></Field><Field label="Cooldown (minutos)"><input type="number" min="0" value={form.cooldownMinutes} onChange={e => set('cooldownMinutes', Number(e.target.value))} className="form-input" data-testid="input-rule-cooldown" /></Field></div><div className="mt-5"><div className="mb-2 text-xs font-bold text-[#547773]">Grupos monitorados</div><div className="grid gap-2 sm:grid-cols-2">{groups.filter(g => g.status !== 'unavailable').map(g => <label key={g.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm ${form.groupIds.includes(g.id) ? 'border-[#79c8b4] bg-[#e4f6ee] text-[#1d7068]' : 'border-[#cfe3dd] text-[#637f7b]'}`}><input type="checkbox" checked={form.groupIds.includes(g.id)} onChange={e => set('groupIds', e.target.checked ? [...form.groupIds, g.id] : form.groupIds.filter(id => id !== g.id))} className="accent-[#116b68]" data-testid={`checkbox-rule-group-${g.id}`} /><span className="truncate font-semibold">{g.name}</span></label>)}</div></div><div className="mt-5 flex items-center gap-5"><Field label="Prioridade"><input type="range" min="0" max="100" value={form.priority} onChange={e => set('priority', Number(e.target.value))} className="accent-[#116b68]" data-testid="input-rule-priority" /></Field><div className="sw-mono text-sm font-bold text-[#226d66]">{form.priority}</div><label className="ml-auto flex items-center gap-2 text-sm font-semibold text-[#4d706b]"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="accent-[#116b68]" data-testid="checkbox-rule-active" /> Ativa agora</label></div><div className="mt-7 flex justify-end gap-2"><Button variant="secondary" onClick={onClose} data-testid="button-cancel-rule">Cancelar</Button><Button onClick={save} disabled={create.isPending || update.isPending} data-testid="button-save-rule">{create.isPending || update.isPending ? 'Salvando…' : initial ? 'Salvar alterações' : 'Criar regra'}</Button></div></div></div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <label className="block text-xs font-bold text-[#557772]"><span>{label} {hint && <em className="font-normal not-italic text-[#8aa39e]">· {hint}</em>}</span><div className="mt-1.5">{children}</div></label>; }

function RulesPage() {
  const query = useListRules({ query: { queryKey: getListRulesQueryKey() } }); const groupsQuery = useListGroups(undefined, { query: { queryKey: getListGroupsQueryKey() } });
  const groups = groupsQuery.data ?? fallbackGroups; const rules = query.data ?? fallbackRules; const [editing, setEditing] = useState<KeywordRule | null | undefined>(undefined); const [search, setSearch] = useState('');
  const del = useDeleteRule(); const update = useUpdateRule(); const qc = useQueryClient();
  const filtered = rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.keywords.join(' ').toLowerCase().includes(search.toLowerCase()));
  const toggle = (rule: KeywordRule) => update.mutate({ ruleId: rule.id, data: { name: rule.name, keywords: rule.keywords, requiredKeywords: rule.requiredKeywords ?? [], excludedKeywords: rule.excludedKeywords ?? [], groupIds: rule.groupIds, matchType: rule.matchType, active: !rule.active, priority: rule.priority, cooldownMinutes: rule.cooldownMinutes } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRulesQueryKey() }); toast({ title: rule.active ? 'Regra pausada.' : 'Regra ativada.' }); }, onError: () => toast({ title: 'Não foi possível atualizar a regra.', variant: 'destructive' }) });
  const remove = (rule: KeywordRule) => { if (!window.confirm(`Excluir a regra “${rule.name}”?`)) return; del.mutate({ ruleId: rule.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRulesQueryKey() }); toast({ title: 'Regra excluída.' }); }, onError: () => toast({ title: 'Não foi possível excluir a regra.', variant: 'destructive' }) }); };
  return <><PageHeader eyebrow="Lógica do radar" title="Regras" description="Diga ao SignalWatch o que merece virar sinal — e o que é só ruído." action={<Button onClick={() => setEditing(null)} data-testid="button-new-rule"><Plus size={16} /> Nova regra</Button>} /><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-3 text-[#819c97]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar regras" className="form-input pl-9" data-testid="input-search-rules" /></div><div className="text-xs font-semibold text-[#718e89]"><span className="sw-mono text-[#286f68]">{rules.filter(r => r.active).length}</span> ativas · <span className="sw-mono text-[#286f68]">{rules.reduce((sum, r) => sum + r.matchedCount, 0)}</span> correspondências</div></div>{query.isError && !query.data && <ErrorState onRetry={() => query.refetch()} />}{query.isLoading ? <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : filtered.length ? <div className="space-y-3">{filtered.map(rule => <div key={rule.id} className="sw-card sw-transition rounded-2xl p-5 hover:-translate-y-0.5" data-testid={`card-rule-${rule.id}`}><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><div className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${rule.active ? 'bg-[#ddf5eb] text-[#277d72]' : 'bg-[#e7efed] text-[#73908b]'}`}><Tag size={17} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#244b4b]">{rule.name}</h3>{rule.active ? <Pill tone="teal"><span className="h-1.5 w-1.5 rounded-full bg-current" /> Ativa</Pill> : <Pill tone="slate">Pausada</Pill>}</div><div className="mt-2 flex flex-wrap gap-1.5">{rule.keywords.map(k => <span key={k} className="rounded bg-[#eef7f3] px-2 py-1 font-mono text-[10px] text-[#397a72]">#{k}</span>)}</div><div className="mt-2 text-xs text-[#7b9792]">{rule.matchType === 'partial' ? 'Correspondência parcial' : rule.matchType === 'exact' ? 'Correspondência exata' : 'Expressão regular'} · {rule.groupIds.length} {rule.groupIds.length === 1 ? 'grupo' : 'grupos'} · prioridade {rule.priority}</div></div></div><div className="grid grid-cols-2 gap-5 border-t border-[#e1eee9] pt-3 md:border-l md:border-t-0 md:pl-6 md:pt-0"><div><div className="text-[10px] font-bold uppercase tracking-wider text-[#86a09b]">Encontrados</div><div className="sw-mono mt-1 text-lg font-bold text-[#246f68]">{rule.matchedCount}</div></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-[#86a09b]">Cooldown</div><div className="sw-mono mt-1 text-lg font-bold text-[#47726d]">{rule.cooldownMinutes}m</div></div></div><div className="flex items-center gap-1 md:ml-2"><button onClick={() => toggle(rule)} className="rounded-lg p-2 text-[#5b8981] hover:bg-[#e2f2ec]" aria-label={rule.active ? 'Pausar regra' : 'Ativar regra'} data-testid={`button-toggle-rule-${rule.id}`}>{rule.active ? <Pause size={17} /> : <Play size={17} />}</button><button onClick={() => setEditing(rule)} className="rounded-lg p-2 text-[#5b8981] hover:bg-[#e2f2ec]" aria-label="Editar regra" data-testid={`button-edit-rule-${rule.id}`}><Pencil size={17} /></button><button onClick={() => remove(rule)} className="rounded-lg p-2 text-[#b66a5e] hover:bg-[#fff0ed]" aria-label="Excluir regra" data-testid={`button-delete-rule-${rule.id}`}><Trash2 size={17} /></button></div></div></div>)}</div> : <EmptyState icon={SlidersHorizontal} title="Comece com uma regra clara" body="Uma boa regra transforma conversas dispersas em oportunidades que sua equipe consegue agir." action={<Button onClick={() => setEditing(null)} data-testid="button-empty-new-rule"><Plus size={16} /> Criar primeira regra</Button>} />}{editing !== undefined && <RuleModal initial={editing || undefined} groups={groups} onClose={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} />}</>;
}

function GroupsPage() {
  const query = useListGroups(undefined, { query: { queryKey: getListGroupsQueryKey() } }); const groups = query.data ?? fallbackGroups; const sync = useSyncGroups(); const update = useUpdateGroupMonitoring(); const qc = useQueryClient(); const [search, setSearch] = useState('');
  const filtered = groups.filter(g => `${g.name} ${g.username ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const syncNow = () => sync.mutate(undefined, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListGroupsQueryKey() }); toast({ title: 'Grupos atualizados.' }); }, onError: () => toast({ title: 'Não foi possível sincronizar grupos.', description: 'Verifique a conexão com o Telegram.', variant: 'destructive' }) });
  const toggle = (g: TelegramGroup) => update.mutate({ groupId: g.id, data: { monitored: !g.monitored } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListGroupsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); toast({ title: g.monitored ? 'Monitoramento pausado.' : 'Monitoramento iniciado.' }); }, onError: () => toast({ title: 'Não foi possível alterar o monitoramento.', variant: 'destructive' }) });
  return <><PageHeader eyebrow="Território monitorado" title="Grupos" description="Escolha onde o radar presta atenção. Grupos pausados continuam disponíveis para reativação." action={<Button variant="secondary" onClick={syncNow} disabled={sync.isPending} data-testid="button-sync-groups"><RefreshCw size={15} className={sync.isPending ? 'animate-spin' : ''} /> Sincronizar grupos</Button>} /><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-sm flex-1"><Search size={16} className="absolute left-3 top-3 text-[#819c97]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar grupo" className="form-input pl-9" data-testid="input-search-groups" /></div><div className="flex gap-2"><Pill tone="teal">{groups.filter(g => g.monitored).length} monitorados</Pill><Pill tone="slate">{groups.length} disponíveis</Pill></div></div>{query.isError && !query.data && <ErrorState onRetry={() => query.refetch()} />}{query.isLoading ? <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36" />)}</div> : <div className="grid gap-3 md:grid-cols-2">{filtered.map(g => <div key={g.id} className="sw-card sw-transition rounded-2xl p-5 hover:-translate-y-0.5" data-testid={`card-group-${g.id}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e1f3ed] text-[#277a70]"><MessageSquare size={18} /></div><div className="min-w-0"><h3 className="truncate font-bold text-[#244b4b]">{g.name}</h3><div className="mt-1 truncate font-mono text-[11px] text-[#77948f]">{g.username ? `@${g.username}` : 'grupo sem username'}</div></div></div>{g.status === 'unavailable' ? <Pill tone="amber">Indisponível</Pill> : g.monitored ? <Pill tone="teal"><span className="h-1.5 w-1.5 rounded-full bg-current" /> Monitorando</Pill> : <Pill tone="slate">Pausado</Pill>}</div><div className="mt-5 grid grid-cols-3 border-t border-[#e1eee9] pt-4 text-xs"><div><div className="text-[#8aa39e]">Mensagens</div><div className="sw-mono mt-1 font-bold text-[#3b6964]">{g.messageCount.toLocaleString('pt-BR')}</div></div><div><div className="text-[#8aa39e]">Regras</div><div className="sw-mono mt-1 font-bold text-[#3b6964]">{g.appliedRules ?? 0}</div></div><div><div className="text-[#8aa39e]">Último sinal</div><div className="mt-1 font-semibold text-[#3b6964]">{relativeDate(g.lastEventAt)}</div></div></div><button disabled={g.status === 'unavailable'} onClick={() => toggle(g)} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold ${g.monitored ? 'bg-[#e4f4ed] text-[#26756d] hover:bg-[#d7efe6]' : 'border border-[#c5dfd8] text-[#56807a] hover:bg-[#eef8f4]'} disabled:opacity-50`} data-testid={`button-toggle-group-${g.id}`}>{g.monitored ? <><Pause size={14} /> Pausar monitoramento</> : <><Play size={14} /> Monitorar grupo</>}</button></div>)}</div>}{!filtered.length && <EmptyState icon={UsersRound} title="Nenhum grupo encontrado" body="Sincronize sua conta autorizada para descobrir novos grupos." />}</>;
}

function ConnectionPage({ onboarding = false }: { onboarding?: boolean }) {
  const query = useGetConnectionStatus({ query: { queryKey: getGetConnectionStatusQueryKey() } });
  const connection = query.data ?? fallbackConnection;
  const qr = useCreateConnectionQr();
  const refresh = useRefreshConnection();
  const disconnect = useDisconnectTelegram();
  const qc = useQueryClient();
  const { getToken } = useAuth();

  // QR + SSE state
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const sseRef = useRef<EventSource | null>(null);

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [password2FA, setPassword2FA] = useState('');
  const [submitting2FA, setSubmitting2FA] = useState(false);
  const [error2FA, setError2FA] = useState('');

  // QR expiry countdown
  useEffect(() => {
    if (!qrExpiresAt) { setQrSecondsLeft(0); return; }
    const tick = () => setQrSecondsLeft(Math.max(0, Math.round((qrExpiresAt.getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [qrExpiresAt]);

  // Cleanup SSE on unmount
  useEffect(() => () => { sseRef.current?.close(); }, []);

  async function openSSE() {
    sseRef.current?.close();
    try {
      const token = await getToken();
      const authResp = await fetch(`${basePath}/api/connection/events/auth`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!authResp.ok) return;
      const { nonce } = await authResp.json() as { nonce: string };
      const es = new EventSource(`${basePath}/api/connection/events?nonce=${nonce}`);
      sseRef.current = es;
      es.onmessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data as string) as { type: string; dataUrl?: string; expiresAt?: string; accountLabel?: string; message?: string };
        if (data.type === 'ping') return;
        if (data.type === 'qr') {
          setQrData(data.dataUrl ?? null);
          setQrExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
          setQrError(null);
        }
        if (data.type === 'connected') {
          setQrData(null);
          setQrExpiresAt(null);
          setShow2FA(false);
          qc.invalidateQueries({ queryKey: getGetConnectionStatusQueryKey() });
          toast({ title: '✓ Telegram conectado!', description: data.accountLabel ?? 'Sua sessão está ativa.' });
          es.close();
          sseRef.current = null;
        }
        if (data.type === 'needs_2fa') {
          setShow2FA(true);
        }
        if (data.type === 'error') {
          setQrError(data.message ?? 'Erro durante a autorização.');
          setQrData(null);
        }
      };
      es.onerror = () => { /* connection closed or network error — silently close */ es.close(); };
    } catch { /* network error — ignore */ }
  }

  const startQr = () => {
    setQrError(null);
    openSSE();
    qr.mutate(undefined, {
      onSuccess: result => {
        if (result.qrData) { setQrData(result.qrData); setQrExpiresAt(result.expiresAt ? new Date(result.expiresAt as unknown as string) : null); }
        qc.invalidateQueries({ queryKey: getGetConnectionStatusQueryKey() });
      },
      onError: () => toast({ title: 'Telegram indisponível.', description: 'O conector ainda não pode iniciar uma autorização neste ambiente.', variant: 'destructive' }),
    });
  };

  const doRefresh = () => refresh.mutate(undefined, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetConnectionStatusQueryKey() }); toast({ title: 'Status atualizado.' }); },
    onError: () => toast({ title: 'Não foi possível atualizar a conexão.', variant: 'destructive' }),
  });

  const doDisconnect = () => disconnect.mutate(undefined, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetConnectionStatusQueryKey() }); toast({ title: 'Sessão desconectada.' }); },
    onError: () => toast({ title: 'Não foi possível desconectar.', variant: 'destructive' }),
  });

  const submit2FA = async () => {
    if (!password2FA.trim()) return;
    setSubmitting2FA(true);
    setError2FA('');
    try {
      const token = await getToken();
      const resp = await fetch(`${basePath}/api/connection/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: password2FA }),
      });
      if (!resp.ok) throw new Error('failed');
      setPassword2FA('');
      toast({ title: 'Senha enviada.', description: 'Aguardando confirmação do Telegram…' });
    } catch {
      setError2FA('Senha incorreta ou expirada. Tente novamente.');
    } finally {
      setSubmitting2FA(false);
    }
  };

  const unavailable = !connection.connectorAvailable || connection.status === 'unavailable';
  const showingQr = !!qrData && !unavailable && connection.status !== 'connected';

  return (
    <>
      {!onboarding && (
        <PageHeader
          eyebrow="Fonte dos sinais"
          title="Conexão Telegram"
          description="Uma sessão pessoal e protegida para ler os grupos que você escolheu. O SignalWatch nunca pede sua senha."
          action={<Button variant="secondary" onClick={doRefresh} disabled={refresh.isPending} data-testid="button-refresh-connection"><RefreshCw size={15} /> Atualizar status</Button>}
        />
      )}

      {/* 2FA modal */}
      {show2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12383a]/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0d0] text-[#9c6e1a]">
                <KeyRound size={20} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#6f8d88]">Verificação em duas etapas</div>
                <h2 className="sw-display text-xl font-bold text-[#12383a]">Insira sua senha do Telegram</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#5b7d78]">
              Sua conta tem verificação em duas etapas ativa. Insira a senha que você configurou no Telegram para continuar.
            </p>
            <div className="mt-5">
              <input
                type="password"
                value={password2FA}
                onChange={e => { setPassword2FA(e.target.value); setError2FA(''); }}
                onKeyDown={e => e.key === 'Enter' && submit2FA()}
                placeholder="Senha do Telegram"
                className="form-input w-full"
                autoFocus
                data-testid="input-2fa-password"
              />
              {error2FA && <p className="mt-2 text-xs font-medium text-[#de765f]">{error2FA}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShow2FA(false); setPassword2FA(''); setError2FA(''); }}
                className="flex-1 rounded-lg border border-[#c5dfd8] py-2.5 text-sm font-bold text-[#527b76] hover:bg-[#eef8f4]"
                data-testid="button-cancel-2fa"
              >Cancelar</button>
              <button
                onClick={submit2FA}
                disabled={submitting2FA || !password2FA.trim()}
                className="flex-1 rounded-lg bg-[#116b68] py-2.5 text-sm font-bold text-white hover:bg-[#0d5754] disabled:opacity-50"
                data-testid="button-submit-2fa"
              >{submitting2FA ? 'Enviando…' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${onboarding ? '' : 'xl:grid-cols-[.8fr_1.2fr]'}`}>
        {/* Left panel — session state */}
        <section className="sw-card rounded-2xl p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${unavailable ? 'bg-[#fff0d0] text-[#a4751c]' : connection.status === 'connected' ? 'bg-[#ddf5eb] text-[#267a70]' : 'bg-[#e1f1f2] text-[#397c86]'}`}>
              <Link2 size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#6f8d88]">Estado da sessão</div>
              <h2 className="sw-display text-2xl font-bold text-[#12383a]">
                {unavailable ? 'Conector indisponível' : connection.status === 'connected' ? 'Telegram conectado' : showingQr ? 'Aguardando escaneamento' : 'Aguardando autorização'}
              </h2>
            </div>
          </div>

          <div className="mt-7 rounded-xl bg-[#eef8f4] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#26766e]"><ShieldCheck size={17} /> Privacidade por desenho</div>
            <p className="mt-2 text-sm leading-6 text-[#5b7d78]">Sua sessão fica vinculada à sua conta. Nenhum grupo é monitorado até você escolher ativá-lo.</p>
          </div>

          {unavailable ? (
            <div className="mt-6 rounded-xl border border-[#eed9aa] bg-[#fffaed] p-4">
              <div className="flex items-center gap-2 font-bold text-[#916b24]"><CircleAlert size={17} /> Integração temporariamente indisponível</div>
              <p className="mt-2 text-sm leading-6 text-[#8e7746]">{connection.message ?? 'O conector do Telegram não está disponível. Tente novamente quando o serviço for habilitado.'}</p>
            </div>
          ) : connection.status === 'connected' ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[#cfe5dd] p-4">
                <div>
                  <div className="text-xs text-[#7d9994]">Conta autorizada</div>
                  <div className="mt-1 font-bold text-[#315c58]">{connection.accountLabel ?? 'Conta Telegram'}</div>
                </div>
                <Pill tone="teal"><Check size={12} /> Ativa</Pill>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f0f8f5] p-4">
                  <div className="text-xs text-[#809b96]">Última sincronização</div>
                  <div className="mt-1 text-sm font-bold text-[#3a6963]">{formatDay(connection.lastSyncAt)}</div>
                </div>
                <div className="rounded-xl bg-[#f0f8f5] p-4">
                  <div className="text-xs text-[#809b96]">Último evento</div>
                  <div className="mt-1 text-sm font-bold text-[#3a6963]">{formatDay(connection.lastEventAt)}</div>
                </div>
              </div>
              <Button variant="danger" onClick={doDisconnect} disabled={disconnect.isPending} data-testid="button-disconnect-telegram">
                <Unplug size={15} /> Desconectar sessão
              </Button>
            </div>
          ) : (
            <>
              {qrError && (
                <div className="mt-4 rounded-xl border border-[#eed9aa] bg-[#fffaed] p-3 text-sm text-[#8e7746]">
                  <span className="font-bold">Erro: </span>{qrError}
                </div>
              )}
              <Button
                onClick={startQr}
                disabled={qr.isPending}
                className="mt-6 w-full"
                data-testid="button-start-telegram-qr"
              >
                <QrCode size={17} /> {qr.isPending ? 'Preparando autorização…' : showingQr ? 'Gerar novo QR code' : 'Autorizar com QR code'}
              </Button>
            </>
          )}
        </section>

        {/* Right panel — QR code */}
        {!onboarding && (
          <section className="sw-card rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#6f8d88]">Autorização</div>
                <h2 className="sw-display mt-1 text-2xl font-bold text-[#12383a]">Conecte sem compartilhar senha</h2>
              </div>
              <div className="text-[#68a399]"><LockKeyhole size={22} /></div>
            </div>

            {showingQr ? (
              <div className="mt-7 flex flex-col items-center rounded-2xl border border-[#d4e9e2] bg-[#f7fffb] p-6 text-center">
                <img src={qrData!} alt="QR code Telegram" className="h-52 w-52 rounded-xl" />
                <div className="mt-3 flex items-center gap-2">
                  <Pill tone={qrSecondsLeft < 8 ? 'amber' : 'teal'}>
                    <Clock3 size={12} /> {qrSecondsLeft > 0 ? `Expira em ${qrSecondsLeft}s` : 'Renovando…'}
                  </Pill>
                </div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#62817c]">
                  Abra o Telegram no celular, vá em <strong>Configurações → Dispositivos</strong> e escaneie o código. O QR é renovado automaticamente.
                </p>
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-dashed border-[#bcdad1] bg-[#f4fbf8] p-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#dff4ea] text-[#378479]">
                  <QrCode size={26} />
                </div>
                <h3 className="sw-display mt-4 text-lg font-bold text-[#244f4c]">Nenhuma autorização em andamento</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#76938e]">
                  Clique em "Autorizar com QR code" para gerar um código. Ele é atualizado automaticamente em tempo real.
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[['1', 'Solicite', 'Gere uma autorização segura'], ['2', 'Escaneie', 'Use Dispositivos no Telegram'], ['3', 'Escolha', 'Ative os grupos certos']].map(([n, t, b]) => (
                <div key={n} className="flex gap-3">
                  <div className="sw-mono grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#d9f2e8] text-[11px] font-bold text-[#28766d]">{n}</div>
                  <div>
                    <div className="text-xs font-bold text-[#436b67]">{t}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-[#8ba39e]">{b}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function BillingPage() {
  const plansQuery = useListBillingPlans({ query: { queryKey: getListBillingPlansQueryKey() } }); const statusQuery = useGetBillingStatus({ query: { queryKey: getGetBillingStatusQueryKey() } }); const plans = plansQuery.data ?? fallbackPlans; const status = statusQuery.data; const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly'); const [selected, setSelected] = useState<string | null>(null); const checkout = useCreatePixCheckout(); const qc = useQueryClient();
  const startCheckout = (planId: string) => { setSelected(planId); checkout.mutate({ data: { planId, cycle } }, { onSuccess: result => { qc.invalidateQueries({ queryKey: getGetBillingStatusQueryKey() }); toast({ title: result.status === 'unavailable' ? 'Checkout indisponível.' : 'Checkout Pix criado.', description: result.message ?? 'Acompanhe o status nesta página.' }); }, onError: () => toast({ title: 'Não foi possível iniciar o Pix.', variant: 'destructive' }) }); };
  const current: BillingStatus | undefined = status;
  const checkoutState = current?.checkout;
  return <><PageHeader eyebrow="Plano da operação" title="Plano e cobrança" description="Mais cobertura para encontrar os sinais que pagam a conta — sem surpresas no cartão." action={<div className="flex items-center rounded-lg border border-[#c6dfd8] bg-[#f9fffc] p-1 text-xs font-bold"><button onClick={() => setCycle('monthly')} className={`rounded-md px-3 py-2 ${cycle === 'monthly' ? 'bg-[#d9f2e8] text-[#176e65]' : 'text-[#71908b]'}`} data-testid="button-cycle-monthly">Mensal</button><button onClick={() => setCycle('annual')} className={`rounded-md px-3 py-2 ${cycle === 'annual' ? 'bg-[#d9f2e8] text-[#176e65]' : 'text-[#71908b]'}`} data-testid="button-cycle-annual">Anual · 2 meses grátis</button></div>} />{current && <div className="mb-6 rounded-2xl border border-[#b9ded0] bg-[#ddf5eb] p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="text-[11px] font-bold uppercase tracking-[.13em] text-[#357d73]">Status atual</div><div className="mt-1 sw-display text-xl font-bold text-[#174f4b]">{current.plan.name} <span className="font-sans text-sm font-semibold text-[#518079]">· {current.state === 'awaiting_payment' ? 'pagamento pendente' : current.state === 'paid' || current.state === 'active' ? 'ativo' : current.state}</span></div></div><Pill tone={current.state === 'awaiting_payment' ? 'amber' : 'teal'}>{current.state === 'awaiting_payment' ? 'Aguardando Pix' : 'Em dia'}</Pill></div></div>}{checkoutState && <div className="mb-6 rounded-2xl border border-[#e6d2a6] bg-[#fff9eb] p-5"><div className="flex items-center gap-2 font-bold text-[#8d6822]"><Clock3 size={17} /> Pagamento Pix {checkoutState.status === 'pending' ? 'pendente' : checkoutState.status}</div><p className="mt-1 text-sm leading-6 text-[#92794b]">{checkoutState.message ?? 'O pagamento ainda não foi confirmado. Não feche esta página até finalizar.'}</p>{checkoutState.status === 'pending' && checkoutState.copyPaste && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input readOnly value={checkoutState.copyPaste} className="form-input flex-1 bg-[#fffdf7] font-mono text-xs" data-testid="input-pix-copy-paste" /><Button variant="secondary" onClick={() => navigator.clipboard?.writeText(checkoutState.copyPaste ?? '')} data-testid="button-copy-pix"><Copy size={15} /> Copiar código</Button></div>}</div>}<div className="grid gap-4 lg:grid-cols-3">{plans.map((plan, idx) => <div key={plan.id} className={`sw-card relative flex flex-col rounded-2xl p-6 ${idx === 1 ? 'border-2 border-[#59b89d] shadow-[0_16px_34px_rgba(31,117,99,.12)]' : ''}`} data-testid={`card-plan-${plan.id}`}>{idx === 1 && <div className="absolute -top-3 left-5 rounded-full bg-[#edbd54] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#31514d]">Mais escolhido</div>}<div className="text-[11px] font-bold uppercase tracking-[.15em] text-[#38877d]">{plan.name}</div><h2 className="sw-display mt-2 text-2xl font-bold text-[#12383a]">{plan.description}</h2><div className="mt-5"><span className="sw-display text-4xl font-bold tracking-[-.06em] text-[#12383a]">{money(cycle === 'monthly' ? plan.monthlyPriceCents : Math.round(plan.annualPriceCents / 12))}</span><span className="text-xs text-[#79948f]"> / mês</span></div><div className="mt-5 space-y-3 border-t border-[#e0eee9] pt-5 text-sm text-[#567772]">{(plan.features ?? []).map(feature => <div key={feature} className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#46a98f]" />{feature}</div>)}</div><Button onClick={() => startCheckout(plan.id)} disabled={checkout.isPending || plan.id === current?.plan.id} variant={idx === 1 ? 'primary' : 'secondary'} className="mt-7 w-full" data-testid={`button-select-plan-${plan.id}`}>{plan.id === current?.plan.id ? 'Plano atual' : selected === plan.id && checkout.isPending ? 'Gerando Pix…' : 'Escolher plano'}</Button></div>)}</div><div className="mt-6 text-center text-xs text-[#78928e]">Pagamento processado por Mercado Pago. O plano só muda após confirmação do webhook.</div></>;
}

function SettingsPage() {
  const query = useGetPreferences({ query: { queryKey: getGetPreferencesQueryKey() } }); const initial: UserPreference = query.data ?? { language: 'pt-BR', theme: 'light', timezone: 'America/Sao_Paulo', dateFormat: 'dd/MM/yyyy', timeFormat: '24h', inAppNotifications: true }; const [form, setForm] = useState<UserPreference>(initial); const [dirty, setDirty] = useState(false); const update = useUpdatePreferences(); const qc = useQueryClient();
  const set = <K extends keyof UserPreference>(key: K, value: UserPreference[K]) => { setForm(prev => ({ ...prev, [key]: value })); setDirty(true); };
  const save = () => update.mutate({ data: form }, { onSuccess: result => { setForm(result); setDirty(false); qc.invalidateQueries({ queryKey: getGetPreferencesQueryKey() }); toast({ title: 'Preferências salvas.' }); }, onError: () => toast({ title: 'Não foi possível salvar preferências.', variant: 'destructive' }) });
  return <><PageHeader eyebrow="Seu espaço de trabalho" title="Preferências" description="Ajuste o SignalWatch ao jeito que sua operação acompanha o mercado." action={<Button onClick={save} disabled={!dirty || update.isPending} data-testid="button-save-preferences">{update.isPending ? 'Salvando…' : 'Salvar alterações'}</Button>} /><div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><section className="sw-card rounded-2xl p-6 lg:p-8"><div className="flex items-center gap-3 border-b border-[#e0eee9] pb-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e1f3ed] text-[#2d7d73]"><Globe2 size={19} /></div><div><h2 className="sw-display text-xl font-bold text-[#12383a]">Idioma e região</h2><p className="mt-1 text-xs text-[#75918c]">Como datas e rótulos aparecem na sua conta.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Idioma"><select value={form.language} onChange={e => set('language', e.target.value as UserPreference['language'])} className="form-input" data-testid="select-language"><option value="pt-BR">Português (Brasil)</option><option value="en">English</option></select></Field><Field label="Fuso horário"><select value={form.timezone} onChange={e => set('timezone', e.target.value)} className="form-input" data-testid="select-timezone"><option value="America/Sao_Paulo">Brasília (GMT−3)</option><option value="America/Manaus">Manaus (GMT−4)</option><option value="America/Belem">Belém (GMT−3)</option></select></Field><Field label="Formato de data"><select value={form.dateFormat} onChange={e => set('dateFormat', e.target.value)} className="form-input" data-testid="select-date-format"><option value="dd/MM/yyyy">18/02/2025</option><option value="MM/dd/yyyy">02/18/2025</option></select></Field><Field label="Formato de hora"><select value={form.timeFormat} onChange={e => set('timeFormat', e.target.value)} className="form-input" data-testid="select-time-format"><option value="24h">24 horas · 14:30</option><option value="12h">12 horas · 2:30 PM</option></select></Field></div><div className="mt-9 flex items-center gap-3 border-t border-[#e0eee9] pt-6"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0d0] text-[#a3751d]"><Sparkles size={18} /></div><div className="flex-1"><div className="text-sm font-bold text-[#355d59]">Notificações no app</div><div className="mt-1 text-xs text-[#78938e]">Mostre avisos quando uma regra encontrar um sinal.</div></div><button onClick={() => set('inAppNotifications', !form.inAppNotifications)} className={`relative h-6 w-11 rounded-full ${form.inAppNotifications ? 'bg-[#2d9a84]' : 'bg-[#b9d2cb]'}`} aria-label="Alternar notificações" data-testid="button-toggle-notifications"><span className={`absolute top-1 h-4 w-4 rounded-full bg-[#f8fffc] shadow-sm transition-transform ${form.inAppNotifications ? 'translate-x-6' : 'translate-x-1'}`} /></button></div></section><aside className="space-y-5"><section className="sw-card rounded-2xl p-6"><div className="flex items-center gap-2 text-[#2d7c73]"><KeyRound size={17} /><h2 className="font-bold">Conta e segurança</h2></div><div className="mt-5 divide-y divide-[#e1eee9] text-sm"><button className="flex w-full items-center justify-between py-3 text-left font-semibold text-[#4d706b] hover:text-[#1c6d66]" data-testid="button-manage-account">Gerenciar conta <ArrowRight size={15} /></button><button className="flex w-full items-center justify-between py-3 text-left font-semibold text-[#4d706b] hover:text-[#1c6d66]" data-testid="button-change-password">Alterar senha <ArrowRight size={15} /></button><button className="flex w-full items-center justify-between py-3 text-left font-semibold text-[#a75c51] hover:text-[#843f35]" data-testid="button-delete-account">Solicitar exclusão <ArrowRight size={15} /></button></div></section><section className="rounded-2xl bg-[#12383a] p-6 text-[#d9f1eb]"><div className="flex items-center gap-2 text-[#80e0c0]"><ShieldCheck size={17} /><span className="text-xs font-bold uppercase tracking-[.14em]">Dados sob controle</span></div><p className="mt-4 text-sm leading-6 text-[#a8cbc1]">Você decide quais grupos entram no radar. A qualquer momento, desconecte sua sessão e remova o histórico.</p><Link href="/privacy" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#80e0c0] hover:text-white" data-testid="link-privacy-settings">Ler política de privacidade <ArrowRight size={14} /></Link></section></aside></div></>;
}

function OnboardingPage() {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const TOTAL_STEPS = 3;

  async function saveName() {
    if (!firstName.trim()) { setNameError('Informe pelo menos o primeiro nome.'); return; }
    setSaving(true);
    setNameError('');
    try {
      const token = await user?.getToken();
    const resp = await fetch(`${basePath}/api/profile/name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
    });
    if (!resp.ok) throw new Error('failed');
    await user?.reload();
    setStep(2);
    } catch {
      setNameError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sw-noise min-h-[100dvh] bg-[#edf7f3]">
      <header className="flex items-center justify-between px-5 py-6 lg:px-12">
        <Logo />
        <Link href="/app" className="text-sm font-bold text-[#5d817c] hover:text-[#176d66]" data-testid="link-exit-onboarding">Pular configuração</Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-8 lg:pt-14">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(n => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${step > n ? 'bg-[#116b68] text-white' : step === n ? 'bg-[#116b68] text-white' : 'bg-[#dcebe6] text-[#78958f]'}`}>
                {step > n ? <Check size={15} /> : n}
              </div>
              {n < TOTAL_STEPS && <div className={`h-0.5 flex-1 ${step > n ? 'bg-[#6abca1]' : 'bg-[#dcebe6]'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="mx-auto mt-14 max-w-xl">
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-[.17em] text-[#398a80]">Configure sua conta · 01</div>
              <h1 className="sw-display mt-3 text-4xl font-bold tracking-[-.05em] text-[#12383a] lg:text-5xl">Como quer ser chamado?</h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#64817d]">Seu nome aparecerá no painel e nos alertas. Você pode alterar depois nas configurações.</p>
            </div>
            <div className="sw-card mt-9 rounded-2xl p-7 lg:p-10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3d6662]">Primeiro nome <span className="text-[#de765f]">*</span></label>
                  <input
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); setNameError(''); }}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    placeholder="Ex: João"
                    className="form-input w-full"
                    autoFocus
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3d6662]">Sobrenome <span className="text-[#9fb8b3] font-normal">(opcional)</span></label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    placeholder="Ex: Silva"
                    className="form-input w-full"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              {nameError && <p className="mt-3 text-xs font-medium text-[#de765f]">{nameError}</p>}
              <button
                onClick={saveName}
                disabled={saving || !firstName.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#116b68] px-5 py-3 text-sm font-bold text-white hover:bg-[#0d5754] disabled:opacity-50"
                data-testid="button-save-name"
              >
                {saving ? 'Salvando…' : <>Continuar <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto mt-14 max-w-2xl">
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-[.17em] text-[#398a80]">Configure sua conta · 02</div>
              <h1 className="sw-display mt-3 text-4xl font-bold tracking-[-.05em] text-[#12383a] lg:text-5xl">Conecte seu Telegram.</h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#64817d]">Uma sessão pessoal permite que o radar acompanhe seus grupos. Você autoriza pelo próprio Telegram, sem compartilhar senha.</p>
            </div>
            <div className="sw-card mt-9 rounded-2xl p-7 lg:p-10">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#dff5eb] text-[#2d8377]">
                  <QrCode size={38} />
                </div>
                <p className="mt-5 text-sm leading-6 text-[#5d817c]">Você pode conectar agora na página de <strong>Conexão</strong> depois de entrar no app. O radar começa a funcionar assim que autorizar.</p>
                <button onClick={() => setStep(3)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#116b68] px-5 py-3 text-sm font-bold text-white hover:bg-[#0d5754]" data-testid="button-onboarding-skip-telegram">
                  Entendido, entrar no app <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sw-fade-up mx-auto mt-16 max-w-xl text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#d9f4e9] text-[#267b70]">
              <CheckCircle2 size={31} />
            </div>
            <h1 className="sw-display mt-6 text-4xl font-bold tracking-[-.04em] text-[#12383a]">Tudo pronto{firstName ? `, ${firstName}` : ''}.</h1>
            <p className="mt-4 text-base leading-7 text-[#64817d]">Seu radar está configurado. Conecte o Telegram e crie regras para começar a receber sinais.</p>
            <Link href="/app/connection" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#116b68] px-5 py-3 text-sm font-bold text-white hover:bg-[#0d5754]" data-testid="link-finish-onboarding">
              Conectar Telegram <ArrowRight size={16} />
            </Link>
            <div className="mt-4">
              <Link href="/app" className="text-sm font-bold text-[#5d817c] hover:text-[#176d66]" data-testid="link-skip-to-dashboard">
                Ir direto para o painel
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



function LegalPage({ privacy = false }: { privacy?: boolean }) {
  return <div className="min-h-[100dvh] bg-[#edf7f3] text-[#234a49]"><header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6"><Logo /><Link href="/" className="text-sm font-bold text-[#477772]" data-testid="link-legal-home">Voltar para início</Link></header><main className="mx-auto max-w-3xl px-5 pb-20 pt-10"><div className="text-[11px] font-bold uppercase tracking-[.17em] text-[#398a80]">SignalWatch · documento legal</div><h1 className="sw-display mt-3 text-5xl font-bold tracking-[-.05em] text-[#12383a]">{privacy ? 'Política de privacidade' : 'Termos de uso'}</h1><p className="mt-4 text-sm text-[#78938e]">Última atualização: 18 de fevereiro de 2025</p><div className="prose prose-sm mt-12 max-w-none prose-headings:font-[var(--app-font-serif)] prose-headings:text-[#12383a] prose-p:leading-7 prose-p:text-[#5d7d78] prose-li:text-[#5d7d78]"><h2>1. Escopo</h2><p>{privacy ? 'Esta política explica quais dados o SignalWatch trata para entregar alertas de oportunidades comerciais e como você pode controlar esse tratamento.' : 'Estes termos regulam o uso do SignalWatch, uma ferramenta para monitoramento configurável de grupos do Telegram e organização de alertas comerciais.'}</p><h2>2. Uso responsável</h2><p>Você é responsável por usar o serviço de acordo com as regras do Telegram, com a legislação aplicável e com as permissões necessárias para os grupos que escolher monitorar.</p><h2>3. Integrações e estados</h2><p>Integrações de terceiros podem estar indisponíveis, pendentes ou sujeitas a confirmação externa. O SignalWatch informa esses estados sem presumir que uma autorização ou pagamento foi concluído.</p><h2>4. Dados e controle</h2><p>{privacy ? 'Tratamos dados de conta, preferências, grupos selecionados e mensagens necessárias para encontrar correspondências às suas regras. Você pode desconectar a sessão, alterar preferências e solicitar exclusão.' : 'Você mantém controle sobre suas regras, grupos e sessão. Recursos e limites podem variar conforme o plano contratado.'}</p><h2>5. Contato</h2><p>Para dúvidas sobre estes documentos ou sobre sua conta, use o canal de suporte indicado dentro do produto.</p></div></main></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== uid) {
        qc.clear();
      }
      prevUserIdRef.current = uid;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

function SignInPage() {
  return (
    <div className="sw-noise flex min-h-[100dvh] items-center justify-center bg-[#12383a] px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="sw-noise flex min-h-[100dvh] items-center justify-center bg-[#12383a] px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in"><WouterRedirect to="/app" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [location] = useLocation();
  const needsOnboarding = isLoaded && user && !user.firstName && !location.startsWith('/onboarding');
  return (
    <>
      <Show when="signed-in">
        {needsOnboarding ? <WouterRedirect to="/onboarding" /> : children}
      </Show>
      <Show when="signed-out"><WouterRedirect to="/sign-in" /></Show>
    </>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/app" component={() => <ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
        <Route path="/app/alerts" component={() => <ProtectedRoute><AppShell><AlertsPage /></AppShell></ProtectedRoute>} />
        <Route path="/app/rules" component={() => <ProtectedRoute><AppShell><RulesPage /></AppShell></ProtectedRoute>} />
        <Route path="/app/groups" component={() => <ProtectedRoute><AppShell><GroupsPage /></AppShell></ProtectedRoute>} />
        <Route path="/app/connection" component={() => <ProtectedRoute><AppShell><ConnectionPage /></AppShell></ProtectedRoute>} />
        <Route path="/app/billing" component={() => <ProtectedRoute><AppShell><BillingPage /></AppShell></ProtectedRoute>} />
        <Route path="/app/settings" component={() => <ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
        <Route path="/terms" component={() => <LegalPage />} />
        <Route path="/privacy" component={() => <LegalPage privacy />} />
        <Route component={HomeRoute} />
      </Switch>
    </ErrorBoundary>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Bem-vindo de volta.', subtitle: 'Entre para ver os sinais que pedem sua atenção.' } },
        signUp: { start: { title: 'Crie seu radar.', subtitle: 'Configure em minutos. Ajuste quando seu contexto mudar.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;