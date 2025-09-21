'use client'

import { TestResult } from '@/app/test-hyperbloom/page'
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'

interface ResultsDashboardProps {
  results: TestResult[]
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'running':
        return 'text-primary'
      default:
        return 'text-gray-500'
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  const runningCount = results.filter(r => r.status === 'running').length

  return (
    <div className="card-base p-6">
      <h3 className="text-lg font-semibold mb-4">Test Results Dashboard</h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-2xl font-bold text-green-500">{successCount}</div>
          <div className="text-xs text-muted">Passed</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-2xl font-bold text-red-500">{errorCount}</div>
          <div className="text-xs text-muted">Failed</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
          <div className="text-xs text-muted">Warnings</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded">
          <div className="text-2xl font-bold text-primary">{runningCount}</div>
          <div className="text-xs text-muted">Running</div>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Test</th>
                <th className="text-left py-2 px-2">Message</th>
                <th className="text-left py-2 px-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={`${result.id}-${index}`} className="border-b border-border/50">
                  <td className="py-2 px-2">
                    {getStatusIcon(result.status)}
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-medium">{result.name}</span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`text-xs ${getStatusColor(result.status)}`}>
                      {result.message || '-'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs text-muted">
                    {result.timestamp
                      ? new Date(result.timestamp).toLocaleTimeString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted">
          <p className="mb-2">No test results yet</p>
          <p className="text-xs">Run tests to see results here</p>
        </div>
      )}

      {/* Export Button */}
      {results.length > 0 && (
        <button
          onClick={() => {
            const data = JSON.stringify(results, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `test-results-${Date.now()}.json`
            a.click()
          }}
          className="mt-4 btn-secondary px-4 py-2 text-sm"
        >
          Export Results
        </button>
      )}
    </div>
  )
}