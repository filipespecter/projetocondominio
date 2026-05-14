import { useState, useEffect } from "react";

function Avisos() {

  const [avisos, setAvisos] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [novoAviso, setNovoAviso] = useState({
    titulo: "",
    descricao: "",
    prioridade: "Média"
  });

  const [editId, setEditId] = useState(null);


  // carregar avisos salvos
  useEffect(() => {

    const dados = localStorage.getItem("avisos");

    if (dados) {
      setAvisos(JSON.parse(dados));
    } else {

      setAvisos([
        {
          id: 1,
          titulo: "Manutenção do elevador",
          descricao: "Será realizada amanhã às 08:00.",
          prioridade: "Alta"
        },
        {
          id: 2,
          titulo: "Interrupção de água",
          descricao: "Bloco B ficará sem água das 14h às 16h.",
          prioridade: "Média"
        }
      ]);

    }

  }, []);


  // salvar automaticamente
  useEffect(() => {

    localStorage.setItem(
      "avisos",
      JSON.stringify(avisos)
    );

  }, [avisos]);


  function salvarAviso() {

    if (!novoAviso.titulo || !novoAviso.descricao) {
      alert("Preencha todos os campos");
      return;
    }

    if (editId !== null) {

      const lista = avisos.map((a) =>
        a.id === editId
          ? { ...novoAviso, id: editId }
          : a
      );

      setAvisos(lista);

      setEditId(null);

    } else {

      const novo = {
        id: Date.now(),
        ...novoAviso
      };

      setAvisos([...avisos, novo]);

    }

    setNovoAviso({
      titulo: "",
      descricao: "",
      prioridade: "Média"
    });

    setMostrarModal(false);

  }


  function editarAviso(aviso) {

    setNovoAviso(aviso);

    setEditId(aviso.id);

    setMostrarModal(true);

  }


  function excluirAviso(id) {

    const lista = avisos.filter(
      (a) => a.id !== id
    );

    setAvisos(lista);

  }


  function corPrioridade(prioridade){

    switch(prioridade){

      case "Alta":
        return "#ef4444";

      case "Média":
        return "#f59e0b";

      case "Baixa":
        return "#22c55e";

      default:
        return "#ccc";

    }

  }


  return (

    <div>

      {/* TOPO */}

      <div style={styles.header}>

        <h2>📢 Avisos</h2>

        <button
          style={styles.button}
          onClick={() => {

            setEditId(null);

            setNovoAviso({
              titulo:"",
              descricao:"",
              prioridade:"Média"
            });

            setMostrarModal(true);

          }}
        >
          + Novo aviso
        </button>

      </div>


      {/* TABELA */}

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>Título</th>

              <th style={styles.th}>Descrição</th>

              <th style={styles.th}>Prioridade</th>

              <th style={styles.th}>Ações</th>

            </tr>

          </thead>

          <tbody>

            {avisos.map((aviso) => (

              <tr key={aviso.id}>

                <td style={styles.td}>
                  {aviso.titulo}
                </td>

                <td style={styles.td}>
                  {aviso.descricao}
                </td>

                <td style={styles.td}>

                  <span
                    style={{
                      background: corPrioridade(aviso.prioridade),
                      color:"white",
                      padding:"5px 10px",
                      borderRadius:"20px",
                      fontSize:"12px"
                    }}
                  >
                    {aviso.prioridade}
                  </span>

                </td>

                <td style={styles.td}>

                  <span
                    style={styles.icon}
                    onClick={() =>
                      editarAviso(aviso)
                    }
                  >
                    ✏️
                  </span>

                  <span
                    style={styles.icon}
                    onClick={() =>
                      excluirAviso(aviso.id)
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
                ? "Editar aviso"
                : "Novo aviso"}
            </h3>


            <input
              placeholder="Título"
              value={novoAviso.titulo}
              onChange={(e)=>
                setNovoAviso({
                  ...novoAviso,
                  titulo:e.target.value
                })
              }
              style={styles.input}
            />

            <textarea
              placeholder="Descrição"
              value={novoAviso.descricao}
              onChange={(e)=>
                setNovoAviso({
                  ...novoAviso,
                  descricao:e.target.value
                })
              }
              style={styles.textarea}
            />

            <select
              value={novoAviso.prioridade}
              onChange={(e)=>
                setNovoAviso({
                  ...novoAviso,
                  prioridade:e.target.value
                })
              }
              style={styles.input}
            >

              <option>Alta</option>
              <option>Média</option>
              <option>Baixa</option>

            </select>


            <div style={styles.modalButtons}>

              <button
                style={styles.saveBtn}
                onClick={salvarAviso}
              >
                Salvar
              </button>

              <button
                style={styles.cancelBtn}
                onClick={() =>
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
width:"350px",
display:"flex",
flexDirection:"column",
gap:"10px"
},

input:{
padding:"10px",
border:"1px solid #ccc",
borderRadius:"6px"
},

textarea:{
padding:"10px",
height:"100px",
resize:"none",
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

export default Avisos;