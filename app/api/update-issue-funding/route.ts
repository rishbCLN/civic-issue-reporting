import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from "pinata-web3";

export async function POST(request: NextRequest) {
    try {
        const { issueId, action, amount, userAddress, totalFunding, fundsUsed, available } = await request.json();

        if (!issueId || !action || !amount || !userAddress) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT!,
            pinataGateway: "orange-accurate-fowl-340.mypinata.cloud",
        });

        // Create metadata for funding action
        const fundingMetadata = {
            issueId,
            action, // 'fund' or 'withdraw'
            amount,
            userAddress,
            totalFunding,
            fundsUsed,
            available,
            timestamp: new Date().toISOString(),
            type: 'funding_update',
        };

        const upload = await pinata.upload.json(fundingMetadata);
        const metadataCid = upload.IpfsHash;

        return NextResponse.json({
            success: true,
            metadataCid,
            fundingMetadata,
        });
    } catch (error) {
        console.error('Error updating issue funding:', error);
        return NextResponse.json(
            { error: 'Failed to update issue funding' },
            { status: 500 }
        );
    }
}
