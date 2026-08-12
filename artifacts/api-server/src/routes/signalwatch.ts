import { and, desc, eq, gte, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { createClerkClient } from "@clerk/express";
import {
  ArchiveAlertBody,
  ArchiveAlertParams,
  ArchiveAlertResponse,
  CreateConnectionQrResponse,
  CreatePixCheckoutBody,
  CreatePixCheckoutResponse,
  CreateRuleBody,
  CreateRuleResponse,
  DeleteRuleParams,
  DisconnectTelegramResponse,
  FavoriteAlertBody,
  FavoriteAlertParams,
  FavoriteAlertResponse,
  GetBillingStatusResponse,
  GetConnectionStatusResponse,
  GetDashboardSummaryResponse,
  GetPreferencesResponse,
  ListAlertsQueryParams,
  ListAlertsResponse,
  ListBillingPlansResponse,
  ListGroupsQueryParams,
  ListGroupsResponse,
  ListRulesResponse,
  MarkAlertReadBody,
  MarkAlertReadParams,
  MarkAlertReadResponse,
  ReceivePaymentWebhookBody,
  ReceivePaymentWebhookResponse,
  RefreshConnectionResponse,
  SyncGroupsResponse,
  UpdateGroupMonitoringBody,
  UpdateGroupMonitoringParams,
  UpdateGroupMonitoringResponse,
  UpdatePreferencesBody,
  UpdatePreferencesResponse,
  UpdateRuleParams,
  UpdateRuleResponse,
} from "@workspace/api-zod";
import {
  db,
  signalwatchAlertsTable,
  signalwatchCheckoutsTable,
  signalwatchConnectionsTable,
  signalwatchGroupsTable,
  signalwatchProfilesTable,
  signalwatchRulesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  BILLING_PLANS,
  connectionDto,
  ensureWorkspace,
  getBillingPlan,
  telegramConnectorAvailable,
} from "../lib/signalwatch";

const router: IRouter = Router();

function userId(req: Express.Request): string {
  if (!req.userId) {
    throw new Error("Authenticated user is missing");
  }
  return req.userId;
}

function alertDto(alert: typeof signalwatchAlertsTable.$inferSelect) {
  return {
    id: alert.id,
    groupId: alert.groupId,
    groupName: alert.groupName,
    ruleId: alert.ruleId,
    ruleName: alert.ruleName,
    message: alert.message,
    author: alert.author,
    matchedKeywords: alert.matchedKeywords,
    receivedAt: alert.receivedAt,
    status: alert.status,
    favorite: alert.favorite,
    messageLink: alert.messageLink,
    deliveryStatus: alert.deliveryStatus,
  };
}

function groupDto(group: typeof signalwatchGroupsTable.$inferSelect) {
  return {
    id: group.id,
    name: group.name,
    username: group.username,
    status: group.status,
    monitored: group.monitored,
    messageCount: group.messageCount,
    lastEventAt: group.lastEventAt,
    appliedRules: group.appliedRules,
  };
}

function ruleDto(rule: typeof signalwatchRulesTable.$inferSelect) {
  return {
    id: rule.id,
    name: rule.name,
    keywords: rule.keywords,
    requiredKeywords: rule.requiredKeywords,
    excludedKeywords: rule.excludedKeywords,
    groupIds: rule.groupIds,
    matchType: rule.matchType,
    active: rule.active,
    priority: rule.priority,
    cooldownMinutes: rule.cooldownMinutes,
    matchedCount: rule.matchedCount,
    createdAt: rule.createdAt,
  };
}

function planDto(plan: (typeof BILLING_PLANS)[number]) {
  return { ...plan };
}

router.post("/billing/webhook", async (req, res): Promise<void> => {
  const parsed = ReceivePaymentWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    res.status(503).json({ received: false });
    return;
  }

  const paymentId =
    typeof parsed.data.data === "object" &&
    parsed.data.data !== null &&
    "id" in parsed.data.data
      ? String((parsed.data.data as { id: unknown }).id)
      : typeof parsed.data.id === "string"
        ? parsed.data.id
        : null;

  if (paymentId) {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      },
    );

    if (response.ok) {
      const payment = (await response.json()) as {
        id?: number;
        status?: string;
        external_reference?: string;
      };
      if (payment.external_reference && payment.status) {
        const nextStatus =
          payment.status === "approved"
            ? "paid"
            : payment.status === "rejected"
              ? "rejected"
              : payment.status === "cancelled"
                ? "expired"
                : "pending";
        await db
          .update(signalwatchCheckoutsTable)
          .set({ status: nextStatus, mercadoPagoPaymentId: String(payment.id ?? paymentId) })
          .where(eq(signalwatchCheckoutsTable.id, payment.external_reference));
        await db
          .update(signalwatchProfilesTable)
          .set({ billingState: nextStatus === "paid" ? "active" : "awaiting_payment" })
          .where(
            eq(
              signalwatchProfilesTable.clerkUserId,
              payment.external_reference.split(":")[0] ?? "",
            ),
          );
      }
    }
  }

  res.json(ReceivePaymentWebhookResponse.parse({ received: true }));
});

