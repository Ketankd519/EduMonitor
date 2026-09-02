import axiosClient from './axiosClient';

export const createClass = (payload) => axiosClient.post('/classes', payload);

export const getMyClasses = () => axiosClient.get('/classes/mine');

export const joinClass = (classCode) => axiosClient.post('/classes/join', { classCode });

export const leaveClass = (classId) => axiosClient.delete(`/classes/${classId}/leave`);

export const deleteClass = (classId) => axiosClient.delete(`/classes/${classId}`);

export const getClassById = (classId) => axiosClient.get(`/classes/${classId}`);

export const getClassStudents = (classId) => axiosClient.get(`/classes/${classId}/students`);
