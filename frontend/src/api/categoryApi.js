import { http } from './httpClient';

export const categoryApi = {
  list: () => http.get('/categories'),
  create: (data) => http.post('/categories', data),
  update: (id, data) => http.put(`/categories/${id}`, data),
  remove: (id) => http.delete(`/categories/${id}`),
};
