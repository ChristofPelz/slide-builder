import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartBlock as ChartBlockType } from "../../types/slide";
import type { Theme } from "../../types/theme";

interface Props {
  block: ChartBlockType;
  theme: Theme;
}

function buildChartData(labels: string[], datasets: ChartBlockType["datasets"]) {
  return labels.map((label, i) => {
    const point: Record<string, string | number> = { label };
    datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0; });
    return point;
  });
}

function formatYTick(value: number, format?: string): string {
  if (format === "currency") {
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + " M€";
    if (Math.abs(value) >= 1_000)     return (value / 1_000).toFixed(0) + " T€";
    return value + " €";
  }
  if (format === "percent") return value + " %";
  return value.toLocaleString("de-DE");
}

export function ChartBlock({ block, theme }: Props) {
  const { chartType, labels, datasets, title, showLegend = true, showGrid = true, formatY } = block;

  const COLORS = [theme.secondary, theme.accent, "#6366f1", "#22c55e", "#f43f5e", "#06b6d4"];

  const data = buildChartData(labels, datasets);
  const dataKeys = datasets.map((ds) => ds.label);

  const axisStyle = { fill: theme.textMuted, fontSize: 11, fontFamily: theme.fontBody };
  const gridProps = showGrid ? { strokeDasharray: "3 3", stroke: "rgba(0,0,0,0.08)" } : undefined;
  const tooltipStyle = { background: theme.surface, border: `1px solid rgba(0,0,0,0.1)`, borderRadius: "6px", fontSize: "12px" };

  const renderChart = () => {
    if (chartType === "pie" || chartType === "donut") {
      const pieData = labels.map((name, i) => ({ name, value: datasets[0]?.data[i] ?? 0 }));
      return (
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%" cy="50%"
            outerRadius={chartType === "donut" ? "65%" : "70%"}
            innerRadius={chartType === "donut" ? "38%" : 0}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={datasets[0]?.color ?? COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      );
    }

    if (chartType === "bar") {
      return (
        <BarChart data={data}>
          {gridProps && <CartesianGrid {...gridProps} />}
          <XAxis dataKey="label" tick={axisStyle} />
          <YAxis tick={axisStyle} tickFormatter={(v) => formatYTick(v, formatY)} width={70} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatYTick(v, formatY)} />
          {showLegend && <Legend wrapperStyle={{ fontSize: "11px", fontFamily: theme.fontBody }} />}
          {dataKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={datasets[i]?.color ?? COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart data={data}>
          {gridProps && <CartesianGrid {...gridProps} />}
          <XAxis dataKey="label" tick={axisStyle} />
          <YAxis tick={axisStyle} tickFormatter={(v) => formatYTick(v, formatY)} width={70} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatYTick(v, formatY)} />
          {showLegend && <Legend wrapperStyle={{ fontSize: "11px", fontFamily: theme.fontBody }} />}
          {dataKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={datasets[i]?.color ?? COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      );
    }

    // area (default)
    return (
      <AreaChart data={data}>
        {gridProps && <CartesianGrid {...gridProps} />}
        <XAxis dataKey="label" tick={axisStyle} />
        <YAxis tick={axisStyle} tickFormatter={(v) => formatYTick(v, formatY)} width={70} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatYTick(v, formatY)} />
        {showLegend && <Legend wrapperStyle={{ fontSize: "11px", fontFamily: theme.fontBody }} />}
        {dataKeys.map((key, i) => {
          const color = datasets[i]?.color ?? COLORS[i % COLORS.length];
          return (
            <Area key={key} type="monotone" dataKey={key} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} dot={false} />
          );
        })}
      </AreaChart>
    );
  };

  return (
    <div style={{
      width: "100%", height: "100%",
      background: theme.surface,
      borderRadius: `${theme.borderRadius}px`,
      padding: "12px",
      boxSizing: "border-box",
      display: "flex", flexDirection: "column",
    }}>
      {title && (
        <span style={{
          fontSize: "13px", fontWeight: 600,
          fontFamily: theme.fontHeading,
          color: theme.text,
          marginBottom: "8px", flexShrink: 0,
        }}>
          {title}
        </span>
      )}
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
