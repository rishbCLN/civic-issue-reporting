import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES } from './contract'
import abi from './abi.json'

export async function submitIssueToContract(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    location: string,
    description: string,
    imageHash: string,
    chainId: number
): Promise<ethers.ContractTransactionReceipt> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Contract not deployed on this network')
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            signer
        )

        const tx = await contract.reportIssue(location, description, imageHash)

        const receipt = await tx.wait()

        return receipt
    } catch (error) {
        console.error('Error submitting issue to contract:', error)
        throw error
    }
}

export async function getIssueFromContract(
    provider: ethers.BrowserProvider,
    issueId: number,
    chainId: number
): Promise<{
    id: number
    reporter: string
    location: string
    description: string
    imageHash: string
    status: string
    timestamp: number
}> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            provider
        )

        const issue = await contract.getIssue(issueId)

        return {
            id: Number(issue[0]),
            reporter: issue[1],
            location: issue[2],
            description: issue[3],
            imageHash: issue[4],
            status: issue[5],
            timestamp: Number(issue[6]),
        }
    } catch (error) {
        console.error('Error getting issue from contract:', error)
        throw error
    }
}

export async function getIssueCount(
    provider: ethers.BrowserProvider,
    chainId: number
): Promise<number> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        const code = await provider.getCode(contractAddress)
        if (code === '0x') {
            throw new Error(
                `No contract found at address ${contractAddress} on chain ${chainId}. ` +
                `Please verify the contract is deployed and the address is correct.`
            )
        }

        console.log('Contract code exists at address:', contractAddress)

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            provider
        )

        console.log('Getting issue count from contract at address:', contractAddress)
        console.log('Contract object:', contract)

        const count = await contract.issueCount()

        console.log('Raw issue count from contract:', count)

        return Number(count)
    } catch (error) {
        console.error('Error getting issue count:', error)
        throw error
    }
}

export async function getAllIssuesFromContract(
    provider: ethers.BrowserProvider,
    chainId: number
): Promise<Array<{
    id: number
    reporter: string
    location: string
    description: string
    imageHash: string
    status: string
    timestamp: number
}>> {
    try {
        const issueCount = await getIssueCount(provider, chainId)
        const issues = []
        for (let i = 1; i <= issueCount; i++) {
            const issue = await getIssueFromContract(provider, i, chainId)
            issues.push(issue)
        }
        return issues
    } catch (error) {
        console.error('Error getting all issues from contract:', error)
        throw error
    }
}

export async function reportIssueFullWorkflow(
    imageFile: File,
    location: string,
    description: string,
    reporter: string,
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    chainId: number
): Promise<{
    imageHash: string
    metadataHash: string
    txReceipt: ethers.ContractTransactionReceipt
    issueId?: number
}> {
    try {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('location', location)
        formData.append('description', description)
        formData.append('reporter', reporter)

        const uploadResponse = await fetch('/api/upload-to-ipfs', {
            method: 'POST',
            body: formData,
        })

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload to IPFS')
        }

        const { imageHash, metadataHash } = await uploadResponse.json()

        const txReceipt = await submitIssueToContract(
            provider,
            signer,
            location,
            description,
            imageHash,
            chainId
        )

        let issueId: number | undefined
        if (txReceipt && txReceipt.logs) {
            const contract = new ethers.Contract(
                txReceipt.to!,
                abi,
                provider
            )

            for (const log of txReceipt.logs) {
                try {
                    const parsed = contract.interface.parseLog({
                        topics: [...log.topics],
                        data: log.data,
                    })
                    if (parsed && parsed.name === 'IssueReported') {
                        issueId = Number(parsed.args[0])
                        break
                    }
                } catch (e) {

                }
            }
        }

        return {
            imageHash,
            metadataHash,
            txReceipt,
            issueId,
        }
    } catch (error) {
        console.error('Error in full workflow:', error)
        throw error
    }
}

export async function confirmIssue(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    issueId: number,
    chainId: number
): Promise<ethers.ContractTransactionReceipt> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Contract not deployed on this network')
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            signer
        )

        const tx = await contract.confirmIssue(issueId)
        const receipt = await tx.wait()

        return receipt
    } catch (error) {
        console.error('Error confirming issue:', error)
        throw error
    }
}