router.use(requireAuth);

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const currentUserId = userId(req);
  const { profile, connection } = await ensureWorkspace(currentUserId);
  const allAlerts = await db
    .select()
    .from(signalwatchAlertsTable)
    .where(eq(signalwatchAlertsTable.clerkUserId, currentUserId))
    .orderBy(desc(signalwatchAlertsTable.receivedAt));
  const rules = await db
    .select()
    .from(signalwatchRulesTable)
    .where(eq(signalwatchRulesTable.clerkUserId, currentUserId));
  const groups = await db
    .select()
    .from(signalwatchGroupsTable)
    .where(
      and(
        eq(signalwatchGroupsTable.clerkUserId, currentUserId),
        eq(signalwatchGroupsTable.monitored, true),
      ),
    );
  const plan = getBillingPlan(profile.planId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const summary = {
    alertsToday: allAlerts.filter((alert) => alert.receivedAt >= today).length,
    unreadAlerts: allAlerts.filter((alert) => alert.status === "unread").length,
    activeRules: rules.filter((rule) => rule.active).length,
    monitoredGroups: groups.length,
    connection: connectionDto(connection),
    planUsage: {
      planName: plan.name,
      groupsUsed: groups.length,
      groupsLimit: plan.groupsLimit,
      keywordsUsed: rules.reduce((total, rule) => total + rule.keywords.length, 0),
      keywordsLimit: plan.keywordsLimit,
      historyDays: plan.historyDays,
    },
    recentAlerts: allAlerts.slice(0, 5).map(alertDto),
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/alerts", async (req, res): Promise<void> => {
  const currentUserId = userId(req);
  const query = ListAlertsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(signalwatchAlertsTable.clerkUserId, currentUserId)];
  const { search, groupId, ruleId, status, period, limit } = query.data;
  if (search) {
    conditions.push(
      or(
        ilike(signalwatchAlertsTable.message, `%${search}%`),
        ilike(signalwatchAlertsTable.groupName, `%${search}%`),
        ilike(signalwatchAlertsTable.ruleName, `%${search}%`),
      )!,
    );
  }
  if (groupId) conditions.push(eq(signalwatchAlertsTable.groupId, groupId));
  if (ruleId) conditions.push(eq(signalwatchAlertsTable.ruleId, ruleId));
  if (status === "favorite") conditions.push(eq(signalwatchAlertsTable.favorite, true));
  if (status === "unread" || status === "read" || status === "archived") {
    conditions.push(eq(signalwatchAlertsTable.status, status));
  }
  if (period !== "all") {
    const since = new Date();
    if (period === "today") since.setHours(0, 0, 0, 0);
    if (period === "7d") since.setDate(since.getDate() - 7);
    if (period === "30d") since.setDate(since.getDate() - 30);
    conditions.push(gte(signalwatchAlertsTable.receivedAt, since));
  }

  const alerts = await db
    .select()
    .from(signalwatchAlertsTable)
    .where(and(...conditions))
    .orderBy(desc(signalwatchAlertsTable.receivedAt))
    .limit(limit);
  res.json(ListAlertsResponse.parse(alerts.map(alertDto)));
});

