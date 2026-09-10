import { http } from './httpClient';

export const recurringApi = {
  list: () => http.get('/recurring-expenses'),
  create: (data) => http.post('/recurring-expenses', data),
  update: (id, data) => http.put(`/recurring-expenses/${id}`, data),
  remove: (id) => http.delete(`/recurring-expenses/${id}`),
  generateDue: () => http.post('/recurring-expenses/generate-due'),
};
