import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const SERIES_SWATCH_CLASSES = {
  qr: 'bg-chart-1',
  nfc: 'bg-chart-2',
}

function ComparisonTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-border rounded-md shadow-md p-3">
      <p className="text-xs text-text-tertiary mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-xs ${
                  SERIES_SWATCH_CLASSES[entry.dataKey] ?? 'bg-chart-1'
                }`}
              />
              <span className="text-xs text-text-secondary">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tabular-nums">
              {Number(entry.value ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonLegend({ payload }) {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-5 pt-3">
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-xs ${
              SERIES_SWATCH_CLASSES[entry.dataKey] ?? 'bg-chart-1'
            }`}
          />
          <span className="text-xs text-text-secondary">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function QrNfcComparisonChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-sm text-text-tertiary">
        No QR and NFC comparison data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barGap={4}
      >
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
          content={<ComparisonTooltip />}
          cursor={{ fill: '#F5F4F2' }}
        />
        <Legend verticalAlign="bottom" content={<ComparisonLegend />} />
        <Bar
          dataKey="qr"
          fill="#1B6B4A"
          radius={[3, 3, 0, 0]}
          name="QR Codes"
        />
        <Bar
          dataKey="nfc"
          fill="#6B7280"
          radius={[3, 3, 0, 0]}
          name="NFC Tags"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
