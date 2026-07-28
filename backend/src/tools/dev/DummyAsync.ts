import { BackendTool } from '../../core/BackendTool';
import { updateJobProgress } from '../../worker';
import { registry } from '../../core/ToolRegistry';
class DummyAsyncTool implements BackendTool {
    id = 'dummy-async-tool';
    mode = 'async' as const;
    async execute(jobId: string, sessionId: string, data: any): Promise<any> {
        for (let i = 1; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            updateJobProgress(jobId, i * 20);
        }
        return { message: "Dummy async task completed successfully", originalData: data };
    }
}
registry.register(new DummyAsyncTool());
