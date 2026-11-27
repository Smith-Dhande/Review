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
      <p className="text-sm font-semibold text-text-primary mt-0.5 tabular-nums">
        {Number(value).toLocaleString()} views
      </p>
    </div>
  )
}

export default function ScanActivityChart({ data = [], error = '' }) {
  if (error) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-error">
        {error}
      </div>
    )
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-sm text-text-tertiary">
        No scan activity data available
      </div>
    )
  }

  return (
    <div className="w-full h-[260px] min-w-0">
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F0F0EE"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={20}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, 'auto']}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
            width={42}
          />
          <Tooltip
            content={<ScanTooltip />}
            cursor={{ stroke: '#E5E5E3', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#1B6B4A"
            fill="#E8F5EE"
            strokeWidth={2}
            dot={(props) => {
              if (!props?.payload?.total || props.cx == null || props.cy == null) {
                return null
              }
              return (
                <circle
                  key={`dot-${props.index}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={3.5}
                  fill="#1B6B4A"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              )
            }}
            activeDot={{ r: 5, fill: '#1B6B4A', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
