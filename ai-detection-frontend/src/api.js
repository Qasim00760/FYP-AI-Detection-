import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const detectAll = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/detect_all', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
