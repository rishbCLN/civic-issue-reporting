'use client'

import React from "react"
import { useState, useRef } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, MapPin, ImagePlus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { submitIssueToContract } from '@/lib/contract-utils'
import { WalletGuard } from '@/components/shared/wallet-guard'
import { LoadingButton } from '@/components/shared/loading-button'
import { useProvider } from '@/hooks/use-provider'

interface ReportIssueFormProps {
  onSuccess?: () => void
}

export function ReportIssueForm({ onSuccess }: ReportIssueFormProps) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { getProviderAndSigner, getChainId } = useProvider()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    location: '',
    description: '',
    image: null as File | null,
    imagePreview: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!formData.location.trim() || !formData.description.trim() || !formData.image) {
      setError('Please fill out all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      toast.info('Uploading to IPFS...')

      const formDataObj = new FormData()
      formDataObj.append('file', formData.image)
      formDataObj.append('location', formData.location)
      formDataObj.append('description', formData.description)
      formDataObj.append('reporter', address)

      const uploadResponse = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: formDataObj,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to IPFS')
      }

      const { imageHash, metadataHash } = await uploadResponse.json()

      if (!walletClient) {
        throw new Error('Wallet client not available')
      }

      const { provider, signer } = await getProviderAndSigner()

      const txReceipt = await submitIssueToContract(
        provider,
        signer,
        formData.location,
        formData.description,
        imageHash,
        getChainId()
      )

      if (txReceipt) {
        console.log('Issue submitted to blockchain:', {
          transactionHash: txReceipt.hash,
          blockNumber: txReceipt.blockNumber,
          imageHash,
          metadataHash,
        })
        toast.success('Issue reported successfully', {
          description: `Transaction: ${txReceipt.hash.slice(0, 10)}...`,
        })
      } else {
        toast.success('Issue reported successfully!')
      }

      // Reset form
      setFormData({
        location: '',
        description: '',
        image: null,
        imagePreview: '',
      })

      onSuccess?.()
    } catch (err) {
      if (err instanceof Error && err.message.includes('user rejected')) {
        toast.error('Transaction rejected by user')
        return
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to report issue'
      setError(errorMessage)
      toast.error('Failed to report issue', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletGuard isConnected={isConnected} message="Please connect your wallet to report an issue">
      <Card>
        <CardHeader>
          <CardTitle>Report a Civic Issue</CardTitle>
          <CardDescription>
            Help improve your community by reporting infrastructure and public service issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
              </label>
              <Input
                placeholder="Enter the location of the issue (address or coordinates)"
                value={formData.location}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, location: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Issue Description</label>
              <Textarea
                placeholder="Describe the issue in detail (e.g., pothole, broken streetlight, overflowing trash bin)"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                rows={5}
                disabled={loading}
                className="resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Upload Image
                </div>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
              >
                {formData.imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={formData.imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="h-40 w-full object-cover rounded-md mx-auto"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.image?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImagePlus className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or GIF (max. 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
              </div>
            </div>

            <LoadingButton
              type="submit"
              className="w-full"
              disabled={!formData.location || !formData.description || !formData.image}
              size="lg"
              isLoading={loading}
              loadingText="Reporting Issue..."
            >
              Report Issue
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </WalletGuard>
  )
}
