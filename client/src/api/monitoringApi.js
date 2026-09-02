import axiosClient from './axiosClient';

export const analyzeFrame = (liveClassId, frameBase64) =>
  axiosClient.post('/monitoring/analyze-frame', { liveClassId, frame: frameBase64 });
