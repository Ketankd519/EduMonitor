import axiosClient from './axiosClient';

export const getStudentDashboard = () => axiosClient.get('/dashboard/student');

export const getTeacherDashboard = () => axiosClient.get('/dashboard/teacher');

export const getPublicStats = () => axiosClient.get('/dashboard/public-stats');
