import { Card, CardContent } from '@/components/ui/card'

export interface StatCardProps {
    value: number
    label: string
    bgColor: string
    textColor: string
}

/**
 * Reusable statistic card component
 */
export function StatCard({ value, label, bgColor, textColor }: StatCardProps) {
    return (
        <Card className={bgColor}>
            <CardContent className="pt-4">
                <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
                <p className={`text-xs ${textColor}/70`}>{label}</p>
            </CardContent>
        </Card>
    )
}
