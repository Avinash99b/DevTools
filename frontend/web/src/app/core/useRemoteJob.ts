import { useCallback, useEffect, useRef, useState } from "react";
import type { LogEntry } from "../components/TerminalOutput";
import type { DevToolOutput } from "../types/DevToolOutput";
import { submitJob, pollJob } from "./jobs";

type LogInput = { level: LogEntry["level"]; message: string };

export interface RemoteJobConfig {
    /** Transforms form data into the backend payload (e.g. uploads a file first). */
    prepare?: (data: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;
    /** Maps a completed job result into output/log entries. */
    onComplete: (result: any) => { output?: DevToolOutput | DevToolOutput[]; logs?: LogInput[] };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const POLL_INTERVAL_MS = 1200;
const MAX_POLL_ATTEMPTS = 300; // ~6 minutes ceiling

/**
 * Shared controller for backend tools. Owns loading, progress, logs, errors and
 * polling so remote tools do not each reimplement the async job lifecycle.
 * Polling stops on unmount and is bounded by a maximum attempt budget.
 */
export function useRemoteJob(toolId: string, config: RemoteJobConfig) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [output, setOutput] = useState<DevToolOutput | DevToolOutput[] | undefined>();
    const [error, setError] = useState<string | undefined>();
    const runningRef = useRef(false);
    const mountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);
    const configRef = useRef(config);

    useEffect(() => { configRef.current = config; });

    useEffect(() => () => {
        mountedRef.current = false;
        abortRef.current?.abort();
    }, []);

    const addLog = useCallback((level: LogEntry["level"], message: string) => {
        if (!mountedRef.current) return;
        setLogs((prev) => [...prev, { level, message, timestamp: new Date().toLocaleTimeString() }]);
    }, []);

    const execute = useCallback(async (data: Record<string, any>) => {
        if (runningRef.current) return;
        runningRef.current = true;
        setIsExecuting(true);
        setError(undefined);
        setProgress(0);
        try {
            addLog("info", "Submitting job to server...");
            const payload = configRef.current.prepare ? await configRef.current.prepare(data) : data;
            const response = await submitJob(toolId, payload);

            if (response.status === "completed") {
                const { output: out, logs: doneLogs } = configRef.current.onComplete(response.result);
                if (out) setOutput(out);
                doneLogs?.forEach((l) => addLog(l.level, l.message));
                setProgress(100);
                addLog("success", "Completed.");
                return;
            }

            const jobId = response.jobId || response.id;
            if (!jobId) throw new Error("Server did not return a job id.");
            addLog("info", `Job ${jobId} queued.`);

            for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
                await sleep(POLL_INTERVAL_MS);
                if (!mountedRef.current) return;
                const job = await pollJob(jobId);
                if (!mountedRef.current) return;
                setProgress(job.progress ?? 0);

                if (job.status === "completed") {
                    const { output: out, logs: doneLogs } = configRef.current.onComplete(job.result);
                    if (out) setOutput(out);
                    doneLogs?.forEach((l) => addLog(l.level, l.message));
                    setProgress(100);
                    addLog("success", "Completed.");
                    return;
                }
                if (job.status === "error") {
                    throw new Error(job.error || "Job failed.");
                }
                if (job.status === "cancelled") {
                    addLog("warning", "Job was cancelled.");
                    return;
                }
            }
            throw new Error("Timed out waiting for the job to finish.");
        } catch (e: any) {
            if (e?.name === "AbortError" || e?.code === "ERR_CANCELED") return;
            const message = e?.response?.data?.error || e?.message || "Execution failed.";
            if (mountedRef.current) {
                setError(message);
                addLog("error", message);
            }
        } finally {
            runningRef.current = false;
            if (mountedRef.current) setIsExecuting(false);
        }
    }, [toolId, addLog]);

    const reset = useCallback(() => {
        setLogs([]);
        setOutput(undefined);
        setError(undefined);
        setProgress(0);
    }, []);

    return { isExecuting, progress, logs, output, error, execute, reset, addLog };
}