const filters=["start","end","operator","profile","status","category","module","action"];
export function biWindowUrl(type,{filters:values={},view="combined",unit="daily",kind="combined",tab="overview"}={}){
 const query=new URLSearchParams({live:"1"});
 if(type==="analytics"){
  for(const key of filters)if(values[key]!=null&&values[key]!=="")query.set("f_"+key,String(values[key]));
  query.set("view",view);query.set("unit",unit);query.set("kind",kind);
 }else query.set("tab",tab);
 return (type==="analytics"?"/bi-analytics":"/bi-monitor")+"?"+query;
}
export function biChoice(key,allowed,fallback){const value=new URLSearchParams(window.location.search).get(key);return allowed.includes(value)?value:fallback;}
