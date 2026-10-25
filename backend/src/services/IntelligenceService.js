import { z } from "zod";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { mean, median, percentage, variation, group, period, secondsBetween } from "../utils/indicatorMath.js";
const security = module => ["AUTH", "CONFIGURATION_SECURITY", "PLATFORM_CLIENT_ACCESS"].includes(module);
const maxRows = 10000;
async function bounded(model, args) {
  const rows = await model.findMany({
    ...args,
    take: maxRows + 1
  });
  if (rows.length > maxRows) throw new ApiError("Muitos registros para este período. Selecione um intervalo menor.", 422);
  return rows;
}
export async function intelligence(user, query = {}, db = prisma, options = {}) {
  const parsed = z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    operator: z.string().uuid().optional(),
    profile: z.enum(["DOORMAN", "MANAGER", "CONDOMINIUM_ADMIN", "RESIDENT"]).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    status: z.string().regex(/^[A-Z_]{2,40}$/).optional(),
    module: z.enum(["PACKAGE", "VISITOR", "RESERVATION", "OCCURRENCE", "ASSET", "CONTRACT", "ASSEMBLY", "AUTH", "SHIFT_HANDOVER"]).optional(),
    action: z.string().regex(/^[A-Z_]{2,60}$/).optional(),
    page: z.coerce.number().int().min(1).max(500).default(1),
    sort: z.enum(["date_desc", "date_asc"]).default("date_desc"),
    export: z.enum(["true"]).optional()
  }).strict().safeParse(query);
  if (!parsed.success) throw new ApiError("Filtros inválidos: " + parsed.error.issues[0].message, 422);
  query = parsed.data;
  if ((query.operator || query.profile) && user?.role !== "CONDOMINIUM_ADMIN") throw new ApiError("Filtros individualizados são exclusivos do síndico.", 403);
  const id = user?.condominiumId;
  if (!id || !["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role)) throw new ApiError("Acesso restrito à gestão autorizada.", 403);
  const condo = await db.condominium.findUnique({
    where: {
      id
    },
    select: {
      name: true,
      logoUrl: true,
      settings: true,
      timezone: true
    }
  });
  const dates = period(query, new Date(), condo?.timezone || "America/Recife"),
    {
      start,
      end,
      previousStart,
      previousEnd
    } = dates;
  const base = {
    condominiumId: id,
    deletedAt: null
  };
  const actorFilter = query.operator ? {
    userId: query.operator
  } : {};
  if (query.operator && !/^[0-9a-f-]{36}$/i.test(query.operator)) throw new ApiError("Operador inválido.", 422);
  let [packages, visitors, reservations, occurrences, events, sessions, communications, contracts, assets, assemblies, previousPackages, previousVisitors, pending] = await Promise.all([bounded(db.package, {
    where: {
      ...base,
      receivedAt: {
        gte: start,
        lte: end
      },
      ...(query.operator ? {
        receivedByUserId: query.operator
      } : {})
    },
    select: {
      id: true,
      status: true,
      receivedAt: true,
      deliveredAt: true,
      receivedByUserId: true,
      apartmentId: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      }
    }
  }), bounded(db.visitor, {
    where: {
      ...base,
      createdAt: {
        gte: start,
        lte: end
      },
      ...(query.operator ? {
        registeredByUserId: query.operator
      } : {})
    },
    select: {
      id: true,
      apartmentId: true,
      apartment: {
        select: {
          block: true,
          number: true
        }
      },
      status: true,
      createdAt: true,
      enteredAt: true,
      exitedAt: true,
      registeredByUserId: true
    }
  }), bounded(db.reservation, {
    where: {
      ...base,
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      id: true,
      apartmentId: true,
      requestedByUserId: true,
      reviewedByUserId: true,
      reviewReason: true,
      commonArea: {
        select: {
          name: true
        }
      },
      status: true,
      createdAt: true,
      reviewedAt: true,
      commonAreaId: true,
      reservationDate: true
    }
  }), bounded(db.occurrence, {
    where: {
      ...base,
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      id: true,
      title: true,
      resolvedAt: true,
      assignedToUserId: true,
      createdByUserId: true,
      status: true,
      category: true,
      createdAt: true,
      updatedAt: true
    }
  }), bounded(db.auditLog, {
    where: {
      ...base,
      createdAt: {
        gte: start,
        lte: end
      },
      ...actorFilter
    },
    select: {
      id: true,
      userName: true,
      referenceId: true,
      userId: true,
      userRole: true,
      module: true,
      action: true,
      createdAt: true
    }
  }), bounded(db.authSession, {
    where: {
      user: {
        condominiumId: id,
        role: {
          in: ["DOORMAN", "MANAGER", "CONDOMINIUM_ADMIN"]
        },
        ...(query.operator ? {
          id: query.operator
        } : {})
      },
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      lastInteractionAt: true,
      revokedAt: true,
      revokeReason: true,
      expiresAt: true,
      user: {
        select: {
          name: true,
          role: true,
          idleTimeoutMinutes: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  }), bounded(db.communicationLog, {
    where: {
      condominiumId: id,
      module: "PACKAGE",
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      channel: true,
      status: true,
      createdAt: true
    }
  }), bounded(db.contract, {
    where: base,
    select: {
      id: true,
      reference: true,
      serviceType: true,
      status: true,
      valueInCents: true,
      startDate: true,
      endDate: true,
      contractKind: true,
      autoRenew: true
    }
  }), bounded(db.asset, {
    where: base,
    select: {
      id: true,
      name: true,
      category: true,
      status: true
    }
  }), bounded(db.notice, {
    where: {
      ...base,
      type: "ASSEMBLY",
      eventDate: {
        gte: start,
        lte: end
      }
    },
    select: {
      id: true,
      title: true,
      eventDate: true,
      eventTime: true,
      status: true
    }
  }), bounded(db.package, {
    where: {
      ...base,
      receivedAt: {
        gte: previousStart,
        lte: previousEnd
      }
    },
    select: {
      status: true,
      receivedByUserId: true
    }
  }), bounded(db.visitor, {
    where: {
      ...base,
      createdAt: {
        gte: previousStart,
        lte: previousEnd
      }
    },
    select: {
      status: true,
      registeredByUserId: true
    }
  }), bounded(db.package, {
    where: {
      ...base,
      status: "RECEIVED"
    },
    select: {
      id: true,
      status: true,
      receivedByUserId: true,
      receivedAt: true
    }
  })]);
  const [maintenance, participation, operators, handovers, residentTotal] = await Promise.all([bounded(db.assetMaintenance, {
    where: {
      condominiumId: id,
      asset: {
        condominiumId: id,
        deletedAt: null
      },
      OR: [{
        scheduledAt: {
          gte: start,
          lte: end
        }
      }, {
        completedAt: {
          gte: start,
          lte: end
        }
      }]
    },
    include: {
      asset: {
        select: {
          name: true,
          category: true
        }
      }
    }
  }), bounded(db.assemblyRecord, {
    where: {
      condominiumId: id,
      notice: {
        condominiumId: id,
        deletedAt: null,
        eventDate: {
          gte: start,
          lte: end
        }
      }
    },
    select: {
      id: true,
      noticeId: true,
      apartmentId: true,
      topic: true,
      vote: true,
      present: true,
      eligibleUnits: true,
      voteFinalized: true,
      createdAt: true
    }
  }), db.user.findMany({
    where: {
      condominiumId: id,
      deletedAt: null,
      role: {
        in: ["DOORMAN", "MANAGER", "CONDOMINIUM_ADMIN"]
      }
    },
    select: {
      id: true,
      name: true,
      role: true
    },
    take: 1000
  }), bounded(db.shiftHandover, {
    where: { condominiumId: id, createdAt: { gte: start, lte: end } },
    select: { id: true, title: true, priority: true, createdAt: true, resolvedAt: true,
      createdByUserId: true, resolvedByUserId: true,
      acknowledgements: { select: { userId: true, acknowledgedAt: true } } }
  }), db.resident.count({ where: base })]);
  const operatorMap = new Map(operators.map(x => [x.id, x.name]));
  const categories = [...new Set([...occurrences.map(x => x.category), ...assets.map(x => x.category)].filter(Boolean))].sort();
  const statuses = [...new Set([...packages, ...visitors, ...reservations, ...occurrences, ...assets, ...contracts].map(x => x.status))].sort();
  const matches = (row, module, operator) => (!query.module || query.module === module) && (!query.status || row.status === query.status) && (!query.category || row.category === query.category) && (!query.operator || operator === query.operator) && (!query.profile || operators.some(x => x.id === operator && x.role === query.profile));
  const historicPackages = previousPackages.filter(x => matches(x, "PACKAGE", x.receivedByUserId)).length;
  const historicVisitors = previousVisitors.filter(x => matches(x, "VISITOR", x.registeredByUserId)).length;
  packages = packages.filter(x => matches(x, "PACKAGE", x.receivedByUserId));
  visitors = visitors.filter(x => matches(x, "VISITOR", x.registeredByUserId));
  reservations = reservations.filter(x => matches(x, "RESERVATION", x.reviewedByUserId || x.requestedByUserId));
  occurrences = occurrences.filter(x => matches(x, "OCCURRENCE", x.assignedToUserId || x.createdByUserId));
  contracts = contracts.filter(x => matches(x, "CONTRACT", null));
  assets = assets.filter(x => matches(x, "ASSET", null));
  assemblies = assemblies.filter(x => matches(x, "ASSEMBLY", null));
  pending = pending.filter(x => matches(x, "PACKAGE", x.receivedByUserId));
  events = events.filter(x => (!query.module || x.module === query.module) && (!query.action || x.action === query.action) && (!query.profile || x.userRole === query.profile));
  sessions = sessions.filter(x => (!query.profile || x.user.role === query.profile) && (!query.module || query.module === "AUTH"));
  communications = communications.filter(_x => !query.module || query.module === "PACKAGE");
  const selectedMaintenance = maintenance.filter(x => (!query.module || query.module === "ASSET") && (!query.category || x.asset.category === query.category) && (!query.operator || x.recordedByUserId === query.operator) && (!query.status || (query.status === "COMPLETED" ? !!x.completedAt : query.status === "PENDING" ? !x.completedAt : false)));
  const assemblyIds = new Set(assemblies.map(a => a.id));
  const selectedHandovers = handovers.filter(x => (!query.module || query.module === "SHIFT_HANDOVER") &&
    (!query.operator || x.createdByUserId === query.operator) &&
    (!query.profile || operators.some(o => o.id === x.createdByUserId && o.role === query.profile)) &&
    (!query.status || (query.status === "RESOLVED" ? !!x.resolvedAt : query.status === "PENDING" ? !x.resolvedAt : false)) && !query.category);
  const selectedParticipation = participation.filter(x => assemblyIds.has(x.noticeId));
  const calendarFormat = new Intl.DateTimeFormat("sv-SE", {
    timeZone: dates.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const dateKey = value => calendarFormat.format(new Date(value));
  const binDate = (date, unit) => {
    if (unit === "month") return date.slice(0, 7);
    if (unit === "week") {
      const n = new Date(date + "T12:00:00Z");
      n.setUTCDate(n.getUTCDate() - (n.getUTCDay() + 6) % 7);
      return n.toISOString().slice(0, 10);
    }
    return date;
  };
  const bins = unit => {
    const result = new Set();
    for (let d = Date.parse(dateKey(start) + "T12:00:00Z"), last = Date.parse(dateKey(end) + "T12:00:00Z"); d <= last; d += 86400000) result.add(binDate(new Date(d).toISOString().slice(0, 10), unit));
    return [...result].sort();
  };
  const series = (rows, field, unit = "day") => {
    const totals = new Map(bins(unit).map(name => [name, 0]));
    for (const row of rows) {
      if (!row[field]) continue;
      const name = binDate(dateKey(row[field]), unit);
      totals.set(name, (totals.get(name) || 0) + 1);
    }
    return [...totals].map(([name, total]) => ({
      name,
      total
    })).sort((a, b) => a.name.localeCompare(b.name));
  };
  const uniqueSeries = (rows, unit) => {
    const map = new Map(bins(unit).map(name => [name, new Set()]));
    for (const x of rows) {
      const key = binDate(dateKey(x.createdAt), unit);
      if (!map.has(key)) map.set(key, new Set());
      if (x.userId) map.get(key).add(x.userId);
    }
    return [...map].map(([name, ids]) => ({
      name,
      uniqueUsers: ids.size
    })).sort((a, b) => a.name.localeCompare(b.name));
  };
  const paginate = (rows, field = "createdAt") => {
    const sorted = [...rows].sort((a, b) => (new Date(a[field] || 0) - new Date(b[field] || 0)) * (query.sort === "date_asc" ? 1 : -1));
    return {
      total: rows.length,
      page: query.page,
      pageSize: 25,
      rows: query.export ? sorted : sorted.slice((query.page - 1) * 25, query.page * 25)
    };
  };
  const now = new Date(),
    withdrawals = packages.map(x => secondsBetween(x.receivedAt, x.deliveredAt)).filter(x => x !== null),
    stays = visitors.map(x => secondsBetween(x.enteredAt, x.exitedAt)).filter(x => x !== null),
    decisions = reservations.map(x => secondsBetween(x.createdAt, x.reviewedAt)).filter(x => x !== null);
  const operational = events.filter(x => !security(x.module) && !/LOGIN|LOGOUT|PASSWORD|SESSION|SECURITY/.test(x.action));
  const daily = series(packages, "receivedAt");
  const counts = new Map(),
    overlaps = new Set(),
    activeByUser = new Map(),
    activeAll = new Set();
  const effective = s => s.revokedAt ?? new Date(Math.min(+s.expiresAt, +s.lastInteractionAt + s.user.idleTimeoutMinutes * 60000));
  const timeline = [...sessions.flatMap(s => [{
    time: +s.createdAt,
    kind: 0,
    s
  }, {
    time: Math.min(+effective(s), +now),
    kind: 2,
    s
  }]), ...operational.map(e => ({
    time: +new Date(e.createdAt),
    kind: 1,
    e
  }))].sort((a, b) => a.time - b.time || a.kind - b.kind);
  for (const entry of timeline) {
    if (entry.kind === 0) {
      const s = entry.s;
      if (activeAll.size) {
        overlaps.add(s.id);
        if (activeAll.size === 1) overlaps.add(activeAll.values().next().value);
      }
      activeAll.add(s.id);
      if (!activeByUser.has(s.userId)) activeByUser.set(s.userId, new Set());
      activeByUser.get(s.userId).add(s.id);
    } else if (entry.kind === 2) {
      activeAll.delete(entry.s.id);
      activeByUser.get(entry.s.userId)?.delete(entry.s.id);
    } else {
      const active = activeByUser.get(entry.e.userId);
      if (active?.size === 1) {
        const sid = active.values().next().value;
        counts.set(sid, (counts.get(sid) || 0) + 1);
      }
    }
  }
  const sessionsView = sessions.map(s => {
    const effectiveEnd = s.revokedAt ?? new Date(Math.min(+s.expiresAt, +s.lastInteractionAt + s.user.idleTimeoutMinutes * 60000));
    return {
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      role: s.user.role,
      loginAt: s.createdAt,
      lastObservedInteractionAt: s.lastInteractionAt,
      endedAt: s.revokedAt,
      endReason: s.revokeReason || (effectiveEnd <= now ? "EXPIRY_INFERRED" : "OPEN"),
      sessionDurationSeconds: secondsBetween(s.createdAt, effectiveEnd < now ? effectiveEnd : now),
      observedSpanSeconds: secondsBetween(s.createdAt, s.lastInteractionAt),
      simultaneous: overlaps.has(s.id),
      operationsUnambiguous: counts.get(s.id) || 0
    };
  });
  const doormanSessions = sessionsView.filter(x => x.role === "DOORMAN"),
    nextDifferent = [];
  for (let i = doormanSessions.length - 2; i >= 0; i--) nextDifferent[i] = doormanSessions[i + 1].userId !== doormanSessions[i].userId ? i + 1 : nextDifferent[i + 1];
  const transitions = doormanSessions.map((session, i) => {
    const next = doormanSessions[nextDifferent[i]];
    return {
      operator: session.name,
      endedAt: session.endedAt,
      nextOperator: next?.name ?? null,
      nextLogin: next?.loginAt ?? null,
      gapSeconds: session.endedAt && next ? secondsBetween(session.endedAt, next.loginAt) : null
    };
  });
  const whatsapp = communications.filter(x => x.channel === "WHATSAPP"),
    delivered = whatsapp.filter(x => x.status === "DELIVERED").length;
  const insights = [];
  const overdue = selectedMaintenance.filter(x => !x.completedAt && new Date(x.scheduledAt) < now).length;
  if (overdue) insights.push(`${overdue} manutenção(ões) com data agendada anterior à consulta e sem conclusão registrada.`);
  const failureCount = communications.filter(x => x.status === "FAILED").length;
  if (failureCount) insights.push(`${failureCount} aviso(s) com falha registrada no período; não representa confirmação de recebimento.`);
  const recurring = group(occurrences, x => x.category).find(x => x.total > 1);
  if (recurring) insights.push(`Categoria recorrente: ${recurring.name}, ${recurring.total} ocorrências no período filtrado.`);
  const peak = group(packages, x => new Intl.DateTimeFormat("pt-BR", {
    timeZone: dates.timezone,
    hour: "2-digit",
    hourCycle: "h23"
  }).format(new Date(x.receivedAt)))[0];
  if (peak) insights.push(`Faixa de maior recebimento: ${peak.name}h, ${peak.total} encomenda(s) na amostra de ${packages.length}.`);
  const change = variation(packages.length, historicPackages);
  if (change !== null) insights.push(`Encomendas: variação de ${change.toFixed(1)}% em relação ao período anterior equivalente.`);
  const old = pending.filter(x => x.receivedAt && now - new Date(x.receivedAt) >= 48 * 3600000).length;
  if (old) insights.push(`${old} encomenda(s) aguardam retirada há pelo menos 48 horas no momento da consulta.`);
  const chartSeries = (unit) => {
    const sets = { packages: series(packages,"receivedAt",unit), visitors: series(visitors,"createdAt",unit),
      reservations: series(reservations,"createdAt",unit), occurrences: series(occurrences,"createdAt",unit),
      operations: series(operational,"createdAt",unit), sessions: series(user.role === "CONDOMINIUM_ADMIN" ? sessions : [],"createdAt",unit),
      handovers: series(selectedHandovers,"createdAt",unit) };
    return bins(unit).map(name => Object.fromEntries([["name",name], ...Object.entries(sets).map(([key,rows])=>[key, rows.find(x=>x.name===name)?.total || 0])]));
  };
  const handoverSummary = {
    total: selectedHandovers.length,
    pending: selectedHandovers.filter(x=>!x.resolvedAt).length,
    resolved: selectedHandovers.filter(x=>x.resolvedAt).length,
    acknowledged: selectedHandovers.filter(x=>x.acknowledgements.some(a=>a.userId!==x.createdByUserId)).length,
    highPriorityPending: selectedHandovers.filter(x=>!x.resolvedAt && x.priority==="HIGH").length
  };
  const sessionSummary = user.role === "CONDOMINIUM_ADMIN" ? {
    total: sessionsView.length, operators: new Set(sessions.map(x=>x.userId)).size,
    open: sessionsView.filter(x=>x.endReason==="OPEN").length,
    observedMeanSeconds: mean(sessionsView.map(x=>x.observedSpanSeconds).filter(x=>x!==null)),
    daily: series(sessions,"createdAt"), byOperator: group(sessions,x=>operatorMap.get(x.userId)||"Operador não identificado")
  } : null;
  if (handoverSummary.highPriorityPending) insights.unshift(`${handoverSummary.highPriorityPending} passagem(ns) de alta prioridade permanece(m) aberta(s) na amostra do período.`);
  if (query.export && options.auditExport !== false) await db.auditLog.create({
    data: {
      condominiumId: id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      module: "REPORT_EXPORT",
      action: "EXPORT",
      details: "Exportação detalhada da Central de Inteligência. Filtros: " + JSON.stringify({
        ...query,
        export: undefined
      })
    }
  });
  return {
    schemaVersion: 2,
    theme: {
      corPrincipal: /^#[0-9a-f]{6}$/i.test(condo?.settings?.theme?.corPrincipal || "") ? condo.settings.theme.corPrincipal : "#7c3aed",
      aplicarTemaPersonalizado: condo?.settings?.theme?.aplicarTemaPersonalizado === true
    },
    generatedAt: now,
    dashboard: {
      residentsNow: residentTotal,
      received: packages.length,
      deliveredFromPeriod: packages.filter(x=>x.status==="DELIVERED").length,
      approvedReservations: reservations.filter(x=>x.status==="APPROVED").length,
      resolvedOccurrences: occurrences.filter(x=>["RESOLVED","CLOSED"].includes(x.status)).length,
      resolutionPercent: percentage(occurrences.filter(x=>["RESOLVED","CLOSED"].includes(x.status)).length, occurrences.length),
      withdrawalPercent: percentage(packages.filter(x=>x.status==="DELIVERED").length, packages.length),
      daily: chartSeries("day"), weekly: chartSeries("week"), monthly: chartSeries("month"),
      distribution: [{name:"Visitantes",total:visitors.length},{name:"Encomendas",total:packages.length},{name:"Reservas",total:reservations.length},{name:"Ocorrências",total:occurrences.length}],
      byBlock: group(packages,x=>x.apartment?.block || "Sem bloco"),
      visitorsByApartment: group(visitors,x=>`${x.apartment?.block || ""}/${x.apartment?.number || "Sem identificação"}`),
      metricGroups: {
        withdrawal: { unit: "segundos", rows: [{name:"Tempo médio de retirada",total:mean(withdrawals)},{name:"Mediana de retirada",total:median(withdrawals)}] },
        serviceTimes: { unit:"segundos", rows:[{name:"Permanência média de visitantes",total:mean(stays)},{name:"Tempo médio de decisão de reservas",total:mean(decisions)},{name:"Tempo médio de resolução de ocorrências",total:mean(occurrences.map(x=>secondsBetween(x.createdAt,x.resolvedAt)).filter(x=>x!==null))}] },
        communication: { unit:"registros",rows:group(communications,x=>x.status) },
        maintenance: {unit:"registros",rows:[{name:"Pendentes",total:selectedMaintenance.filter(x=>!x.completedAt).length},{name:"Concluídas",total:selectedMaintenance.filter(x=>x.completedAt).length}]},
        participation: {unit:"unidades presentes",rows:assemblies.map(a=>({name:a.title,total:new Set(selectedParticipation.filter(p=>p.noticeId===a.id&&p.present).map(p=>p.apartmentId)).size}))},
        activeUsers: {unit:"usuários únicos",rows:uniqueSeries(operational,"day").map(x=>({name:x.name,total:x.uniqueUsers}))}
      },
      operationsDaily: series(operational,"createdAt"),
      periodDays: bins("day").length
    },
    handovers: handoverSummary,
    sessionSummary,
    filters: query,
    options: {
      operators: user.role === "CONDOMINIUM_ADMIN" ? operators : [],
      categories,
      statuses
    },
    details: {
      handovers: paginate(selectedHandovers.map(({createdByUserId, resolvedByUserId, acknowledgements, ...x}) => ({...x,
        ...(user.role==="CONDOMINIUM_ADMIN" ? {operator: operatorMap.get(createdByUserId)||"Operador não identificado", resolvedBy: operatorMap.get(resolvedByUserId)||null} : {}),
        acknowledgements: acknowledgements.filter(a=>a.userId!==createdByUserId).length
      }))),
      packages: paginate(packages, "receivedAt"),
      visitors: paginate(visitors),
      reservations: paginate(reservations),
      occurrences: paginate(occurrences),
      contracts: paginate(contracts, "endDate"),
      assets: paginate(assets),
      maintenance: paginate(selectedMaintenance, "scheduledAt"),
      assemblies: paginate(assemblies, "eventDate"),
      operations: paginate(operational.map(({
        userId,
        userName,
        userRole,
        ...x
      }) => ({
        ...x,
        ...(userRole !== "RESIDENT" && user.role === "CONDOMINIUM_ADMIN" ? {
          operator: operatorMap.get(userId) || userName,
          role: userRole
        } : {
          role: userRole
        })
      }))),
      sessions: paginate(user.role === "CONDOMINIUM_ADMIN" ? sessionsView : [], "loginAt"),
      transitions: paginate(user.role === "CONDOMINIUM_ADMIN" ? transitions : [], "nextLogin")
    },
    rankings: user.role === "CONDOMINIUM_ADMIN" ? {
      sessions: group(sessions, x => operatorMap.get(x.userId) || "Operador não identificado"),
      packages: group(packages, x => operatorMap.get(x.receivedByUserId) || "Operador não identificado"),
      visitors: group(visitors, x => operatorMap.get(x.registeredByUserId) || "Operador não identificado"),
      completedOperations: group(operational.filter(x => /COMPLETE|DELIVER|RESOLVE|APPROVE/.test(x.action)), x => operatorMap.get(x.userId) || "Operador não identificado")
    } : null,
    condominiumName: condo?.name,
    logoUrl: condo?.logoUrl,
    period: {
      start,
      end,
      previousStart,
      previousEnd,
      timezone: dates.timezone
    },
    sample: {
      packages: packages.length,
      visitors: visitors.length,
      reservations: reservations.length,
      events: events.length,
      limit: maxRows
    },
    packages: {
      total: packages.length,
      byStatus: group(packages, x => x.status),
      daily,
      weekly: series(packages, "receivedAt", "week"),
      monthly: series(packages, "receivedAt", "month"),
      byApartment: user.role === "CONDOMINIUM_ADMIN" ? group(packages, x => `${x.apartment?.block || ""}/${x.apartment?.number || "Sem identificação"}`) : [],
      averagePerDay: packages.length / Math.max(1, Math.ceil((end - start + 1) / 86400000)),
      withdrawalMeanSeconds: mean(withdrawals),
      withdrawalMedianSeconds: median(withdrawals),
      withdrawalSample: withdrawals.length,
      variationPercent: change,
      pendingNow: pending.length,
      older24h: pending.filter(x => x.receivedAt && now - new Date(x.receivedAt) >= 86400000).length,
      older48h: old,
      older72h: pending.filter(x => x.receivedAt && now - new Date(x.receivedAt) >= 3 * 86400000).length,
      peakHours: group(packages, x => new Intl.DateTimeFormat("pt-BR", {
        timeZone: dates.timezone,
        hour: "2-digit",
        hourCycle: "h23"
      }).format(x.receivedAt)),
      weekdays: group(packages, x => new Intl.DateTimeFormat("pt-BR", {
        timeZone: dates.timezone,
        weekday: "long"
      }).format(x.receivedAt)),
      byOperator: group(packages, x => operatorMap.get(x.receivedByUserId) || "Operador não identificado")
    },
    visitors: {
      total: visitors.length,
      daily: series(visitors, "createdAt"),
      weekly: series(visitors, "createdAt", "week"),
      monthly: series(visitors, "createdAt", "month"),
      weekdays: group(visitors, x => new Intl.DateTimeFormat("pt-BR", {
        timeZone: dates.timezone,
        weekday: "long"
      }).format(new Date(x.createdAt))),
      incomplete: visitors.filter(x => x.enteredAt && !x.exitedAt).length,
      byOperator: group(visitors, x => operatorMap.get(x.registeredByUserId) || "Operador não identificado"),
      byStatus: group(visitors, x => x.status),
      stayMeanSeconds: mean(stays),
      staySample: stays.length,
      variationPercent: variation(visitors.length, historicVisitors),
      hourly: group(visitors, x => new Intl.DateTimeFormat("pt-BR", {
        timeZone: dates.timezone,
        hour: "2-digit",
        hourCycle: "h23"
      }).format(x.createdAt))
    },
    reservations: {
      total: reservations.length,
      daily: series(reservations, "createdAt"),
      weekly: series(reservations, "createdAt", "week"),
      monthly: series(reservations, "createdAt", "month"),
      byReservationDay: group(reservations, x => new Date(x.reservationDate).toISOString().slice(0, 10)),
      occupancyPercent: null,
      occupancyReason: "Disponibilidade de cada área por data/horário e bloqueios não é modelada integralmente; não é possível calcular ocupação confiável.",
      byStatus: group(reservations, x => x.status),
      decisionMeanSeconds: mean(decisions),
      decisionSample: decisions.length,
      byArea: group(reservations, x => x.commonArea?.name || x.commonAreaId)
    },
    occurrences: {
      total: occurrences.length,
      byStatus: group(occurrences, x => x.status),
      byCategory: group(occurrences, x => x.category),
      resolutionTime: mean(occurrences.map(x => secondsBetween(x.createdAt, x.resolvedAt)).filter(x => x !== null)),
      resolutionSample: occurrences.filter(x => secondsBetween(x.createdAt, x.resolvedAt) !== null).length,
      older30Days: occurrences.filter(x => !["RESOLVED", "CLOSED", "CANCELED"].includes(x.status) && now - new Date(x.createdAt) >= 30 * 86400000).length,
      daily: series(occurrences, "createdAt"),
      weekly: series(occurrences, "createdAt", "week"),
      monthly: series(occurrences, "createdAt", "month"),
      recurringCategories: group(occurrences, x => x.category).filter(x => x.total > 1)
    },
    adoption: {
      activeUsers: new Set(operational.map(x => x.userId).filter(Boolean)).size,
      operations: operational.length,
      weeklyActiveUsers: uniqueSeries(operational, "week"),
      monthlyActiveUsers: uniqueSeries(operational, "month"),
      byAction: group(operational, x => x.action),
      dailyActiveUsers: uniqueSeries(operational, "day"),
      byOperator: user.role === "CONDOMINIUM_ADMIN" ? group(operational.filter(x => x.userRole !== "RESIDENT"), x => x.userId) : [],
      byModule: ["PACKAGE", "VISITOR", "RESERVATION", "OCCURRENCE", "ASSET", "CONTRACT", "ASSEMBLY_RECORD", "SHIFT_HANDOVER"].map(name => ({
        name,
        total: operational.filter(x => x.module === name).length
      })),
      byRole: group(operational, x => x.userRole)
    },
    transitions: user.role === "CONDOMINIUM_ADMIN" ? transitions.slice((query.page - 1) * 25, query.page * 25) : [],
    sessions: user.role === "CONDOMINIUM_ADMIN" ? sessionsView.slice((query.page - 1) * 25, query.page * 25) : [],
    security: user.role === "CONDOMINIUM_ADMIN" ? group(events.filter(x => security(x.module)), x => x.action) : [],
    communications: {
      total: communications.length,
      byStatus: group(communications, x => x.status),
      whatsappDelivered: delivered,
      whatsappTotal: whatsapp.length,
      failures: communications.filter(x => x.status === "FAILED").length,
      confirmedDeliveryPercent: percentage(delivered, whatsapp.length)
    },
    administration: {
      contracts: group(contracts, x => x.status),
      assets: group(assets, x => x.status),
      assetsByCategory: group(assets, x => x.category),
      expiring30Days: contracts.filter(x => x.status === "ACTIVE" && x.endDate && new Date(x.endDate) >= now && new Date(x.endDate) - now <= 30 * 86400000).length,
      contractValueInCents: contracts.some(x => x.valueInCents !== null) ? contracts.reduce((a, x) => a + (x.valueInCents || 0), 0) : null,
      commitments: contracts.filter(x => x.status === "ACTIVE" && x.endDate && new Date(x.endDate) >= now).map(x => ({
        id: x.id,
        dueDate: x.endDate,
        valueInCents: x.valueInCents,
        serviceType: x.serviceType
      })),
      maintenancePending: selectedMaintenance.filter(x => !x.completedAt).length,
      maintenanceCompleted: selectedMaintenance.filter(x => x.completedAt).length,
      maintenanceOverdue: selectedMaintenance.filter(x => !x.completedAt && new Date(x.scheduledAt) < now).length,
      maintenanceHistory: selectedMaintenance.length,
      assembliesScheduled: assemblies.length,
      assembliesHeld: assemblies.filter(x => x.eventDate && new Date(x.eventDate).toISOString().slice(0, 10) < dateKey(now) && selectedParticipation.some(p => p.noticeId === x.id && p.present)).length,
      assemblyParticipation: assemblies.map(a => {
        const records = selectedParticipation.filter(x => x.noticeId === a.id),
          present = new Set(records.filter(x => x.present).map(x => x.apartmentId)).size,
          bases = [...new Set(records.map(x => x.eligibleUnits).filter(Boolean))];
        const denominator = bases.length === 1 && bases[0] >= present ? bases[0] : null;
        return {
          id: a.id,
          title: a.title,
          date: a.eventDate,
          documentedUnits: new Set(records.map(x => x.apartmentId)).size,
          present,
          eligibleUnits: denominator,
          participationPercent: denominator ? percentage(present, denominator) : null,
          votes: group(records.filter(x => x.vote), x => `${x.topic} · ${x.vote}`),
          topicsWithRecordedVotes: new Set(records.filter(x => x.vote).map(x => x.topic)).size,
          finalizedVotes: [...new Set(records.filter(x => x.vote).map(x => x.topic))].filter(topic => records.filter(x => x.topic === topic).every(x => x.voteFinalized)).length
        };
      })
    },
    insights,
    methodology: ["Totais usam registros não excluídos do condomínio autenticado.", "Períodos são apresentados no fuso cadastrado do condomínio. Comparação usa intervalo anterior com a mesma duração.", "null significa dado indisponível ou denominador zero, não zero observado.", "Pendências são a posição atual; grupos por status refletem o estado atual dos registros do período.", "Tempos de retirada/permanência usam somente pares cronológicos completos; a amostra está indicada.", "Sessões não são controle de ponto. Intervalo observado não mede horas trabalhadas; encerramento inferido é identificado.", "Resolução de ocorrências usa resolvedAt realmente registrado, nunca updatedAt. Registros antigos sem resolução datada não entram na amostra.", "Manutenções no período incluem agendamento ou conclusão no intervalo; pendências são o estado atual dessa amostra, não o inventário histórico inteiro.", "Manutenção e participação/votação usam evidências registradas pela gestão após esta atualização; nenhum histórico foi preenchido artificialmente. Assembleias anteriores à data atual são agendamentos passados, não prova automática de realização.", "Participação: unidades presentes únicas / base de unidades elegíveis documentada, somente com base consistente. Votos são lançamentos de ata, não votação eletrônica nem validação jurídica.", "Valores de contratos são valores cadastrados, sem inferir mensalidade ou multiplicar recorrência. Compromissos são contratos ativos com vencimento futuro, não contas a pagar geradas.", "Votações concluídas contam pautas com voto e encerramento atestado pela gestão conforme ata; não é contagem de resultados de uma votação eletrônica.", "Retenção: consultas operacionais de até 90 dias; registros de origem e auditoria preservados. Política de revisão e descarte está em docs/RETENCAO-E-PRIVACIDADE.md; este pacote não apaga o histórico.", "Ranking compara contagens independentes, não qualidade ou jornada. Operações por sessão não são atribuídas quando não houver vínculo inequívoco.", "Filtros categoria/status se aplicam aos registros com esses campos; módulo restringe a coleção consultada. Perfil/operador são exclusivos do síndico; tipo de operação restringe eventos auditados.", "Indicadores individualizados de sessões e segurança ficam restritos ao síndico.", "Consultas limitadas a 90 dias e 10 mil registros por conjunto; excedentes exigem período menor."]
  };
}
