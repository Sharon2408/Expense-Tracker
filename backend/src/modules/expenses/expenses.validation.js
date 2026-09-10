const ApiError = require('../../utils/apiError');

function validateExpenseInput(body, { partial = false } = {}) {
  const errors = {};
  const out = {};

  if (!partial || body.amount !== undefined) {
    const amount = Number(body.amount);
    if (body.amount === undefined || body.amount === null || body.amount === '') {
      errors.amount = 'Amount is required';
    } else if (Number.isNaN(amount)) {
      errors.amount = 'Amount must be numeric';
    } else if (amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    } else {
      out.amount = amount;
    }
  }

  if (!partial || body.categoryId !== undefined) {
    if (!body.categoryId) {
      errors.categoryId = 'Category is required';
    } else {
      out.categoryId = body.categoryId;
    }
  }

  if (!partial || body.expenseDate !== undefined) {
    if (!body.expenseDate) {
      errors.expenseDate = 'Expense date is required';
    } else if (Number.isNaN(new Date(body.expenseDate).getTime())) {
      errors.expenseDate = 'Expense date is invalid';
    } else {
      out.expenseDate = body.expenseDate;
    }
  }

  if (body.description !== undefined) out.description = String(body.description || '').slice(0, 500);
  if (body.paymentMethod !== undefined) out.paymentMethod = body.paymentMethod || 'Other';
  if (body.notes !== undefined) out.notes = String(body.notes || '').slice(0, 1000);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }
  return out;
}

module.exports = { validateExpenseInput };
