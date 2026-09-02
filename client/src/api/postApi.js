import axiosClient from './axiosClient';

export const getPosts = (classId, search = '') =>
  axiosClient.get(`/posts/class/${classId}`, { params: search ? { search } : {} });

export const createPost = (classId, content) =>
  axiosClient.post(`/posts/class/${classId}`, { content });

export const updatePost = (postId, content) => axiosClient.put(`/posts/${postId}`, { content });

export const deletePost = (postId) => axiosClient.delete(`/posts/${postId}`);
