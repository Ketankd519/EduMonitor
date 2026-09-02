import axiosClient from './axiosClient';

export const getAssignments = (classId) => axiosClient.get(`/assignments/class/${classId}`);

export const createAssignment = (classId, payload) =>
  axiosClient.post(`/assignments/class/${classId}`, payload);

export const getAssignmentById = (assignmentId) => axiosClient.get(`/assignments/${assignmentId}`);

export const updateAssignment = (assignmentId, payload) =>
  axiosClient.put(`/assignments/${assignmentId}`, payload);

export const deleteAssignment = (assignmentId) => axiosClient.delete(`/assignments/${assignmentId}`);
