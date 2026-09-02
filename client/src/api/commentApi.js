import axiosClient from './axiosClient';

export const getComments = (postId) => axiosClient.get(`/comments/post/${postId}`);

export const createComment = (postId, content) =>
  axiosClient.post(`/comments/post/${postId}`, { content });

export const deleteComment = (commentId) => axiosClient.delete(`/comments/${commentId}`);