router.patch("/alerts/:alertId/read", async (req, res): Promise<void> => {
  const params = MarkAlertReadParams.safeParse(req.params);
  const body = MarkAlertReadBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.success ? body.error?.message : params.error?.message) ?? "Validation error" });
    return;
  }
  const [alert] = await db
    .update(signalwatchAlertsTable)
    .set({ status: body.data.read ? "read" : "unread" })
    .where(
      and(
        eq(signalwatchAlertsTable.id, params.data.alertId),
        eq(signalwatchAlertsTable.clerkUserId, userId(req)),
      ),
    )
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(MarkAlertReadResponse.parse(alertDto(alert)));
});

router.patch("/alerts/:alertId/archive", async (req, res): Promise<void> => {
  const params = ArchiveAlertParams.safeParse(req.params);
  const body = ArchiveAlertBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.success ? body.error?.message : params.error?.message) ?? "Validation error" });
    return;
  }
  const [alert] = await db
    .update(signalwatchAlertsTable)
    .set({ status: body.data.archived ? "archived" : "read" })
    .where(
      and(
        eq(signalwatchAlertsTable.id, params.data.alertId),
        eq(signalwatchAlertsTable.clerkUserId, userId(req)),
      ),
    )
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(ArchiveAlertResponse.parse(alertDto(alert)));
});

router.patch("/alerts/:alertId/favorite", async (req, res): Promise<void> => {
  const params = FavoriteAlertParams.safeParse(req.params);
  const body = FavoriteAlertBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.success ? body.error?.message : params.error?.message) ?? "Validation error" });
    return;
  }
  const [alert] = await db
    .update(signalwatchAlertsTable)
    .set({ favorite: body.data.favorite })
    .where(
      and(
        eq(signalwatchAlertsTable.id, params.data.alertId),
        eq(signalwatchAlertsTable.clerkUserId, userId(req)),
      ),
    )
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(FavoriteAlertResponse.parse(alertDto(alert)));
});

router.get("/groups", async (req, res): Promise<void> => {
  const query = ListGroupsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const currentUserId = userId(req);
  await ensureWorkspace(currentUserId);
  const conditions = [eq(signalwatchGroupsTable.clerkUserId, currentUserId)];
  if (query.data.search) {
    conditions.push(ilike(signalwatchGroupsTable.name, `%${query.data.search}%`));
  }
  if (query.data.status !== "all") {
    conditions.push(eq(signalwatchGroupsTable.status, query.data.status));
  }
  const groups = await db.select().from(signalwatchGroupsTable).where(and(...conditions));
  res.json(ListGroupsResponse.parse(groups.map(groupDto)));
});

router.patch("/groups/:groupId/monitoring", async (req, res): Promise<void> => {
  const params = UpdateGroupMonitoringParams.safeParse(req.params);
  const body = UpdateGroupMonitoringBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.success ? body.error?.message : params.error?.message) ?? "Validation error" });
    return;
  }
  const [group] = await db
    .update(signalwatchGroupsTable)
    .set({ monitored: body.data.monitored, status: body.data.monitored ? "active" : "paused" })
    .where(
      and(
        eq(signalwatchGroupsTable.id, params.data.groupId),
        eq(signalwatchGroupsTable.clerkUserId, userId(req)),
      ),
    )
    .returning();
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.json(UpdateGroupMonitoringResponse.parse(groupDto(group)));
});

router.post("/groups/sync", async (req, res): Promise<void> => {
  await ensureWorkspace(userId(req));
  const groups = await db
    .select()
    .from(signalwatchGroupsTable)
    .where(eq(signalwatchGroupsTable.clerkUserId, userId(req)));
  res.json(SyncGroupsResponse.parse(groups.map(groupDto)));
});

router.get("/rules", async (req, res): Promise<void> => {
  await ensureWorkspace(userId(req));
  const rules = await db
    .select()
    .from(signalwatchRulesTable)
    .where(eq(signalwatchRulesTable.clerkUserId, userId(req)))
    .orderBy(desc(signalwatchRulesTable.createdAt));
  res.json(ListRulesResponse.parse(rules.map(ruleDto)));
});

