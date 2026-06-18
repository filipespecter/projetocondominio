import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DashboardSindico() {
  const navigate = useNavigate();

  const [mostrarManual, setMostrarManual] = useState(false);

  const [perfilCondominio, setPerfilCondominio] = useState({
    condominioId: null,
    nomeCondominio: "Condomínio",
    plano: "Gestão Premium",
    statusComercial: "Ativo",
    quantidadeUnidades: ""
  });

  const [dados, setDados] = useState({
    moradores: 0,
    apartamentos: 0,
    porteiros: 0,
    prestadores: 0,
    encomendas: 0,
    visitantes: 0,
    reservas: 0,
    avisos: 0,
    areasComuns: 0,
    ocorrencias: 0,
    movimentacoes: 0,
    sugestoes: 0,
    reclamacoes: 0,
    notificacoes: 0,
    auditoria: 0,
    moradoresPrincipais: 0,
    dependentes: 0,
    apartamentosOcupados: 0,
    areasManutencao: 0,
    prestadoresExecucao: 0,
    prestadoresFinalizados: 0
  });

  const [atividades, setAtividades] = useState([]);

  useEffect(() => {
    carregarDados();

    const interval = setInterval(() => {
      carregarDados();
    }, 10000);

    window.addEventListener("storage", carregarDados);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", carregarDados);
    };
  }, []);

  function lerStorage(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      return [];
    }
  }

  function lerObjeto(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || {};
    } catch {
      return {};
    }
  }

  function normalizarTexto(valor) {
    return String(valor || "").trim().toLowerCase();
  }

  function carregarDados() {
    const perfil =
      lerObjeto("perfil_condominio") ||
      lerObjeto("configuracoes") ||
      {};

    const condominioId =
      perfil.id ||
      perfil.condominioId ||
      null;

    setPerfilCondominio({
      condominioId,
      nomeCondominio: perfil.nomeCondominio || "Condomínio",
      plano: perfil.plano || "Gestão Premium",
      statusComercial: perfil.statusComercial || "Ativo",
      quantidadeUnidades: perfil.quantidadeUnidades || ""
    });

    const moradores = lerStorage("moradores");
    const apartamentos = lerStorage("apartamentos");
    const porteiros = lerStorage("porteiros");

    const prestadores = [
      ...lerStorage("condominio_prestadores"),
      ...lerStorage("prestadores_particulares_v2")
    ].filter(
      (item, index, array) =>
        index ===
        array.findIndex(
          (p) =>
            String(p.id || p.cpfCnpj || p.documento || p.nome || index) ===
            String(item.id || item.cpfCnpj || item.documento || item.nome || index)
        )
    );

    const encomendas = [
      ...lerStorage("encomendas"),
      ...lerStorage("encomendas_historico"),
      ...lerStorage("encomendas_esperadas")
    ];

    const visitantes = [
      ...lerStorage("visitantes"),
      ...lerStorage("visitantes_historico")
    ];

    const reservas = lerStorage("reservas");

    const avisos = [
      ...lerStorage("avisos"),
      ...lerStorage("avisos_sindico")
    ];

    const notificacoesMorador = lerStorage("notificacoesMorador");
    const notificacoes = lerStorage("notificacoes");

    const notificacoesSindicoNaoLidas = notificacoes.filter((item) => {
      return item.perfilDestino === "sindico" && !item.lida;
    });

    const notificacoesMoradorPendentes = notificacoesMorador.filter(
      (item) => !item.lida
    );

    const areasComuns = lerStorage("areasComuns");

    const ocorrencias = [
      ...lerStorage("ocorrencias"),
      ...lerStorage("historico_ocorrencias"),
      ...lerStorage("livro_ocorrencias")
    ];

    const sugestoesReclamacoes = [
      ...lerStorage("sugestoesMorador"),
      ...lerStorage("sugestoes_reclamacoes")
    ];

    const movimentacoes = [
      ...lerStorage("movimentacoes"),
      ...lerStorage("relatorios_operacionais")
    ];

    const auditoria = [
      ...lerStorage("auditoria_logs"),
      ...lerStorage("auditoriaSistema")
    ];

    const moradoresPrincipais = moradores.filter((m) => m.moradorPrincipal);
    const dependentes = moradores.filter((m) => !m.moradorPrincipal);

    const apartamentosOcupados = apartamentos.filter((a) => {
      const status = normalizarTexto(a.status);

      return (
        status === "ocupado" ||
        a.morador ||
        a.moradoresNomes?.length > 0 ||
        a.moradoresIds?.length > 0
      );
    });

    const areasManutencao = areasComuns.filter(
      (area) => normalizarTexto(area.status) === "manutenção" ||
        normalizarTexto(area.status) === "manutencao"
    );

    const prestadoresExecucao = prestadores.filter((p) => {
      const status = normalizarTexto(p.status);
      return status === "em execução" || status === "em execucao";
    });

    const prestadoresFinalizados = prestadores.filter((p) => {
      const status = normalizarTexto(p.status);
      return status === "finalizado" || status === "finalizada";
    });

    const encomendasPendentes = encomendas.filter((e) => {
      const status = normalizarTexto(e.status || e.statusSindico);

      return (
        status === "pendente" ||
        status === "recebido" ||
        status === "aguardando" ||
        status === "aguardando retirada" ||
        status === "esperada" ||
        status === "atrasado"
      );
    });

    const reservasPendentes = reservas.filter((r) => {
      const status = normalizarTexto(r.status);

      return (
        status === "pendente" ||
        status === "em análise" ||
        status === "em analise"
      );
    });

    const ocorrenciasPendentes = ocorrencias.filter((o) => {
      const status = normalizarTexto(o.status);

      return (
        status !== "resolvida" &&
        status !== "resolvido" &&
        status !== "finalizada" &&
        status !== "finalizado"
      );
    });

    const sugestoesAbertas = sugestoesReclamacoes.filter((item) => {
      const tipo = normalizarTexto(item.tipoRegistro || item.tipo || item.categoria);
      const status = normalizarTexto(item.status);

      return (
        tipo.includes("sugest") &&
        status !== "resolvido" &&
        status !== "resolvida"
      );
    });

    const reclamacoesAbertas = sugestoesReclamacoes.filter((item) => {
      const tipo = normalizarTexto(item.tipoRegistro || item.tipo || item.categoria);
      const status = normalizarTexto(item.status);

      return (
        tipo.includes("reclama") &&
        status !== "resolvido" &&
        status !== "resolvida"
      );
    });

    setDados({
      moradores: moradores.length,
      apartamentos: apartamentos.length,
      porteiros: porteiros.length,
      prestadores: prestadores.length,
      encomendas: encomendasPendentes.length,
      visitantes: visitantes.length,
      reservas: reservasPendentes.length,
      avisos: avisos.length,
      areasComuns: areasComuns.length,
      ocorrencias: ocorrenciasPendentes.length,
      movimentacoes: movimentacoes.length,
      sugestoes: sugestoesAbertas.length,
      reclamacoes: reclamacoesAbertas.length,
      notificacoes:
        notificacoesSindicoNaoLidas.length +
        notificacoesMoradorPendentes.length,
      auditoria: auditoria.length,
      moradoresPrincipais: moradoresPrincipais.length,
      dependentes: dependentes.length,
      apartamentosOcupados: apartamentosOcupados.length,
      areasManutencao: areasManutencao.length,
      prestadoresExecucao: prestadoresExecucao.length,
      prestadoresFinalizados: prestadoresFinalizados.length
    });

    const historico = [
      ...notificacoes.slice(-5).map((n) => ({
        id: n.id || `notificacao-${n.titulo || ""}-${n.data || ""}`,
        icon: n.lida ? "🔔" : "🟡",
        titulo: n.titulo || "Notificação",
        texto: n.mensagem || "Nova notificação do sistema",
        tempo: `${n.data || ""} ${n.hora || ""}`,
        tipo: n.lida ? "Notificação lida" : "Notificação pendente"
      })),

      ...auditoria.slice(-5).map((a) => ({
        id: a.id || `auditoria-${a.acao || ""}-${a.criadoEm || ""}`,
        icon: "🧾",
        titulo: a.acao || "Registro de auditoria",
        texto: `${a.usuario || "Sistema"} • ${a.modulo || "Sistema"}`,
        tempo: `${a.data || a.criadoEm || ""} ${a.hora || ""}`,
        tipo: "Auditoria"
      })),

      ...ocorrencias.slice(-4).map((o) => ({
        id: o.id || `ocorrencia-${o.titulo || ""}-${o.criadoEm || ""}`,
        icon: "💬",
        titulo: o.titulo || o.tipo || "Ocorrência registrada",
        texto:
          o.origem === "morador"
            ? `Solicitação do morador ${o.moradorNome || o.morador || ""}`
            : "Ocorrência registrada pela portaria",
        tempo: `${o.data || o.criadoEm || ""} ${o.hora || ""}`,
        tipo: "Ocorrência"
      })),

      ...encomendas.slice(-4).map((e) => ({
        id: e.id || `encomenda-${e.codigoInterno || e.codigo || ""}-${e.criadoEm || ""}`,
        icon: "📦",
        titulo: e.status === "esperada" || e.status === "Esperada"
          ? "Encomenda esperada"
          : "Encomenda registrada",
        texto: `Apartamento ${e.apartamento || e.apto || "N/A"}`,
        tempo: e.data || e.criadoEm || e.recebidoEm || "Agora",
        tipo: "Encomenda"
      })),

      ...reservas.slice(-4).map((r) => ({
        id: r.id || `reserva-${r.area || r.areaComum || ""}-${r.criadoEm || ""}`,
        icon: "📅",
        titulo: "Reserva solicitada",
        texto: r.area || r.areaComum || "Área comum",
        tempo: r.criadoEm || r.data || "Agora",
        tipo: "Reserva"
      })),

      ...visitantes.slice(-4).map((v) => ({
        id: v.id || `visitante-${v.nome || ""}-${v.data || ""}`,
        icon: "👤",
        titulo: "Visitante registrado",
        texto: v.nome || "Visitante",
        tempo: v.horarioEntrada || v.hora || v.data || "Agora",
        tipo: "Visitante"
      })),

      ...sugestoesReclamacoes.slice(-4).map((s) => ({
        id: s.id || `solicitacao-${s.titulo || s.tipo || ""}-${s.criadoEm || ""}`,
        icon: normalizarTexto(s.tipoRegistro || s.tipo || s.categoria).includes("reclama")
          ? "⚠️"
          : "💡",
        titulo: s.titulo || s.tipoRegistro || s.tipo || "Solicitação do morador",
        texto: s.descricao || s.mensagem || s.observacao || "Registro enviado pelo morador",
        tempo: s.data || s.criadoEm || "Agora",
        tipo: normalizarTexto(s.tipoRegistro || s.tipo || s.categoria).includes("reclama")
          ? "Reclamação"
          : "Sugestão"
      }))
    ];

    setAtividades(historico.reverse().slice(0, 12));
  }

  const totalOperacao =
    dados.encomendas +
    dados.visitantes +
    dados.reservas +
    dados.ocorrencias +
    dados.sugestoes +
    dados.reclamacoes +
    dados.notificacoes;

  const maxGrafico = Math.max(
    dados.moradores,
    dados.apartamentos,
    dados.porteiros,
    dados.prestadores,
    dados.encomendas,
    dados.visitantes,
    dados.reservas,
    dados.ocorrencias,
    dados.sugestoes,
    dados.reclamacoes,
    dados.movimentacoes,
    dados.notificacoes,
    dados.auditoria,
    1
  );

  function larguraGrafico(valor) {
    return `${Math.max((valor / maxGrafico) * 100, valor > 0 ? 8 : 0)}%`;
  }
    return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroBadge}>👑 Central de comando</span>

          <h1 style={styles.title}>Gestão Premium do Condomínio</h1>

          <p style={styles.subtitle}>
            Visão executiva com indicadores reais, módulos integrados
            e acompanhamento operacional em tempo real.
          </p>

          <div style={styles.heroInfo}>
            <span style={styles.heroDot}></span>
            Sistema online • {perfilCondominio.nomeCondominio}
          </div>

          <div style={styles.heroInfo}>
            Plano: {perfilCondominio.plano} • Status: {perfilCondominio.statusComercial}
            {perfilCondominio.quantidadeUnidades
              ? ` • Unidades: ${perfilCondominio.quantidadeUnidades}`
              : ""}
          </div>
        </div>

        <div style={styles.heroPanel}>
          <p style={styles.heroLabel}>Operações ativas</p>

          <h3 style={styles.heroNumber}>{totalOperacao}</h3>

          <span style={styles.heroStatus}>tempo real</span>
        </div>
      </div>

      <div style={styles.quickActions}>
        <button
          style={styles.quickPrimary}
          onClick={() => navigate("/dashboard/moradores")}
        >
          <span style={styles.quickIconLight}>👥</span>

          <div>
            <strong>Moradores</strong>
            <p>Gerenciar cadastros</p>
          </div>
        </button>

        <button
          style={styles.quickButton}
          onClick={() => navigate("/dashboard/apartamentos")}
        >
          <span style={styles.quickIcon}>🏢</span>

          <div>
            <strong>Apartamentos</strong>
            <p>Unidades cadastradas</p>
          </div>
        </button>

        <button
          style={styles.quickButton}
          onClick={() => navigate("/dashboard/avisos")}
        >
          <span style={styles.quickIcon}>📢</span>

          <div>
            <strong>Avisos</strong>
            <p>Central do síndico</p>
          </div>
        </button>

        <button
          style={styles.quickButton}
          onClick={() => setMostrarManual(true)}
        >
          <span style={styles.quickIcon}>📘</span>

          <div>
            <strong>Guia rápido</strong>
            <p>Manual de uso</p>
          </div>
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.cardPrimary}>
          <div>
            <p style={styles.cardLabelLight}>Moradores cadastrados</p>

            <h2 style={styles.cardNumberLight}>{dados.moradores}</h2>

            <span style={styles.cardHintLight}>base residencial</span>
          </div>

          <div style={styles.cardIconLight}>👥</div>
        </div>

        <KpiCard icon="🏢" label="Apartamentos" value={dados.apartamentos} color="#166534" bg="#dcfce7" />
        <KpiCard icon="🏠" label="Aptos ocupados" value={dados.apartamentosOcupados} color="#166534" bg="#dcfce7" />
        <KpiCard icon="👑" label="Moradores principais" value={dados.moradoresPrincipais} color="#1d4ed8" bg="#dbeafe" />
        <KpiCard icon="👨‍👩‍👧" label="Dependentes" value={dados.dependentes} color="#4338ca" bg="#e0e7ff" />
        <KpiCard icon="🛡️" label="Porteiros" value={dados.porteiros} color="#1d4ed8" bg="#dbeafe" />
        <KpiCard icon="🧰" label="Prestadores" value={dados.prestadores} color="#92400e" bg="#fef3c7" />
        <KpiCard icon="🔧" label="Prestadores em execução" value={dados.prestadoresExecucao} color="#92400e" bg="#fef3c7" />
        <KpiCard icon="✅" label="Prestadores finalizados" value={dados.prestadoresFinalizados} color="#166534" bg="#dcfce7" />
        <KpiCard icon="📦" label="Encomendas pendentes" value={dados.encomendas} color="#7c2d12" bg="#ffedd5" />
        <KpiCard icon="👤" label="Visitantes" value={dados.visitantes} color="#4338ca" bg="#e0e7ff" />
        <KpiCard icon="📅" label="Reservas pendentes" value={dados.reservas} color="#be123c" bg="#ffe4e6" />
        <KpiCard icon="💬" label="Ocorrências abertas" value={dados.ocorrencias} color="#dc2626" bg="#fee2e2" />
        <KpiCard icon="💡" label="Sugestões abertas" value={dados.sugestoes} color="#166534" bg="#dcfce7" />
        <KpiCard icon="⚠️" label="Reclamações abertas" value={dados.reclamacoes} color="#b91c1c" bg="#fee2e2" />
        <KpiCard icon="📢" label="Central do síndico" value={dados.avisos} color="#92400e" bg="#fef3c7" />
        <KpiCard icon="🔔" label="Notificações pendentes" value={dados.notificacoes} color="#92400e" bg="#fef3c7" />
        <KpiCard icon="🧾" label="Auditoria" value={dados.auditoria} color="#0f766e" bg="#ccfbf1" />
        <KpiCard icon="🛠️" label="Áreas em manutenção" value={dados.areasManutencao} color="#dc2626" bg="#fee2e2" />
      </div>

      <div style={styles.middleGrid}>
        <div style={styles.chartCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Visualização operacional
              </h2>

              <p style={styles.sectionSubtitle}>
                Gráfico temporário com dados reais já cadastrados no sistema.
              </p>
            </div>

            <span style={styles.sectionBadge}>
              Preview gráfico
            </span>
          </div>

          <div style={styles.chartList}>
            <ChartBar label="Moradores" value={dados.moradores} width={larguraGrafico(dados.moradores)} icon="👥" />
            <ChartBar label="Moradores principais" value={dados.moradoresPrincipais} width={larguraGrafico(dados.moradoresPrincipais)} icon="👑" />
            <ChartBar label="Dependentes" value={dados.dependentes} width={larguraGrafico(dados.dependentes)} icon="👨‍👩‍👧" />
            <ChartBar label="Apartamentos" value={dados.apartamentos} width={larguraGrafico(dados.apartamentos)} icon="🏢" />
            <ChartBar label="Aptos ocupados" value={dados.apartamentosOcupados} width={larguraGrafico(dados.apartamentosOcupados)} icon="🏠" />
            <ChartBar label="Porteiros" value={dados.porteiros} width={larguraGrafico(dados.porteiros)} icon="🛡️" />
            <ChartBar label="Prestadores" value={dados.prestadores} width={larguraGrafico(dados.prestadores)} icon="🧰" />
            <ChartBar label="Encomendas" value={dados.encomendas} width={larguraGrafico(dados.encomendas)} icon="📦" />
            <ChartBar label="Visitantes" value={dados.visitantes} width={larguraGrafico(dados.visitantes)} icon="👤" />
            <ChartBar label="Reservas" value={dados.reservas} width={larguraGrafico(dados.reservas)} icon="📅" />
            <ChartBar label="Ocorrências" value={dados.ocorrencias} width={larguraGrafico(dados.ocorrencias)} icon="💬" />
            <ChartBar label="Sugestões" value={dados.sugestoes} width={larguraGrafico(dados.sugestoes)} icon="💡" />
            <ChartBar label="Reclamações" value={dados.reclamacoes} width={larguraGrafico(dados.reclamacoes)} icon="⚠️" />
            <ChartBar label="Movimentações" value={dados.movimentacoes} width={larguraGrafico(dados.movimentacoes)} icon="📈" />
            <ChartBar label="Notificações" value={dados.notificacoes} width={larguraGrafico(dados.notificacoes)} icon="🔔" />
            <ChartBar label="Auditoria" value={dados.auditoria} width={larguraGrafico(dados.auditoria)} icon="🧾" />
          </div>
        </div>

        <div style={styles.controlPanel}>
          <span style={styles.controlBadge}>
            Painel inteligente
          </span>

          <h2 style={styles.controlTitle}>
            Central de prioridades
          </h2>

          <div style={styles.priorityList}>
            <PriorityItem icon="💬" label="Ocorrências abertas" value={dados.ocorrencias} alert={dados.ocorrencias > 0} />
            <PriorityItem icon="📅" label="Reservas pendentes" value={dados.reservas} alert={dados.reservas > 0} />
            <PriorityItem icon="📦" label="Encomendas pendentes" value={dados.encomendas} alert={dados.encomendas > 0} />
            <PriorityItem icon="👤" label="Visitantes registrados" value={dados.visitantes} alert={dados.visitantes > 0} />
            <PriorityItem icon="💡" label="Sugestões abertas" value={dados.sugestoes} alert={dados.sugestoes > 0} />
            <PriorityItem icon="⚠️" label="Reclamações abertas" value={dados.reclamacoes} alert={dados.reclamacoes > 0} />
            <PriorityItem icon="🔔" label="Notificações pendentes" value={dados.notificacoes} alert={dados.notificacoes > 0} />
            <PriorityItem icon="🧾" label="Logs de auditoria" value={dados.auditoria} alert={false} />
          </div>

          <button
            style={styles.manualButton}
            onClick={() => setMostrarManual(true)}
          >
            Abrir mini manual
          </button>
        </div>
      </div>

      <div style={styles.activityCard}>
        <div style={styles.activityHeader}>
          <div>
            <h3 style={styles.activityTitle}>
              Atividades recentes
            </h3>

            <p style={styles.sectionSubtitle}>
              Últimas ações reais registradas no sistema.
            </p>
          </div>

          <span style={styles.viewAll}>
            Sistema ativo
          </span>
        </div>

        {atividades.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📭</div>

            <h3 style={styles.emptyTitle}>
              Nenhuma atividade recente
            </h3>

            <p style={styles.emptyText}>
              As atividades aparecerão quando houver cadastros,
              reservas, visitas, encomendas, notificações, auditorias ou ocorrências.
            </p>
          </div>
        ) : (
          <div style={styles.timeline}>
            {atividades.map((item, index) => (
              <div key={item.id || index} style={styles.activityItem}>
                <div style={styles.activityIcon}>
                  {item.icon}
                </div>

                <div style={styles.activityContent}>
                  <span style={styles.activityType}>
                    {item.tipo}
                  </span>

                  <h4 style={styles.activityItemTitle}>
                    {item.titulo}
                  </h4>

                  <p style={styles.activityText}>
                    {item.texto}
                  </p>

                  <small style={styles.time}>
                    {item.tempo}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
            {mostrarManual && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHero}>
              <div>
                <span style={styles.modalBadge}>
                  📘 Mini manual
                </span>

                <h2 style={styles.modalTitle}>
                  Como usar o painel do síndico
                </h2>

                <p style={styles.modalText}>
                  Guia rápido para operar os módulos principais do sistema.
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setMostrarManual(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.manualGrid}>
              <ManualItem number="01" title="Cadastre apartamentos" text="Comece criando as unidades reais do condomínio. Elas serão usadas em moradores, reservas e portaria." />
              <ManualItem number="02" title="Cadastre moradores" text="Vincule cada morador ao apartamento correto para liberar integração com encomendas, visitantes e login do morador." />
              <ManualItem number="03" title="Cadastre porteiros" text="Os porteiros terão login próprio para registrar visitantes, encomendas e ocorrências." />
              <ManualItem number="04" title="Crie áreas comuns" text="As áreas cadastradas aparecem no módulo de reservas dos moradores." />
              <ManualItem number="05" title="Publique avisos" text="Os comunicados e registros da central aparecem no painel do síndico e alimentam relatórios e BI." />
              <ManualItem number="06" title="Acompanhe operações" text="Reservas, ocorrências, visitantes, reclamações, notificações e auditorias aparecem no dashboard conforme forem gerados." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color, bg }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ ...styles.kpiIcon, background: bg }}>
        {icon}
      </div>

      <div>
        <p style={styles.kpiLabel}>{label}</p>

        <h2 style={{ ...styles.kpiValue, color }}>
          {value}
        </h2>
      </div>
    </div>
  );
}

