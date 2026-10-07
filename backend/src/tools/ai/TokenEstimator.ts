import { BackendTool } from '../../core/BackendTool';
import { registry } from '../../core/ToolRegistry';
import { encoding_for_model, TiktokenModel } from 'tiktoken';

const MAX_TEXT_CHARS = parseInt(process.env.MAX_TOKEN_TEXT_CHARS || '200000', 10);

class TokenEstimatorTool implements BackendTool {
    id = 'token-estimator-tool';
    mode = 'sync' as const;

    async execute(jobId: string, sessionId: string, data: { text: string; model?: string }): Promise<any> {
        const { text, model = 'gpt-3.5-turbo' } = data ?? {};
        if (typeof text !== 'string' || !text) throw new Error('No text provided.');
        if (text.length > MAX_TEXT_CHARS) {
            throw new Error(`text is required to be at most ${MAX_TEXT_CHARS} characters.`);
        }
        if (typeof model !== 'string') throw new Error('Invalid model.');

        try {
            const enc = encoding_for_model(model as TiktokenModel);
            try {
                const tokens = enc.encode(text);
                return { tokens: tokens.length, model, characters: text.length };
            } finally {
                enc.free();
            }
        } catch (error: any) {
            throw new Error(`Token estimation failed: ${error.message}`);
        }
    }
}

registry.register(new TokenEstimatorTool());