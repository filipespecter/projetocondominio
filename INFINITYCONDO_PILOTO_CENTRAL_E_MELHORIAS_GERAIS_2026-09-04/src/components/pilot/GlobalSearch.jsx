import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import searchApi from "../../Services/searchApi.js";

const groups = [
  ["apartments", "Apartamentos", "/dashboard/apartamentos", (x) => `${x.block || ""} ${x.number || ""}`.trim()],
  ["residents", "Moradores", "/dashboard/moradores", (x) => `${x.user?.name || "Morador"} • ${x.apartment?.block || ""}${x.apartment?.number || ""}`],
  ["visitors", "Visitantes", "/dashboard/visitantes", (x) => `${x.name || "Visitante"} • ${x.apartment?.block || ""}${x.apartment?.number || ""}`],
  ["packages", "Encomendas", "/dashboard/encomendas", (x) => `${x.description || x.trackingCode || "Encomenda"} • ${x.apartment?.block || ""}${x.apartment?.number || ""}`],
  ["occurrences", "Ocorrências", "/dashboard/sindico", (x) => `${x.title || "Ocorrência"} • ${x.category || ""}`],
];

function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function change(value) {
    setQuery(value);
    clearTimeout(timer.current);
    if (value.trim().length < 2) { setResults({}); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { setResults(await searchApi.search(value.trim())); }
      catch { setResults({}); }
      finally { setLoading(false); }
    }, 260);
  }

  const total = useMemo(() => groups.reduce((sum, [key]) => sum + (results?.[key]?.length || 0), 0), [results]);
  const open = query.trim().length >= 2;

  return (
    <div className="pilot-global-search" style={styles.wrap}>
      <FaSearch style={styles.icon} />
      <input value={query} onChange={(e) => change(e.target.value)} style={styles.input} placeholder="Buscar morador, apartamento, visitante, encomenda..." aria-label="Busca global" />
      {query && <button type="button" style={styles.clear} onClick={() => { setQuery(""); setResults({}); }} aria-label="Limpar busca"><FaTimes /></button>}
      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHead}>{loading ? "Buscando..." : `${total} resultado(s)`}</div>
          {!loading && total === 0 && <div style={styles.empty}>Nenhum resultado encontrado.</div>}
          {groups.map(([key, label, route, formatter]) => (results?.[key]?.length ? (
            <section key={key} style={styles.group}>
              <strong style={styles.groupTitle}>{label}</strong>
              {results[key].map((item) => <button type="button" key={item.id} style={styles.row} onClick={() => { setQuery(""); setResults({}); navigate(route); }}>{formatter(item)}</button>)}
            </section>
          ) : null))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { position: "relative", width: "min(760px,100%)", marginBottom: 18, zIndex: 30 },
  icon: { position: "absolute", left: 16, top: 15, color: "#7c3aed", zIndex: 2 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #ddd6fe", background: "rgba(255,255,255,.96)", borderRadius: 16, padding: "13px 44px 13px 44px", outline: "none", fontSize: 14, boxShadow: "0 12px 30px rgba(76,29,149,.08)" },
  clear: { position: "absolute", right: 10, top: 8, width: 34, height: 34, border: 0, borderRadius: 10, background: "#f5f3ff", color: "#6d28d9", cursor: "pointer" },
  panel: { position: "absolute", left: 0, right: 0, top: 54, maxHeight: 460, overflowY: "auto", borderRadius: 18, background: "white", border: "1px solid #e9ddff", boxShadow: "0 24px 70px rgba(46,16,101,.20)", padding: 12 },
  panelHead: { padding: "8px 10px 12px", color: "#7c6b95", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" },
  empty: { padding: 18, color: "#6b7280" },
  group: { padding: "8px 0", borderTop: "1px solid #f1ecfb" },
  groupTitle: { display: "block", color: "#5b21b6", fontSize: 11, letterSpacing: .8, textTransform: "uppercase", padding: "6px 10px" },
  row: { width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "10px", borderRadius: 10, color: "#302143", cursor: "pointer" },
};
export default GlobalSearch;
