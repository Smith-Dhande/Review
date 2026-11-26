import { useMemo } from 'react'
import { BarChart3, QrCode, Wifi, FileText } from 'lucide-react'
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
  businessesData,
} from '../data/mockData'

function resolveRow(firstArg, secondArg) {
  return typeof firstArg === 'object' && firstArg !== null ? firstArg : secondArg
}

export default function AnalyticsPage() {
  const { totalQrScans, totalNfcTaps } = useMemo(() => {
    return qrNfcComparisonData.reduce(
      (acc, entry) => ({
        totalQrScans: acc.totalQrScans + entry.qr,
        totalNfcTaps: acc.totalNfcTaps + entry.nfc,
      }),
      { totalQrScans: 0, totalNfcTaps: 0 },
    )
  }, [])

  const rankedBusinesses = useMemo(
    () =>
      [...businessesData]
        .sort((a, b) => b.totalScans - a.totalScans)
        .map((business, index) => ({
          ...business,
          rank: index + 1,
        })),
    [],
  )

  const columns = useMemo(
    () => [
      {
        key: 'rank',
        label: '#',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return (
            <span className="text-text-tertiary font-medium">{row.rank}</span>
          )
        },
      },
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
        key: 'status',
        label: 'Status',
        render: (arg1, arg2) => {
          const row = resolveRow(arg1, arg2)
          return <StatusText status={row.status} />
        },
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Scan performance and usage insights"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Analytics' }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Total Scans"
          value={dashboardStats.totalScans.toLocaleString()}
          icon={BarChart3}
          change="+18%"
          changeType="positive"
        />
        <StatCard
          title="QR Scans"
          value={totalQrScans.toLocaleString()}
          icon={QrCode}
        />
        <StatCard
          title="NFC Taps"
          value={totalNfcTaps.toLocaleString()}
          icon={Wifi}
        />
        <StatCard
          title="Reviews Generated"
          value={dashboardStats.reviewDraftsGenerated.toLocaleString()}
          icon={FileText}
          change="+12%"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartCard
          title="Scan Activity"
          description="Scans over the last 12 months"
          className="lg:col-span-1"
        >
          <ScanActivityChart data={scanActivityData} />
        </ChartCard>

        <ChartCard
          title="QR vs NFC"
          description="Usage comparison"
          className="lg:col-span-1"
        >
          <QrNfcComparisonChart data={qrNfcComparisonData} />
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard title="Business Performance">
          <DataTable
            columns={columns}
            data={rankedBusinesses}
            pagination
          />
        </ChartCard>
      </div>
    </div>
  )
}
