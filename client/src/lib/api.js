import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });
export const mediaUrl = (path) => path ? `${api.defaults.baseURL.replace(/\/api$/, '')}/${path}` : '';

export const brands = {
  list: () => api.get('/brands').then((r) => r.data),
  save: (data, id) => api[id ? 'put' : 'post'](`/brands${id ? `/${id}` : ''}`, data).then((r) => r.data),
  upload: (form) => api.post('/brands/upload', form).then((r) => r.data),
  remove: (id) => api.delete(`/brands/${id}`).then((r) => r.data),
};

export const projects = {
  list: () => api.get('/projects').then((r) => r.data),
  create: (data) => api.post('/projects', data).then((r) => r.data),
  uploadThumbnail: (form) => api.post('/projects/upload-thumbnail', form).then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
};

export const ai = {
  generate: (data) => api.post('/ai/generate-news-package', data).then((r) => r.data),
};

export const tts = {
  generate: (data) => api.post('/tts/generate', data).then((r) => r.data),
};

export const assets = {
  upload: (form) => api.post('/assets/upload', form).then((r) => r.data),
  url: (data) => api.post('/assets/url', data).then((r) => r.data),
  update: (id, data) => api.put(`/assets/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/assets/${id}`).then((r) => r.data),
};

export const render = {
  start: (projectId) => api.post(`/render/${projectId}`).then((r) => r.data),
  status: (projectId) => api.get(`/render/${projectId}/status`).then((r) => r.data),
  downloadUrl: (projectId) => `${api.defaults.baseURL}/render/${projectId}/download`,
};

export default api;
