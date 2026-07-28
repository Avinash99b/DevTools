export interface BackendTool {
    id: string;
    mode: 'sync' | 'async';
    execute: (jobId: string, sessionId: string, data: any) => Promise<any>;
}
