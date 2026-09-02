import axiosClient from './axiosClient';

export const getNotes = (classId) => axiosClient.get(`/notes/class/${classId}`);

export const uploadNote = (classId, { file, title, description }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('description', description || '');
  return axiosClient.post(`/notes/class/${classId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteNote = (noteId) => axiosClient.delete(`/notes/${noteId}`);

/**
 * Downloads a note by fetching it as a blob (so the JWT goes through the
 * normal Authorization header via the axios interceptor) and then
 * triggering a native browser download with the correct filename.
 */
export const downloadNote = async (noteId, fileName) => {
  const res = await axiosClient.get(`/notes/${noteId}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
