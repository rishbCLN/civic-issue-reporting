import { IssueStatus } from "./types"

export const mapStatusToString = (statusNum: number): IssueStatus => {
    const statusMap: Record<number, IssueStatus> = {
        0: 'Reported',
        1: 'Under Review',
        2: 'In Progress',
        3: 'Resolved',
        4: 'Rejected',
        5: 'Confirmed',
    }
    return statusMap[statusNum] || 'Reported'
}

export const mapStatusToNumber = (status: IssueStatus): number => {
    const statusMap: Record<IssueStatus, number> = {
        'Reported': 0,
        'Under Review': 1,
        'In Progress': 2,
        'Resolved': 3,
        'Rejected': 4,
        'Confirmed': 5,
    }
    return statusMap[status] ?? 0
}

export const statusColors: Record<IssueStatus, string> = {
    'Reported': 'bg-blue-100 text-blue-800',
    'Under Review': 'bg-purple-100 text-purple-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Confirmed': 'bg-teal-100 text-teal-800',
}