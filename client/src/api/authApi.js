import axiosClient from './axiosClient';

export const registerUser = (payload) => axiosClient.post('/auth/register', payload);

export const loginUser = (payload) => axiosClient.post('/auth/login', payload);

export const forgotPassword = (email) => axiosClient.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  axiosClient.post(`/auth/reset-password/${token}`, { password });
