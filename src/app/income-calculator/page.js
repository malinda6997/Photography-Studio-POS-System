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
  DocumentArrowDownIcon,
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
  const [filterPeriod, setFilterPeriod] = useState("today"); // Default to TODAY

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
    if (!user) return; // Wait for user to load

    if (user.role !== "admin") {
      toast.error("Access denied. Admin only.");
      window.location.href = "/dashboard";
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Helper function to get date range based on filter
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterPeriod) {
      case "today":
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return { start: today, end: endOfToday };

      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };

      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };

      default:
        return null; // all time
    }
  };

  // Helper function to filter items by date
  const filterByDate = (items, dateField = "date") => {
    if (filterPeriod === "all") return items;

    const range = getDateRange();
    if (!range) return items;

    return items.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= range.start && itemDate <= range.end;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch system data (invoices for income, expenses for outgoing)
      // Fetch ALL invoices and expenses (no pagination limit)
      const [invoicesRes, expensesRes, customIncomesRes, customExpensesRes] =
        await Promise.all([
          fetch("/api/invoices?limit=10000", { credentials: "include" }),
          fetch("/api/expenses", { credentials: "include" }),
          fetch("/api/income-calculator/incomes", { credentials: "include" }),
          fetch("/api/income-calculator/expenses", { credentials: "include" }),
        ]);

      let totalSystemIncome = 0;
      let totalSystemExpenses = 0;

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        console.log("📊 Invoices data:", data);
        let invoices = data.invoices || data || [];
        console.log("📊 Invoices array:", invoices);
        console.log("📊 Invoices count:", invoices.length);

        // Filter invoices by date period
        invoices = filterByDate(invoices, "date");
        console.log("📊 Filtered invoices count:", invoices.length);

        // Calculate total income from filtered invoices
        totalSystemIncome = invoices.reduce((sum, invoice) => {
          console.log(`Invoice ${invoice.invoiceNo}: ${invoice.finalTotal}`);
          return sum + (Number(invoice.finalTotal) || 0);
        }, 0);
        console.log("📊 Total system income:", totalSystemIncome);
      } else {
        console.error("Failed to fetch invoices:", await invoicesRes.text());
      }

      if (expensesRes.ok) {
        const data = await expensesRes.json();
        console.log("💰 Expenses data:", data);
        let expenses = data.expenses || data || [];
        console.log("💰 Expenses array:", expenses);
        console.log("💰 Expenses count:", expenses.length);

        // Filter expenses by date period
        expenses = filterByDate(expenses, "date");
        console.log("💰 Filtered expenses count:", expenses.length);

        totalSystemExpenses = expenses.reduce((sum, expense) => {
          console.log(`Expense ${expense.description}: ${expense.amount}`);
          return sum + (Number(expense.amount) || 0);
        }, 0);
        console.log("💰 Total system expenses:", totalSystemExpenses);
      } else {
        console.error("Failed to fetch expenses:", await expensesRes.text());
      }

      if (customIncomesRes.ok) {
        const incomes = await customIncomesRes.json();
        console.log("💵 Custom incomes data:", incomes);
        console.log("💵 Custom incomes count:", incomes.length);
        setCustomIncomes(incomes);
      } else {
        console.error(
          "Failed to fetch custom incomes:",
          await customIncomesRes.text()
        );
        setCustomIncomes([]);
      }

      if (customExpensesRes.ok) {
        const expenses = await customExpensesRes.json();
        console.log("💸 Custom expenses data:", expenses);
        console.log("💸 Custom expenses count:", expenses.length);
        setCustomExpenses(expenses);
      } else {
        console.error(
          "Failed to fetch custom expenses:",
          await customExpensesRes.text()
        );
        setCustomExpenses([]);
      }

      setSystemIncome(totalSystemIncome);
      setSystemExpenses(totalSystemExpenses);

      console.log("✅ Final state - System Income:", totalSystemIncome);
      console.log("✅ Final state - System Expenses:", totalSystemExpenses);
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

  const generateReport = async () => {
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Calculate filtered data for the report
      const filteredInvoices = filterByDate(customIncomes);
      const filteredExpenses = filterByDate(customExpenses);

      const filteredCustomIncomesTotal = filteredInvoices.reduce(
        (sum, income) => sum + income.amount,
        0
      );
      const filteredCustomExpensesTotal = filteredExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const reportTotalIncome = systemIncome + filteredCustomIncomesTotal;
      const reportTotalExpenses = systemExpenses + filteredCustomExpensesTotal;
      const reportNetProfit = reportTotalIncome - reportTotalExpenses;

      // Get period label
      let periodLabel = "All Time";
      if (filterPeriod === "today") periodLabel = "Today";
      else if (filterPeriod === "week") periodLabel = "This Week";
      else if (filterPeriod === "month") periodLabel = "This Month";

      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const reportTime = new Date().toLocaleTimeString("en-US");

      // Header with background
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("Income Calculator Report", pageWidth / 2, 15, {
        align: "center",
      });

      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.text("Shine Art Studio - POS System", pageWidth / 2, 23, {
        align: "center",
      });
      doc.setFontSize(9);
      doc.text(`Generated: ${reportDate} at ${reportTime}`, pageWidth / 2, 29, {
        align: "center",
      });
      doc.text(
        `Report by: ${user?.name || "Admin"} | Period: ${periodLabel}`,
        pageWidth / 2,
        35,
        { align: "center" }
      );

      yPos = 50;

      // Summary Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Financial Summary", 14, yPos);
      yPos += 10;

      // Total Income
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.rect(14, yPos, 180, 15, "FD");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Total Income", 18, yPos + 6);
      doc.setFontSize(14);
      doc.text(`LKR ${reportTotalIncome.toLocaleString()}`, 18, yPos + 11);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(
        `Invoices: LKR ${systemIncome.toLocaleString()} | Other: LKR ${filteredCustomIncomesTotal.toLocaleString()}`,
        100,
        yPos + 9
      );
      yPos += 20;

      // Total Expenses
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.rect(14, yPos, 180, 15, "FD");
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Total Expenses", 18, yPos + 6);
      doc.setFontSize(14);
      doc.text(`LKR ${reportTotalExpenses.toLocaleString()}`, 18, yPos + 11);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text(
        `Business: LKR ${systemExpenses.toLocaleString()} | Other: LKR ${filteredCustomExpensesTotal.toLocaleString()}`,
        100,
        yPos + 9
      );
      yPos += 20;

      // Net Profit/Loss
      const isProfit = reportNetProfit >= 0;
      doc.setFillColor(
        isProfit ? 239 : 255,
        isProfit ? 246 : 251,
        isProfit ? 255 : 235
      );
      doc.setDrawColor(
        isProfit ? 59 : 245,
        isProfit ? 130 : 158,
        isProfit ? 246 : 11
      );
      doc.rect(14, yPos, 180, 15, "FD");
      doc.setTextColor(
        isProfit ? 59 : 245,
        isProfit ? 130 : 158,
        isProfit ? 246 : 11
      );
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(isProfit ? "Net Profit" : "Net Loss", 18, yPos + 6);
      doc.setFontSize(14);
      doc.text(`LKR ${reportNetProfit.toLocaleString()}`, 18, yPos + 11);
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text("Income - Expenses", 100, yPos + 9);
      yPos += 25;

      // Income Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Income Details", 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Business Invoices", 18, yPos);
      doc.text(`LKR ${systemIncome.toLocaleString()}`, 180, yPos, {
        align: "right",
      });
      yPos += 6;

      filteredInvoices.forEach((income) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const incomeDate = new Date(income.date).toLocaleDateString();
        doc.text(`${income.description} (${incomeDate})`, 18, yPos);
        doc.text(`LKR ${income.amount.toLocaleString()}`, 180, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      yPos += 2;
      doc.setFont(undefined, "bold");
      doc.text("TOTAL INCOME", 18, yPos);
      doc.text(`LKR ${reportTotalIncome.toLocaleString()}`, 180, yPos, {
        align: "right",
      });
      yPos += 10;

      // Expense Details
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text("Expense Details", 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text("Business Expenses", 18, yPos);
      doc.text(`LKR ${systemExpenses.toLocaleString()}`, 180, yPos, {
        align: "right",
      });
      yPos += 6;

      filteredExpenses.forEach((expense) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const expenseDate = new Date(expense.date).toLocaleDateString();
        doc.text(`${expense.description} (${expenseDate})`, 18, yPos);
        doc.text(`LKR ${expense.amount.toLocaleString()}`, 180, yPos, {
          align: "right",
        });
        yPos += 6;
      });

      yPos += 2;
      doc.setFont(undefined, "bold");
      doc.text("TOTAL EXPENSES", 18, yPos);
      doc.text(`LKR ${reportTotalExpenses.toLocaleString()}`, 180, yPos, {
        align: "right",
      });

      // Footer on all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} - Generated by Shine Art Studio POS System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const filename = `Income_Calculator_Report_${periodLabel.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);

      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(`Failed to generate PDF report: ${error.message}`);
    }
  };

  // Calculate totals with date filtering
  const filteredCustomIncomes = filterByDate(customIncomes);
  const filteredCustomExpenses = filterByDate(customExpenses);

  const customIncomesTotal = filteredCustomIncomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const customExpensesTotal = filteredCustomExpenses.reduce(
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
            <div className="flex items-center justify-between mb-4">
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
              <button
                onClick={generateReport}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Download PDF
              </button>
            </div>

            {/* Filter Options */}
            <div className="flex items-center gap-3 bg-gray-800 p-4 rounded-lg">
              <span className="text-sm font-medium text-gray-300">
                Filter by:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilterPeriod("all");
                    fetchData();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterPeriod === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => {
                    setFilterPeriod("today");
                    fetchData();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterPeriod === "today"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    setFilterPeriod("week");
                    fetchData();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterPeriod === "week"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    setFilterPeriod("month");
                    fetchData();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterPeriod === "month"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  This Month
                </button>
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
                    Invoices: LKR {systemIncome.toLocaleString()} + Other: LKR{" "}
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
                    Business: LKR {systemExpenses.toLocaleString()} + Other: LKR{" "}
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
                {filteredCustomIncomes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No custom incomes{" "}
                    {filterPeriod !== "all"
                      ? `for ${
                          filterPeriod === "today"
                            ? "today"
                            : filterPeriod === "week"
                            ? "this week"
                            : "this month"
                        }`
                      : "added"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomIncomes.map((income) => (
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
                {filteredCustomExpenses.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No custom expenses{" "}
                    {filterPeriod !== "all"
                      ? `for ${
                          filterPeriod === "today"
                            ? "today"
                            : filterPeriod === "week"
                            ? "this week"
                            : "this month"
                        }`
                      : "added"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredCustomExpenses.map((expense) => (
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
