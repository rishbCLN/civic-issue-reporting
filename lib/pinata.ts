import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: "orange-accurate-fowl-340.mypinata.cloud",
});

export async function uploadFileToIPFS(file: File): Promise<string> {
    try {
        const upload = await pinata.upload.file(file);
        return upload.IpfsHash;
    } catch (error) {
        console.error("Error uploading file to Pinata:", error);
        throw new Error("Failed to upload file to IPFS");
    }
}

export async function uploadJSONToIPFS(data: object): Promise<string> {
    try {
        const upload = await pinata.upload.json(data);
        return upload.IpfsHash;
    } catch (error) {
        console.error("Error uploading JSON to Pinata:", error);
        throw new Error("Failed to upload JSON to IPFS");
    }
}

export function getIPFSUrl(ipfsHash: string): string {
    const hash = ipfsHash.replace("ipfs://", "");
    return `https://orange-accurate-fowl-340.mypinata.cloud/ipfs/${hash}`;
}

export async function uploadIssueToIPFS(
    imageFile: File,
    location: string,
    description: string,
    reporter: string
): Promise<{ imageHash: string; metadataHash: string }> {
    try {
        const imageHash = await uploadFileToIPFS(imageFile);

        const metadata = {
            location,
            description,
            reporter,
            imageHash,
            timestamp: new Date().toISOString(),
        };

        const metadataHash = await uploadJSONToIPFS(metadata);

        return {
            imageHash,
            metadataHash,
        };
    } catch (error) {
        console.error("Error uploading issue to IPFS:", error);
        throw error;
    }
}

export async function fetchFromIPFS(ipfsHash: string): Promise<any> {
    try {
        const url = getIPFSUrl(ipfsHash);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching from IPFS:", error);
        throw new Error("Failed to fetch data from IPFS");
    }
}
