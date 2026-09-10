import { http } from './httpClient';

export const analyticsApi = {
  dashboard: () => http.get('/analytics/dashboard'),
  monthly: (year, month) => http.get(`/analytics/monthly?year=${year}&month=${month}`),
  trend: (months = 6) => http.get(`/analytics/trend?months=${months}`),
  insights: () => http.get('/analytics/insights'),
};
