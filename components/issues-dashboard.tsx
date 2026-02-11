'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IssueCard } from './issue-card'
import { AlertCircle, Search, Filter } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Issue, IssueStatus } from '@/lib/types'
import { WalletGuard } from '@/components/shared/wallet-guard'
import { LoadingState } from '@/components/shared/loading-state'
import { StatCard } from '@/components/shared/stat-card'
import { useFetchIssues } from '@/hooks/use-fetch-issues'

const STATS_CONFIG = [
  { key: 'total', label: 'Total Issues', bgColor: 'bg-blue-50', textColor: 'text-blue-600', filter: () => true },
  { key: 'underReview', label: 'Under Review', bgColor: 'bg-purple-50', textColor: 'text-purple-600', filter: (i: Issue) => i.status === 'Under Review' },
  { key: 'inProgress', label: 'In Progress', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600', filter: (i: Issue) => i.status === 'In Progress' },
  { key: 'resolved', label: 'Resolved', bgColor: 'bg-green-50', textColor: 'text-green-600', filter: (i: Issue) => i.status === 'Resolved' },
  { key: 'confirmed', label: 'Confirmed', bgColor: 'bg-teal-50', textColor: 'text-teal-600', filter: (i: Issue) => i.status === 'Confirmed' },
] as const

export function IssuesDashboard() {
  const { isConnected } = useAccount()
  const { issues, loading, error } = useFetchIssues({ enabled: isConnected })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'All'>('All')

  const filteredIssues = issues.filter(issue => {
    const matchesSearch =
      issue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || issue.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <WalletGuard isConnected={isConnected} message="Connect your wallet to view issues">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Civic Issues Dashboard</CardTitle>
            <CardDescription>
              Track and monitor reported issues from the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues by location or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as IssueStatus | 'All')}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Reported">Reported</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {STATS_CONFIG.map(({ key, label, bgColor, textColor, filter }) => (
                  <StatCard
                    key={key}
                    value={issues.filter(filter).length}
                    label={label}
                    bgColor={bgColor}
                    textColor={textColor}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {filteredIssues.length} {filteredIssues.length === 1 ? 'Issue' : 'Issues'} Found
          </h2>

          {loading ? (
            <LoadingState message="Loading issues from blockchain..." />
          ) : filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {searchTerm || statusFilter !== 'All'
                    ? 'No issues found matching your criteria'
                    : 'No issues have been reported yet'}
                </p>
                {!searchTerm && statusFilter === 'All' && (
                  <p className="text-sm text-muted-foreground">
                    Be the first to report an issue by going to the Report tab
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  {...issue}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </WalletGuard>
  )
}
