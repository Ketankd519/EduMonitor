import axiosClient from './axiosClient';

export const markAttendance = (classId, date, records) =>
  axiosClient.post(`/attendance/class/${classId}/mark`, { date, records });

export const getClassAttendance = (classId) => axiosClient.get(`/attendance/class/${classId}`);

export const getAttendanceForDate = (classId, date) =>
  axiosClient.get(`/attendance/class/${classId}/date/${date}`);

export const getMyAttendance = (classId) => axiosClient.get(`/attendance/class/${classId}/mine`);
