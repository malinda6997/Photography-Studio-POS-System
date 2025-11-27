"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    todayIncome: 0,
    pendingInvoices: 0,
    lowStockItems: [],
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      const [reportRes, invoicesRes, framesRes] = await Promise.all([
        user?.role === "admin"
          ? fetch(`/api/reports/daily?date=${today}`)
          : null,
        fetch("/api/invoices?limit=5"),
        fetch("/api/frames?lowStock=true"),
      ]);

      let todayIncome = 0;
      let pendingInvoicesCount = 0;

      if (reportRes && reportRes.ok) {
        const reportData = await reportRes.json();
        todayIncome = reportData.income.total;
        pendingInvoicesCount =
          reportData.invoices.stats.find((s) => s._id === "pending")?.count ||
          0;
      } else {
        // For staff users, get pending invoices count
        const invoicesData = await invoicesRes.json();
        pendingInvoicesCount = invoicesData.invoices.filter(
          (inv) => inv.paymentStatus === "pending"
        ).length;
      }

      const invoicesData = await invoicesRes.json();
      const framesData = await framesRes.json();

      setDashboardData({
        todayIncome,
        pendingInvoices: pendingInvoicesCount,
        lowStockItems: framesData.slice(0, 5),
        recentInvoices: invoicesData.invoices || invoicesData,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Income - Admin only */}
        {isAdmin && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today&apos;s Income
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      LKR {dashboardData.todayIncome.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/reports"
                  className="font-medium text-indigo-700 hover:text-indigo-900"
                >
                  View reports
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending Invoices */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.pendingInvoices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/invoices?status=pending"
                className="font-medium text-indigo-700 hover:text-indigo-900"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Low Stock Alert
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.lowStockItems.length} items
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/frames?lowStock=true"
                className="font-medium text-orange-700 hover:text-orange-900"
              >
                View items
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <CubeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Quick Actions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    Create Invoice
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/invoices/create"
                className="font-medium text-indigo-700 hover:text-indigo-900"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Invoices
            </h3>
            <div className="space-y-3">
              {dashboardData.recentInvoices.length > 0 ? (
                dashboardData.recentInvoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.customer?.name} - LKR{" "}
                        {invoice.subtotal.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : invoice.paymentStatus === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent invoices
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/invoices"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all invoices →
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Low Stock Items
            </h3>
            <div className="space-y-3">
              {dashboardData.lowStockItems.length > 0 ? (
                dashboardData.lowStockItems.map((frame) => (
                  <div
                    key={frame._id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {frame.name}
                      </p>
                      <p className="text-sm text-gray-500">{frame.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-600">
                        {frame.quantity} left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  All items are well stocked
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/frames"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Manage inventory →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
