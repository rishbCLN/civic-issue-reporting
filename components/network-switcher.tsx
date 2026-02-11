'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Network } from 'lucide-react'
import { mainnet, sepolia } from 'wagmi/chains'

const chains = [
  { id: mainnet.id, name: 'Ethereum', symbol: 'ETH' },
  { id: sepolia.id, name: 'Sepolia Testnet', symbol: 'SEP' },
]

export function NetworkSwitcher() {
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()

  const currentChain = chains.find(c => c.id === chain?.id)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Network className="h-4 w-4" />
          {currentChain?.name || 'Network'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">
          Select Network
        </div>
        {chains.map(chainOption => (
          <DropdownMenuCheckboxItem
            key={chainOption.id}
            checked={currentChain?.id === chainOption.id}
            onCheckedChange={() => switchChain?.({ chainId: chainOption.id })}
          >
            <div className="flex flex-col">
              <span>{chainOption.name}</span>
              <span className="text-xs text-muted-foreground">
                {chainOption.symbol}
              </span>
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
