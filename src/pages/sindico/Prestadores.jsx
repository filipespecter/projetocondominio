import { confirmDialog, promptDialog } from "../../components/GlobalDialogs.jsx";
import { useEffect, useState } from "react";
import serviceProviderApi from "../../Services/serviceProviderApi.js";
import providerAccessApi from "../../Services/providerAccessApi.js";
import operationalRecordApi from "../../Services/operationalRecordApi.js";
import residentApi from "../../Services/residentApi.js";
import apartmentApi from "../../Services/apartmentApi.js";
import commonAreaApi from "../../Services/commonAreaApi.js";
import privateServiceRequestApi from "../../Services/privateServiceRequestApi.js";

function Prestadores() {
  const estadoInicialPrestador={nome:"",empresa:"",telefone:"",cpf:"",servico:"",tipoServico:"Condomínio",areaRelacionada:"",apartamento:"",responsavel:"",dataEntrada:"",horaEntrada:"",dataSaida:"",horaSaida:"",observacao:"",status:"Pendente",moradorId:null,apartamentoId:null,tipoMoradorResponsavel:"",moradorPrincipalResponsavel:false,serviceProviderId:null};
  const estadoInicialOperacional={data:"",horario:"",porteiro:"",leituraAnterior:"",leituraAtual:"",consumo:"",poco:"Desligado",observacao:""};
  const [abaAtiva,setAbaAtiva]=useState("condominio");
  const [prestadores,setPrestadores]=useState([]);
  const [particulares,setParticulares]=useState([]);
  const [operacional,setOperacional]=useState([]);
  const [areasComuns,setAreasComuns]=useState([]);
  const [moradores,setMoradores]=useState([]);
  const [apartamentos,setApartamentos]=useState([]);
  const [mostrarModal,setMostrarModal]=useState(false);
  const [busca,setBusca]=useState("");
  const [editId,setEditId]=useState(null);
  const [novoPrestador,setNovoPrestador]=useState(estadoInicialPrestador);
  const [novoOperacional,setNovoOperacional]=useState(estadoInicialOperacional);
  const [solicitacoes,setSolicitacoes]=useState([]);
  const [processandoSolicitacao,setProcessandoSolicitacao]=useState(null);

  const statusFront={SCHEDULED:"Pendente",INSIDE:"Em execução",EXITED:"Finalizado",CANCELED:"Cancelado"};
  function mapResident(r){return {...r,nome:r.user?.name??r.name??"",apartamento:r.apartment?.number??"",apto:r.apartment?.number??"",apartamentoId:r.apartmentId??r.apartment?.id??null,tipoMorador:r.residentType??"Morador",moradorPrincipal:Boolean(r.isPrimary)};}
  function mapAccess(a){const p=a.serviceProvider??{}; return {id:a.id,serviceProviderId:p.id??a.serviceProviderId,nome:p.name??"",empresa:p.companyName??"",telefone:p.phone??"",cpf:p.document??"",servico:a.serviceDescription??p.serviceType??"",tipoServico:a.apartmentId?"Apartamento":"Condomínio",areaRelacionada:"",apartamento:a.apartment?.number??"",apartamentoId:a.apartmentId??a.apartment?.id??null,responsavel:"",dataEntrada:String(a.scheduledDate??"").slice(0,10),horaEntrada:a.scheduledStartTime??"",dataSaida:a.exitedAt?new Date(a.exitedAt).toISOString().slice(0,10):"",horaSaida:a.exitedAt?new Date(a.exitedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"",observacao:a.notes??"",status:statusFront[a.status]??a.status};}
  function mapOperational(o){return {id:o.id,data:String(o.recordDate??"").slice(0,10),horario:o.recordTime??"",porteiro:o.responsibleName??"",leituraAnterior:o.previousReading??"",leituraAtual:o.currentReading??"",consumo:o.consumption??"",poco:o.wellStatus??"Desligado",observacao:o.notes??""};}
  async function carregar(){try{const [accesses,ops,residents,aps,areas,requests]=await Promise.all([providerAccessApi.list(),operationalRecordApi.list(),residentApi.list(),apartmentApi.list(),commonAreaApi.list(),privateServiceRequestApi.list()]); const mapped=(accesses??[]).map(mapAccess); setPrestadores(mapped.filter(i=>!i.apartamentoId)); setParticulares(mapped.filter(i=>i.apartamentoId)); setOperacional((ops??[]).map(mapOperational)); setMoradores((residents??[]).map(mapResident)); setApartamentos((aps??[]).map(a=>({...a,numero:a.number??a.numero??""}))); setAreasComuns((areas??[]).map(a=>({...a,nome:a.name??a.nome??""}))); setSolicitacoes(requests??[]);}catch(e){alert(e?.message??"Não foi possível carregar prestadores e operações.");}}
  useEffect(()=>{carregar();},[]);

  const listaAtual=abaAtiva==="condominio"?prestadores:particulares;
  const listaFiltrada=listaAtual.filter(item=>{const t=busca.toLowerCase(); return item.nome?.toLowerCase().includes(t)||item.empresa?.toLowerCase().includes(t)||item.servico?.toLowerCase().includes(t)||item.tipoServico?.toLowerCase().includes(t)||item.areaRelacionada?.toLowerCase().includes(t)||item.apartamento?.toLowerCase().includes(t)||item.responsavel?.toLowerCase().includes(t)||item.status?.toLowerCase().includes(t);});
  const ativos=[...prestadores,...particulares].filter(p=>p.status==="Em execução"||p.status==="Pendente").length;
  const finalizados=[...prestadores,...particulares].filter(p=>p.status==="Finalizado").length;
  function limparNumeros(v){return String(v||"").replace(/\D/g,"");}
  function validarCPF(cpf){const n=limparNumeros(cpf); if(!n)return true; if(n.length!==11||/^(\d)\1+$/.test(n))return false; let s=0; for(let i=0;i<9;i++)s+=Number(n[i])*(10-i); let d=11-(s%11); if(d>=10)d=0; if(d!==Number(n[9]))return false; s=0; for(let i=0;i<10;i++)s+=Number(n[i])*(11-i); d=11-(s%11); if(d>=10)d=0; return d===Number(n[10]);}
  function validarPrestador(){if(String(novoPrestador.nome).trim().length<3){alert("Informe o nome do prestador.");return false;} if(limparNumeros(novoPrestador.telefone).length<10){alert("Informe telefone com DDD.");return false;} if(novoPrestador.cpf&&!validarCPF(novoPrestador.cpf)){alert("CPF inválido.");return false;} if(String(novoPrestador.servico).trim().length<3){alert("Informe o serviço.");return false;} if(!novoPrestador.dataEntrada||!novoPrestador.horaEntrada){alert("Informe data e hora.");return false;} if(abaAtiva==="particular"&&!novoPrestador.apartamentoId){alert("Selecione o apartamento.");return false;} return true;}
  function selecionarMoradorResponsavel(id){const m=moradores.find(x=>String(x.id)===String(id)); if(!m)return; setNovoPrestador(p=>({...p,moradorId:m.id,responsavel:m.nome,apartamento:m.apartamento,apartamentoId:m.apartamentoId,tipoMoradorResponsavel:m.tipoMorador,moradorPrincipalResponsavel:m.moradorPrincipal}));}
  function selecionarApartamento(valor){const a=apartamentos.find(x=>String(x.numero)===String(valor)); setNovoPrestador(p=>({...p,apartamento:valor,apartamentoId:a?.id??null,responsavel:"",moradorId:null,tipoMoradorResponsavel:"",moradorPrincipalResponsavel:false}));}
  const moradoresDoApartamento=moradores.filter(m=>String(m.apartamento)===String(novoPrestador.apartamento));
  function formatarTelefone(v){v=v.replace(/\D/g,"").slice(0,11); return v.length<=10?v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3"):v.replace(/(\d{2})(\d{5})(\d{0,4})/,"($1) $2-$3");}
  function formatarCPF(v){return v.replace(/\D/g,"").slice(0,11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,"$1.$2.$3-$4");}
  function abrirNovoCadastro(){setEditId(null);setNovoPrestador({...estadoInicialPrestador,tipoServico:abaAtiva==="condominio"?"Condomínio":"Apartamento"});setMostrarModal(true);}
  function editarPrestador(item){setEditId(item.id);setNovoPrestador({...estadoInicialPrestador,...item});setMostrarModal(true);}
  function fecharModal(){setMostrarModal(false);setEditId(null);setNovoPrestador(estadoInicialPrestador);}
  async function salvarPrestador(){if(!validarPrestador())return; try{let providerId=novoPrestador.serviceProviderId; const providerPayload={name:novoPrestador.nome.trim(),companyName:novoPrestador.empresa?.trim()||null,document:novoPrestador.cpf?.trim()||null,phone:novoPrestador.telefone?.trim()||null,email:null,serviceType:novoPrestador.servico.trim(),notes:novoPrestador.observacao?.trim()||null,status:"ACTIVE"}; if(providerId){await serviceProviderApi.update(providerId,providerPayload);}else{const p=await serviceProviderApi.create(providerPayload);providerId=p.id;} const accessPayload={serviceProviderId:providerId,apartmentId:abaAtiva==="particular"?novoPrestador.apartamentoId:null,serviceDescription:novoPrestador.areaRelacionada?`${novoPrestador.servico} • ${novoPrestador.areaRelacionada}`:novoPrestador.servico,scheduledDate:novoPrestador.dataEntrada,scheduledStartTime:novoPrestador.horaEntrada,scheduledEndTime:novoPrestador.horaSaida||null,notes:novoPrestador.observacao?.trim()||null}; if(editId)await providerAccessApi.update(editId,accessPayload); else await providerAccessApi.create(accessPayload); await carregar();fecharModal();}catch(e){alert(e?.message??"Não foi possível salvar o prestador.");}}
  async function alterarStatusPrestador(id,status){try{if(status==="Em execução")await providerAccessApi.entry(id); else if(status==="Finalizado")await providerAccessApi.exit(id); else if(status==="Cancelado")await providerAccessApi.cancel(id); await carregar();}catch(e){alert(e?.message??"Não foi possível alterar o status.");}}
  async function excluirPrestador(id){if(!await confirmDialog("Deseja excluir este cadastro?"))return; try{await providerAccessApi.remove(id); await carregar();}catch(e){alert(e?.message??"Só acessos finalizados/cancelados podem ser excluídos.");}}
  function calcularConsumoManual(a,b){if(a===""||b==="")return ""; const x=Number(a),y=Number(b); if(!Number.isFinite(x)||!Number.isFinite(y)||y<x)return ""; return String(y-x);}
  function atualizarOperacional(campo,valor){setNovoOperacional(prev=>{const next={...prev,[campo]:valor}; const c=calcularConsumoManual(campo==="leituraAnterior"?valor:next.leituraAnterior,campo==="leituraAtual"?valor:next.leituraAtual); next.consumo=c; return next;});}
  async function salvarOperacional(){if(!novoOperacional.data||!novoOperacional.horario||!novoOperacional.porteiro){alert("Preencha data, horário e porteiro responsável.");return;} try{await operationalRecordApi.create({recordDate:novoOperacional.data,recordTime:novoOperacional.horario,responsibleName:novoOperacional.porteiro,previousReading:novoOperacional.leituraAnterior===""?null:Number(novoOperacional.leituraAnterior),currentReading:novoOperacional.leituraAtual===""?null:Number(novoOperacional.leituraAtual),consumption:novoOperacional.consumo===""?null:Number(novoOperacional.consumo),wellStatus:novoOperacional.poco,notes:novoOperacional.observacao||null});setNovoOperacional(estadoInicialOperacional);await carregar();}catch(e){alert(e?.message??"Não foi possível salvar o registro operacional.");}}
  async function excluirOperacional(id){if(!await confirmDialog("Deseja excluir este registro operacional?"))return; try{await operationalRecordApi.remove(id);await carregar();}catch(e){alert(e?.message??"Não foi possível excluir o registro.");}}
  async function aprovarSolicitacao(item){
    setProcessandoSolicitacao(item.id);
    try{
      await privateServiceRequestApi.approve(item.id,{});
      await carregar();
      setAbaAtiva("particular");
    }catch(e){alert(e?.message??"Não foi possível aprovar a solicitação.");}
    finally{setProcessandoSolicitacao(null);}
  }
  async function rejeitarSolicitacao(item){
    const motivo=await promptDialog("Informe o motivo da não aprovação:","");
    if(!motivo||String(motivo).trim().length<3)return;
    setProcessandoSolicitacao(item.id);
    try{await privateServiceRequestApi.reject(item.id,{reviewNotes:String(motivo).trim()});await carregar();}
    catch(e){alert(e?.message??"Não foi possível rejeitar a solicitação.");}
    finally{setProcessandoSolicitacao(null);}
  }
  function statusSolicitacao(status){return {PENDING:"Em análise",APPROVED:"Aprovada",REJECTED:"Não aprovada",CANCELED:"Cancelada"}[status]??status;}
  function corStatus(status){switch(status){case"Pendente":return{background:"#fef3c7",color:"#92400e",border:"#fde68a",label:"Pendente"};case"Em execução":return{background:"var(--ic-primary-soft-2)",color:"var(--ic-primary-strong)",border:"var(--ic-primary-border-soft)",label:"Em execução"};case"Finalizado":return{background:"var(--ic-primary-soft)",color:"var(--ic-primary)",border:"var(--ic-primary-border-soft)",label:"Finalizado"};case"Cancelado":return{background:"#fee2e2",color:"#b91c1c",border:"#fecaca",label:"Cancelado"};default:return{background:"var(--ic-primary-soft-4)",color:"#374151",border:"var(--ic-primary-border-soft)",label:status||"Sem status"};}}
  function iconeServico(servico){const t=servico?.toLowerCase()||""; if(t.includes("elétr")||t.includes("eletr"))return"⚡";if(t.includes("hidrá")||t.includes("agua")||t.includes("água"))return"💧";if(t.includes("limpeza"))return"🧹";if(t.includes("pintura"))return"🎨";if(t.includes("jardin"))return"🌿";if(t.includes("internet")||t.includes("rede"))return"🌐";return"🧰";}
  function formatarData(data){if(!data)return"-";const p=data.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:data;}
  const ultimoRegistroOperacional=operacional[0];

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroBadge}>
            🛠️ Central operacional
          </span>

          <h1 style={styles.title}>
            Prestadores e Operações
          </h1>

          <p style={styles.subtitle}>
            Controle serviços do condomínio, atendimentos particulares e registros técnicos de operação.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.operationBoard}>
            <div style={styles.operationItem}>
              <span>🏢</span>
              <strong>{prestadores.length}</strong>
              <small>condomínio</small>
            </div>

            <div style={styles.operationItem}>
              <span>🏠</span>
              <strong>{particulares.length}</strong>
              <small>particulares</small>
            </div>

            <div style={styles.operationItem}>
              <span>💧</span>
              <strong>{operacional.length}</strong>
              <small>operações</small>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "condominio" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("condominio");
            setBusca("");
          }}
        >
          🏢 Serviços Condomínio
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "particular" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("particular");
            setBusca("");
          }}
        >
          🏠 Serviços Particulares
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "solicitacoes" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("solicitacoes");
            setBusca("");
          }}
        >
          📥 Solicitações de moradores {solicitacoes.filter((item)=>item.status==="PENDING").length>0?`(${solicitacoes.filter((item)=>item.status==="PENDING").length})`:""}
        </button>

        <button
          style={{
            ...styles.tab,
            ...(abaAtiva === "operacional" ? styles.activeTab : {})
          }}
          onClick={() => {
            setAbaAtiva("operacional");
            setBusca("");
          }}
        >
          💧 Operacional / COMPESA
        </button>
      </section>

      {["condominio","particular"].includes(abaAtiva) && (
        <section style={styles.controlStrip}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>

            <input
              placeholder="Buscar por nome, empresa, serviço, área, apartamento ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={styles.search}
            />
          </div>

          <div style={styles.compactStats}>
            <span>
              <b>{listaAtual.length}</b> cadastros
            </span>

            <span>
              <b>{ativos}</b> ativos
            </span>

            <span>
              <b>{finalizados}</b> finalizados
            </span>
          </div>

          <button
            style={styles.heroButton}
            onClick={abrirNovoCadastro}
          >
            + Novo cadastro
          </button>
        </section>
      )}

      {abaAtiva === "solicitacoes" ? (
        <section style={styles.servicePanel}>
          <div style={styles.panelHeader}>
            <div><span style={styles.panelLabel}>Solicitações dos moradores</span><h2 style={styles.panelTitle}>Serviços aguardando análise</h2></div>
            <span style={styles.resultBadge}>{solicitacoes.filter((item)=>item.status==="PENDING").length} pendente(s)</span>
          </div>
          {solicitacoes.length===0 ? (
            <div style={styles.empty}><div style={styles.emptyIcon}>📥</div><h3 style={styles.emptyTitle}>Nenhuma solicitação recebida</h3><p style={styles.emptyText}>Quando um morador informar um profissional para trabalhar no apartamento, a solicitação aparecerá aqui antes de chegar à portaria.</p></div>
          ) : (
            <div style={styles.serviceGrid}>
              {solicitacoes.map((item)=><article key={item.id} style={styles.serviceCard}>
                <div style={styles.cardTop}><div style={styles.serviceIdentity}><div style={styles.serviceIcon}>🏠</div><div><h3 style={styles.serviceName}>{item.providerName}</h3><p style={styles.company}>Apto {item.apartment?.number||"-"} · solicitado por {item.requester?.name||item.resident?.user?.name||"morador"}</p></div></div><span style={styles.statusBadge}>{statusSolicitacao(item.status)}</span></div>
                <div style={styles.serviceType}><span>🧰</span><strong>{item.serviceType}</strong></div>
                <p style={styles.observation}>{item.description}</p>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}><span>Data</span><strong>{formatarData(String(item.scheduledDate||"").slice(0,10))}</strong></div>
                  <div style={styles.infoItem}><span>Horário</span><strong>{item.scheduledStartTime}{item.scheduledEndTime?`–${item.scheduledEndTime}`:""}</strong></div>
                  <div style={styles.infoItem}><span>Telefone</span><strong>{item.providerPhone||"-"}</strong></div>
                  <div style={styles.infoItem}><span>Documento</span><strong>{item.providerDocument||"-"}</strong></div>
                  <div style={styles.infoItem}><span>Empresa</span><strong>{item.providerCompany||"Freelancer / pessoa física"}</strong></div>
                </div>
                {item.notes&&<div style={styles.noteBox}>{item.notes}</div>}
                {item.reviewNotes&&<div style={styles.noteBox}><strong>Retorno:</strong> {item.reviewNotes}</div>}
                {item.status==="PENDING"&&<div style={styles.actionRow}><button style={styles.doneButton} disabled={processandoSolicitacao===item.id} onClick={()=>aprovarSolicitacao(item)}>Aprovar e agendar na portaria</button><button style={styles.deleteButton} disabled={processandoSolicitacao===item.id} onClick={()=>rejeitarSolicitacao(item)}>Não aprovar</button></div>}
                {item.status==="APPROVED"&&item.providerAccess&&<div style={styles.noteBox}>Acesso criado e vinculado aos Serviços Particulares. Status da portaria: {statusFront[item.providerAccess.status]??item.providerAccess.status}.</div>}
              </article>)}
            </div>
          )}
        </section>
      ) : abaAtiva === "operacional" ? (
        <section style={styles.operationalPanel}>
          <div style={styles.operationalHeader}>
            <div>
              <span style={styles.operationalBadge}>
                💧 Controle técnico
              </span>

              <h2 style={styles.operationalTitle}>
                COMPESA / Poço
              </h2>
            </div>

            <div style={styles.operationalResume}>
              <div style={styles.yellowMetric}>
                <span>Registros</span>
                <strong>{operacional.length}</strong>
              </div>

              <div style={styles.yellowMetric}>
                <span>Último consumo</span>
                <strong>
                  {ultimoRegistroOperacional?.consumo || "0"} m³
                </strong>
              </div>

              <div style={styles.yellowMetric}>
                <span>Poço</span>
                <strong>
                  {ultimoRegistroOperacional?.poco || "Sem registro"}
                </strong>
              </div>
            </div>
          </div>

          <div style={styles.operationalFormCard}>
            <div style={styles.operationalSectionTitle}>
              <span>01</span>
              Dados do registro
            </div>

            <div style={styles.operationalGrid}>
              <div style={styles.formRow}>
                <label style={styles.label}>Data</label>

                <input
                  value={novoOperacional.data}
                  onChange={(e) =>
                    atualizarOperacional("data", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Horário</label>

                <input
                  value={novoOperacional.horario}
                  onChange={(e) =>
                    atualizarOperacional("horario", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Porteiro responsável</label>

                <input
                  placeholder="Nome do porteiro"
                  value={novoOperacional.porteiro}
                  onChange={(e) =>
                    atualizarOperacional("porteiro", e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Poço</label>

                <select
                  value={novoOperacional.poco}
                  onChange={(e) =>
                    atualizarOperacional("poco", e.target.value)
                  }
                  style={styles.input}
                >
                  <option>Ligado</option>
                  <option>Desligado</option>
                </select>
              </div>
            </div>

            <div style={styles.operationalSectionTitle}>
              <span>02</span>
              Leitura e consumo
            </div>

            <div style={styles.readingGrid}>
              <div style={styles.readingBox}>
                <label style={styles.yellowLabel}>
                  Leitura anterior
                </label>

                <input
                  type="number"
                  placeholder="Ex: 1200"
                  value={novoOperacional.leituraAnterior}
                  onChange={(e) =>
                    atualizarOperacional("leituraAnterior", e.target.value)
                  }
                  style={styles.yellowInput}
                />
              </div>

              <div style={styles.readingBox}>
                <label style={styles.yellowLabel}>
                  Leitura atual
                </label>

                <input
                  type="number"
                  placeholder="Ex: 1230"
                  value={novoOperacional.leituraAtual}
                  onChange={(e) =>
                    atualizarOperacional("leituraAtual", e.target.value)
                  }
                  style={styles.yellowInput}
                />
              </div>

              <div style={styles.consumptionBox}>
                <span>Consumo calculado</span>

                <strong>
                  {novoOperacional.consumo || "0"} m³
                </strong>
              </div>
            </div>

            <div style={styles.formRowFull}>
              <label style={styles.label}>Observações</label>

              <textarea
                placeholder="Observações operacionais"
                value={novoOperacional.observacao}
                onChange={(e) =>
                  atualizarOperacional("observacao", e.target.value)
                }
                style={styles.textarea}
              />
            </div>

            <button
              style={styles.saveOperationalButton}
              onClick={salvarOperacional}
            >
              Salvar controle operacional
            </button>
          </div>

          <div style={styles.operationalHistory}>
            <div style={styles.panelHeader}>
              <div>
                <span style={styles.panelLabel}>
                  Histórico operacional
                </span>

                <h2 style={styles.panelTitle}>
                  Registros COMPESA / Poço
                </h2>
              </div>

              <span style={styles.resultBadgeYellow}>
                {operacional.length} registro(s)
              </span>
            </div>

            {operacional.length === 0 ? (
              <div style={styles.emptyYellow}>
                <div style={styles.emptyIcon}>💧</div>

                <h3 style={styles.emptyTitle}>
                  Nenhum registro operacional
                </h3>

                <p style={styles.emptyText}>
                  Registre leituras para acompanhar consumo, poço e controle técnico.
                </p>
              </div>
            ) : (
              <div style={styles.operationalList}>
                {operacional.map((o) => (
                  <article key={o.id} style={styles.operationalCard}>
                    <div style={styles.operationalIcon}>
                      💧
                    </div>

                    <div style={styles.operationalInfo}>
                      <div style={styles.operationalCardTop}>
                        <div>
                          <h3 style={styles.operationalCardTitle}>
                            {formatarData(o.data)} às {o.horario || "-"}
                          </h3>

                          <p style={styles.operationalText}>
                            Porteiro: <strong>{o.porteiro || "-"}</strong>
                          </p>
                        </div>

                        <span style={styles.pocoBadge}>
                          {o.poco}
                        </span>
                      </div>

                      <div style={styles.meterGrid}>
                        <div style={styles.meterItem}>
                          <span>Anterior</span>
                          <strong>{o.leituraAnterior || "-"}</strong>
                        </div>

                        <div style={styles.meterItem}>
                          <span>Atual</span>
                          <strong>{o.leituraAtual || "-"}</strong>
                        </div>

                        <div style={styles.meterItemYellow}>
                          <span>Consumo</span>
                          <strong>{o.consumo || "0"} m³</strong>
                        </div>
                      </div>

                      {o.observacao && (
                        <p style={styles.observation}>
                          {o.observacao}
                        </p>
                      )}

                      <button
                        style={styles.deleteOperationalButton}
                        onClick={() => excluirOperacional(o.id)}
                      >
                        Excluir registro
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section style={styles.servicePanel}>
          <div style={styles.panelHeader}>
            <div>
              <span style={styles.panelLabel}>
                {abaAtiva === "condominio"
                  ? "Serviços do condomínio"
                  : "Serviços particulares"}
              </span>

              <h2 style={styles.panelTitle}>
                Cadastros operacionais
              </h2>
            </div>

            <span style={styles.resultBadge}>
              {listaFiltrada.length} resultado(s)
            </span>
          </div>

          {listaFiltrada.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>🧰</div>

              <h3 style={styles.emptyTitle}>
                Nenhum cadastro encontrado
              </h3>

              <p style={styles.emptyText}>
                Cadastre prestadores para controlar serviços, entradas e status de execução.
              </p>

              <button
                style={styles.emptyButton}
                onClick={abrirNovoCadastro}
              >
                Novo cadastro
              </button>
            </div>
          ) : (
            <div style={styles.serviceGrid}>
              {listaFiltrada.map((p) => {
                const status = corStatus(p.status);

                return (
                  <article
                    key={p.id}
                    style={{
                      ...styles.serviceCard,
                      borderColor: status.border
                    }}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.serviceIdentity}>
                        <div style={styles.serviceIcon}>
                          {iconeServico(p.servico)}
                        </div>

                        <div>
                          <h3 style={styles.serviceName}>
                            {p.nome}
                          </h3>

                          <p style={styles.company}>
                            {p.empresa || "Sem empresa informada"}
                          </p>
                        </div>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background: status.background,
                          color: status.color
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div style={styles.serviceType}>
                      <span>🧰</span>
                      <strong>{p.servico}</strong>
                    </div>

                    <div style={styles.infoGrid}>
                      <div style={styles.infoItem}>
                        <span>Telefone</span>
                        <strong>{p.telefone || "-"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>CPF</span>
                        <strong>{p.cpf || "-"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>Tipo</span>
                        <strong>{p.tipoServico || "-"}</strong>
                      </div>

                      <div style={styles.infoItem}>
                        <span>Área</span>
                        <strong>{p.areaRelacionada || "-"}</strong>
                      </div>

                      {abaAtiva === "particular" && (
                        <>
                          <div style={styles.infoItem}>
                            <span>Apartamento</span>
                            <strong>{p.apartamento || "-"}</strong>
                          </div>

                          <div style={styles.infoItem}>
                            <span>Responsável</span>
                            <strong>{p.responsavel || "-"}</strong>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={styles.timeBox}>
                      <div>
                        <span>Entrada</span>
                        <strong>
                          {formatarData(p.dataEntrada)} {p.horaEntrada || ""}
                        </strong>
                      </div>

                      <div>
                        <span>Saída</span>
                        <strong>
                          {formatarData(p.dataSaida)} {p.horaSaida || ""}
                        </strong>
                      </div>
                    </div>

                    {p.observacao && (
                      <div style={styles.noteBox}>
                        {p.observacao}
                      </div>
                    )}

                    <div style={styles.actionRow}>
                      {p.status !== "Em execução" && (
                        <button
                          style={styles.runningButton}
                          onClick={() => alterarStatusPrestador(p.id, "Em execução")}
                        >
                          Iniciar
                        </button>
                      )}

                      {p.status !== "Finalizado" && (
                        <button
                          style={styles.doneButton}
                          onClick={() => alterarStatusPrestador(p.id, "Finalizado")}
                        >
                          Finalizar
                        </button>
                      )}

                      <button
                        style={styles.editButton}
                        onClick={() => editarPrestador(p)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirPrestador(p.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {mostrarModal && (
        <div style={styles.modalBg}>
          <div style={styles.modal}>
            <div style={styles.modalTop}>
              <div>
                <span style={styles.modalBadge}>
                  {editId !== null ? "Editar serviço" : "Novo serviço"}
                </span>

                <h2 style={styles.modalTitle}>
                  {editId !== null
                    ? "Editar cadastro"
                    : "Cadastrar prestador"}
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
                Dados do prestador
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Nome completo</label>

                  <input
                    minLength="3"
                    placeholder="Nome completo"
                    value={novoPrestador.nome}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        nome: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Empresa</label>

                  <input
                    placeholder="Empresa"
                    value={novoPrestador.empresa}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        empresa: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Telefone</label>

                  <input
                    placeholder="Telefone"
                    value={novoPrestador.telefone}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        telefone: formatarTelefone(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>CPF</label>

                  <input
                    placeholder="CPF"
                    value={novoPrestador.cpf}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        cpf: formatarCPF(e.target.value)
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Serviço
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Serviço executado</label>

                  <input
                    minLength="3"
                    placeholder="Ex: Manutenção elétrica"
                    value={novoPrestador.servico}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        servico: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Tipo de serviço</label>

                  <select
                    value={novoPrestador.tipoServico}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        tipoServico: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Condomínio</option>
                    <option>Apartamento</option>
                    <option>Emergencial</option>
                    <option>Preventiva</option>
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Área relacionada</label>

                  {areasComuns.length > 0 ? (
                    <select
                      value={novoPrestador.areaRelacionada}
                      onChange={(e) =>
                        setNovoPrestador({
                          ...novoPrestador,
                          areaRelacionada: e.target.value
                        })
                      }
                      style={styles.input}
                    >
                      <option value="">Selecione uma área</option>

                      {areasComuns.map((area) => (
                        <option
                          key={area.id}
                          value={area.nome}
                        >
                          {area.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Área relacionada"
                      value={novoPrestador.areaRelacionada}
                      onChange={(e) =>
                        setNovoPrestador({
                          ...novoPrestador,
                          areaRelacionada: e.target.value
                        })
                      }
                      style={styles.input}
                    />
                  )}
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Status</label>

                  <select
                    value={novoPrestador.status}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        status: e.target.value
                      })
                    }
                    style={styles.input}
                  >
                    <option>Pendente</option>
                    <option>Aguardando liberação</option>
                    <option>Em execução</option>
                    <option>Finalizado</option>
                    <option>Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            {abaAtiva === "particular" && (
              <div style={styles.modalSection}>
                <h3 style={styles.modalSectionTitle}>
                  Responsável pela solicitação
                </h3>

                <div style={styles.formGrid}>
                  <div style={styles.formRow}>
                    <label style={styles.label}>Apartamento</label>

                    {apartamentos.length > 0 ? (
                      <select
                        value={novoPrestador.apartamento}
                        onChange={(e) => selecionarApartamento(e.target.value)}
                        style={styles.input}
                      >
                        <option value="">Selecione um apartamento</option>

                        {apartamentos.map((ap) => {
                          const numeroApartamento =
                            ap.numero ||
                            ap.apartamento ||
                            ap.apto ||
                            ap.numeroApartamento ||
                            "";

                          return (
                            <option key={ap.id || numeroApartamento} value={numeroApartamento}>
                              Bloco {ap.bloco || "-"} - Apto {numeroApartamento}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        placeholder="Apartamento"
                        value={novoPrestador.apartamento}
                        onChange={(e) =>
                          setNovoPrestador({
                            ...novoPrestador,
                            apartamento: e.target.value.replace(/\D/g, "").slice(0, 6)
                          })
                        }
                        style={styles.input}
                      />
                    )}
                  </div>

                  <div style={styles.formRow}>
                    <label style={styles.label}>Morador responsável</label>

                    {moradoresDoApartamento.length > 0 ? (
                      <select
                        value={novoPrestador.moradorId || ""}
                        onChange={(e) =>
                          selecionarMoradorResponsavel(e.target.value)
                        }
                        style={styles.input}
                      >
                        <option value="">Selecione o morador</option>

                        {moradoresDoApartamento.map((morador) => (
                          <option key={morador.id} value={morador.id}>
                            {morador.nome} - {morador.tipoMorador || "Morador"}
                            {morador.moradorPrincipal ? " - Principal" : " - Dependente"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        placeholder="Morador responsável"
                        value={novoPrestador.responsavel}
                        onChange={(e) =>
                          setNovoPrestador({
                            ...novoPrestador,
                            responsavel: e.target.value,
                            moradorId: null
                          })
                        }
                        style={styles.input}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={styles.modalSection}>
              <h3 style={styles.modalSectionTitle}>
                Controle de entrada e saída
              </h3>

              <div style={styles.formGrid}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Data entrada</label>

                  <input
                    value={novoPrestador.dataEntrada}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        dataEntrada: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Hora entrada</label>

                  <input
                    value={novoPrestador.horaEntrada}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        horaEntrada: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Data saída</label>

                  <input
                    value={novoPrestador.dataSaida}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        dataSaida: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.label}>Hora saída</label>

                  <input
                    value={novoPrestador.horaSaida}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        horaSaida: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRowFull}>
                  <label style={styles.label}>Observações</label>

                  <textarea
                    placeholder="Digite observações adicionais"
                    value={novoPrestador.observacao}
                    onChange={(e) =>
                      setNovoPrestador({
                        ...novoPrestador,
                        observacao: e.target.value
                      })
                    }
                    style={styles.textarea}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveBtn}
                onClick={salvarPrestador}
              >
                Salvar cadastro
              </button>

              <button
                style={styles.cancelBtn}
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
  container: {
    width: "100%",
    fontFamily: "Arial",
    color: "#111827",
    position: "relative"
  },

  hero: {
    background:
      "linear-gradient(135deg,#02140b,var(--ic-primary-dark) 55%,var(--ic-primary))",
    borderRadius: "36px",
    padding: "34px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "28px",
    boxShadow: "0 26px 70px rgba(6,78,59,0.30)",
    marginBottom: "24px"
  },

  heroLeft: {
    maxWidth: "680px"
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "var(--ic-primary-soft)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "15px"
  },

  title: {
    margin: 0,
    fontSize: "44px",
    letterSpacing: "-1px"
  },

  subtitle: {
    margin: "10px 0 0",
    color: "rgba(255,255,255,0.76)",
    lineHeight: "1.55"
  },

  heroRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  operationBoard: {
    display: "flex",
    gap: "10px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px",
    borderRadius: "24px"
  },

  operationItem: {
    width: "92px",
    height: "76px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.11)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px"
  },

  tabs: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "28px",
    padding: "12px",
    marginBottom: "24px",
    display: "flex",
    gap: "12px",
    boxShadow: "0 14px 35px rgba(88,28,135,0.07)",
    flexWrap: "wrap"
  },

  tab: {
    flex: 1,
    minWidth: "210px",
    background: "#fbfaff",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border)",
    padding: "14px",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "900"
  },

  activeTab: {
    background: "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "1px solid var(--ic-primary-light)",
    boxShadow: "0 12px 26px rgb(var(--ic-primary-rgb) / 0.18)"
  },

  controlStrip: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "28px",
    padding: "18px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 14px 35px rgba(88,28,135,0.07)",
    flexWrap: "wrap"
  },

  searchWrap: {
    flex: 1,
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    padding: "0 14px"
  },

  searchIcon: {
    color: "var(--ic-primary)",
    fontSize: "20px",
    marginRight: "8px"
  },

  search: {
    flex: 1,
    padding: "15px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px"
  },

  compactStats: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#374151"
  },

  heroButton: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "none",
    padding: "15px 20px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900",
    whiteSpace: "nowrap"
  },

  servicePanel: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px"
  },

  panelLabel: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  panelTitle: {
    margin: "12px 0 0",
    color: "var(--ic-primary-deep)",
    fontSize: "28px"
  },

  resultBadge: {
    background: "var(--ic-primary-soft-3)",
    color: "var(--ic-primary)",
    border: "1px solid var(--ic-primary-border-soft)",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  resultBadgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "9px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  serviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
    gap: "18px"
  },

  serviceCard: {
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 15px 38px rgba(88,28,135,0.07)",
    border: "1px solid var(--ic-primary-border-soft)"
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px"
  },

  serviceIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  serviceIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "24px",
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary-light))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "0 14px 26px rgb(var(--ic-primary-rgb) / 0.18)"
  },

  serviceName: {
    margin: 0,
    color: "#111827",
    fontSize: "21px"
  },

  company: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px"
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },

  serviceType: {
    background: "var(--ic-primary-soft-3)",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "18px",
    padding: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--ic-primary)",
    marginBottom: "14px"
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },

  infoItem: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "17px",
    padding: "13px"
  },

  timeBox: {
    marginTop: "12px",
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "17px",
    padding: "13px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },

  noteBox: {
    marginTop: "12px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "12px",
    borderRadius: "16px",
    fontSize: "13px"
  },

  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "8px",
    marginTop: "18px"
  },

  runningButton: {
    background: "var(--ic-primary-soft-2)",
    color: "var(--ic-primary-strong)",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  doneButton: {
    background: "var(--ic-primary-soft)",
    color: "var(--ic-primary)",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  editButton: {
    background: "#fef3c7",
    color: "#92400e",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  deleteButton: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "11px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  operationalPanel: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "34px",
    padding: "28px",
    boxShadow: "0 18px 55px rgba(88,28,135,0.09)"
  },

  operationalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },

  operationalBadge: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  operationalTitle: {
    margin: "12px 0 0",
    color: "var(--ic-primary-deep)",
    fontSize: "30px"
  },

  operationalResume: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },

  yellowMetric: {
    minWidth: "135px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "14px",
    borderRadius: "18px"
  },

  operationalFormCard: {
    background: "#fbfaff",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "28px",
    padding: "24px",
    marginBottom: "24px"
  },

  operationalSectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--ic-primary-deep)",
    fontWeight: "900",
    marginBottom: "16px",
    marginTop: "8px"
  },

  operationalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginBottom: "22px"
  },

  readingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginBottom: "20px"
  },

  readingBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "20px",
    padding: "14px"
  },

  yellowLabel: {
    display: "block",
    color: "#92400e",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px"
  },

  yellowInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #facc15",
    outline: "none",
    fontSize: "14px",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    boxSizing: "border-box"
  },

  consumptionBox: {
    background: "linear-gradient(135deg,#facc15,#fef3c7)",
    border: "1px solid #eab308",
    color: "#713f12",
    borderRadius: "20px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  operationalHistory: {
    background: "#ffffff",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "28px",
    padding: "24px"
  },

  operationalList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
    gap: "14px"
  },

  operationalCard: {
    display: "flex",
    gap: "14px",
    background: "linear-gradient(180deg,#ffffff,#fbfaff)",
    border: "1px solid #fde68a",
    borderRadius: "24px",
    padding: "18px"
  },

  operationalIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#facc15,#92400e)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px"
  },

  operationalInfo: {
    flex: 1
  },

  operationalCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start"
  },

  operationalCardTitle: {
    margin: 0,
    color: "#111827"
  },

  operationalText: {
    margin: "6px 0",
    color: "#6b7280"
  },

  pocoBadge: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  meterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: "8px",
    marginTop: "10px"
  },

  meterItem: {
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    border: "1px solid var(--ic-primary-border-soft)",
    borderRadius: "14px",
    padding: "10px"
  },

  meterItemYellow: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: "14px",
    padding: "10px"
  },

  observation: {
    marginTop: "10px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "10px",
    borderRadius: "14px"
  },

  deleteOperationalButton: {
    marginTop: "12px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "10px 12px",
    borderRadius: "13px",
    cursor: "pointer",
    fontWeight: "900"
  },

  empty: {
    background: "#fbfaff",
    border: "1px dashed var(--ic-primary-border)",
    borderRadius: "26px",
    padding: "48px",
    textAlign: "center"
  },

  emptyYellow: {
    background: "#fffbeb",
    border: "1px dashed #fde68a",
    borderRadius: "26px",
    padding: "48px",
    textAlign: "center"
  },

  emptyIcon: {
    fontSize: "44px",
    marginBottom: "12px"
  },

  emptyTitle: {
    margin: 0,
    color: "#111827"
  },

  emptyText: {
    margin: "8px 0 18px",
    color: "#6b7280"
  },

  emptyButton: {
    background:
      "linear-gradient(135deg,var(--ic-primary-dark),var(--ic-primary-light))",
    color: "white",
    border: "none",
    padding: "13px 18px",
    borderRadius: "15px",
    cursor: "pointer",
    fontWeight: "900"
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
    background: "white"
  },

  textarea: {
    minHeight: "100px",
    resize: "vertical",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid var(--ic-primary-border)",
    outline: "none",
    fontSize: "14px",
    background:
      "radial-gradient(circle at top right,rgb(var(--ic-primary-bright-rgb) / 0.10),transparent 34%), white",
    fontFamily: "Arial"
  },

  saveOperationalButton: {
    width: "100%",
    marginTop: "18px",
    background:
      "linear-gradient(135deg,#92400e,#facc15)",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "17px",
    cursor: "pointer",
    fontWeight: "900"
  },

  modalBg: {
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
    width: "100%",
    maxWidth: "820px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fbfaff",
    boxSizing: "border-box",
    padding: "26px",
    borderRadius: "36px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.28)"
  },

  modalTop: {
    background:
      "linear-gradient(135deg,var(--ic-primary-deep),var(--ic-primary))",
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

  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "18px"
  },

  saveBtn: {
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

  cancelBtn: {
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

export default Prestadores;