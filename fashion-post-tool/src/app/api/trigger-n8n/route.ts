import { NextResponse } from 'next/server';

export async function POST() {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('N8N_WEBHOOK_URL not configured');
        return NextResponse.json({ message: 'Webhook not configured' }, { status: 200 });
    }

    try {
        // Fire and forget - não esperamos a resposta do N8N para não travar a UI
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger: 'post_now', timestamp: Date.now() }),
        }).catch(err => console.error('Failed to trigger N8N:', err));

        return NextResponse.json({ success: true, message: 'Webhook triggered' });
    } catch (error) {
        console.error('Error triggering N8N:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
