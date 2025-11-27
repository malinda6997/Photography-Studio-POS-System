"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import Layout from "../components/Layout";
import {
  BanknotesIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalBookings: 0,
    paidInvoices: 0,
    pendingPayments: 0,
    completedBookings: 0,
    topServices: [],
    recentPayments: [],
    monthlyRevenue: [],
  });

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        export: "true",
      });

      const response = await fetch(`/api/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Failed to export report");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reports & Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Business insights and performance metrics
              </p>
            </div>
            <button
              onClick={handleExportReport}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="pt-6">
                <span className="text-sm text-gray-600">
                  {formatDate(dateRange.startDate)} -{" "}
                  {formatDate(dateRange.endDate)}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading report data...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(reportData.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Invoices
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.totalInvoices}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reportData.paidInvoices} paid •{" "}
                        {reportData.totalInvoices - reportData.paidInvoices}{" "}
                        pending
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Customers
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.totalCustomers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <CalendarIcon className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Bookings
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.totalBookings}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reportData.completedBookings} completed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Revenue Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Monthly Revenue Trend
                  </h3>
                  {reportData.monthlyRevenue.length > 0 ? (
                    <div className="space-y-3">
                      {reportData.monthlyRevenue.map((month, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">
                            {month.month}
                          </span>
                          <div className="flex-1 mx-4">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (month.revenue /
                                      Math.max(
                                        ...reportData.monthlyRevenue.map(
                                          (m) => m.revenue
                                        )
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No revenue data for this period
                    </p>
                  )}
                </div>

                {/* Top Services */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Top Services
                  </h3>
                  {reportData.topServices.length > 0 ? (
                    <div className="space-y-3">
                      {reportData.topServices.map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-gray-600 capitalize">
                              {service.type || service._id}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {service.count} bookings
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(service.revenue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No service data for this period
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Payments
                  </h3>
                </div>
                <div className="px-6 py-4">
                  {reportData.recentPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-600">
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Date
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Invoice
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Customer
                            </th>
                            <th className="text-left py-2 text-sm font-medium text-gray-600">
                              Method
                            </th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.recentPayments.map((payment) => (
                            <tr key={payment._id}>
                              <td className="py-3 text-sm text-gray-900 dark:text-gray-300">
                                {formatDate(payment.createdAt)}
                              </td>
                              <td className="py-3 text-sm text-gray-600">
                                {payment.invoice?.invoiceNumber || "N/A"}
                              </td>
                              <td className="py-3 text-sm text-gray-600">
                                {payment.invoice?.customer?.name || "N/A"}
                              </td>
                              <td className="py-3 text-sm text-gray-600 capitalize">
                                {payment.method.replace("_", " ")}
                              </td>
                              <td className="py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                                {formatCurrency(payment.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No payments found for this period
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900">
                      Payment Collection Rate
                    </h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-green-600">
                        {reportData.totalInvoices > 0
                          ? Math.round(
                              (reportData.paidInvoices /
                                reportData.totalInvoices) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {reportData.paidInvoices} of {reportData.totalInvoices}{" "}
                      invoices paid
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900">
                      Pending Payments
                    </h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-orange-600">
                        {formatCurrency(reportData.pendingPayments)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Outstanding invoices amount
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900">
                      Booking Completion
                    </h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {reportData.totalBookings > 0
                          ? Math.round(
                              (reportData.completedBookings /
                                reportData.totalBookings) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {reportData.completedBookings} of{" "}
                      {reportData.totalBookings} bookings completed
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
