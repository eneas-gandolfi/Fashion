import { NextResponse } from 'next/server';

export async function POST() {
    const webhookUrl = process.env.N8N_COMPETITOR_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('N8N_COMPETITOR_WEBHOOK_URL not configured');
        return NextResponse.json({ success: false, message: 'Webhook not configured' }, { status: 200 });
    }

    try {
        // Fire and forget - do not block UI
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger: 'competitor_monitor', timestamp: Date.now() }),
        }).catch(err => console.error('Failed to trigger competitor workflow:', err));

        return NextResponse.json({ success: true, message: 'Workflow triggered' });
    } catch (error) {
        console.error('Error triggering competitor workflow:', error);
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
    }
}
