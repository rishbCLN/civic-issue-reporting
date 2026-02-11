import { NextRequest, NextResponse } from 'next/server';
import { uploadIssueToIPFS } from '@/lib/pinata';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const file = formData.get('file') as File;
        const location = formData.get('location') as string;
        const description = formData.get('description') as string;
        const reporter = formData.get('reporter') as string;

        if (!file || !location || !description || !reporter) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Upload to IPFS via Pinata
        const { imageHash, metadataHash } = await uploadIssueToIPFS(
            file,
            location,
            description,
            reporter
        );

        return NextResponse.json({
            success: true,
            imageHash,
            metadataHash,
        });
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        return NextResponse.json(
            { error: 'Failed to upload to IPFS' },
            { status: 500 }
        );
    }
}
