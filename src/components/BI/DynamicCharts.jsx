import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

function DynamicCharts({
  tipo = "barra",
  data = [],
  dataKey = "total",
  xKey = "nome",
  secondKey = null,
  height = 360
}) {
  const COLORS = [
    "#7cff4a",
    "#b9ff8a",
    "#facc15",
    "#8cff66",
    "#6eff3b",
    "#d8ffbe",
    "#9dff70",
    "#eab308"
  ];

  if (tipo === "linha") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,255,138,0.10)" />
          <XAxis dataKey={xKey} stroke="#b9ff8a" />
          <YAxis stroke="#b9ff8a" />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey={dataKey} stroke="#7cff4a" strokeWidth={4} dot={{ r: 5 }} />

          {secondKey && (
            <Line type="monotone" dataKey={secondKey} stroke="#facc15" strokeWidth={3} dot={{ r: 5 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (tipo === "pizza") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={xKey} outerRadius="70%" label>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (tipo === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,255,138,0.10)" />
          <XAxis dataKey={xKey} stroke="#b9ff8a" />
          <YAxis stroke="#b9ff8a" />
          <Tooltip />
          <Legend />

          <Area type="monotone" dataKey={dataKey} stroke="#7cff4a" fill="rgba(124,255,74,0.22)" strokeWidth={3} />

          {secondKey && (
            <Area type="monotone" dataKey={secondKey} stroke="#facc15" fill="rgba(250,204,21,0.16)" strokeWidth={3} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(185,255,138,0.10)" />
        <XAxis dataKey={xKey} stroke="#b9ff8a" />
        <YAxis stroke="#b9ff8a" />
        <Tooltip />
        <Legend />

        <Bar dataKey={dataKey} fill="#7cff4a" radius={[14, 14, 0, 0]} />

        {secondKey && (
          <Bar dataKey={secondKey} fill="#facc15" radius={[14, 14, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DynamicCharts;