'use client'

import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Shield, CheckCircle, Clock, RefreshCw, Wallet, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { formatAddress, formatTimestamp } from '@/lib/web3-utils'
import { updateIssueStatus as updateIssueStatusContract, withdrawFunds as withdrawFundsContract } from '@/lib/contract-utils'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Issue, IssueStatus } from '@/lib/types'
import { mapStatusToNumber, statusColors } from '@/lib/status-utils'
import { LoadingState } from '@/components/shared/loading-state'
import { LoadingButton } from '@/components/shared/loading-button'
import { StatCard } from '@/components/shared/stat-card'
import { useProvider } from '@/hooks/use-provider'
import { useFetchIssues } from '@/hooks/use-fetch-issues'

// Stats configuration
const STATS_CONFIG = [
  { key: 'total', label: 'Total Issues', bgColor: 'bg-blue-50', textColor: 'text-blue-600', filter: () => true },
  { key: 'underReview', label: 'Under Review', bgColor: 'bg-purple-50', textColor: 'text-purple-600', filter: (i: Issue) => i.status === 'Under Review' },
  { key: 'inProgress', label: 'In Progress', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600', filter: (i: Issue) => i.status === 'In Progress' },
  { key: 'resolved', label: 'Resolved', bgColor: 'bg-green-50', textColor: 'text-green-600', filter: (i: Issue) => i.status === 'Resolved' },
  { key: 'confirmed', label: 'Confirmed', bgColor: 'bg-teal-50', textColor: 'text-teal-600', filter: (i: Issue) => i.status === 'Confirmed' },
] as const

interface AdminPanelProps {
  adminAddress?: string
  onStatusUpdate?: (issueId: number, status: IssueStatus) => Promise<void>
}

const ADMIN_ADDRESSES = [
  '0x7e9B83Ca7A390Cb5C0B37Ea7A02070B072F2F060'
]

export function AdminPanel({ adminAddress, onStatusUpdate }: AdminPanelProps) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { getProviderAndSigner, getChainId } = useProvider()
  const isAdmin = address && ADMIN_ADDRESSES.includes(address.toString())

  const { issues, loading, refetchIssues } = useFetchIssues({
    enabled: isAdmin,
    includeFunding: true,
    showToastOnError: true,
  })

  const [updating, setUpdating] = useState<number | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [newStatus, setNewStatus] = useState<IssueStatus>('Under Review')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedWithdrawIssue, setSelectedWithdrawIssue] = useState<Issue | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)

  const handleStatusUpdate = async (issue: Issue) => {
    if (!address || !walletClient) {
      toast.error('Please connect your wallet')
      return
    }

    setUpdating(issue.id)

    try {
      toast.info('Updating issue status on blockchain...')
      const { provider, signer } = await getProviderAndSigner()

      const statusNumber = mapStatusToNumber(newStatus)
      const txReceipt = await updateIssueStatusContract(
        provider,
        signer,
        issue.id,
        statusNumber,
        getChainId()
      )

      if (txReceipt) {
        toast.success(`Issue #${issue.id} status updated on blockchain`, {
          description: `Transaction: ${txReceipt.hash.slice(0, 10)}...`,
        })
      }

      try {
        toast.info('Updating metadata on IPFS...')
        await fetch('/api/update-issue-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueId: issue.id,
            imageHash: issue.imageHash,
            newStatus,
            adminAddress: address,
          }),
        })
        toast.success('Metadata updated on IPFS')
      } catch (ipfsError) {
        console.error('IPFS update error:', ipfsError)
        toast.warning('IPFS metadata update failed, but blockchain update succeeded')
      }

      await refetchIssues()
      setSelectedIssue(null)

      if (onStatusUpdate) {
        await onStatusUpdate(issue.id, newStatus)
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('user rejected')) {
        toast.error('Transaction rejected by user')
        return
      }
      console.error('Error updating status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const handleWithdrawFunds = async () => {
    if (!address || !walletClient || !selectedWithdrawIssue) {
      toast.error('Please connect your wallet')
      return
    }

    const amount = parseInt(withdrawAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > (selectedWithdrawIssue.availableFunds || 0)) {
      toast.error('Insufficient funds available')
      return
    }

    setIsWithdrawing(true)
    try {
      const { provider, signer } = await getProviderAndSigner()

      await withdrawFundsContract(
        provider,
        signer,
        selectedWithdrawIssue.id,
        amount,
        getChainId()
      )

      toast.success(`Successfully withdrew ${amount} tokens!`)
      setWithdrawAmount('')
      setShowWithdrawDialog(false)
      setSelectedWithdrawIssue(null)

      // Refresh issues list
      await refetchIssues()
    } catch (error: any) {
      console.error('Error withdrawing funds:', error)
      toast.error(error.message || 'Failed to withdraw funds')
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Admin access required. Contact the platform administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                Manage civic issues and update statuses on the blockchain
              </CardDescription>
            </div>
            <Button
              onClick={refetchIssues}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Admin Stats */}
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

          {/* Admin Info */}
          <div className="mb-6 p-4 bg-primary/5 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Admin Information</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Current Admin: {formatAddress(address || '')}</div>
              <div>Issues are stored on the blockchain</div>
              <div>Status updates are immutable and transparent</div>
              <div>Resolved issues get auto-confirmed after 3 community confirmations</div>
            </div>
          </div>

          {/* Issues Table */}
          {loading ? (
            <LoadingState message="Loading issues..." />
          ) : issues.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No issues found. Issues will appear here once reported.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Manage Issues</h3>
              {issues.map((issue) => (
                <Card key={issue.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Issue Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">#{issue.id}</Badge>
                            <Badge className={statusColors[issue.status]}>
                              {issue.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold truncate">{issue.location}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {issue.description}
                          </p>
                        </div>
                      </div>

                      {/* Issue Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Reporter:</span> {formatAddress(issue.reporter)}
                        </div>
                        <div>
                          <span className="font-medium">Reported:</span> {formatTimestamp(issue.timestamp)}
                        </div>
                      </div>

                      {/* Funding Information */}
                      {issue.totalFunding !== undefined && (
                        <div className="flex gap-2 pt-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Total: {issue.totalFunding}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            Available: {issue.availableFunds || 0}
                          </Badge>
                        </div>
                      )}

                      {/* Status Update Controls */}
                      {selectedIssue?.id === issue.id ? (
                        <div className="flex gap-2 pt-2 border-t">
                          <Select
                            value={newStatus}
                            onValueChange={(value) => setNewStatus(value as IssueStatus)}
                            disabled={updating === issue.id}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Reported">Reported</SelectItem>
                              <SelectItem value="Under Review">Under Review</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <LoadingButton
                            onClick={() => handleStatusUpdate(issue)}
                            size="sm"
                            isLoading={updating === issue.id}
                            loadingText="Updating..."
                            icon={CheckCircle}
                          >
                            Update
                          </LoadingButton>
                          <Button
                            onClick={() => setSelectedIssue(null)}
                            variant="outline"
                            size="sm"
                            disabled={updating === issue.id}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          {
                            (issue.status != 'Confirmed') && (
                              <Button
                                onClick={() => {
                                  setSelectedIssue(issue)
                                  setNewStatus(issue.status)
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Change Status
                              </Button>
                            )
                          }
                          {issue.availableFunds && issue.availableFunds > 0 &&
                            (issue.status !== 'Resolved') ? (
                            <Button
                              onClick={() => {
                                setSelectedWithdrawIssue(issue)
                                setWithdrawAmount('')
                                setShowWithdrawDialog(true)
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <Wallet className="h-4 w-4 mr-2" />
                              Withdraw
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdraw Funds Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Withdraw funds from issue #{selectedWithdrawIssue?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawIssue && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Total Funded:</span> {selectedWithdrawIssue.totalFunding || 0}
                  </div>
                  <div>
                    <span className="font-medium">Available:</span> {selectedWithdrawIssue.availableFunds || 0}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isWithdrawing}
                  min="0"
                  max={selectedWithdrawIssue.availableFunds || 0}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowWithdrawDialog(false)}
                  disabled={isWithdrawing}
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleWithdrawFunds}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  isLoading={isWithdrawing}
                  loadingText="Withdrawing..."
                  icon={Wallet}
                >
                  Withdraw Funds
                </LoadingButton>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
