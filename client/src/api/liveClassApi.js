import axiosClient from './axiosClient';

export const startLiveClass = (classId) => axiosClient.post(`/live-classes/class/${classId}/start`);

export const endLiveClass = (liveClassId) => axiosClient.post(`/live-classes/${liveClassId}/end`);

export const getLiveClassById = (liveClassId) => axiosClient.get(`/live-classes/${liveClassId}`);

export const getActiveLiveClass = (classId) =>
  axiosClient.get(`/live-classes/class/${classId}/active`);
