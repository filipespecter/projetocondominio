import { useState } from "react";

function Apartamentos() {

  const [apartamentos, setApartamentos] = useState([
    { bloco: "A", numero: "101", andar: "1º", morador: "João da Silva" },
    { bloco: "A", numero: "102", andar: "1º", morador: "Maria Oliveira" },
    { bloco: "A", numero: "201", andar: "2º", morador: "Carlos Santos" },
    { bloco: "B", numero: "101", andar: "1º", morador: "Ana Paula" }
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [busca, setBusca] = useState("");

  const [novoAp, setNovoAp] = useState({
    bloco: "",
    numero: "",
    andar: "",
    morador: ""
  });

  const [editIndex, setEditIndex] = useState(null);


  const apartamentosFiltrados = apartamentos.filter((ap) =>
    ap.bloco.toLowerCase().includes(busca.toLowerCase()) ||
    ap.numero.toLowerCase().includes(busca.toLowerCase()) ||
    ap.andar.toLowerCase().includes(busca.toLowerCase()) ||
    ap.morador.toLowerCase().includes(busca.toLowerCase())
  );


  function adicionarApartamento() {

    if (editIndex !== null) {

      const lista = [...apartamentos];

      lista[editIndex] = novoAp;

      setApartamentos(lista);

      setEditIndex(null);

    } else {

      setApartamentos([
        ...apartamentos,
        novoAp
      ]);

    }

    setNovoAp({
      bloco:"",
      numero:"",
      andar:"",
      morador:""
    });

    setMostrarModal(false);

  }


  function excluirApartamento(index){

    const lista = apartamentos.filter(
      (_,i)=> i !== index
    );

    setApartamentos(lista);

  }


  function editarApartamento(index){

    setNovoAp(
      apartamentos[index]
    );

    setEditIndex(index);

    setMostrarModal(true);

  }


  return (

    <div style={styles.container}>


      {/* CABEÇALHO */}


      <div style={styles.header}>

        <div>

          <h2 style={styles.title}>
            Apartamentos
          </h2>

          <p style={styles.subtitle}>
            Gerenciamento dos apartamentos
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
              setEditIndex(null);

              setNovoAp({
                bloco:"",
                numero:"",
                andar:"",
                morador:""
              });

              setMostrarModal(true);

            }}
          >

            + Novo apartamento

          </button>

        </div>

      </div>



      {/* TABELA */}


      <div style={styles.card}>


        <table style={styles.table}>


          <thead>

          <tr>

            <th style={styles.th}>Bloco</th>

            <th style={styles.th}>Número</th>

            <th style={styles.th}>Andar</th>

            <th style={styles.th}>Morador</th>

            <th style={styles.thCenter}>Ações</th>

          </tr>

          </thead>


          <tbody>


          {apartamentosFiltrados.map((ap,index)=>(

          <tr key={index}>

            <td style={styles.td}>
              {ap.bloco}
            </td>

            <td style={styles.td}>
              {ap.numero}
            </td>

            <td style={styles.td}>
              {ap.andar}
            </td>

            <td style={styles.td}>
              {ap.morador}
            </td>

            <td style={styles.tdCenter}>


              <span
              style={styles.icon}
              onClick={()=>editarApartamento(index)}
              >

              ✏️

              </span>


              <span
              style={styles.icon}
              onClick={()=>excluirApartamento(index)}
              >

              🗑️

              </span>


            </td>

          </tr>

          ))}


          </tbody>

        </table>

      </div>



      {/* MODAL */}


      {mostrarModal && (

      <div style={styles.modalBackground}>


      <div style={styles.modal}>


      <h3>

      {editIndex !== null
      ? "Editar apartamento"
      :"Novo apartamento"}

      </h3>


      <input
      placeholder="Bloco"
      value={novoAp.bloco}
      onChange={(e)=>
      setNovoAp({
      ...novoAp,
      bloco:e.target.value
      })
      }
      style={styles.input}
      />


      <input
      placeholder="Número"
      value={novoAp.numero}
      onChange={(e)=>
      setNovoAp({
      ...novoAp,
      numero:e.target.value
      })
      }
      style={styles.input}
      />


      <input
      placeholder="Andar"
      value={novoAp.andar}
      onChange={(e)=>
      setNovoAp({
      ...novoAp,
      andar:e.target.value
      })
      }
      style={styles.input}
      />


      <input
      placeholder="Morador"
      value={novoAp.morador}
      onChange={(e)=>
      setNovoAp({
      ...novoAp,
      morador:e.target.value
      })
      }
      style={styles.input}
      />


      <div style={styles.modalButtons}>


      <button
      style={styles.saveButton}
      onClick={adicionarApartamento}
      >

      Salvar

      </button>


      <button
      style={styles.cancelButton}
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

  );

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
borderRadius:"8px",
outline:"none"
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
margin:"0 5px"
},

modalBackground:{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,.5)",
display:"flex",
alignItems:"center",
justifyContent:"center"
},

modal:{
width:"350px",
background:"white",
padding:"30px",
borderRadius:"12px",
display:"flex",
flexDirection:"column",
gap:"12px"
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

saveButton:{
background:"#6c3eb8",
border:"none",
padding:"10px 18px",
borderRadius:"8px",
color:"white",
cursor:"pointer"
},

cancelButton:{
background:"#ddd",
border:"none",
padding:"10px 18px",
borderRadius:"8px",
cursor:"pointer"
}

};

export default Apartamentos;