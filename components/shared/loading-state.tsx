import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
    message?: string
    className?: string
}

/**
 * Reusable loading state component
 */
export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    )
}
