import { Button } from '@/components/ui/button'
import { Loader2, LucideIcon } from 'lucide-react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean
    loadingText?: string
    icon?: LucideIcon
    children: ReactNode
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * Reusable button component that shows loading state
 */
export function LoadingButton({
    isLoading,
    loadingText,
    icon: Icon,
    children,
    variant,
    size,
    ...props
}: LoadingButtonProps) {
    return (
        <Button variant={variant} size={size} disabled={isLoading} {...props}>
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {loadingText || children}
                </>
            ) : (
                <>
                    {Icon && <Icon className="h-4 w-4 mr-2" />}
                    {children}
                </>
            )}
        </Button>
    )
}
