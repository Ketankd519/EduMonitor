import axiosClient from './axiosClient';

export const getClassAcademicRecords = (classId) =>
  axiosClient.get(`/academic-records/class/${classId}`);

export const updateAcademicRecord = (recordId, payload) =>
  axiosClient.put(`/academic-records/${recordId}`, payload);

export const getMyAcademicRecord = (classId) =>
  axiosClient.get(`/academic-records/class/${classId}/mine`);
