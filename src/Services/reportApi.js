import api from "./api.js";
import residentApi from "./residentApi.js";
import apartmentApi from "./apartmentApi.js";
import doormanApi from "./doormanApi.js";
import visitorApi from "./visitorApi.js";
import packageApi from "./packageApi.js";
import reservationApi from "./reservationApi.js";
import commonAreaApi from "./commonAreaApi.js";
import noticeApi from "./noticeApi.js";
import occurrenceApi from "./occurrenceApi.js";
import serviceProviderApi from "./serviceProviderApi.js";
import operationalRecordApi from "./operationalRecordApi.js";

const unwrap=(r)=>r?.data?.data??r?.data??r??null;
const reportApi={
  async loadAll(){
    const [moradores,apartamentos,porteiros,visitantes,encomendas,reservas,areasComuns,avisos,prestadores,ocorrencias,movimentacoes,audit,me]=await Promise.all([
      residentApi.list(),apartmentApi.list(),doormanApi.list(),visitorApi.list(),packageApi.list(),reservationApi.list(),commonAreaApi.list(),noticeApi.list(),serviceProviderApi.list(),occurrenceApi.list(),operationalRecordApi.list(),api.get("/v1/audit"),api.get("/v1/auth/me")
    ]);
    const auditoria=unwrap(audit); const usuario=unwrap(me);
    return {moradores,apartamentos,porteiros,visitantes,encomendas,reservas,areasComuns,avisos,prestadores,ocorrencias,sugestoes:ocorrencias.filter(x=>["SUGGESTION","COMPLAINT","REQUEST"].includes(String(x.type||x.category||"").toUpperCase())),movimentacoes,auditoria:Array.isArray(auditoria)?auditoria:(auditoria?.items||[]),configuracoes:usuario?.condominium||{},usuario};
  },
  async registrarExportacao({tipo,titulo,periodo}){
    return api.post("/v1/operational-records",{type:"REPORT_EXPORT",title:`${titulo} - ${tipo}`,description:`Relatório exportado em ${tipo}. Período: ${periodo}.`});
  }
};
export default reportApi;