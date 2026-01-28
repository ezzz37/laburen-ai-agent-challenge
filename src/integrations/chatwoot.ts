import type { ChatwootConfig } from '../types';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

export async function addChatwootTags(
    conversationId: string,
    tags: string[],
    config: ChatwootConfig
): Promise<void> {
    const sanitizedTags = tags.map(tag => sanitizeTag(tag));

    const url = `${config.url}/api/v1/accounts/${config.accountId}/conversations/${conversationId}/labels`;

    const payload = {
        labels: sanitizedTags
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': config.token
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Chatwoot API error: ${response.status} - ${errorText}`);
            }

            console.log(`[Chatwoot] Tags added successfully to conversation ${conversationId}:`, sanitizedTags);
            return;
        } catch (error) {
            lastError = error as Error;
            console.warn(`[Chatwoot] Attempt ${attempt + 1} failed:`, error);

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    console.error(`[Chatwoot] Failed to add tags after ${MAX_RETRIES + 1} attempts:`, lastError);
}

function sanitizeTag(tag: string): string {
    return tag
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateProductTags(productName: string): string[] {
    const sanitized = sanitizeTag(productName);
    return [`producto_${sanitized}`];
}

export function generateCartTags(): string[] {
    return ['carrito_activo', 'interes_compra'];
}

export function generateHandoffTags(reason: string): string[] {
    const sanitizedReason = sanitizeTag(reason);
    return ['derivado_humano', `motivo_${sanitizedReason}`];
}

export async function handoffToHuman(
    conversationId: string,
    reason: string,
    config: ChatwootConfig
): Promise<void> {
    const tags = generateHandoffTags(reason);
    await addChatwootTags(conversationId, tags, config);

    const url = `${config.url}/api/v1/accounts/${config.accountId}/conversations/${conversationId}`;

    console.log(`[Chatwoot] Handoff URL: ${url}`);
    console.log(`[Chatwoot] Method: PATCH`);

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'api_access_token': config.token
            },
            body: JSON.stringify({ status: 'open' }),
            redirect: 'manual'
        });

        console.log(`[Chatwoot] Handoff Response Status: ${response.status}`);

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('Location');
            console.warn(`[Chatwoot] API redirected to: ${location}`);
            throw new Error(`Chatwoot API redirect detected to ${location} (Status ${response.status})`);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Chatwoot] Handoff failed body: ${errorText.substring(0, 200)}`);
            throw new Error(`Failed to change conversation status: ${response.status} - ${errorText}`);
        }

        console.log(`[Chatwoot] Conversation ${conversationId} handed off to human. Reason: ${reason}`);
    } catch (error) {
        console.error(`[Chatwoot] Failed to handoff conversation:`, error);
        throw error;
    }
}

