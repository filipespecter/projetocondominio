function OnboardingChecklist({ data = {}, onNavigate }) {
  const items = [
    { label: "Cadastrar apartamentos", done: Number(data.apartamentos || 0) > 0, route: "/dashboard/apartamentos" },
    { label: "Cadastrar moradores", done: Number(data.moradores || 0) > 0, route: "/dashboard/moradores" },
    { label: "Cadastrar porteiros", done: Number(data.porteiros || 0) > 0, route: "/dashboard/porteiros" },
    { label: "Configurar áreas comuns", done: Number(data.areasComuns || 0) > 0, route: "/dashboard/areas-comuns" },
  ];
  const completed = items.filter((i) => i.done).length;
  if (completed === items.length) return null;
  return (
    <section style={styles.card} className="pilot-onboarding">
      <div style={styles.head}><div><span style={styles.kicker}>CONFIGURAÇÃO INICIAL</span><h3 style={styles.title}>Prepare o condomínio para operação</h3></div><strong style={styles.progress}>{completed}/{items.length}</strong></div>
      <div style={styles.bar}><span style={{ ...styles.fill, width: `${(completed / items.length) * 100}%` }} /></div>
      <div style={styles.grid}>{items.map((item) => <button key={item.label} type="button" disabled={item.done} onClick={() => onNavigate?.(item.route)} style={{ ...styles.item, ...(item.done ? styles.done : {}) }}><span>{item.done ? "✓" : "○"}</span><span>{item.label}</span></button>)}</div>
    </section>
  );
}
const styles = {
  card: { margin: "0 0 22px", borderRadius: 22, padding: 20, background: "linear-gradient(135deg,#fff,#f7f2ff)", border: "1px solid #e9ddff", boxShadow: "0 16px 42px rgba(76,29,149,.08)" },
  head: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }, kicker: { color: "#7c3aed", fontWeight: 900, fontSize: 10, letterSpacing: 1.4 }, title: { margin: "5px 0 0", color: "#2e174f", fontSize: 18 }, progress: { color: "#6d28d9", fontSize: 20 },
  bar: { height: 7, borderRadius: 999, background: "#ede9fe", overflow: "hidden", margin: "15px 0" }, fill: { display: "block", height: "100%", background: "linear-gradient(90deg,#6d28d9,#a855f7)", borderRadius: 999 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9 }, item: { border: "1px solid #ddd6fe", background: "white", color: "#4c1d95", borderRadius: 13, padding: "11px 12px", display: "flex", gap: 8, alignItems: "center", fontWeight: 800, cursor: "pointer" }, done: { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0", cursor: "default" },
};
export default OnboardingChecklist;
