export interface Issue {
    id: number
    reporter: string
    location: string
    description: string
    imageHash?: string
    status: IssueStatus
    timestamp: number
    totalFunding?: number
    availableFunds?: number
}

export type IssueStatus = 'Reported' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected' | 'Confirmed'