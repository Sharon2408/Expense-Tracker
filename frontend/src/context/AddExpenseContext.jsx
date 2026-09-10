import { createContext, useContext, useState, useCallback } from 'react';

const AddExpenseContext = createContext(null);

export function AddExpenseProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [onSaved, setOnSaved] = useState(null);

  const openAddExpense = useCallback((callback) => {
    setOnSaved(callback || null);
    setOpen(true);
  }, []);

  const closeAddExpense = useCallback(() => setOpen(false), []);

  return (
    <AddExpenseContext.Provider value={{ open, openAddExpense, closeAddExpense, onSaved }}>
      {children}
    </AddExpenseContext.Provider>
  );
}

export function useAddExpense() {
  const ctx = useContext(AddExpenseContext);
  if (!ctx) throw new Error('useAddExpense must be used within AddExpenseProvider');
  return ctx;
}
