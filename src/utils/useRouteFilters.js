import {useEffect,useState} from "react";
import {useSearchParams} from "react-router-dom";
// Only presentation filters are kept in the address, never passwords or records.
export function useRouteFilters(defaults,prefix="f_"){
 const [params,setParams]=useSearchParams();
 const [filters,setFilters]=useState(()=>Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,params.get(prefix+k)??v])));
 useEffect(()=>{const next=new URLSearchParams(params);for(const [k,v]of Object.entries(filters)){if(v!==""&&v!=null)next.set(prefix+k,String(v));else next.delete(prefix+k);}if(next.toString()!==params.toString())setParams(next,{replace:true});},[filters,params,setParams,prefix]);
 return [filters,setFilters];
}
