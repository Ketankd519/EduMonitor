import axiosClient from './axiosClient';

export const checkHealth = () => axiosClient.get('/health');
