"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../../components/ui/toast";
import { useConfirm } from "../../components/ui/confirm";
import Layout from "../components/Layout";
import {
  PlusIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalculatorIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

export default function IncomeCalculatorPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [systemIncome, setSystemIncome] = useState(0);
  const [systemExpenses, setSystemExpenses] = useState(0);
  const [customIncomes, setCustomIncomes] = useState([]);
  const [customExpenses, setCustomExpenses] = useState([]);

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [incomeFormData, setIncomeFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [expenseFormData, setExpenseFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (user?.role !== "admin") {
      toast.error("Access denied. Admin only.");
      window.location.href = "/dashboard";
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch system data (payments and expenses from system)
      const [paymentsRes, expensesRes, customIncomesRes, customExpensesRes] =
        await Promise.all([
          fetch("/api/payments", { credentials: "include" }),
          fetch("/api/expenses", { credentials: "include" }),
          fetch("/api/income-calculator/incomes", { credentials: "include" }),
          fetch("/api/income-calculator/expenses", { credentials: "include" }),
        ]);

      let totalSystemIncome = 0;
      let totalSystemExpenses = 0;

      if (paymentsRes.ok) {
        const payments = await paymentsRes.json();
        totalSystemIncome = payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
      } else {
        console.error("Failed to fetch payments:", await paymentsRes.text());
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        totalSystemExpenses = expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        );
      } else {
        console.error("Failed to fetch expenses:", await expensesRes.text());
      }

      if (customIncomesRes.ok) {
        const incomes = await customIncomesRes.json();
        setCustomIncomes(incomes);
      } else {
        console.error("Failed to fetch custom incomes:", await customIncomesRes.text());
        setCustomIncomes([]);
      }

      if (customExpensesRes.ok) {
        const expenses = await customExpensesRes.json();
        setCustomExpenses(expenses);
      } else {
        console.error("Failed to fetch custom expenses:", await customExpensesRes.text());
        setCustomExpenses([]);
      }

      setSystemIncome(totalSystemIncome);
      setSystemExpenses(totalSystemExpenses);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();

    if (!incomeFormData.description || !incomeFormData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch("/api/income-calculator/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: incomeFormData.description,
          amount: parseFloat(incomeFormData.amount),
          date: incomeFormData.date,
        }),
      });

      if (response.ok) {
        toast.success("Income added successfully");
        setIncomeFormData({
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowIncomeForm(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add income");
      }
    } catch (error) {
      console.error("Add income error:", error);
      toast.error("Failed to add income");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!expenseFormData.description || !expenseFormData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch("/api/income-calculator/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expenseFormData.description,
          amount: parseFloat(expenseFormData.amount),
          date: expenseFormData.date,
        }),
      });

      if (response.ok) {
        toast.success("Expense added successfully");
        setExpenseFormData({
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowExpenseForm(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add expense");
      }
    } catch (error) {
      console.error("Add expense error:", error);
      toast.error("Failed to add expense");
    }
  };

  const handleDeleteIncome = async (id, description) => {
    const confirmed = await confirm(
      `Are you sure you want to delete "${description}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/income-calculator/incomes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Income deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete income");
      }
    } catch (error) {
      console.error("Delete income error:", error);
      toast.error("Failed to delete income");
    }
  };

  const handleDeleteExpense = async (id, description) => {
    const confirmed = await confirm(
      `Are you sure you want to delete "${description}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/income-calculator/expenses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Expense deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete expense");
      }
    } catch (error) {
      console.error("Delete expense error:", error);
      toast.error("Failed to delete expense");
    }
  };

  // Calculate totals
  const customIncomesTotal = customIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const customExpensesTotal = customExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalIncome = systemIncome + customIncomesTotal;
  const totalExpenses = systemExpenses + customExpensesTotal;
  const netProfit = totalIncome - totalExpenses;

  if (!user || user.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <CalculatorIcon className="h-8 w-8" />
                  Income Calculator
                </h1>
                <p className="mt-2 text-sm text-gray-300">
                  Track all income and expenses to calculate net profit (Admin
                  Only)
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Income */}
            <div className="bg-linear-to-br from-green-600 to-green-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Total Income
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    LKR {totalIncome.toLocaleString()}
                  </p>
                  <p className="text-green-100 text-xs mt-1">
                    System: LKR {systemIncome.toLocaleString()} + Custom: LKR{" "}
                    {customIncomesTotal.toLocaleString()}
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-12 w-12 text-green-200" />
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-linear-to-br from-red-600 to-red-700 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    Total Expenses
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    LKR {totalExpenses.toLocaleString()}
                  </p>
                  <p className="text-red-100 text-xs mt-1">
                    System: LKR {systemExpenses.toLocaleString()} + Custom: LKR{" "}
                    {customExpensesTotal.toLocaleString()}
                  </p>
                </div>
                <ArrowTrendingDownIcon className="h-12 w-12 text-red-200" />
              </div>
            </div>

            {/* Net Profit */}
            <div
              className={`bg-linear-to-br ${
                netProfit >= 0
                  ? "from-blue-600 to-blue-700"
                  : "from-orange-600 to-orange-700"
              } rounded-lg shadow-lg p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Net Profit</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    LKR {netProfit.toLocaleString()}
                  </p>
                  <p className="text-blue-100 text-xs mt-1">
                    Income - Expenses
                  </p>
                </div>
                <BanknotesIcon className="h-12 w-12 text-blue-200" />
              </div>
            </div>
          </div>

          {/* Custom Income and Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Incomes */}
            <div className="bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                    Other Incomes
                  </h2>
                  <button
                    onClick={() => setShowIncomeForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Income
                  </button>
                </div>
              </div>

              <div className="p-6">
                {customIncomes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No custom incomes added
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customIncomes.map((income) => (
                      <div
                        key={income._id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {income.description}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(income.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-green-400 font-semibold">
                            +LKR {income.amount.toLocaleString()}
                          </p>
                          <button
                            onClick={() =>
                              handleDeleteIncome(income._id, income.description)
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Expenses */}
            <div className="bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <ReceiptPercentIcon className="h-6 w-6 text-red-400" />
                    Other Expenses
                  </h2>
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Expense
                  </button>
                </div>
              </div>

              <div className="p-6">
                {customExpenses.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No custom expenses added
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customExpenses.map((expense) => (
                      <div
                        key={expense._id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {expense.description}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-red-400 font-semibold">
                            -LKR {expense.amount.toLocaleString()}
                          </p>
                          <button
                            onClick={() =>
                              handleDeleteExpense(
                                expense._id,
                                expense.description
                              )
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {showIncomeForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                Add Custom Income
              </h3>
              <form onSubmit={handleAddIncome}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={incomeFormData.description}
                      onChange={(e) =>
                        setIncomeFormData({
                          ...incomeFormData,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g., Equipment Sale, Consultation Fee"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Amount (LKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={incomeFormData.amount}
                      onChange={(e) =>
                        setIncomeFormData({
                          ...incomeFormData,
                          amount: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={incomeFormData.date}
                      onChange={(e) =>
                        setIncomeFormData({
                          ...incomeFormData,
                          date: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIncomeForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                Add Custom Expense
              </h3>
              <form onSubmit={handleAddExpense}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={expenseFormData.description}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="e.g., Electricity Bill, Rent, Maintenance"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Amount (LKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseFormData.amount}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          amount: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          date: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Add Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
