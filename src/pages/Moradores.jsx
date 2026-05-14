import { useState } from "react";

function Moradores() {

  const [moradores, setMoradores] = useState([
    { nome: "João Silva", apto: "101", telefone: "99999-1111" },
    { nome: "Maria Souza", apto: "202", telefone: "99999-2222" },
    { nome: "Carlos Lima", apto: "305", telefone: "99999-3333" }
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [busca, setBusca] = useState("");

  const [novoMorador, setNovoMorador] = useState({
    nome: "",
    apto: "",
    telefone: ""
  });

  const [editIndex, setEditIndex] = useState(null);


  const moradoresFiltrados = moradores.filter((morador) =>

    morador.nome.toLowerCase().includes(busca.toLowerCase()) ||
    morador.apto.toLowerCase().includes(busca.toLowerCase()) ||
    morador.telefone.toLowerCase().includes(busca.toLowerCase())

  );


  function salvarMorador() {

    if (editIndex !== null) {

      const lista = [...moradores];

      lista[editIndex] = novoMorador;

      setMoradores(lista);

      setEditIndex(null);

    } else {

      setMoradores([
        ...moradores,
        novoMorador
      ]);

    }

    setNovoMorador({
      nome:"",
      apto:"",
      telefone:""
    });

    setMostrarModal(false);

  }


  function excluirMorador(index){

    const lista = moradores.filter(
      (_,i)=> i !== index
    );

    setMoradores(lista);

  }


  function editarMorador(index){

    setNovoMorador(
      moradores[index]
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
            Moradores
          </h2>

          <p style={styles.subtitle}>
            Gerenciamento dos moradores
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

              setNovoMorador({
                nome:"",
                apto:"",
                telefone:""
              });

              setMostrarModal(true);

            }}
          >

          + Novo morador

          </button>


        </div>

      </div>



      {/* TABELA */}


      <div style={styles.card}>


        <table style={styles.table}>


          <thead>

            <tr>

              <th style={styles.th}>
                Nome
              </th>

              <th style={styles.th}>
                Apartamento
              </th>

              <th style={styles.th}>
                Telefone
              </th>

              <th style={styles.thCenter}>
                Ações
              </th>

            </tr>

          </thead>


          <tbody>


            {moradoresFiltrados.map((morador,index)=>(

              <tr key={index}>

                <td style={styles.td}>
                  {morador.nome}
                </td>

                <td style={styles.td}>
                  {morador.apto}
                </td>

                <td style={styles.td}>
                  {morador.telefone}
                </td>

                <td style={styles.tdCenter}>


                  <span
                  style={styles.icon}
                  onClick={()=>editarMorador(index)}
                  >

                  ✏️

                  </span>


                  <span
                  style={styles.icon}
                  onClick={()=>excluirMorador(index)}
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
      ? "Editar morador"
      : "Novo morador"}

      </h3>


      <input
      placeholder="Nome"
      value={novoMorador.nome}
      onChange={(e)=>
      setNovoMorador({
      ...novoMorador,
      nome:e.target.value
      })
      }
      style={styles.input}
      />


      <input
      placeholder="Apartamento"
      value={novoMorador.apto}
      onChange={(e)=>
      setNovoMorador({
      ...novoMorador,
      apto:e.target.value
      })
      }
      style={styles.input}
      />


      <input
      placeholder="Telefone"
      value={novoMorador.telefone}
      onChange={(e)=>
      setNovoMorador({
      ...novoMorador,
      telefone:e.target.value
      })
      }
      style={styles.input}
      />


      <div style={styles.modalButtons}>


      <button
      style={styles.saveButton}
      onClick={salvarMorador}
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


const styles = {

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

export default Moradores;