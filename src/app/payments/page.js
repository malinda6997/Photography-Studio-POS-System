"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import Layout from "../components/Layout";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      if (response.ok) {
        const data = await response.json();
        // Only show invoices with outstanding balance
        const unpaidInvoices = data.filter((invoice) => invoice.balance > 0);
        setInvoices(unpaidInvoices);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.invoiceId || formData.amount <= 0) {
      alert("Please select an invoice and enter a valid amount");
      return;
    }

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPayments();
        await fetchInvoices(); // Refresh to update outstanding balances
        handleCloseForm();
        alert("Payment recorded successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Record payment error:", error);
      alert("Failed to record payment");
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find((inv) => inv._id === invoiceId);
    if (invoice) {
      setFormData((prev) => ({
        ...prev,
        invoiceId,
        amount: invoice.balance, // Set default amount to remaining balance
      }));
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({
      invoiceId: "",
      amount: 0,
      method: "cash",
      reference: "",
      notes: "",
    });
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.invoice?.invoiceNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.invoice?.customer?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod =
      filterMethod === "all" || payment.method === filterMethod;

    const matchesDate =
      !filterDate ||
      new Date(payment.createdAt).toISOString().split("T")[0] === filterDate;

    return matchesSearch && matchesMethod && matchesDate;
  });

  const getMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return <BanknotesIcon className="h-5 w-5" />;
      case "card":
      case "bank_transfer":
        return <CreditCardIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "bank_transfer":
        return "bg-purple-100 text-purple-800";
      case "cheque":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTotalPayments = () => {
    return filteredPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track and record customer payments
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Record Payment
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <BanknotesIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Payments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    LKR {calculateTotalPayments().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Transactions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredPayments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CreditCardIcon className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Invoices
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {invoices.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />

              <div className="flex justify-end">
                <span className="text-sm text-gray-600 self-center">
                  {filteredPayments.length} payment(s) found
                </span>
              </div>
            </div>
          </div>

          {/* Payments List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No payments found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-500"
              >
                Record your first payment
              </button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <li key={payment._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="shrink-0">
                            {getMethodIcon(payment.method)}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {payment.invoice?.invoiceNumber ||
                                  "Unknown Invoice"}
                              </p>
                              <span
                                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(
                                  payment.method
                                )}`}
                              >
                                {payment.method.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-1">
                              <p className="text-sm text-gray-600">
                                Customer:{" "}
                                {payment.invoice?.customer?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(payment.createdAt)} • Received by:{" "}
                                {payment.recordedBy?.name || "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            LKR {payment.amount.toFixed(2)}
                          </p>
                          {payment.reference && (
                            <p className="text-xs text-gray-500">
                              Ref: {payment.reference}
                            </p>
                          )}
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            <strong>Notes:</strong> {payment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Record Payment</h3>
                  <button
                    onClick={handleCloseForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Invoice *
                    </label>
                    <select
                      value={formData.invoiceId}
                      onChange={(e) => handleInvoiceSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select an invoice</option>
                      {invoices.map((invoice) => (
                        <option key={invoice._id} value={invoice._id}>
                          {invoice.invoiceNumber} - {invoice.customer?.name}{" "}
                          (Balance: LKR {invoice.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Amount (LKR) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          method: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reference: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Transaction reference, cheque number, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Additional payment details..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Record Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
