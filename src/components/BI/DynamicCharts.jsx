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
    "#22c55e",
    "#facc15",
    "#6d28d9",
    "#8b5cf6",
    "#c084fc",
    "#eab308"
  ];

  const gridColor = "rgba(124,255,74,0.14)";
  const axisColor = "#b9ff8a";
  const primaryColor = "#7cff4a";
  const secondaryColor = "#facc15";

  const tooltipStyle = {
    background: "#2e1065",
    border: "1px solid rgba(124,255,74,0.30)",
    borderRadius: "14px",
    color: "#ffffff",
    boxShadow: "0 18px 40px rgba(88,28,135,0.28)"
  };

  if (tipo === "linha") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xKey} stroke={axisColor} />
          <YAxis stroke={axisColor} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={primaryColor}
            strokeWidth={4}
            dot={{ r: 5, fill: primaryColor }}
          />

          {secondKey && (
            <Line
              type="monotone"
              dataKey={secondKey}
              stroke={secondaryColor}
              strokeWidth={3}
              dot={{ r: 5, fill: secondaryColor }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (tipo === "pizza") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={xKey}
            outerRadius="70%"
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (tipo === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xKey} stroke={axisColor} />
          <YAxis stroke={axisColor} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={primaryColor}
            fill="rgba(124,255,74,0.22)"
            strokeWidth={3}
          />

          {secondKey && (
            <Area
              type="monotone"
              dataKey={secondKey}
              stroke={secondaryColor}
              fill="rgba(250,204,21,0.16)"
              strokeWidth={3}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} stroke={axisColor} />
        <YAxis stroke={axisColor} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />

        <Bar
          dataKey={dataKey}
          fill={primaryColor}
          radius={[14, 14, 0, 0]}
        />

        {secondKey && (
          <Bar
            dataKey={secondKey}
            fill={secondaryColor}
            radius={[14, 14, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DynamicCharts;
