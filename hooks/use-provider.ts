import { BrowserProvider } from 'ethers'
import { useAccount } from 'wagmi'

/**
 * Custom hook to get Web3 provider and signer
 * Throws an error if window.ethereum is not available
 */
export const useProvider = () => {
    const { chainId } = useAccount()

    const getProvider = async () => {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask or another Web3 wallet')
        }
        return new BrowserProvider(window.ethereum as any)
    }

    const getProviderAndSigner = async () => {
        const provider = await getProvider()
        const signer = await provider.getSigner()
        return { provider, signer }
    }

    const getChainId = () => chainId || 11155111 // Default to Sepolia testnet

    return {
        getProvider,
        getProviderAndSigner,
        getChainId,
    }
}