function ChartBar({ icon, label, value, width }) {
  return (
    <div style={styles.chartRow}>
      <div style={styles.chartInfo}>
        <span style={styles.chartIcon}>{icon}</span>
        <span>{label}</span>
      </div>

      <div style={styles.chartTrack}>
        <div style={{ ...styles.chartFill, width }}></div>
      </div>

      <strong style={styles.chartValue}>
        {value}
      </strong>
    </div>
  );
}

function PriorityItem({ icon, label, value, alert }) {
  return (
    <div style={styles.priorityItem}>
      <div style={styles.priorityLeft}>
        <span style={styles.priorityIcon}>
          {icon}
        </span>

        <span>{label}</span>
      </div>

      <strong
        style={{
          ...styles.priorityValue,
          color: alert ? "#dc2626" : "#166534"
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ManualItem({ number, title, text }) {
  return (
    <div style={styles.manualItem}>
      <span style={styles.manualNumber}>
        {number}
      </span>

      <h3 style={styles.manualTitle}>
        {title}
      </h3>

      <p style={styles.manualText}>
        {text}
      </p>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827"
  },

  hero: {
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.32),transparent 36%), linear-gradient(135deg,#031b0f,#064e3b,#166534)",
    borderRadius: "34px",
    padding: "34px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "30px",
    marginBottom: "26px",
    boxShadow: "0 24px 60px rgba(22,101,52,0.30)",
    position: "relative",
    overflow: "hidden"
  },

  heroBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    display: "inline-block",
    marginBottom: "16px"
  },

  title: {
    margin: 0,
    fontSize: "40px",
    letterSpacing: "-0.8px"
  },

  subtitle: {
    margin: "12px 0 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "730px",
    lineHeight: "1.55",
    fontSize: "15px"
  },

  heroInfo: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#dcfce7",
    fontSize: "14px",
    fontWeight: "700"
  },

  heroDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 0 5px rgba(34,197,94,0.16)"
  },

  heroPanel: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "26px",
    padding: "24px",
    width: "100%",
    maxWidth: "245px",
    textAlign: "center"
  },

  heroLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.70)",
    fontSize: "13px"
  },

  heroNumber: {
    margin: "8px 0 12px",
    color: "white",
    fontSize: "42px"
  },

  heroStatus: {
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  quickActions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  quickPrimary: {
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    color: "white",
    border: "none",
    padding: "22px",
    borderRadius: "26px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    boxShadow: "0 16px 35px rgba(22,163,74,0.24)"
  },

  quickButton: {
    background: "white",
    color: "#111827",
    border: "1px solid #eef2f7",
    padding: "22px",
    borderRadius: "26px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    textAlign: "left",
    boxShadow: "0 12px 35px rgba(15,23,42,0.07)"
  },

  quickIconLight: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  quickIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "18px",
    marginBottom: "26px"
  },

  cardPrimary: {
    background: "linear-gradient(135deg,#064e3b,#16a34a)",
    borderRadius: "26px",
    padding: "24px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 16px 35px rgba(22,163,74,0.22)"
  },

  cardLabelLight: {
    margin: 0,
    color: "rgba(255,255,255,0.76)",
    fontSize: "14px"
  },

  cardNumberLight: {
    margin: "10px 0 2px",
    color: "white",
    fontSize: "40px"
  },

  cardHintLight: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "13px"
  },

  cardIconLight: {
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px"
  },

  kpiCard: {
    background: "white",
    borderRadius: "26px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 12px 35px rgba(15,23,42,0.07)",
    border: "1px solid #eef2f7"
  },

  kpiIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "19px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    flexShrink: 0
  },

  kpiLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  kpiValue: {
    margin: "8px 0 0",
    fontSize: "36px"
  },

  middleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: "24px",
    marginBottom: "26px"
  },

  chartCard: {
    background: "white",
    borderRadius: "30px",
    padding: "28px",
    boxShadow: "0 16px 45px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  controlPanel: {
    background:
      "radial-gradient(circle at top right,rgba(187,247,208,0.28),transparent 34%), linear-gradient(135deg,#052e16,#14532d)",
    color: "white",
    borderRadius: "30px",
    padding: "28px",
    boxShadow: "0 18px 50px rgba(20,83,45,0.22)"
  },

  controlBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  controlTitle: {
    margin: "18px 0 20px",
    fontSize: "25px"
  },

  priorityList: {
    display: "flex",
    flexDirection: "column",
    gap: "13px"
  },

  priorityItem: {
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "17px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  priorityLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(255,255,255,0.82)",
    fontSize: "13px",
    fontWeight: "800"
  },

  priorityIcon: {
    fontSize: "20px"
  },

  priorityValue: {
    background: "white",
    padding: "6px 10px",
    borderRadius: "12px"
  },

  manualButton: {
    width: "100%",
    marginTop: "20px",
    background: "#dcfce7",
    color: "#166534",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "900"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "22px"
  },

  sectionTitle: {
    margin: 0,
    color: "#052e16",
    fontSize: "25px"
  },

  sectionSubtitle: {
    margin: "7px 0 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5"
  },

  sectionBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  chartList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  chartRow: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 40px",
    gap: "14px",
    alignItems: "center"
  },

  chartInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#374151",
    fontWeight: "800",
    fontSize: "14px"
  },

  chartIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  chartTrack: {
    height: "13px",
    background: "#f3f4f6",
    borderRadius: "999px",
    overflow: "hidden"
  },

  chartFill: {
    height: "100%",
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    borderRadius: "999px"
  },

  chartValue: {
    textAlign: "right",
    color: "#052e16"
  },

  activityCard: {
    background: "white",
    borderRadius: "30px",
    padding: "28px",
    boxShadow: "0 16px 45px rgba(15,23,42,0.08)",
    border: "1px solid #eef2f7"
  },

  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "22px"
  },

  activityTitle: {
    margin: 0,
    color: "#052e16",
    fontSize: "25px"
  },

  viewAll: {
    color: "#166534",
    fontSize: "13px",
    fontWeight: "900",
    background: "#dcfce7",
    padding: "8px 12px",
    borderRadius: "999px"
  },

  empty: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#6b7280"
  },

  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  activityItem: {
    display: "flex",
    gap: "14px",
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "20px",
    padding: "16px"
  },

  activityIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "16px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0
  },

  activityContent: {
    flex: 1
  },

  activityType: {
    display: "inline-block",
    background: "white",
    border: "1px solid #e5e7eb",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    marginBottom: "7px"
  },

  activityItemTitle: {
    margin: 0,
    color: "#111827"
  },

  activityText: {
    margin: "5px 0",
    color: "#6b7280"
  },

  time: {
    color: "#9ca3af"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "20px"
  },

  modal: {
    width: "100%",
    maxWidth: "850px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#f8fafc",
    borderRadius: "34px",
    padding: "26px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalHero: {
    background:
      "linear-gradient(135deg,#052e16,#166534)",
    color: "white",
    borderRadius: "28px",
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px"
  },

  modalBadge: {
    background: "rgba(255,255,255,0.14)",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  modalTitle: {
    margin: "16px 0 8px",
    fontSize: "28px"
  },

  modalText: {
    margin: 0,
    color: "rgba(255,255,255,0.75)"
  },

  closeButton: {
    width: "42px",
    height: "42px",
    borderRadius: "15px",
    border: "none",
    background: "rgba(255,255,255,0.14)",
    color: "white",
    cursor: "pointer",
    fontWeight: "900"
  },

  manualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "16px"
  },

  manualItem: {
    background: "white",
    border: "1px solid #eef2f7",
    borderRadius: "22px",
    padding: "20px"
  },

  manualNumber: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "12px"
  },

  manualTitle: {
    margin: "0 0 8px",
    color: "#052e16"
  },

  manualText: {
    margin: 0,
    color: "#6b7280",
    lineHeight: "1.5",
    fontSize: "14px"
  }
};

export default DashboardSindico;