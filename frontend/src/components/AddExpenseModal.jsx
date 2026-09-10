import { useEffect, useState } from 'react';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import { useAddExpense } from '../context/AddExpenseContext';
import { categoryApi } from '../api/categoryApi';
import { expenseApi } from '../api/expenseApi';

export default function AddExpenseModal() {
  const { open, closeAddExpense, onSaved } = useAddExpense();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (open) {
      categoryApi.list().then((res) => setCategories(res.categories)).catch(() => setCategories([]));
    }
  }, [open]);

  const handleSubmit = async (values) => {
    const expense = await expenseApi.create(values);
    closeAddExpense();
    if (onSaved) onSaved(expense.expense);
  };

  return (
    <Modal open={open} title="Add Expense" onClose={closeAddExpense}>
      <ExpenseForm categories={categories} onSubmit={handleSubmit} onCancel={closeAddExpense} />
    </Modal>
  );
}
