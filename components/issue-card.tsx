'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTimestamp, formatAddress } from '@/lib/web3-utils'
import { getIPFSUrl } from '@/lib/pinata'
import { Calendar, User, CheckCircle2, Loader2, DollarSign, Coins } from 'lucide-react'
import { IssueStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useAccount, useWalletClient } from 'wagmi'
import { confirmIssue, getConfirmationCount, hasUserConfirmed, fundIssue, getIssueFunding, getUserFunding } from '@/lib/contract-utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { statusColors } from '@/lib/status-utils'
import { LoadingButton } from '@/components/shared/loading-button'
import { useProvider } from '@/hooks/use-provider'

interface IssueCardProps {
  id: number
  reporter: string
  location: string
  description: string
  imageHash?: string
  status: IssueStatus
  timestamp: number
  onStatusChange?: (status: IssueStatus) => void
  isAdmin?: boolean
  onConfirm?: () => void
}

export function IssueCard({
  id,
  reporter,
  location,
  description,
  imageHash,
  status,
  timestamp,
  onStatusChange,
  isAdmin = false,
  onConfirm,
}: IssueCardProps) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { getProvider, getProviderAndSigner, getChainId } = useProvider()
  const [confirmationCount, setConfirmationCount] = useState(0)
  const [userHasConfirmed, setUserHasConfirmed] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isLoadingConfirmations, setIsLoadingConfirmations] = useState(false)
  const [totalFunding, setTotalFunding] = useState(0)
  const [availableFunds, setAvailableFunds] = useState(0)
  const [userFunding, setUserFunding] = useState(0)
  const [fundAmount, setFundAmount] = useState('')
  const [isFunding, setIsFunding] = useState(false)
  const [showFundDialog, setShowFundDialog] = useState(false)

  // Load confirmation data
  useEffect(() => {
    const loadConfirmationData = async () => {
      if (!isConnected || !address || status !== 'Resolved') return

      setIsLoadingConfirmations(true)
      try {
        const provider = await getProvider()
        const count = await getConfirmationCount(provider, id, getChainId())
        setConfirmationCount(count)

        const confirmed = await hasUserConfirmed(provider, id, address, getChainId())
        setUserHasConfirmed(confirmed)
      } catch (error) {
        console.error('Error loading confirmation data:', error)
      } finally {
        setIsLoadingConfirmations(false)
      }
    }

    loadConfirmationData()
  }, [id, isConnected, address, status, getProvider, getChainId])

  // Load funding data
  useEffect(() => {
    const loadFundingData = async () => {
      if (!isConnected) return

      try {
        const provider = await getProvider()
        const funding = await getIssueFunding(provider, id, getChainId())
        setTotalFunding(funding.totalFunding)
        setAvailableFunds(funding.available)

        if (address) {
          const userAmount = await getUserFunding(provider, id, address, getChainId())
          setUserFunding(userAmount)
        }
      } catch (error) {
        console.error('Error loading funding data:', error)
      }
    }

    loadFundingData()
  }, [id, isConnected, address, getProvider, getChainId])

  const handleConfirm = async () => {
    if (!walletClient || !address || !isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    setIsConfirming(true)
    try {
      const { provider, signer } = await getProviderAndSigner()

      await confirmIssue(provider, signer, id, getChainId())

      setUserHasConfirmed(true)
      setConfirmationCount(prev => prev + 1)

      await fetch('/api/update-issue-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: id,
          imageHash: imageHash,
          newStatus: 'Confirmed',
          confirmedBy: address,
          confirmationCount: confirmationCount + 1,
        }),
      })

      toast.success('Issue confirmed successfully!')

      if (confirmationCount + 1 >= 3 && onConfirm) {
        onConfirm()
      }
    } catch (error: any) {
      console.error('Error confirming issue:', error)
      toast.error(error.message || 'Failed to confirm issue')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleFund = async () => {
    if (!walletClient || !address || !isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    const amount = parseInt(fundAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsFunding(true)
    try {
      const { provider, signer } = await getProviderAndSigner()

      await fundIssue(provider, signer, id, amount, getChainId())

      // Update local state
      setTotalFunding(prev => prev + amount)
      setAvailableFunds(prev => prev + amount)
      setUserFunding(prev => prev + amount)

      toast.success(`Successfully funded ${amount} tokens!`)
      setFundAmount('')
      setShowFundDialog(false)
    } catch (error: any) {
      console.error('Error funding issue:', error)
      toast.error(error.message || 'Failed to fund issue')
    } finally {
      setIsFunding(false)
    }
  }

  const canConfirm = status === 'Resolved' && isConnected && !userHasConfirmed && !isAdmin

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">#{id}</Badge>
              <Badge className={statusColors[status]}>
                {status}
              </Badge>
            </div>
            <CardTitle className="text-lg">{location}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Preview */}
        {imageHash && (
          <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={getIPFSUrl(imageHash)}
              alt={`Issue at ${location}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}

        {/* Description */}
        <div>
          <p className="text-sm font-medium mb-1">Issue Description</p>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{formatAddress(reporter)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatTimestamp(timestamp)}</span>
          </div>
        </div>

        {/* Confirmation Count for Resolved Issues */}
        {status === 'Resolved' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {isLoadingConfirmations ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : (
                `${confirmationCount} community confirmation${confirmationCount !== 1 ? 's' : ''}`
              )}
            </span>
            {confirmationCount >= 3 && (
              <Badge className="ml-auto bg-green-600 text-white">
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Funding Information */}
        {totalFunding > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {totalFunding} tokens funded
              </span>
            </div>
            <Badge className="bg-amber-600 text-white">
              {availableFunds} available
            </Badge>
          </div>
        )}

        {userFunding > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>You contributed: {userFunding} tokens</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 flex-wrap">
          {/*<Button variant="outline" size="sm" className="flex-1 min-w-[100px] bg-transparent">
            View Details
          </Button>*/}

          {/* Fund Issue Button */}
          {isConnected && !isAdmin && status !== 'Rejected' && status !== 'Confirmed' && (
            <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1 min-w-25 border-amber-500 text-amber-700 hover:bg-amber-50">
                  <Coins className="h-4 w-4 mr-2" />
                  Fund Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Fund this Issue</DialogTitle>
                  <DialogDescription>
                    Support the resolution of this issue with mock tokens. Funds can be used by admins to allocate resources.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Amount (tokens)</label>
                    <Input
                      type="number"
                      min="1"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="Enter amount"
                      disabled={isFunding}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• Total funding: {totalFunding} tokens</div>
                    <div>• Available: {availableFunds} tokens</div>
                    {userFunding > 0 && <div>• Your contribution: {userFunding} tokens</div>}
                  </div>
                  <div className="flex gap-2">
                    <LoadingButton
                      onClick={handleFund}
                      disabled={!fundAmount}
                      isLoading={isFunding}
                      loadingText="Funding..."
                      icon={DollarSign}
                      className="flex-1"
                    >
                      Fund {fundAmount || '0'} Tokens
                    </LoadingButton>
                    <Button variant="outline" onClick={() => setShowFundDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Button size="sm" className="flex-1 min-w-25">
              Update Status
            </Button>
          )}
          {canConfirm && (
            <LoadingButton
              size="sm"
              className="flex-1 min-w-25 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              isLoading={isConfirming}
              loadingText="Confirming..."
              icon={CheckCircle2}
            >
              Confirm Resolution
            </LoadingButton>
          )}
          {status === 'Resolved' && userHasConfirmed && !isAdmin && (
            <Button
              size="sm"
              className="flex-1 min-w-25 bg-green-600 hover:bg-green-700"
              disabled
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
