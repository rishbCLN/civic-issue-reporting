import { ethers } from 'ethers'

export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

export function formatIPFSHash(hash: string): string {
  if (!hash) return ''
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`
}

export function formatTimestamp(timestamp: number | BigInt): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
