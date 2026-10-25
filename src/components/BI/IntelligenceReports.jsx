import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Users,
  UserRound,
  Package,
  CalendarDays,
  TriangleAlert,
  Briefcase,
  Megaphone,
  Landmark,
  ClipboardList,
  ShieldCheck,
  FilePenLine,
  Star,
  Download,
  RefreshCw,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import api from "../../Services/api.js";
import {
  prepareReportDocument,
  downloadReportDocument,
  reportDate,
  reportMillimeters as mm,
} from "../../utils/reportWorkspaceDocument.js";
import "../../styles/reportWorkspace.css";
const icons = {
  executive: FileText,
  residents: Users,
  visitors: UserRound,
  packages: Package,
  reservations: CalendarDays,
  occurrences: TriangleAlert,
  providers: Briefcase,
  communications: Megaphone,
  areas: Landmark,
  operational: ClipboardList,
  security: ShieldCheck,
  custom: FilePenLine,
};
const datasetLabels = {
  packages: "Encomendas",
  visitors: "Visitantes",
  reservations: "Reservas",
  occurrences: "Ocorrências",
  residents: "Moradores",
  apartments: "Apartamentos",
  doormen: "Porteiros",
  areas: "Áreas comuns",
  notices: "Avisos",
  providers: "Prestadores",
  operational: "Registros operacionais",
};

function defaults() {
  const end = new Date().toLocaleDateString("sv-SE");
  return {
    subject: "executive",
    start: end.slice(0, 8) + "01",
    end,
    content: "summary",
    groups: [],
    datasets: [],
    responsible: "",
    notes: "",
    status: "",
    apartmentId: "",
    floor: "",
    block: "",
    person: "",
    includeLogo: true,
  };
}
const clean = (config) =>
  Object.fromEntries(
    Object.entries(config)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([k, v]) => [k, k === "floor" ? Number(v) : v]),
  );
const key = (config) =>
  JSON.stringify(
    Object.entries(clean(config))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, Array.isArray(v) ? [...v].sort() : v]),
  );
