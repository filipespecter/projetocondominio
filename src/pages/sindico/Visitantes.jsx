import { useState } from "react";

function Visitantes() {

  const [visitantes, setVisitantes] = useState([
    {
      id: 1,
      nome: "Pedro Alves",
      documento: "123.456.789-00",
      apartamento: "101",
      entrada: "10:30",
      status: "Em visita"
    },
    {
      id: 2,
      nome: "Ana Costa",
      documento: "987.654.321-00",
      apartamento: "202",
      entrada: "11:00",
      status: "Autorizado"
    }
  ]);

  const [mostrarModal,setMostrarModal] = useState(false);

  const [busca,setBusca] = useState("");

  const [novoVisitante,setNovoVisitante] = useState({
    nome:"",
    documento:"",
    apartamento:"",
    entrada:"",
    status:"Em visita"
  });

  const [editId,setEditId] = useState(null);



  const visitantesFiltrados = visitantes.filter((v)=>

      v.nome.toLowerCase().includes(busca.toLowerCase()) ||
      v.documento.toLowerCase().includes(busca.toLowerCase()) ||
      v.apartamento.toLowerCase().includes(busca.toLowerCase())

  );



  function salvarVisitante(){

    if(editId !== null){

      const lista = visitantes.map((v)=>

      v.id===editId
      ? {...novoVisitante,id:editId}
      :v

      );

      setVisitantes(lista);

      setEditId(null);

    }

    else{

      const novo={

      id:Date.now(),
      ...novoVisitante

      };

      setVisitantes([
      ...visitantes,
      novo
      ]);

    }


    setNovoVisitante({

      nome:"",
      documento:"",
      apartamento:"",
      entrada:"",
      status:"Em visita"

    });


    setMostrarModal(false);

  }



function excluirVisitante(id){

setVisitantes(

visitantes.filter(
(v)=>v.id !== id
)

);

}



function editarVisitante(v){

setNovoVisitante(v);

setEditId(v.id);

setMostrarModal(true);

}



function mudarStatus(id,status){

const lista=visitantes.map((v)=>

v.id===id
?{...v,status}
:v

);

setVisitantes(lista);

}




return(

<div style={styles.container}>


<div style={styles.header}>


<div>

<h2 style={styles.title}>
Visitantes
</h2>

<p style={styles.subtitle}>
Controle de visitantes do condomínio
</p>

</div>


<div style={styles.actions}>


<input
placeholder="Buscar..."
value={busca}
onChange={(e)=>setBusca(e.target.value)}
style={styles.search}
/>


<button

style={styles.button}

onClick={()=>{

setEditId(null);

setNovoVisitante({

nome:"",
documento:"",
apartamento:"",
entrada:"",
status:"Em visita"

});

setMostrarModal(true);

}}

>

+ Novo visitante

</button>


</div>


</div>




<div style={styles.card}>


<table style={styles.table}>


<thead>

<tr>

<th style={styles.th}>
Nome
</th>

<th style={styles.th}>
Documento
</th>

<th style={styles.th}>
Apartamento
</th>

<th style={styles.th}>
Entrada
</th>

<th style={styles.th}>
Status
</th>

<th style={styles.thCenter}>
Ações
</th>

</tr>

</thead>


<tbody>


{visitantesFiltrados.map((v)=>(


<tr key={v.id}>


<td style={styles.td}>
{v.nome}
</td>


<td style={styles.td}>
{v.documento}
</td>


<td style={styles.td}>
{v.apartamento}
</td>


<td style={styles.td}>
{v.entrada}
</td>


<td style={styles.td}>

<span
style={{
...styles.status,

backgroundColor:
v.status==="Em visita"
? "#dcfce7"
: "#e5e7eb",

color:
v.status==="Em visita"
? "#166534"
: "#555"
}}
>

{v.status}

</span>

</td>



<td style={styles.tdCenter}>


<button

style={styles.smallBtn}

onClick={()=>
mudarStatus(v.id,"Em visita")
}

>

Entrou

</button>


<button

style={styles.smallBtn}

onClick={()=>
mudarStatus(v.id,"Saiu")
}

>

Saiu

</button>


<span
style={styles.icon}
onClick={()=>
editarVisitante(v)
}
>

✏️

</span>


<span
style={styles.icon}
onClick={()=>
excluirVisitante(v.id)
}
>

🗑️

</span>


</td>

</tr>

))}


</tbody>

</table>

</div>




{mostrarModal && (


<div style={styles.modalBg}>


<div style={styles.modal}>


<h3>

{editId
? "Editar visitante"
: "Novo visitante"}

</h3>


<input
placeholder="Nome"
value={novoVisitante.nome}
onChange={(e)=>

setNovoVisitante({
...novoVisitante,
nome:e.target.value
})

}
style={styles.input}
/>



<input
placeholder="Documento"
value={novoVisitante.documento}
onChange={(e)=>

setNovoVisitante({
...novoVisitante,
documento:e.target.value
})

}
style={styles.input}
/>



<input
placeholder="Apartamento"
value={novoVisitante.apartamento}
onChange={(e)=>

setNovoVisitante({
...novoVisitante,
apartamento:e.target.value
})

}
style={styles.input}
/>



<input
placeholder="Hora entrada"
value={novoVisitante.entrada}
onChange={(e)=>

setNovoVisitante({
...novoVisitante,
entrada:e.target.value
})

}
style={styles.input}
/>


<div style={styles.modalButtons}>


<button
style={styles.saveBtn}
onClick={salvarVisitante}
>

Salvar

</button>


<button
style={styles.cancelBtn}
onClick={()=>
setMostrarModal(false)
}
>

Cancelar

</button>


</div>

</div>

</div>

)}

</div>

)

}



