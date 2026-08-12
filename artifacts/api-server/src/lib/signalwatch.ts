import { and, eq } from "drizzle-orm";
import {
  db,
  signalwatchConnectionsTable,
  signalwatchProfilesTable,
  type SignalwatchConnection,
  type SignalwatchProfile,
} from "@workspace/db";

export const BILLING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Para começar a encontrar oportunidades sem acompanhar tudo manualmente.",
    monthlyPriceCents: 5900,
    annualPriceCents: 59000,
    groupsLimit: 3,
    keywordsLimit: 25,
    destinationsLimit: 1,
    historyDays: 7,
    features: ["Até 3 grupos", "25 palavras-chave", "Alertas no SaaS", "Histórico de 7 dias"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Para operações que dependem dos alertas todos os dias.",
    monthlyPriceCents: 12900,
    annualPriceCents: 129000,
    groupsLimit: 15,
    keywordsLimit: 150,
    destinationsLimit: 1,
    historyDays: 90,
    features: ["Até 15 grupos", "150 palavras-chave", "Regras avançadas", "Histórico de 90 dias"],
  },
  {
    id: "business",
    name: "Business",
    description: "Para equipes e operações com maior volume de monitoramento.",
    monthlyPriceCents: 29900,
    annualPriceCents: 299000,
    groupsLimit: 50,
    keywordsLimit: 500,
    destinationsLimit: 1,
    historyDays: 365,
    features: ["Até 50 grupos", "500 palavras-chave", "Auditoria", "Histórico de 1 ano"],
  },
] as const;

export type BillingPlan = (typeof BILLING_PLANS)[number];

export function getBillingPlan(planId: string): BillingPlan {
  return BILLING_PLANS.find((plan) => plan.id === planId) ?? BILLING_PLANS[0];
}

export function telegramConnectorAvailable(): boolean {
  return Boolean(process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH);
}

export async function ensureWorkspace(userId: string): Promise<{
  profile: SignalwatchProfile;
  connection: SignalwatchConnection;
}> {
  let [profile] = await db
    .select()
    .from(signalwatchProfilesTable)
    .where(eq(signalwatchProfilesTable.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    [profile] = await db
      .insert(signalwatchProfilesTable)
      .values({ clerkUserId: userId })
      .returning();
  }

  let [connection] = await db
    .select()
    .from(signalwatchConnectionsTable)
    .where(eq(signalwatchConnectionsTable.clerkUserId, userId))
    .limit(1);

  if (!connection) {
    [connection] = await db
      .insert(signalwatchConnectionsTable)
      .values({
        clerkUserId: userId,
        connectorAvailable: telegramConnectorAvailable(),
      })
      .returning();
  }

  return { profile, connection };
}

export function connectionDto(connection: SignalwatchConnection) {
  const connectorAvailable = telegramConnectorAvailable();
  const unavailable = !connectorAvailable && connection.status !== "connected";

  return {
    status: unavailable ? "unavailable" : connection.status,
    accountLabel: connection.accountLabel,
    authorizedAt: connection.authorizedAt,
    lastSyncAt: connection.lastSyncAt,
    lastEventAt: connection.lastEventAt,
    availableGroups: connection.availableGroups,
    monitoringEnabled: connection.monitoringEnabled,
    connectorAvailable,
    message:
      unavailable
        ? "A conexão do Telegram ainda não foi configurada pelo responsável da plataforma."
        : connection.message,
  };
}