function allowed(config, boot) {
  if (!boot?.hasBI) return [];
  return (boot.relevance?.[config.subject] || []).filter(
    (id) =>
      boot.groups.some(([k]) => k === id) &&
      (!(config.apartmentId || config.floor !== "") ||
        ["withdrawal", "serviceTimes"].includes(id)),
  );
}
function Paper({ model, layout, page }) {
  return (
    <article
      className="ic-rw-paper"
      aria-label={`Prévia da página ${page + 1}`}
    >
      <div className="ic-rw-paper-rule" />
      <h3>{model.title}</h3>
      <p className="ic-rw-paper-condo">{model.condominiumName}</p>
      <p className="ic-rw-paper-meta">
        Relatório nº {model.number} • Emitido em{" "}
        {reportDate(model.emittedDay || model.generatedAt)}
      </p>
      <p className="ic-rw-paper-period">
        Período: {reportDate(model.start)} a {reportDate(model.end)}
      </p>
      <p className="ic-rw-paper-responsible">
        Responsável: {model.responsible}
      </p>
      <p className="ic-rw-paper-content">
        {model.content === "summary"
          ? "Resumo executivo"
          : "Relatório detalhado"}
      </p>
      {layout.logoDataUrl && (
        <img
          className="ic-rw-paper-logo"
          src={layout.logoDataUrl}
          alt="Logo do condomínio"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      {layout.pages[page]?.blocks.map((block, i) => (
        <section
          className="ic-rw-paper-block"
          style={{ top: mm(block.y) }}
          key={`${block.title}-${i}`}
        >
          <h4>{block.title}</h4>
          {block.kind === "text" ? (
            <p className="ic-rw-paper-text">{block.lines.join("\n")}</p>
          ) : (
            <table>
              <colgroup>
                {block.widths.map((width, j) => (
                  <col key={j} style={{ width: mm(width) }} />
                ))}
              </colgroup>
              <thead>
                <tr style={{ height: mm(block.headerHeight) }}>
                  {block.headerLines.map((lines, j) => (
                    <th key={j}>
                      {lines.map((text, n) => (
                        <span key={n}>{text}</span>
                      ))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j} style={{ height: mm(row.height) }}>
                    {row.cells.map((lines, k) => (
                      <td key={k}>
                        {lines.map((text, n) => (
                          <span key={n}>{text || " "}</span>
                        ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
      <footer className="ic-rw-paper-footer">
        <span>InfinityCondo • Documento administrativo</span>
        <span>
          Página {page + 1} de {layout.pages.length}
        </span>
      </footer>
    </article>
  );
}
export default function IntelligenceReports() {
  const [boot, setBoot] = useState(null),
    [config, setConfig] = useState(defaults),
    [preview, setPreview] = useState(null),
    [document, setDocument] = useState(null),
    [busy, setBusy] = useState(false),
    [exporting, setExporting] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [preset, setPreset] = useState(""),
    [saving, setSaving] = useState(false),
    [saveOpen, setSaveOpen] = useState(false),
    [modelName, setModelName] = useState(""),
    [page, setPage] = useState(0),
    [zoom, setZoom] = useState(1),
    [paperWidth, setPaperWidth] = useState(650),
    [history, setHistory] = useState([]);
  const alive = useRef(false),
    sequence = useRef(0),
    viewport = useRef(null),
    previewPanel = useRef(null);
  useEffect(()=>{let mounted=true;const refreshHistory=()=>api.get("/v1/management-reports/workspace/history").then(r=>{if(mounted)setHistory(r.data);}).catch(()=>{});window.addEventListener("infinitycondo:report-issued",refreshHistory);return ()=>{mounted=false;window.removeEventListener("infinitycondo:report-issued",refreshHistory);};},[]);
  const load = useCallback(async (selection) => {
    const request = ++sequence.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.post(
        "/v1/management-reports/workspace/preview",
        clean(selection),
      );
      const prepared = await prepareReportDocument(response.data.model);
      if (alive.current && request === sequence.current) {
        setPreview(response.data);
        setDocument(prepared);
        setPage(0);
      }
    } catch (e) {
      if (alive.current && request === sequence.current) {
        setError(e.message || "Não foi possível gerar a prévia.");
        if ([401, 403].includes(e.status)) {
          setPreview(null);
          setDocument(null);
        }
      }
    } finally {
      if (alive.current && request === sequence.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    api
      .get("/v1/management-reports/workspace")
      .then((r) => {
        if (!alive.current) return;
        const data = r.data;
        setBoot(data);
        setHistory(data.history);
        const initial = {
          ...defaults(),
          groups: data.hasBI
            ? data.groups.map(([id]) => id).filter((id) => id !== "sessions")
            : [],
        };
        setConfig(initial);
        void load(initial);
      })
      .catch((e) => {
        if (alive.current) setError(e.message);
      });
    return () => {
      alive.current = false;
      sequence.current++;
    };
  }, [load]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setPaperWidth(Math.max(100, entry.contentRect.width - 32)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const patch = (updates) =>
    setConfig((old) => {
      const next = { ...old, ...updates };
      next.groups = next.groups.filter((id) =>
        allowed(next, boot).includes(id),
      );
      if (next.apartmentId || next.floor !== "")
        next.datasets = next.datasets.filter((id) =>
          [
            "residents",
            "apartments",
            "packages",
            "visitors",
            "reservations",
            "occurrences",
          ].includes(id),
        );
      return next;
    });
  const dirty =
    !!preview &&
    key(config) !== key({ ...defaults(), ...preview.model.config });
  const selectedGroups = allowed(config, boot),
    groups = boot?.groups.filter(([id]) => selectedGroups.includes(id)) || [];
  async function savePreset() {
    if (saving || !modelName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.post(
        "/v1/management-reports/workspace/presets",
        { name: modelName.trim(), config: clean(config) },
      );
      setBoot((old) => ({
        ...old,
        presets: [
          result.data,
          ...old.presets.filter((p) => p.id !== result.data.id),
        ],
      }));
      setPreset(result.data.id);
      setSaveOpen(false);
      setMessage(
        "Modelo salvo. Observações e conteúdo do documento não são armazenados no modelo.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function exportFile(format) {
    if (exporting || busy || !preview || dirty) return;
    setExporting(true);
    setError("");
    try {
      await api.post("/v1/management-reports/workspace/archive", {
        ...preview,
        format,
      });
      await downloadReportDocument(preview.model, format, document?.blob);
      const response = await api.get(
        "/v1/management-reports/workspace/history",
      );
      setHistory(response.data);
      setMessage(
        "Documento gerado. A cópia emitida está disponível no histórico deste usuário.",
      );
    } catch (e) {
      setError(e.message);
      if ([401, 403].includes(e.status)) {
        setPreview(null);
        setDocument(null);
      }
    } finally {
      setExporting(false);
    }
  }
  async function downloadHistory(id) {
    if (exporting) return;
    setExporting(true);
    setError("");
    try {
      const response = await api.get(
        `/v1/management-reports/workspace/history/${id}`,
      );
      await downloadReportDocument(response.data.model, response.data.format);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }
  async function fullscreen() {
    try {
      await previewPanel.current?.requestFullscreen?.();
    } catch {
      setError("O navegador não permitiu ampliar a prévia.");
    }
  }
  const toggleGroup = (id, checked) =>
    patch({
      groups: checked
        ? [...config.groups, id]
        : config.groups.filter((key) => key !== id),
    });
  const metricCheckbox = ([id, label]) => (
    <label key={id}>
      <input
        type="checkbox"
        checked={config.groups.includes(id)}
        onChange={(e) => toggleGroup(id, e.target.checked)}
      />
      {label}
    </label>
  );
  const scale = (paperWidth / ((210 * 96) / 25.4)) * zoom,
    model = preview?.model;
  return (
    <section className="ic-report-workspace">
      <header>
        <h1>Relatórios</h1>
        <p>Selecione o assunto, confira a prévia e exporte.</p>
      </header>
      {error && (
        <div className="ic-rw-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="ic-rw-status" role="status">
          {message}
        </div>
      )}
      <div className="ic-rw-grid">
        <section className="ic-rw-panel">
          <h2>Montar relatório</h2>
          <label htmlFor="rw-preset">Modelo salvo</label>
          <div className="ic-rw-preset-row">
            <select
              id="rw-preset"
              value={preset}
              disabled={!boot}
              onChange={(e) => {
                setPreset(e.target.value);
                const saved = boot.presets.find((p) => p.id === e.target.value);
                if (saved) {
                  const next = { ...defaults(), ...saved.config };
                  next.groups = next.groups.filter((id) =>
                    allowed(next, boot).includes(id),
                  );
                  setConfig(next);
                }
              }}
            >
              <option value="">Selecione um modelo</option>
              {boot?.presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!boot}
              onClick={() => setSaveOpen(!saveOpen)}
            >
              <Star size={16} />
              Salvar modelo
            </button>
          </div>
          {saveOpen && (
            <div className="ic-rw-save-model">
              <label htmlFor="rw-model-name">Nome do modelo</label>
              <input
                id="rw-model-name"
                value={modelName}
                maxLength={60}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Ex.: Resumo mensal"
              />
              <div>
                <button
                  disabled={saving || modelName.trim().length < 2}
                  onClick={savePreset}
                >
                  Salvar
                </button>
                <button onClick={() => setSaveOpen(false)}>Cancelar</button>
              </div>
            </div>
          )}
          <span className="ic-rw-legend">Tipo de relatório</span>
          <div
            className="ic-rw-types"
            role="group"
            aria-label="Tipo de relatório"
          >
            {boot?.subjects.map(([id, label, description]) => {
              const Icon = icons[id] || FileText;
              return (
                <button
                  type="button"
                  key={id}
                  aria-pressed={config.subject === id}
                  className={config.subject === id ? "selected" : ""}
                  onClick={() =>
                    patch({
                      subject: id,
                      status: "",
                      datasets: id === "custom" ? config.datasets : [],
                      ...(![
                        "executive",
                        "custom",
                        "residents",
                        "packages",
                        "visitors",
                        "reservations",
                        "occurrences",
                      ].includes(id)
                        ? { apartmentId: "", floor: "", block: "", person: "" }
                        : {}),
                    })
                  }
                >
                  <Icon />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <label>Período</label>
          <div className="ic-rw-date-row">
            <input
              aria-label="Data inicial"
              required
              type="date"
              value={config.start}
              onChange={(e) => patch({ start: e.target.value })}
            />
            <span>a</span>
            <input
              aria-label="Data final"
              required
              type="date"
              min={config.start}
              value={config.end}
              onChange={(e) => patch({ end: e.target.value })}
            />
          </div>
          <label htmlFor="rw-unit">Unidade</label>
          <select
            id="rw-unit"
            disabled={
              ![
                "executive",
                "custom",
                "residents",
                "packages",
                "visitors",
                "reservations",
                "occurrences",
              ].includes(config.subject)
            }
            value={config.apartmentId}
            onChange={(e) =>
              patch({
                apartmentId: e.target.value,
                floor: "",
                block: "",
                person: "",
              })
            }
          >
            <option value="">Todas as unidades</option>
            {boot?.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {[unit.block, unit.number].filter(Boolean).join(" · ")}
              </option>
            ))}
          </select>
          <span className="ic-rw-legend">Conteúdo</span>
          <div className="ic-rw-content">
            {[
              ["summary", "Resumo executivo"],
              ["detailed", "Detalhado"],
            ].map(([value, label]) => (
              <label
                className={config.content === value ? "selected" : ""}
                key={value}
              >
                <input
                  type="radio"
                  name="report-content"
                  value={value}
                  checked={config.content === value}
                  onChange={() => patch({ content: value })}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="ic-rw-section-title">
            <strong>Métricas do relatório</strong>
            <span>Opções conforme o assunto selecionado</span>
          </div>
          <div className="ic-rw-metrics">
            {groups.slice(0, 6).map(metricCheckbox)}
          </div>
          {!groups.length && (
            <p className="ic-rw-methodology">
              {boot?.hasBI
                ? "Não há métricas adicionais para esta seleção."
                : "As métricas complementares seguem a disponibilidade do plano."}
            </p>
          )}
          {groups.length > 6 && (
            <details className="ic-rw-more">
              <summary>
                <span>
                  <ChevronDown size={13} /> Mais métricas
                </span>
                <span className="ic-rw-metric-chips">
                  {groups
                    .slice(6, 8)
                    .filter(([id]) => config.groups.includes(id))
                    .map(([id, label]) => (
                      <small key={id}>✓ {label}</small>
                    ))}
                </span>
              </summary>
              <div className="ic-rw-metrics">
                {groups.slice(6).map(metricCheckbox)}
              </div>
            </details>
          )}
          <details className="ic-rw-identification">
            <summary>
              Identificação e observações{" "}
              <span>Administração • logo opcional</span>
            </summary>
            <label>
              Responsável
              <input
                value={config.responsible}
                maxLength={120}
                onChange={(e) => patch({ responsible: e.target.value })}
                placeholder="Síndico / Administração"
              />
            </label>
            <label>
              Observações
              <textarea
                value={config.notes}
                maxLength={1500}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={3}
              />
            </label>
            <label className="ic-rw-optional-logo">
              <input
                type="checkbox"
                checked={config.includeLogo}
                onChange={(e) => patch({ includeLogo: e.target.checked })}
              />
              Incluir logo cadastrada, se disponível (opcional)
            </label>
            <p className="ic-rw-methodology">
              {model?.logoUrl
                ? document?.logoDataUrl
                  ? "A logo cadastrada será incluída."
                  : "A logo não pôde ser carregada. O documento pode ser emitido sem ela."
                : "Sem logo cadastrada, o documento é emitido normalmente."}
            </p>
            <label>
              Situação
              <select
                value={config.status}
                onChange={(e) => patch({ status: e.target.value })}
              >
                <option value="">Todas</option>
                {(
                  {
                    packages: ["EXPECTED", "RECEIVED", "DELIVERED", "CANCELED"],
                    visitors: ["WAITING", "INSIDE", "EXITED", "DENIED"],
                    reservations: ["PENDING", "APPROVED", "DENIED", "CANCELED"],
                    occurrences: ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"],
                  }[config.subject] || []
                ).map((status) => (
                  <option key={status} value={status}>
                    {
                      {
                        EXPECTED: "Esperada",
                        RECEIVED: "Aguardando retirada",
                        DELIVERED: "Retirada concluída",
                        CANCELED: "Cancelado",
                        WAITING: "Aguardando",
                        INSIDE: "Presente",
                        EXITED: "Saiu",
                        DENIED: "Recusado",
                        PENDING: "Pendente",
                        APPROVED: "Aprovado",
                        NEW: "Nova",
                        IN_PROGRESS: "Em atendimento",
                        RESOLVED: "Resolvida",
                        CLOSED: "Encerrada",
                      }[status]
                    }
                  </option>
                ))}
              </select>
            </label>
            <label>
              Andar (opcional)
              <input
                type="number"
                min="-20"
                max="300"
                value={config.floor}
                onChange={(e) =>
                  patch({ floor: e.target.value, apartmentId: "", person: "" })
                }
              />
            </label>
            {(config.apartmentId || config.floor !== "") && (
              <label>
                Pessoa vinculada
                <select
                  value={config.person}
                  onChange={(e) => patch({ person: e.target.value })}
                >
                  <option value="">Todas as pessoas da seleção</option>
                  {boot?.units
                    .filter((u) =>
                      config.apartmentId
                        ? u.id === config.apartmentId
                        : Number(u.floor) === Number(config.floor),
                    )
                    .flatMap((u) =>
                      (u.residents || []).map((p) => (
                        <option value={p.userId} key={p.userId}>
                          {p.user.name}
                        </option>
                      )),
                    )}
                </select>
              </label>
            )}
            <label>
              Bloco (consulta por andar)
              <input
                disabled={config.floor === ""}
                value={config.block}
                maxLength={40}
                onChange={(e) => patch({ block: e.target.value })}
              />
            </label>
            {config.subject === "custom" && (
              <>
                <span className="ic-rw-legend">
                  Cadastros e registros do personalizado
                </span>
                <p className="ic-rw-methodology">
                  Sem seleção, serão incluídas encomendas, visitas, reservas e
                  ocorrências.
                </p>
                <div className="ic-rw-data-options">
                  {Object.entries(datasetLabels).map(([id, label]) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        disabled={
                          !!(config.apartmentId || config.floor !== "") &&
                          ![
                            "residents",
                            "apartments",
                            "packages",
                            "visitors",
                            "reservations",
                            "occurrences",
                          ].includes(id)
                        }
                        checked={config.datasets.includes(id)}
                        onChange={(e) =>
                          patch({
                            datasets: e.target.checked
                              ? [...config.datasets, id]
                              : config.datasets.filter((x) => x !== id),
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </details>
          <div className="ic-rw-confirm">
            <FileText size={20} />
            <div>
              <strong>Conferência da exportação</strong>
              <p>
                {model
                  ? `${reportDate(model.start)} a ${reportDate(model.end)} • ${model.scope} • ${model.content === "summary" ? "Resumo executivo" : "Detalhado"}`
                  : "Atualize a prévia para conferir os dados."}
              </p>
              <p>
                {model
                  ? `${model.recordCount} registros ${model.content === "summary" ? "no resumo principal" : "no detalhamento"} • Dados pessoais conforme as permissões`
                  : "Os registros são consultados na base do condomínio."}
              </p>
            </div>
          </div>
          {dirty && (
            <p className="ic-rw-status" role="status">
              Seleção alterada. Atualize a prévia para liberar a exportação.
            </p>
          )}
          <div className="ic-rw-actions">
            <button
              className="ic-rw-primary"
              disabled={!model || dirty || busy || exporting}
              onClick={() => exportFile("PDF")}
            >
              <FileText size={15} />
              Gerar PDF
            </button>
            <button
              disabled={!model || dirty || busy || exporting}
              onClick={() => exportFile("XLSX")}
            >
              <FileSpreadsheet size={15} />
              Excel
            </button>
            <button
              disabled={!model || dirty || busy || exporting}
              onClick={() => exportFile("CSV")}
            >
              <FileText size={15} />
              CSV
            </button>
            <button
              disabled={busy || !boot || exporting}
              onClick={() => void load(config)}
            >
              <RefreshCw size={16} />
              {busy ? "Consultando…" : "Atualizar prévia"}
            </button>
          </div>
        </section>
        <section className="ic-rw-panel ic-rw-preview" ref={previewPanel}>
          <div className="ic-rw-preview-header">
            <div>
              <h2>Prévia do relatório</h2>
              <p>Documento A4</p>
            </div>
            <div className="ic-rw-preview-tools">
              <button
                aria-label="Diminuir prévia"
                onClick={() => setZoom(Math.max(0.75, zoom - 0.1))}
              >
                <ZoomOut size={17} />
              </button>
              <button
                aria-label="Aumentar prévia"
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              >
                <ZoomIn size={17} />
              </button>
              <button
                aria-label="Ampliar prévia em tela cheia"
                onClick={fullscreen}
              >
                <Maximize2 size={17} />
              </button>
            </div>
          </div>
          <div className="ic-rw-paper-viewport" ref={viewport}>
            {model && document ? (
              <div
                className="ic-rw-paper-shell"
                style={{
                  width: ((210 * 96) / 25.4) * scale,
                  height: ((297 * 96) / 25.4) * scale,
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <Paper model={model} layout={document} page={page} />
                </div>
              </div>
            ) : (
              <div className="ic-rw-empty">
                {busy
                  ? "Preparando o documento com os dados do condomínio…"
                  : "Nenhum documento carregado. Clique em Atualizar prévia."}
              </div>
            )}
          </div>
          {document && (
            <div className="ic-rw-pagination">
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                Anterior
              </button>
              <span>
                Página {page + 1} de {document.pages.length}
              </span>
              <button
                disabled={page >= document.pages.length - 1}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </button>
            </div>
          )}
        </section>
      </div>
      <section className="ic-rw-panel ic-rw-history">
        <h2>Relatórios gerados</h2>
        <p>
          Últimos documentos emitidos pelo seu usuário. O download preserva os
          dados da emissão.
        </p>
        {history.map((row) => (
          <div className="ic-rw-history-row" key={row.id}>
            <FileText size={16} />
            <span>
              {row.number} • {row.title} • {reportDate(row.start)} a{" "}
              {reportDate(row.end)} • {row.responsible} • {row.format}
            </span>
            <button
              aria-label={`Baixar relatório ${row.number}`}
              disabled={exporting}
              onClick={() => downloadHistory(row.id)}
            >
              <Download size={17} />
            </button>
          </div>
        ))}
        {!history.length && <p>Nenhum relatório gerado ainda.</p>}
      </section>
      {model?.methodology.length > 0 && (
        <details className="ic-rw-methodology">
          <summary>Metodologia e origem dos indicadores</summary>
          <ul>
            {model.methodology.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
