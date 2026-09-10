import { http } from './httpClient';

export const budgetApi = {
  getMonthly: (year, month) => http.get(`/budgets/monthly/${year}/${month}`),
  setMonthly: (year, month, amount) => http.put(`/budgets/monthly/${year}/${month}`, { amount }),
  listCategoryBudgets: (year, month) => http.get(`/budgets/category?year=${year}&month=${month}`),
  upsertCategoryBudget: (data) => http.put('/budgets/category', data),
  removeCategoryBudget: (id) => http.delete(`/budgets/category/${id}`),
};
