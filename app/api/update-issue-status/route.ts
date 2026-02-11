import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from "pinata-web3";

export async function POST(request: NextRequest) {
    try {
        const { issueId, imageHash, newStatus, adminAddress } = await request.json();

        if (!issueId || !newStatus || !adminAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT!,
            pinataGateway: "orange-accurate-fowl-340.mypinata.cloud",
        });

        // Create new metadata with status update
        // Note: IPFS is immutable, so we create a new entry for each status change
        const statusMetadata = {
            issueId,
            imageHash,
            status: newStatus,
            updatedBy: adminAddress,
            updatedAt: new Date().toISOString(),
            type: 'status_update',
        };

        const upload = await pinata.upload.json(statusMetadata);
        const metadataCid = upload.IpfsHash;

        return NextResponse.json({
            success: true,
            metadataCid,
            statusMetadata,
        });
    } catch (error) {
        console.error('Error updating issue status:', error);
        return NextResponse.json(
            { error: 'Failed to update issue status' },
            { status: 500 }
        );
    }
}