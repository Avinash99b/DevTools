import { api } from './api';
export const submitJob = async (toolId: string, data: any) => {
    const response = await api.post('/api/jobs', { toolId, data });
    return response.data;
};
export const pollJob = async (jobId: string) => {
    const response = await api.get(`/api/jobs/${jobId}`);
    return response.data;
};
