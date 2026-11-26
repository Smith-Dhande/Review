import { useMemo } from 'react'
import { Building2, QrCode, Wifi, BarChart3, FileText } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import ChartCard from '../components/ui/ChartCard'
import DataTable from '../components/ui/DataTable'
import StatusText from '../components/ui/StatusText'
import ScanActivityChart from '../components/charts/ScanActivityChart'
import QrNfcComparisonChart from '../components/charts/QrNfcComparisonChart'
import {
  dashboardStats,
  scanActivityData,
  qrNfcComparisonData,
  recentActivity,
  businessesData,
} from '../data/mockData'

const ACTIVITY_DOT_CLASSES = {
  scan: 'bg-primary',
  review: 'bg-chart-3',
  business: 'bg-chart-2',
}

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function resolveRow(firstArg, secondArg) {
  return typeof firstArg === 'object' && firstArg !== null ? firstArg : secondArg
}

export default function DashboardPage() {
  const recentBusinesses = useMemo(() => businessesData.slice(0, 5), [])

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Business',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return (
            <div>
              <p className="font-medium text-text-primary">{row.name}</p>
              <p className="text-xs text-text-tertiary">{row.city}</p>
            </div>
          )
        },
      },
      {
        key: 'category',
        label: 'Category',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return <span className="text-text-secondary">{row.category}</span>
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return <StatusText status={row.status} />
        },
      },
      {
        key: 'qrCodes',
        label: 'QR Codes',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return <span className="text-text-primary">{row.qrCodes}</span>
        },
      },
      {
        key: 'nfcTags',
        label: 'NFC Tags',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return <span className="text-text-primary">{row.nfcTags}</span>
        },
      },
      {
        key: 'totalScans',
        label: 'Total Scans',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return (
            <span className="font-medium text-text-primary">
              {row.totalScans.toLocaleString()}
            </span>
          )
        },
      },
      {
        key: 'dateAdded',
        label: 'Date Added',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return (
            <span className="text-text-secondary">{formatDate(row.dateAdded)}</span>
          )
        },
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Dashboard overview and key metrics"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        <StatCard
          title="Total Businesses"
          value={dashboardStats.totalBusinesses}
          icon={Building2}
        />
        <StatCard
          title="Active Businesses"
          value={dashboardStats.activeBusinesses}
          icon={Building2}
          change="+2 this month"
          changeType="positive"
        />
        <StatCard
          title="Total QR Codes"
          value={dashboardStats.totalQrCodes}
          icon={QrCode}
        />
        <StatCard
          title="Total NFC Tags"
          value={dashboardStats.totalNfcTags}
          icon={Wifi}
        />
        <StatCard
          title="Total Scans"
          value={dashboardStats.totalScans.toLocaleString()}
          icon={BarChart3}
          change="+18%"
          changeType="positive"
        />
        <StatCard
          title="Reviews Generated"
          value={dashboardStats.reviewDraftsGenerated.toLocaleString()}
          icon={FileText}
          change="+12%"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="lg:col-span-3">
          <ChartCard
            title="Scan Activity"
            description="Scans over the last 12 months"
          >
            <ScanActivityChart data={scanActivityData} />
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard
            title="QR vs NFC"
            description="Usage comparison"
          >
            <QrNfcComparisonChart data={qrNfcComparisonData} />
          </ChartCard>

          <div className="mt-6 bg-card rounded-lg border border-border">
            <h3 className="px-5 pt-5 pb-3 text-sm font-semibold text-text-primary">
              Recent Activity
            </h3>
            <ul className="divide-y divide-border">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="px-5 py-3 flex items-start gap-3"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      ACTIVITY_DOT_CLASSES[item.type] || 'bg-chart-2'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">{item.message}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Recent Businesses
        </h2>
        <DataTable
          columns={columns}
          data={recentBusinesses}
          searchable={false}
          pagination={false}
        />
      </div>
    </div>
  )
}