router.post("/rules", async (req, res): Promise<void> => {
  const body = CreateRuleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [rule] = await db
    .insert(signalwatchRulesTable)
    .values({
      clerkUserId: userId(req),
      ...body.data,
      requiredKeywords: body.data.requiredKeywords ?? [],
      excludedKeywords: body.data.excludedKeywords ?? [],
    })
    .returning();
  res.status(201).json(CreateRuleResponse.parse(ruleDto(rule)));
});

router.patch("/rules/:ruleId", async (req, res): Promise<void> => {
  const params = UpdateRuleParams.safeParse(req.params);
  const body = CreateRuleBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: (params.success ? body.error?.message : params.error?.message) ?? "Validation error" });
    return;
  }
  const [rule] = await db
    .update(signalwatchRulesTable)
    .set({
      ...body.data,
      requiredKeywords: body.data.requiredKeywords ?? [],
      excludedKeywords: body.data.excludedKeywords ?? [],
    })
    .where(
      and(
        eq(signalwatchRulesTable.id, params.data.ruleId),
        eq(signalwatchRulesTable.clerkUserId, userId(req)),
      ),
    )
    .returning();
  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }
  res.json(UpdateRuleResponse.parse(ruleDto(rule)));
});

router.delete("/rules/:ruleId", async (req, res): Promise<void> => {
  const params = DeleteRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [rule] = await db
    .delete(signalwatchRulesTable)
    .where(
      and(
        eq(signalwatchRulesTable.id, params.data.ruleId),
        eq(signalwatchRulesTable.clerkUserId, userId(req)),
      ),
    )
    .returning();
  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/connection/status", async (req, res): Promise<void> => {
  const { connection } = await ensureWorkspace(userId(req));
  res.json(GetConnectionStatusResponse.parse(connectionDto(connection)));
});

router.post("/connection/qr", async (req, res): Promise<void> => {
  const { connection } = await ensureWorkspace(userId(req));
  if (!telegramConnectorAvailable()) {
    res.json(
      CreateConnectionQrResponse.parse({
        status: "unavailable",
        qrData: null,
        expiresAt: null,
        message: "A conexão Telegram ainda não está configurada.",
      }),
    );
    return;
  }
  res.json(
    CreateConnectionQrResponse.parse({
      status: "unavailable",
      qrData: null,
      expiresAt: null,
      message: "O conector Telegram precisa ser habilitado pelo responsável da plataforma.",
    }),
  );
});

router.post("/connection/sync", async (req, res): Promise<void> => {
  const { connection } = await ensureWorkspace(userId(req));
  res.json(RefreshConnectionResponse.parse(connectionDto(connection)));
});

router.post("/connection/disconnect", async (req, res): Promise<void> => {
  const [connection] = await db
    .update(signalwatchConnectionsTable)
    .set({
      status: "disconnected",
      monitoringEnabled: false,
      sessionCiphertext: null,
      message: "A sessão foi desconectada. Uma nova autorização será necessária.",
    })
    .where(eq(signalwatchConnectionsTable.clerkUserId, userId(req)))
    .returning();
  res.json(DisconnectTelegramResponse.parse(connectionDto(connection)));
});

router.get("/billing/plans", async (_req, res): Promise<void> => {
  res.json(ListBillingPlansResponse.parse(BILLING_PLANS.map(planDto)));
});

