import { useState, useEffect } from 'react'
import { getAllIssuesFromContract, getIssueFunding } from '@/lib/contract-utils'
import { mapStatusToString } from '@/lib/status-utils'
import { Issue } from '@/lib/types'
import { useProvider } from './use-provider'
import { toast } from 'sonner'

interface UseFetchIssuesOptions {
    enabled?: boolean
    includeFunding?: boolean
    onError?: (error: Error) => void
    showToastOnError?: boolean
}

export const useFetchIssues = (options: UseFetchIssuesOptions = {}) => {
    const {
        enabled = true,
        includeFunding = false,
        onError,
        showToastOnError = false,
    } = options

    const { getProvider, getChainId } = useProvider()
    const [issues, setIssues] = useState<Issue[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchIssues = async () => {
        setLoading(true)
        setError(null)

        try {
            const provider = await getProvider()
            const contractIssues = await getAllIssuesFromContract(provider, getChainId())

            const transformedIssues: Issue[] = includeFunding
                ? await Promise.all(
                    contractIssues.map(async (issue) => {
                        let totalFunding = 0
                        let availableFunds = 0

                        try {
                            const funding = await getIssueFunding(provider, issue.id, getChainId())
                            totalFunding = funding.totalFunding
                            availableFunds = funding.available
                        } catch (error) {
                            console.error(`Error fetching funding for issue ${issue.id}:`, error)
                        }

                        return {
                            id: issue.id,
                            reporter: issue.reporter,
                            location: issue.location,
                            description: issue.description,
                            imageHash: issue.imageHash,
                            status: mapStatusToString(Number(issue.status)),
                            timestamp: issue.timestamp,
                            totalFunding,
                            availableFunds,
                        }
                    })
                )
                : contractIssues.map((issue) => ({
                    id: issue.id,
                    reporter: issue.reporter,
                    location: issue.location,
                    description: issue.description,
                    imageHash: issue.imageHash,
                    status: mapStatusToString(Number(issue.status)),
                    timestamp: issue.timestamp,
                }))

            setIssues(transformedIssues)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load issues from blockchain'
            console.error('Failed to fetch issues from contract:', err)

            setError(errorMessage)
            setIssues([])

            if (showToastOnError) {
                toast.error('Failed to load issues from blockchain')
            }

            if (onError && err instanceof Error) {
                onError(err)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (enabled) {
            fetchIssues()
        }
    }, [enabled])

    return {
        issues,
        loading,
        error,
        refetchIssues: fetchIssues,
    }
}