export async function getConfirmationCount(
    provider: ethers.BrowserProvider,
    issueId: number,
    chainId: number
): Promise<number> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            provider
        )

        const count = await contract.getConfirmationCount(issueId)
        return Number(count)
    } catch (error) {
        console.error('Error getting confirmation count:', error)
        throw error
    }
}

export async function hasUserConfirmed(
    provider: ethers.BrowserProvider,
    issueId: number,
    userAddress: string,
    chainId: number
): Promise<boolean> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            provider
        )

        const confirmed = await contract.hasUserConfirmed(issueId, userAddress)
        return confirmed
    } catch (error) {
        console.error('Error checking user confirmation:', error)
        throw error
    }
}

export async function updateIssueStatus(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    issueId: number,
    newStatus: number,
    chainId: number
): Promise<ethers.ContractTransactionReceipt> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Contract not deployed on this network')
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            signer
        )

        const tx = await contract.updateIssueStatus(issueId, newStatus)
        const receipt = await tx.wait()

        return receipt
    } catch (error) {
        console.error('Error updating issue status:', error)
        throw error
    }
}

export async function fundIssue(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    issueId: number,
    amount: number,
    chainId: number
): Promise<ethers.ContractTransactionReceipt> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Contract not deployed on this network')
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            signer
        )

        const tx = await contract.fundIssue(issueId, amount)
        const receipt = await tx.wait()

        // Get updated funding data
        const funding = await contract.getIssueFunding(issueId)
        const fundingData = {
            totalFunding: Number(funding[0]),
            fundsUsed: Number(funding[1]),
            available: Number(funding[2]),
        }

        // Get user address
        const userAddress = await signer.getAddress()

        // Update Pinata with funding information
        try {
            await fetch('/api/update-issue-funding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueId,
                    action: 'fund',
                    amount,
                    userAddress,
                    ...fundingData,
                }),
            })
        } catch (e) {
            console.warn('Failed to update Pinata, but blockchain transaction succeeded:', e)
        }

        return receipt
    } catch (error) {
        console.error('Error funding issue:', error)
        throw error
    }
}

export async function withdrawFunds(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    issueId: number,
    amount: number,
    chainId: number
): Promise<ethers.ContractTransactionReceipt> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        if (contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error('Contract not deployed on this network')
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            signer
        )

        const tx = await contract.withdrawFunds(issueId, amount)
        const receipt = await tx.wait()

        // Get updated funding data
        const funding = await contract.getIssueFunding(issueId)
        const fundingData = {
            totalFunding: Number(funding[0]),
            fundsUsed: Number(funding[1]),
            available: Number(funding[2]),
        }

        // Get user address
        const userAddress = await signer.getAddress()

        // Update Pinata with funding information
        try {
            await fetch('/api/update-issue-funding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueId,
                    action: 'withdraw',
                    amount,
                    userAddress,
                    ...fundingData,
                }),
            })
        } catch (e) {
            console.warn('Failed to update Pinata, but blockchain transaction succeeded:', e)
        }

        return receipt
    } catch (error) {
        console.error('Error withdrawing funds:', error)
        throw error
    }
}

export async function getIssueFunding(
    provider: ethers.BrowserProvider,
    issueId: number,
    chainId: number
): Promise<{
    totalFunding: number
    fundsUsed: number
    available: number
}> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            provider
        )

        const funding = await contract.getIssueFunding(issueId)
        return {
            totalFunding: Number(funding[0]),
            fundsUsed: Number(funding[1]),
            available: Number(funding[2]),
        }
    } catch (error) {
        console.error('Error getting issue funding:', error)
        throw error
    }
}

export async function getUserFunding(
    provider: ethers.BrowserProvider,
    issueId: number,
    userAddress: string,
    chainId: number
): Promise<number> {
    try {
        let contractAddress: string
        switch (chainId) {
            case 11155111:
                contractAddress = CONTRACT_ADDRESSES.sepolia
                break
            default:
                throw new Error(`Unsupported chain ID: ${chainId}`)
        }

        const contract = new ethers.Contract(
            contractAddress,
            abi,
            provider
        )

        const amount = await contract.getUserFunding(issueId, userAddress)
        return Number(amount)
    } catch (error) {
        console.error('Error getting user funding:', error)
        throw error
    }
}
