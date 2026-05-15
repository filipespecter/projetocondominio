import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function Movimentacoes() {

  const dados = [
    { dia: "Seg", movimentacao: 12 },
    { dia: "Ter", movimentacao: 19 },
    { dia: "Qua", movimentacao: 7 },
    { dia: "Qui", movimentacao: 15 },
    { dia: "Sex", movimentacao: 22 },
    { dia: "Sab", movimentacao: 9 },
    { dia: "Dom", movimentacao: 5 }
  ];

  return (

    <div>

      <h1>Movimentações da Portaria</h1>

      <div style={styles.chart}>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart data={dados}>

            <XAxis dataKey="dia" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="movimentacao"
              stroke="#7b2cbf"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

const styles = {

  chart: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    marginTop: "30px",
    boxShadow: "0px 2px 10px rgba(0,0,0,0.1)"
  }

};

export default Movimentacoes;