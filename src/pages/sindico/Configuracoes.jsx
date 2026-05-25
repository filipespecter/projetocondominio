import { useState, useEffect } from "react";

function Configuracoes() {

  const [config, setConfig] = useState({
    nomeCondominio: "",
    endereco: "",
    telefone: "",
    sindico: "",
    email: "",
    corTema: "#14532d"
  });

  const [salvo, setSalvo] = useState(false);


  // CARREGAR CONFIGURAÇÕES

  useEffect(() => {

    const dados = localStorage.getItem("configuracoes");

    if (dados) {

      setConfig(JSON.parse(dados));

    }

  }, []);


  // SALVAR

  function salvar() {

    localStorage.setItem(
      "configuracoes",
      JSON.stringify(config)
    );

    setSalvo(true);

    setTimeout(() => {

      setSalvo(false);

    }, 3000);

  }


  return (

    <div style={styles.container}>


      {/* HEADER */}


      <div style={styles.header}>


        <div>

          <h1 style={styles.title}>
            Configurações
          </h1>

          <p style={styles.subtitle}>
            Gerencie as informações do condomínio
          </p>

        </div>


        <button
          style={styles.saveTopButton}
          onClick={salvar}
        >

          Salvar alterações

        </button>


      </div>



      {/* RESUMO */}


      <div style={styles.resumeGrid}>


        <div style={styles.resumeCard}>


          <div style={styles.resumeIcon}>
            🏢
          </div>


          <div>

            <p style={styles.resumeLabel}>
              Condomínio
            </p>

            <h2 style={styles.resumeNumber}>
              {
                config.nomeCondominio
                || "Não definido"
              }
            </h2>

          </div>

        </div>


        <div style={styles.resumeCard}>


          <div style={styles.resumeIcon}>
            👨‍💼
          </div>


          <div>

            <p style={styles.resumeLabel}>
              Síndico
            </p>

            <h2 style={styles.resumeNumber}>
              {
                config.sindico
                || "Não definido"
              }
            </h2>

          </div>

        </div>


      </div>



      {/* FORMULÁRIO */}


      <div style={styles.card}>


        <h2 style={styles.cardTitle}>
          Informações do condomínio
        </h2>


        <div style={styles.formGrid}>


          <div style={styles.group}>


            <label style={styles.label}>
              Nome do condomínio
            </label>


            <input
              type="text"
              value={config.nomeCondominio}
              onChange={(e) =>

                setConfig({
                  ...config,
                  nomeCondominio:e.target.value
                })

              }
              style={styles.input}
            />

          </div>



          <div style={styles.group}>


            <label style={styles.label}>
              Nome do síndico
            </label>


            <input
              type="text"
              value={config.sindico}
              onChange={(e) =>

                setConfig({
                  ...config,
                  sindico:e.target.value
                })

              }
              style={styles.input}
            />

          </div>



          <div style={styles.group}>


            <label style={styles.label}>
              Telefone
            </label>


            <input
              type="text"
              value={config.telefone}
              onChange={(e) =>

                setConfig({
                  ...config,
                  telefone:e.target.value
                })

              }
              style={styles.input}
            />

          </div>



          <div style={styles.group}>


            <label style={styles.label}>
              E-mail
            </label>


            <input
              type="email"
              value={config.email}
              onChange={(e) =>

                setConfig({
                  ...config,
                  email:e.target.value
                })

              }
              style={styles.input}
            />

          </div>


        </div>



        <div style={styles.group}>


          <label style={styles.label}>
            Endereço
          </label>


          <input
            type="text"
            value={config.endereco}
            onChange={(e) =>

              setConfig({
                ...config,
                endereco:e.target.value
              })

            }
            style={styles.input}
          />

        </div>



        <div style={styles.group}>


          <label style={styles.label}>
            Cor principal do sistema
          </label>


          <div style={styles.colorRow}>


            <input
              type="color"
              value={config.corTema}
              onChange={(e) =>

                setConfig({
                  ...config,
                  corTema:e.target.value
                })

              }
              style={styles.colorInput}
            />


            <span style={styles.colorText}>
              {config.corTema}
            </span>

          </div>

        </div>



        <button
          style={styles.button}
          onClick={salvar}
        >

          Salvar configurações

        </button>



        {salvo && (

          <div style={styles.success}>

            ✅ Configurações salvas com sucesso

          </div>

        )}


      </div>

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
    marginBottom:"30px"
  },

  title:{
    margin:0,
    fontSize:"32px",
    color:"#14532d"
  },

  subtitle:{
    marginTop:"8px",
    color:"#6b7280"
  },

  saveTopButton:{
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color:"white",
    border:"none",
    padding:"14px 20px",
    borderRadius:"14px",
    cursor:"pointer",
    fontWeight:"700",
    boxShadow:
      "0 6px 18px rgba(20,83,45,0.25)"
  },

  resumeGrid:{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap:"20px",
    marginBottom:"30px"
  },

  resumeCard:{
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    borderRadius:"24px",
    padding:"25px",
    color:"white",
    display:"flex",
    alignItems:"center",
    gap:"18px",
    boxShadow:
      "0 10px 30px rgba(20,83,45,0.20)"
  },

  resumeIcon:{
    fontSize:"42px"
  },

  resumeLabel:{
    margin:0,
    opacity:0.8
  },

  resumeNumber:{
    margin:"6px 0 0",
    fontSize:"24px"
  },

  card:{
    background:"white",
    borderRadius:"24px",
    padding:"30px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.06)",
    display:"flex",
    flexDirection:"column",
    gap:"20px"
  },

  cardTitle:{
    margin:0,
    color:"#14532d"
  },

  formGrid:{
    display:"grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap:"20px"
  },

  group:{
    display:"flex",
    flexDirection:"column",
    gap:"10px"
  },

  label:{
    fontWeight:"600",
    color:"#374151"
  },

  input:{
    padding:"14px",
    border:"1px solid #d1d5db",
    borderRadius:"14px",
    outline:"none",
    fontSize:"14px"
  },

  colorRow:{
    display:"flex",
    alignItems:"center",
    gap:"12px"
  },

  colorInput:{
    width:"60px",
    height:"45px",
    border:"none",
    background:"none",
    cursor:"pointer"
  },

  colorText:{
    fontWeight:"600",
    color:"#374151"
  },

  button:{
    background:
      "linear-gradient(135deg,#14532d,#166534)",
    color:"white",
    border:"none",
    padding:"14px",
    borderRadius:"14px",
    cursor:"pointer",
    fontWeight:"700",
    marginTop:"10px"
  },

  success:{
    background:"#dcfce7",
    color:"#166534",
    padding:"14px",
    borderRadius:"14px",
    fontWeight:"700"
  }

};

export default Configuracoes;