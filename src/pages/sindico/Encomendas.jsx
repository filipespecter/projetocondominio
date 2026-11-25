import PackagePickupModal from "../../components/Porteiro/PackagePickupModal.jsx";
import { FiPackage, FiCalendar, FiPlus, FiCheckCircle, FiSearch, FiClock, FiArrowRight, FiArrowLeft, FiSend, FiMail, FiAlertTriangle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import MonthlyClosure from "../../components/MonthlyClosure.jsx";
import "./EncomendasReferencia.css";
import api from "../../Services/api.js";
import OperationalHistoryTools from "../../components/OperationalHistoryTools.jsx";
import PackageNoticeButton from "../../components/PackageNoticeButton.jsx";
import {packageNotificationWarning} from "../../utils/packageNotificationStatus.js";
import { confirmDialog, notify } from "../../components/GlobalDialogs.jsx";
import { useEffect, useRef, useState } from "react";
import packageApi from "../../Services/packageApi.js";
import { rotuloUnidade } from "../../utils/unidade.js";

function Encomendas() {
  const estadoInicialEncomenda = {
    morador: "",
    moradorId: "",
    apartamento: "",
    apartamentoId: null,
    descricao: "",
    codigo: "",
    transportadora: "",
    status: "Recebido",
    tipo: "Encomenda",
  };

  const [pickup,setPickup]=useState(null);
  const [closureOpen,setClosureOpen]=useState(false);
  const [overviewFilters,setOverviewFilters]=useState(null);
  const [block,setBlock]=useState("");
  const [unitPage,setUnitPage]=useState(1);
  const [activeUnit,setActiveUnit]=useState(null);
  const [unitOverview,setUnitOverview]=useState(null);
  const [encomendas, setEncomendas] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Pendentes");
  const [novaEncomenda, setNovaEncomenda] = useState(estadoInicialEncomenda);
  const [editId, setEditId] = useState(null);
  const [historyMonth,setHistoryMonth]=useState("");
  const [historyPage,setHistoryPage]=useState(1);
  const [historyTotal,setHistoryTotal]=useState(0);
  const [historyUpdated,setHistoryUpdated]=useState(null);
  const [liveError,setLiveError]=useState("");



  function normalizarCodigo(valor) {
    return String(valor || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toUpperCase();
  }

  function obterCodigoRastreio(item = {}) {
    return normalizarCodigo(
      item.codigoRastreio ??
      item.trackingCode ??
      item.rastreio ??
      item.codigo ??
      ""
    );
  }

  function mapPackage(item, residentList = []) {
    const resident =
      item.expectedByResident ??
      item.resident ??
      residentList.find(
        (r) =>
          String(r.id) ===
          String(
            item.expectedByResidentId ??
            item.residentId ??
            ""
          )
      ) ??
      residentList.find(
        (r) =>
          String(r.apartamentoId) ===
          String(item.apartmentId)
      );

    const user =
      resident?.user ??
      resident ??
      {};

    const statusMap = {
      EXPECTED: "Aguardando",
      RECEIVED: "Recebido",
      DELIVERED: "Entregue",
      CANCELED: "Cancelado",
    };

    return {
      ...item,
      codigoInterno:
        item.internalCode ??
        "",
      codigoRastreio:
        item.trackingCode ??
        "",
      codigo:
        item.trackingCode ??
        "",
      rastreio:
        item.trackingCode ??
        "",
      apartamento:
        item.apartment?.number ??
        resident?.apartment?.number ??
        resident?.apartamento ??
        "",
      unidade:
        rotuloUnidade(item.apartment ?? resident?.apartment) ||
        resident?.unidade ||
        "",
      apartamentoId:
        item.apartmentId ??
        item.apartment?.id ??
        null,
      moradorId:
        resident?.id ??
        null,
      morador:
        user.name ??
        resident?.nome ??
        "Morador",
      nome:
        user.name ??
        resident?.nome ??
        "Morador",
      tipo:
        item.type ??
        "Encomenda",
      descricao:
        item.description ??
        item.type ??
        "Encomenda",
      transportadora:
        item.carrier ??
        "",
      status:
        statusMap[item.status] ??
        item.status ??
        "Recebido",
      data:
        item.receivedAt
          ? new Date(item.receivedAt).toLocaleString("pt-BR")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleString("pt-BR")
            : "",
      dataRecebimento:
        item.receivedAt
          ? new Date(item.receivedAt).toLocaleDateString("pt-BR")
          : "",
      receivedAtRaw: item.receivedAt ?? item.createdAt ?? null,
      retiradaEm:
        item.deliveredAt
          ? new Date(item.deliveredAt).toLocaleString("pt-BR")
          : "",
      retiradoPor:
        item.withdrawnBy ??
        "",
      retiradoDocumento:
        item.withdrawnDocument ??
        "",
      pickupMethod:
        item.pickupMethod ??
        "",
      pickupPersonType:
        item.pickupPersonType ??
        "",
      porteiroRecebimento:
        item.receivedBy?.name ??
        item.receivedBy?.user?.name ??
        "",
    };
  }

  function mapResident(r) {
    return {
      ...r,
      nome:
        r.user?.name ??
        r.name ??
        "",
      apartamento:
        r.apartment?.number ??
        "",
      unidade:
        rotuloUnidade(r.apartment),
      apto:
        r.apartment?.number ??
        "",
      apartamentoId:
        r.apartmentId ??
        r.apartment?.id ??
        null,
    };
  }

  const liveRequest=useRef(0);
  async function carregar() {
    const request=++liveRequest.current;
    try {
      const [
        packageData,
        residentData,
      ] = await Promise.all([
        api.get(`/v1/dashboard/operations/packages?`+new URLSearchParams({page:historyPage,...(activeUnit?{apartmentId:activeUnit.id,noticeSummary:"true"}:{view:"units",overviewMetrics:"true"}),...(filtroStatus==="Atrasado"?{overdue:"true"}:{}),...(filtroStatus==="Pendentes"?{pending:"true"}:{}),...(activeUnit&&historyMonth?{completed:"true"}:{}),...(historyMonth?{history:historyMonth}:{}),q:busca,...({"Aguardando": "EXPECTED", "Recebido": "RECEIVED", "Entregue": "DELIVERED", "Cancelado": "CANCELED"}[filtroStatus]?{status:{"Aguardando": "EXPECTED", "Recebido": "RECEIVED", "Entregue": "DELIVERED", "Cancelado": "CANCELED"}[filtroStatus]}:{})})),
        moradores.length ? Promise.resolve(moradores) : packageApi.residentsDirectory(),
      ]);

      if(request!==liveRequest.current)return;
      setUnitOverview(activeUnit?null:packageData.data);
      setHistoryTotal(packageData.data.total);setHistoryUpdated(packageData.data.refreshedAt);setLiveError("");
      const mappedResidents =
        (residentData ?? []).map(
          mapResident
        );

      setMoradores(
        mappedResidents
      );

      setEncomendas(
        (packageData?.data?.items ?? []).map(
          (item) =>
            mapPackage(
              item,
              mappedResidents
            )
        )
      );
    } catch (error) {
      if(request!==liveRequest.current)return;
      setLiveError(error?.message || "Não foi possível atualizar o acompanhamento.");
    }
  }

  useEffect(() => {
    let active=true,inFlight=false;
    const refresh=async()=>{if(!active||inFlight||document.hidden)return;inFlight=true;try{await carregar();}finally{inFlight=false;}};
    const debounce=setTimeout(refresh,300),timer=setInterval(refresh,10000);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{active=false;liveRequest.current++;clearTimeout(debounce);clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
  }, [historyPage,historyMonth,busca,filtroStatus,activeUnit]);

  const encomendasFiltradas = encomendas.filter(e=>e.apartamentoId===activeUnit?.id);

  function limparCodigo(valor) {
    return normalizarCodigo(valor);
  }

  function selecionarMorador(moradorId) {
    const morador =
      moradores.find(
        (m) =>
          String(m.id) ===
          String(moradorId)
      );

    if (!morador) {
      setNovaEncomenda(
        (prev) => ({
          ...prev,
          moradorId: "",
          morador: "",
          apartamento: "",
          apartamentoId: null,
        })
      );
      return;
    }

    setNovaEncomenda(
      (prev) => ({
        ...prev,
        moradorId:
          morador.id,
        morador:
          morador.nome,
        apartamento:
          morador.apartamento,
        unidade:
          morador.unidade,
        apartamentoId:
          morador.apartamentoId,
      })
    );
  }

  async function salvarEncomenda() {
    if (
      !novaEncomenda.apartamentoId ||
      novaEncomenda.descricao.trim().length < 2
    ) {
      notify(
        "Selecione o morador/apartamento e informe a descrição.", "error"
      );
      return;
    }

    const payload = {
      apartmentId:
        novaEncomenda.apartamentoId,
      expectedByResidentId:
        novaEncomenda.moradorId ||
        null,
      type:
        novaEncomenda.tipo ||
        "Encomenda",
      description:
        novaEncomenda.descricao.trim(),
      carrier:
        novaEncomenda.transportadora?.trim() ||
        null,
      trackingCode:
        normalizarCodigo(
          novaEncomenda.codigo
        ) || null,
      notes: null,
      expectedAt: null,
    };

    try {
      if (editId) {
        await packageApi.update(
          editId,
          payload
        );
      } else {
        const received = await packageApi.createReceived(payload);
        const warning=packageNotificationWarning(received); if(warning) notify(warning, "info");
      }

      await carregar();
      fecharModal();
    } catch (error) {
      notify(
        error?.message ??
        "Não foi possível salvar a encomenda.", "error"
      );
    }
  }

  function editarEncomenda(e) {
    setEditId(e.id);
    setNovaEncomenda({
      ...estadoInicialEncomenda,
      ...e,
      codigo:
        obterCodigoRastreio(e),
    });
    setMostrarModal(true);
  }

  async function excluirEncomenda(id) {
    if (
      !await confirmDialog(
        "Deseja excluir este registro?"
      )
    ) {
      return;
    }

    try {
      await packageApi.remove(id);
      await carregar();
    } catch (error) {
      notify(
        error?.message ??
        "Não foi possível excluir a encomenda.", "error"
      );
    }
  }

  function fecharModal() {
    setMostrarModal(false);
    setEditId(null);
    setNovaEncomenda(
      estadoInicialEncomenda
    );
  }

  const units=unitOverview?.units||[];
  const blocks=[...new Set(units.map(u=>u.block).filter(Boolean))].sort();
  const filteredUnits=units.filter(u=>!block||u.block===block).sort((a,b)=>[a.block,a.number].join(" ").localeCompare([b.block,b.number].join(" "),"pt-BR",{numeric:true}));
  const pages=Math.max(1,Math.ceil(filteredUnits.length/9));
  const current=Math.min(unitPage,pages);
  const pageNumbers=[...new Set([1,current-1,current,current+1,pages].filter(n=>n>=1&&n<=pages))].sort((a,b)=>a-b);
  const blockName=value=>value?(/^bloco\b/i.test(value)?value:"Bloco "+value):"Sem bloco";
  const date=value=>{
    if(!value)return "—";
    const instant=new Date(value),today=new Date(),yesterday=new Date();
    yesterday.setDate(today.getDate()-1);
    const day=instant.toDateString(),time=instant.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    return day===today.toDateString()?`Hoje, ${time}`:day===yesterday.toDateString()?`Ontem, ${time}`:instant.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
  };
  const newPackage=()=>{setEditId(null);setNovaEncomenda(estadoInicialEncomenda);setMostrarModal(true);};
  const closePanel=()=>{setClosureOpen(true);requestAnimationFrame(()=>document.getElementById("encomendas-fechamento")?.scrollIntoView({block:"start"}));};
  const returnToUnits=()=>{
    setActiveUnit(null);setEncomendas([]);setHistoryMonth(overviewFilters?.month||"");
    setFiltroStatus(overviewFilters?.status||"Pendentes");setBusca(overviewFilters?.q||"");setHistoryPage(1);
  };
  const openUnit=unit=>{
    setOverviewFilters({month:historyMonth,status:filtroStatus,q:busca});
    const showHistory=Boolean(historyMonth)||filtroStatus==="Entregue";
    setActiveUnit(unit);setHistoryTotal(unit.pending||0);
    setHistoryMonth(showHistory?(historyMonth||new Date().toLocaleDateString("sv-SE").slice(0,7)):"");
    setFiltroStatus(showHistory?"Todos":"Pendentes");setBusca("");setHistoryPage(1);
  };
  const chooseHistory=()=>{setHistoryMonth(historyMonth||new Date().toLocaleDateString("sv-SE").slice(0,7));setFiltroStatus("Todos");setHistoryPage(1);};
  const noticeLabels={DELIVERED:"entregue",SENT:"aceito pelo provedor",PENDING:"pendente",FAILED:"com falha",CANCELED:"cancelado"};
  return (
    <div className="ic-pkg-reference">
      {!activeUnit ? <section className="ic-pkg-panel">
        <header className="ic-pkg-hero">
          <div className="ic-pkg-heading"><span className="ic-pkg-icon"><FiPackage/></span><div><h1>Encomendas</h1><p>Acompanhe as encomendas por unidade.</p></div></div>
          <div className="ic-pkg-actions"><button type="button" onClick={newPackage}><FiPlus/> Nova encomenda</button><button type="button" onClick={closePanel}><FiCalendar/> Histórico e fechamento</button></div>
        </header>
        <div className="ic-pkg-content">
          <div className="ic-pkg-metrics"><span><FiPackage/><strong>{unitOverview?.metrics?.pending??"—"}</strong> pendentes</span><span><FiCheckCircle/><strong>{unitOverview?.metrics?.deliveredToday??"—"}</strong> retiradas hoje</span></div>
          <div className="ic-pkg-filters">
            <label className="ic-pkg-search"><FiSearch aria-hidden="true"/><input aria-label="Buscar unidade, morador ou encomenda" placeholder="Buscar unidade, morador ou encomenda..." value={busca} onChange={e=>{setBusca(e.target.value);setUnitPage(1);setBlock("");}}/></label>
            <select aria-label="Bloco" value={block} onChange={e=>{setBlock(e.target.value);setUnitPage(1);}}><option value="">Todos os blocos</option>{blocks.map(b=><option key={b} value={b}>{blockName(b)}</option>)}</select>
            <select aria-label="Situação" value={filtroStatus} onChange={e=>{setFiltroStatus(e.target.value);setBlock("");setUnitPage(1);}}><option value="Pendentes">Com pendências</option><option value="Todos">Todas as situações</option><option value="Recebido">Recebidas</option><option value="Entregue">Retiradas</option><option value="Atrasado">Atrasadas</option></select>
          </div>
          <h2 className="ic-pkg-section-title"><HiOutlineOfficeBuilding/> Unidades com encomendas</h2>
          <div className="ic-pkg-unit-grid">{filteredUnits.slice((current-1)*9,current*9).map(unit=><article key={unit.id} className="ic-pkg-unit">
            <div className="ic-pkg-unit-head"><span className="ic-pkg-icon"><HiOutlineOfficeBuilding/></span><div><h3>Apartamento {unit.number}</h3><p>{blockName(unit.block)}</p></div><span className="ic-pkg-tag">{unit.pending??0} {(unit.pending??0)===1?"pendente":"pendentes"}</span></div>
            <p className="ic-pkg-received"><FiClock/> Último recebimento: {date(unit.lastReceivedAt)}</p>
            <button type="button" className="ic-pkg-primary" onClick={()=>openUnit(unit)}>Ver encomendas <FiArrowRight/></button>
          </article>)}</div>
          {!filteredUnits.length&&<p className="ic-pkg-empty">{unitOverview?"Nenhuma unidade corresponde aos filtros.":"Carregando unidades…"}</p>}
          {pages>1&&<nav className="ic-pkg-pagination" aria-label="Páginas de unidades"><button type="button" disabled={current===1} onClick={()=>setUnitPage(current-1)}>‹ Anterior</button>{pageNumbers.map((n,i)=><span key={n}>{i>0&&n-pageNumbers[i-1]>1&&<span aria-hidden="true"> … </span>}<button type="button" aria-current={n===current?"page":undefined} aria-label={`Página ${n}`} onClick={()=>setUnitPage(n)}>{n}</button></span>)}<button type="button" disabled={current===pages} onClick={()=>setUnitPage(current+1)}>Próxima ›</button></nav>}
        </div>
      </section> : <section className="ic-pkg-panel">
        <header className="ic-pkg-breadcrumb">Encomendas / {blockName(activeUnit.block)} / Apartamento {activeUnit.number}</header>
        <div className="ic-pkg-content">
          <button type="button" className="ic-pkg-outline" onClick={returnToUnits}><FiArrowLeft/> Voltar às unidades</button>
          <div className="ic-pkg-heading ic-pkg-detail-title"><span className="ic-pkg-icon"><HiOutlineOfficeBuilding/></span><div><h1>Apartamento {activeUnit.number}</h1><p>{blockName(activeUnit.block)}</p></div></div>
          <div className="ic-pkg-tabs" aria-label="Visão da unidade"><button type="button" aria-pressed={!historyMonth} onClick={()=>{setHistoryMonth("");setFiltroStatus("Pendentes");setHistoryPage(1);}}>Pendentes ({!historyMonth?historyTotal:activeUnit.pending??0})</button><button type="button" aria-pressed={Boolean(historyMonth)} onClick={chooseHistory}>Histórico</button></div>
          {historyMonth&&<label className="ic-pkg-history-month">Mês do histórico <input type="month" value={historyMonth} onChange={e=>{if(e.target.value){setHistoryMonth(e.target.value);setHistoryPage(1);}}}/></label>}
          <div className="ic-pkg-table-wrap"><table className="ic-pkg-table"><thead><tr><th>Encomenda</th><th>Morador</th><th>Recebida em</th><th>Aviso</th><th>Ações</th></tr></thead>
          <tbody>{encomendasFiltradas.map(e=><tr key={e.id}>
            <td data-label="Encomenda"><span className="ic-pkg-description"><FiPackage/><strong>{e.descricao}</strong></span><small>{e.status}{e.codigoRastreio?` · ${e.codigoRastreio}`:""}</small></td>
            <td data-label="Morador">{e.morador}</td>
            <td data-label="Recebida em">{date(e.receivedAt)}</td>
            <td data-label="Aviso">{e.notices?.length?e.notices.map(n=><div key={n.channel} className={n.status==="FAILED"?"ic-pkg-failed":undefined}>{n.status==="FAILED"?<FiAlertTriangle/>:n.channel==="EMAIL"?<FiMail/>:<FaWhatsapp/>} {n.channel==="EMAIL"?"E-mail":"WhatsApp"} {n.uncertain?"com resultado incerto":noticeLabels[n.status]}</div>):e.status==="Recebido"?<span><FiClock/> Aguardando envio</span>:"—"}</td>
            <td data-label="Ações"><div className="ic-pkg-row-actions">
              {e.status==="Recebido"&&<><PackageNoticeButton id={e.id} compact icon={<FiSend aria-hidden="true"/>}/><details className="ic-pkg-action-menu"><summary>✓ Validar retirada</summary><div><button type="button" onClick={()=>setPickup({id:e.id,method:"CODE"})}>Usar código</button><button type="button" onClick={()=>setPickup({id:e.id,method:"QR"})}>Escanear QR</button></div></details></>}
              <details className="ic-pkg-action-menu"><summary aria-label="Mais ações">•••</summary><div><small>Transportadora: {e.transportadora||"Não informada"} · Retirada: {e.retiradaEm||"Pendente"}</small><button type="button" onClick={()=>editarEncomenda(e)}>Editar</button><button type="button" onClick={()=>excluirEncomenda(e.id)}>Excluir</button></div></details>
            </div></td>
          </tr>)}</tbody></table>{!encomendasFiltradas.length&&<p className="ic-pkg-empty">Nenhuma encomenda nesta visão.</p>}</div>
          {historyTotal>50&&<nav className="ic-pkg-pagination" aria-label="Páginas de encomendas"><button type="button" disabled={historyPage<=1} onClick={()=>setHistoryPage(historyPage-1)}>‹ Anterior</button><span>Página {historyPage} de {Math.ceil(historyTotal/50)}</span><button type="button" disabled={historyPage*50>=historyTotal} onClick={()=>setHistoryPage(historyPage+1)}>Próxima ›</button></nav>}
          <button type="button" className="ic-pkg-outline ic-pkg-closure-button" onClick={closePanel}><FiCalendar/> Histórico e fechamento</button>
        </div>
      </section>}
      {(closureOpen||activeUnit)&&<div id="encomendas-fechamento" className="ic-pkg-closure"><MonthlyClosure embedded/></div>}
      <details className="ic-pkg-operator"><summary>Acompanhamento dos operadores</summary><OperationalHistoryTools kind="packages" month={historyMonth} onMonth={value=>{setHistoryMonth(value);setFiltroStatus(value?"Todos":"Pendentes");}} page={historyPage} onPage={setHistoryPage} total={historyTotal} updatedAt={historyUpdated} showPagination={false}/></details>
      {liveError&&<p role="alert" className="ic-pkg-failed">{liveError} Os dados podem estar desatualizados.</p>}
      {pickup&&<PackagePickupModal method={pickup.method} expectedPackageId={pickup.id} onClose={()=>setPickup(null)} onCompleted={carregar}/>}
      {mostrarModal && (
        <div style={styles.modalBackground}>
          <div style={styles.modal} className="ic-apartment-modal">
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar pacote" : "Novo pacote"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar encomenda"
                    : "Registrar encomenda"}
                </h2>
              </div>

              <button
                style={styles.closeButton}
                onClick={fecharModal}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Destinatário
              </h3>

              <div style={styles.formGrid} className="ic-apartment-form">
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Morador
                  </label>

                  {moradores.length > 0 ? (
                    <select
                      value={
                        novaEncomenda.moradorId ||
                        moradores.find(
                          (m) => m.nome === novaEncomenda.morador
                        )?.id ||
                        ""
                      }
                      onChange={(e) => selecionarMorador(e.target.value)}
                      style={styles.input}
                    >
                      <option value="">
                        Selecione o morador
                      </option>

                      {moradores.map((morador) => (
                        <option
                          key={morador.id}
                          value={morador.id}
                        >
                          {morador.nome} - {morador.unidade || `Apto ${morador.apartamento || morador.apto}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Nome do morador"
                      value={novaEncomenda.morador}
                      onChange={(e) =>
                        setNovaEncomenda({
                          ...novaEncomenda,
                          morador: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  )}
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Apartamento
                  </label>

                  <input
                    placeholder="Apartamento"
                    inputMode="numeric"
                                        maxLength="6"
                    value={moradores.length > 0 ? (novaEncomenda.unidade || novaEncomenda.apartamento) : novaEncomenda.apartamento}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        apartamento: e.target.value.replace(/\D/g, "").slice(0, 6),
                        unidade: ""
                      })
                    }
                    style={styles.input}
                    readOnly={moradores.length > 0}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Dados da encomenda
              </h3>

              <div style={styles.formGrid} className="ic-apartment-form">
                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Descrição
                  </label>

                  <input
                    minLength="3"
                    placeholder="Ex: Amazon - Caixa média"
                    value={novaEncomenda.descricao}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        descricao: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Código / rastreio
                  </label>

                  <input
                    placeholder="Ex: BR123456789"
                    value={novaEncomenda.codigo}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        codigo: limparCodigo(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>
                    Transportadora
                  </label>

                  <input
                    minLength="2"
                    placeholder="Ex: Correios, Amazon, Jadlog..."
                    value={novaEncomenda.transportadora}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        transportadora: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>
                    Status
                  </label>

                  <select
                    value={novaEncomenda.status}
                    onChange={(e) =>
                      setNovaEncomenda({
                        ...novaEncomenda,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Recebido</option>
                    <option>Entregue</option>
                    <option>Atrasado</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveButton}
                onClick={salvarEncomenda}
              >
                Salvar encomenda
              </button>

              <button
                style={styles.cancelButton}
                onClick={fecharModal}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalBackground: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px"
  },

  modal: {
    minWidth: 0,
    width: "100%",
    maxWidth: "780px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fbfaff",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,#1c1205,var(--ic-primary))",
    color: "white",
    borderRadius: "28px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
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
    margin: "14px 0 0",
    fontSize: "28px"
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

  modalSection: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "15px"
  },

  modalSectionTitle: {
    margin: "0 0 16px",
    color: "var(--ic-primary-deep)"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px"
  },

  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  formRowFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  label: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: "900"
  },

  input: {
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background: "#fbfaff"
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveButton: {
    flex: 1,
    background:
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  cancelButton: {
    flex: 1,
    background: "var(--ic-primary-soft-4)",
    color: "#374151",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  }
};

export default Encomendas;