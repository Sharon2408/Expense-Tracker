import { http } from './httpClient';

function toQueryString(params) {
  const usable = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (usable.length === 0) return '';
  return `?${new URLSearchParams(usable).toString()}`;
}

export const expenseApi = {
  list: (filters) => http.get(`/expenses${toQueryString(filters)}`),
  get: (id) => http.get(`/expenses/${id}`),
  create: (data) => http.post('/expenses', data),
  update: (id, data) => http.put(`/expenses/${id}`, data),
  remove: (id) => http.delete(`/expenses/${id}`),
};
