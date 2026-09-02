import axiosClient from './axiosClient';

export const getMyProfile = () => axiosClient.get('/users/me');

export const updateMyProfile = (payload) => axiosClient.put('/users/me', payload);

export const updateMyAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return axiosClient.put('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
