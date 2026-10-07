import { useCallback, useRef, useState } from "react";
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

/**
 * Shared controller for backend tools. Owns loading, progress, logs, errors and
 * polling so remote tools do not each reimplement the async job lifecycle.
 */
export function useRemoteJob(toolId: string, config: RemoteJobConfig) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [output, setOutput] = useState<DevToolOutput | DevToolOutput[] | undefined>();
    const [error, setError] = useState<string | undefined>();
    const runningRef = useRef(false);
    const configRef = useRef(config);
    configRef.current = config;

    const addLog = useCallback((level: LogEntry["level"], message: string) => {
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

            for (;;) {
                await sleep(1000);
                const job = await pollJob(jobId);
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
        } catch (e: any) {
            const message = e?.response?.data?.error || e?.message || "Execution failed.";
            setError(message);
            addLog("error", message);
        } finally {
            runningRef.current = false;
            setIsExecuting(false);
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