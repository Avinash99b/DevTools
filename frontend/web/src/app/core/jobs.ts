import { api } from './api';

export interface JobResponse {
    jobId?: string;
    id?: string;
    toolId?: string;
    status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled' | string;
    progress?: number;
    result?: any;
    error?: string;
    createdAt?: string | number;
    updatedAt?: string | number;
}

export const submitJob = async (toolId: string, data: any): Promise<JobResponse> => {
    const response = await api.post('/api/jobs', { toolId, data });
    return response.data;
};

export const pollJob = async (jobId: string): Promise<JobResponse> => {
    const response = await api.get(`/api/jobs/${jobId}`);
    return response.data;
};

export const listJobs = async (limit = 50): Promise<{ jobs: JobResponse[] }> => {
    const response = await api.get('/api/jobs', { params: { limit } });
    return response.data;
};

export const cancelJob = async (jobId: string) => {
    const response = await api.delete(`/api/jobs/${jobId}`);
    return response.data;
};

export const retryJob = async (jobId: string) => {
    const response = await api.post(`/api/jobs/${jobId}/retry`);
    return response.data;
};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { success: boolean; fileId: string };
};

/** Builds an absolute download URL for a stored file id. */
export const fileDownloadUrl = (fileId: string) => {
    const base = api.defaults.baseURL || '';
    return `${base.replace(/\/$/, '')}/api/files/${fileId}`;
};