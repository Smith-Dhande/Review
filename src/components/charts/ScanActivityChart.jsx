import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function ScanTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const value = payload[0]?.value ?? 0

  return (
    <div className="bg-white border border-border rounded-md shadow-md p-3">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm font-semibold text-text-primary mt-0.5">
        {Number(value).toLocaleString()} scans
      </p>
    </div>
  )
}

export default function ScanActivityChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-text-tertiary">
        No scan activity data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#F0F0EE"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
          width={40}
        />
        <Tooltip
          content={<ScanTooltip />}
          cursor={{ stroke: '#E5E5E3', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="scans"
          stroke="#1B6B4A"
          fill="#E8F5EE"
          strokeWidth={2}
          activeDot={{ r: 4, fill: '#1B6B4A', stroke: '#FFFFFF', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