router.get("/billing/status", async (req, res): Promise<void> => {
  const { profile } = await ensureWorkspace(userId(req));
  const plan = getBillingPlan(profile.planId);
  const groups = await db
    .select()
    .from(signalwatchGroupsTable)
    .where(
      and(
        eq(signalwatchGroupsTable.clerkUserId, userId(req)),
        eq(signalwatchGroupsTable.monitored, true),
      ),
    );
  const rules = await db
    .select()
    .from(signalwatchRulesTable)
    .where(eq(signalwatchRulesTable.clerkUserId, userId(req)));
  const [checkout] = await db
    .select()
    .from(signalwatchCheckoutsTable)
    .where(eq(signalwatchCheckoutsTable.clerkUserId, userId(req)))
    .orderBy(desc(signalwatchCheckoutsTable.createdAt))
    .limit(1);
  const response = {
    state: profile.billingState,
    plan: planDto(plan),
    usage: {
      planName: plan.name,
      groupsUsed: groups.length,
      groupsLimit: plan.groupsLimit,
      keywordsUsed: rules.reduce((total, rule) => total + rule.keywords.length, 0),
      keywordsLimit: plan.keywordsLimit,
      historyDays: plan.historyDays,
    },
    nextBillingAt: null,
    lastPaymentAt: null,
    checkout: checkout
      ? {
          id: checkout.id,
          status: checkout.status,
          amountCents: checkout.amountCents,
          qrCode: checkout.qrCode,
          copyPaste: checkout.copyPaste,
          expiresAt: checkout.expiresAt,
          message: checkout.status === "unavailable" ? "Mercado Pago ainda não foi configurado." : null,
        }
      : null,
  };
  res.json(GetBillingStatusResponse.parse(response));
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const body = CreatePixCheckoutBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const plan = getBillingPlan(body.data.planId);
  const amountCents = body.data.cycle === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
  const currentUserId = userId(req);
  let status = "unavailable";
  let qrCode: string | null = null;
  let copyPaste: string | null = null;
  let expiresAt: Date | null = null;
  let mercadoPagoPaymentId: string | null = null;
  let message: string | null = "Mercado Pago ainda não foi configurado. A cobrança ficará disponível após a credencial ser adicionada.";

  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const clerkUser = await clerk.users.getUser(currentUserId);
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (!email) throw new Error("No billing email available");
      expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${currentUserId}:${plan.id}:${body.data.cycle}:${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: amountCents / 100,
          description: `SignalWatch ${plan.name} - ${body.data.cycle}`,
          payment_method_id: "pix",
          external_reference: `${currentUserId}:${crypto.randomUUID()}`,
          payer: { email },
          date_of_expiration: expiresAt.toISOString(),
        }),
      });
      if (response.ok) {
        const payment = (await response.json()) as {
          id?: number;
          status?: string;
          point_of_interaction?: {
            transaction_data?: { qr_code?: string; qr_code_base64?: string };
          };
        };
        status = payment.status === "approved" ? "paid" : "pending";
        mercadoPagoPaymentId = payment.id ? String(payment.id) : null;
        copyPaste = payment.point_of_interaction?.transaction_data?.qr_code ?? null;
        qrCode = payment.point_of_interaction?.transaction_data?.qr_code_base64
          ? `data:image/png;base64,${payment.point_of_interaction.transaction_data.qr_code_base64}`
          : null;
        message = null;
      }
    } catch (error) {
      req.log.warn({ err: error }, "Mercado Pago checkout unavailable");
    }
  }

  const [checkout] = await db
    .insert(signalwatchCheckoutsTable)
    .values({
      clerkUserId: currentUserId,
      planId: plan.id,
      cycle: body.data.cycle,
      status,
      amountCents,
      qrCode,
      copyPaste,
      expiresAt,
      mercadoPagoPaymentId,
    })
    .returning();
  const response = {
    id: checkout.id,
    status: checkout.status,
    amountCents: checkout.amountCents,
    qrCode: checkout.qrCode,
    copyPaste: checkout.copyPaste,
    expiresAt: checkout.expiresAt,
    message,
  };
  res.status(201).json(CreatePixCheckoutResponse.parse(response));
});

router.get("/preferences", async (req, res): Promise<void> => {
  const { profile } = await ensureWorkspace(userId(req));
  res.json(
    GetPreferencesResponse.parse({
      language: profile.language,
      theme: profile.theme,
      timezone: profile.timezone,
      dateFormat: profile.dateFormat,
      timeFormat: profile.timeFormat,
      inAppNotifications: profile.inAppNotifications,
    }),
  );
});

router.patch("/preferences", async (req, res): Promise<void> => {
  const body = UpdatePreferencesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [profile] = await db
    .update(signalwatchProfilesTable)
    .set(body.data)
    .where(eq(signalwatchProfilesTable.clerkUserId, userId(req)))
    .returning();
  if (!profile) {
    res.status(404).json({ error: "Preferences not found" });
    return;
  }
  res.json(
    UpdatePreferencesResponse.parse({
      language: profile.language,
      theme: profile.theme,
      timezone: profile.timezone,
      dateFormat: profile.dateFormat,
      timeFormat: profile.timeFormat,
      inAppNotifications: profile.inAppNotifications,
    }),
  );
});

export default router;