const styles={

container:{
width:"100%"
},

header:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"25px"
},

title:{
margin:"0"
},

subtitle:{
margin:"5px 0 0",
color:"#777"
},

actions:{
display:"flex",
gap:"10px"
},

search:{
padding:"10px",
border:"1px solid #ddd",
borderRadius:"8px"
},

button:{
background:"#6c3eb8",
color:"white",
border:"none",
padding:"10px 16px",
borderRadius:"8px",
cursor:"pointer",
fontWeight:"bold"
},

card:{
background:"white",
padding:"25px",
borderRadius:"12px",
boxShadow:"0 2px 10px rgba(0,0,0,.05)"
},

table:{
width:"100%",
borderCollapse:"collapse"
},

th:{
padding:"15px",
textAlign:"left",
borderBottom:"2px solid #eee"
},

thCenter:{
padding:"15px",
textAlign:"center",
borderBottom:"2px solid #eee"
},

td:{
padding:"15px",
borderBottom:"1px solid #eee"
},

tdCenter:{
padding:"15px",
textAlign:"center",
borderBottom:"1px solid #eee"
},

icon:{
cursor:"pointer",
marginLeft:"10px"
},

smallBtn:{
border:"none",
padding:"7px 10px",
marginRight:"5px",
borderRadius:"6px",
cursor:"pointer"
},

status:{
padding:"6px 10px",
borderRadius:"20px",
fontSize:"13px"
},

modalBg:{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,.5)",
display:"flex",
justifyContent:"center",
alignItems:"center"
},

modal:{
width:"350px",
background:"white",
padding:"30px",
borderRadius:"12px",
display:"flex",
flexDirection:"column",
gap:"10px"
},

input:{
padding:"10px",
border:"1px solid #ddd",
borderRadius:"8px"
},

modalButtons:{
display:"flex",
justifyContent:"space-between"
},

saveBtn:{
background:"#6c3eb8",
border:"none",
padding:"10px 18px",
borderRadius:"8px",
color:"white"
},

cancelBtn:{
background:"#ddd",
border:"none",
padding:"10px 18px",
borderRadius:"8px"
}

};

export default Visitantes;