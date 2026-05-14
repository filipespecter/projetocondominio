import { useState, useEffect } from "react";

function Porteiros() {

  const [porteiros, setPorteiros] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [novoPorteiro, setNovoPorteiro] = useState({
    nome: "",
    turno: "",
    telefone: ""
  });

  const [editId, setEditId] = useState(null);


  // carregar dados
  useEffect(() => {

    const dados = localStorage.getItem("porteiros");

    if (dados) {

      setPorteiros(JSON.parse(dados));

    } else {

      setPorteiros([
        {
          id:1,
          nome:"José Carlos",
          turno:"Manhã",
          telefone:"99999-1111"
        },
        {
          id:2,
          nome:"Marcos Silva",
          turno:"Noite",
          telefone:"99999-2222"
        }
      ]);

    }

  }, []);


  // salvar
  useEffect(()=>{

    localStorage.setItem(
      "porteiros",
      JSON.stringify(porteiros)
    );

  },[porteiros]);


  function salvarPorteiro(){

    if(
      !novoPorteiro.nome ||
      !novoPorteiro.turno ||
      !novoPorteiro.telefone
    ){
      alert("Preencha todos os campos");
      return;
    }


    if(editId !== null){

      const lista = porteiros.map((p)=>

        p.id === editId
        ? { ...novoPorteiro,id:editId }
        : p

      );

      setPorteiros(lista);

      setEditId(null);

    }else{

      const novo = {
        id:Date.now(),
        ...novoPorteiro
      };

      setPorteiros([
        ...porteiros,
        novo
      ]);

    }


    setNovoPorteiro({
      nome:"",
      turno:"",
      telefone:""
    });

    setMostrarModal(false);

  }


  function editarPorteiro(porteiro){

    setNovoPorteiro(porteiro);

    setEditId(porteiro.id);

    setMostrarModal(true);

  }


  function excluirPorteiro(id){

    const lista = porteiros.filter(
      (p)=>p.id !== id
    );

    setPorteiros(lista);

  }


  return (

    <div>

      {/* TOPO */}

      <div style={styles.header}>

        <h2>🛡️ Porteiros</h2>

        <button
          style={styles.button}
          onClick={()=>{

            setEditId(null);

            setNovoPorteiro({
              nome:"",
              turno:"",
              telefone:""
            });

            setMostrarModal(true);

          }}
        >
          + Novo porteiro
        </button>

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
                Turno
              </th>

              <th style={styles.th}>
                Telefone
              </th>

              <th style={styles.th}>
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {porteiros.map((p)=>(

              <tr key={p.id}>

                <td style={styles.td}>
                  {p.nome}
                </td>

                <td style={styles.td}>
                  {p.turno}
                </td>

                <td style={styles.td}>
                  {p.telefone}
                </td>

                <td style={styles.td}>

                  <span
                    style={styles.icon}
                    onClick={()=>
                      editarPorteiro(p)
                    }
                  >
                    ✏️
                  </span>

                  <span
                    style={styles.icon}
                    onClick={()=>
                      excluirPorteiro(p.id)
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


      {/* MODAL */}

      {mostrarModal && (

        <div style={styles.modalBg}>

          <div style={styles.modal}>

            <h3>

              {editId !== null
              ? "Editar porteiro"
              : "Novo porteiro"}

            </h3>


            <input
              placeholder="Nome"
              value={novoPorteiro.nome}
              onChange={(e)=>

                setNovoPorteiro({
                  ...novoPorteiro,
                  nome:e.target.value
                })

              }
              style={styles.input}
            />

            <select
              value={novoPorteiro.turno}
              onChange={(e)=>

                setNovoPorteiro({
                  ...novoPorteiro,
                  turno:e.target.value
                })

              }
              style={styles.input}
            >

              <option value="">
                Escolha turno
              </option>

              <option>
                Manhã
              </option>

              <option>
                Tarde
              </option>

              <option>
                Noite
              </option>

            </select>

            <input
              placeholder="Telefone"
              value={novoPorteiro.telefone}
              onChange={(e)=>

                setNovoPorteiro({
                  ...novoPorteiro,
                  telefone:e.target.value
                })

              }
              style={styles.input}
            />


            <div style={styles.modalButtons}>

              <button
                style={styles.saveBtn}
                onClick={salvarPorteiro}
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

  );

}


const styles={

header:{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"20px"
},

button:{
background:"#6c3eb8",
color:"white",
border:"none",
padding:"10px 16px",
borderRadius:"6px",
cursor:"pointer"
},

card:{
background:"white",
padding:"20px",
borderRadius:"10px",
boxShadow:"0 2px 10px rgba(0,0,0,0.05)"
},

table:{
width:"100%",
borderCollapse:"collapse"
},

th:{
padding:"14px",
textAlign:"left",
borderBottom:"2px solid #eee"
},

td:{
padding:"14px",
borderBottom:"1px solid #eee"
},

icon:{
cursor:"pointer",
marginRight:"10px"
},

modalBg:{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.4)",
display:"flex",
justifyContent:"center",
alignItems:"center"
},

modal:{
background:"white",
padding:"30px",
borderRadius:"10px",
width:"320px",
display:"flex",
flexDirection:"column",
gap:"10px"
},

input:{
padding:"10px",
border:"1px solid #ccc",
borderRadius:"6px"
},

modalButtons:{
display:"flex",
justifyContent:"space-between"
},

saveBtn:{
background:"#6c3eb8",
color:"white",
border:"none",
padding:"8px 14px",
borderRadius:"5px",
cursor:"pointer"
},

cancelBtn:{
background:"#ccc",
border:"none",
padding:"8px 14px",
borderRadius:"5px",
cursor:"pointer"
}

};

export default Porteiros;