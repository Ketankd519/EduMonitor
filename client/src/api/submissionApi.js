import axiosClient from './axiosClient';

export const submitAssignment = (assignmentId, answers) =>
  axiosClient.post(`/submissions/${assignmentId}/submit`, { answers });

export const getMySubmission = (assignmentId) => axiosClient.get(`/submissions/${assignmentId}/mine`);

export const getAllSubmissions = (assignmentId) => axiosClient.get(`/submissions/${assignmentId}/all`);
