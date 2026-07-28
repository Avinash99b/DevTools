import { BackendTool } from '../../core/BackendTool';
import { registry } from '../../core/ToolRegistry';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
class TokenEstimatorTool implements BackendTool {
    id = 'token-estimator-tool';
    mode = 'sync' as const;
    async execute(jobId: string, sessionId: string, data: { text: string, model: string }): Promise<any> {
        const { text, model = 'gpt-3.5-turbo' } = data;
        if (!text) throw new Error('No text provided');
        try {
            const enc = encoding_for_model(model as TiktokenModel);
            const tokens = enc.encode(text);
            const count = tokens.length;
            enc.free();
            return { tokens: count, model: model, characters: text.length };
        } catch (error: any) { throw new Error(`Token estimation failed: ${error.message}`); }
    }
}
registry.register(new TokenEstimatorTool());
