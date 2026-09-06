"use client";

type Expense = { id: string; label: string; amount: number; status: string };

/** Extracted expenses surface for the employee portal (lazy-loaded). */
export function EmployeeExpensesPanel({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) {
    return <p className="muted-line">No expenses submitted.</p>;
  }
  return (
    <div className="list">
      {expenses.slice(0, 40).map((e) => (
        <div className="list-row" key={e.id}>
          <span className="badge">{e.status}</span>
          <p>
            <strong>{e.label}</strong>
            <span className="muted-line">${e.amount.toFixed(2)}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
