import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ReactNode } from 'react'

interface WalletGuardProps {
    isConnected: boolean
    message?: string
    children: ReactNode
}

/**
 * Wrapper component that shows a connect wallet message if wallet is not connected
 */
export function WalletGuard({
    isConnected,
    message = 'Please connect your wallet to continue',
    children,
}: WalletGuardProps) {
    if (!isConnected) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return <>{children}</>
}
