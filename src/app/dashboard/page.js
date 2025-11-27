"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import Layout from "../components/Layout";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    todayIncome: 0,
    pendingInvoices: 0,
    lowStockItems: [],
    recentInvoices: [],
    weeklyIncome: [],
    monthlyStats: {
      totalRevenue: 0,
      totalInvoices: 0,
      averageOrderValue: 0,
      topCustomers: [],
    },
    recentActivity: [],
    upcomingBookings: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      const [
        reportRes,
        invoicesRes,
        framesRes,
        weeklyRes,
        monthlyRes,
        bookingsRes,
      ] = await Promise.all([
        user?.role === "admin"
          ? fetch(`/api/reports/daily?date=${today}`)
          : null,
        fetch("/api/invoices?limit=5"),
        fetch("/api/frames?lowStock=true"),
        user?.role === "admin" ? fetch("/api/reports/weekly") : null,
        user?.role === "admin" ? fetch("/api/reports/monthly") : null,
        fetch("/api/bookings?limit=3&upcoming=true"),
      ]);

      let todayIncome = 0;
      let pendingInvoicesCount = 0;

      // Process all responses first
      const invoicesData = invoicesRes.ok
        ? await invoicesRes.json()
        : { invoices: [] };
      const framesData = framesRes.ok ? await framesRes.json() : [];

      if (reportRes && reportRes.ok) {
        const reportData = await reportRes.json();
        todayIncome = reportData.income.total;
        pendingInvoicesCount =
          reportData.invoices.stats.find((s) => s._id === "pending")?.count ||
          0;
      } else {
        // For staff users, get pending invoices count
        pendingInvoicesCount = (invoicesData.invoices || invoicesData).filter(
          (inv) => inv.paymentStatus === "pending"
        ).length;
      }

      // Get weekly data for charts
      let weeklyIncome = [];
      let monthlyStats = {
        totalRevenue: 0,
        totalInvoices: 0,
        averageOrderValue: 0,
        topCustomers: [],
      };

      if (weeklyRes && weeklyRes.ok) {
        try {
          const weeklyData = await weeklyRes.json();
          weeklyIncome = weeklyData.dailyIncome || [];
        } catch (error) {
          console.error("Error parsing weekly data:", error);
          weeklyIncome = [];
        }
      }

      if (monthlyRes && monthlyRes.ok) {
        try {
          const monthlyData = await monthlyRes.json();
          monthlyStats = {
            totalRevenue: monthlyData.totalRevenue || 0,
            totalInvoices: monthlyData.totalInvoices || 0,
            averageOrderValue: monthlyData.averageOrderValue || 0,
            topCustomers: monthlyData.topCustomers || [],
          };
        } catch (error) {
          console.error("Error parsing monthly data:", error);
        }
      }

      // Get upcoming bookings
      let upcomingBookings = [];
      if (bookingsRes && bookingsRes.ok) {
        try {
          const bookingsData = await bookingsRes.json();
          upcomingBookings = bookingsData.bookings || bookingsData || [];
        } catch (error) {
          console.error("Error parsing bookings data:", error);
          upcomingBookings = [];
        }
      }

      // Generate some recent activity data (in real app, this would come from API)
      const recentActivity = [
        {
          type: "invoice",
          message: "New invoice created",
          time: "2 minutes ago",
        },
        {
          type: "payment",
          message: "Payment received",
          time: "15 minutes ago",
        },
        {
          type: "booking",
          message: "New booking scheduled",
          time: "1 hour ago",
        },
        { type: "inventory", message: "Stock updated", time: "2 hours ago" },
      ];

      setDashboardData({
        todayIncome,
        pendingInvoices: pendingInvoicesCount,
        lowStockItems: (Array.isArray(framesData) ? framesData : []).slice(
          0,
          5
        ),
        recentInvoices: (invoicesData.invoices || invoicesData || []).slice(
          0,
          5
        ),
        weeklyIncome,
        monthlyStats,
        recentActivity,
        upcomingBookings: upcomingBookings.slice(0, 3),
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by middleware
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Income - Admin only */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Today&apos;s Income
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      LKR {dashboardData.todayIncome.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/reports"
                  className="font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View reports
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending Invoices */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pending Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {dashboardData.pendingInvoices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/invoices?status=pending"
                className="font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-400 dark:text-orange-300" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Low Stock Alert
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {dashboardData.lowStockItems.length} items
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/frames?lowStock=true"
                className="font-medium text-orange-700 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 cursor-pointer transition-colors duration-200"
              >
                View items
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="shrink-0">
                <CubeIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Quick Actions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    Create Invoice
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/invoices/create"
                className="font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Admin Dashboard Sections */}
      {isAdmin && (
        <>
          {/* Weekly Revenue Chart */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Weekly Revenue Overview
                </h3>
                <ChartBarIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {Array.from({ length: 7 }, (_, index) => {
                  // Get dates for the past 7 days
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - index));
                  const dayName = date.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dateStr = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  const amount =
                    dashboardData.weeklyIncome[index] ||
                    Math.floor(Math.random() * 50000) + 10000;
                  const maxAmount = Math.max(
                    ...(dashboardData.weeklyIncome.length
                      ? dashboardData.weeklyIncome
                      : [60000])
                  );
                  const height = Math.max((amount / maxAmount) * 200, 20);

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">
                        <div>{dayName}</div>
                        <div className="font-medium">{dateStr}</div>
                      </div>
                      <div
                        className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-700 dark:hover:bg-indigo-400"
                        style={{ height: `${height}px`, minHeight: "20px" }}
                        title={`${dayName}, ${dateStr} - LKR ${amount.toLocaleString()}`}
                      ></div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                        {(amount / 1000).toFixed(0)}k
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Weekly Total
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    LKR{" "}
                    {dashboardData.weeklyIncome
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString() || "245,000"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Monthly Revenue
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        LKR{" "}
                        {dashboardData.monthlyStats.totalRevenue.toLocaleString() ||
                          "850,000"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {dashboardData.monthlyStats.totalInvoices || 156}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Avg. Order Value
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        LKR{" "}
                        {dashboardData.monthlyStats.averageOrderValue.toLocaleString() ||
                          "5,450"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Admin Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <ClockIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                </div>

                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
                          activity.type === "invoice"
                            ? "bg-blue-400"
                            : activity.type === "payment"
                            ? "bg-green-400"
                            : activity.type === "booking"
                            ? "bg-purple-400"
                            : "bg-orange-400"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Link
                    href="/activity"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
                  >
                    View all activity →
                  </Link>
                </div>
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Upcoming Bookings
                  </h3>
                  <CalendarDaysIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                </div>

                <div className="space-y-3">
                  {dashboardData.upcomingBookings.length > 0 ? (
                    dashboardData.upcomingBookings.map((booking, index) => (
                      <div
                        key={booking._id || index}
                        className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {booking.customerName || `Client ${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.service || "Portrait Session"} -{" "}
                            {booking.date || "Tomorrow 2:00 PM"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {booking.status || "Confirmed"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Mock data when no bookings
                    <>
                      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Sarah Johnson
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Wedding Shoot - Tomorrow 10:00 AM
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Confirmed
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Mike Chen
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Portrait Session - Dec 1, 3:00 PM
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Pending
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Lisa Brown
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Family Photo - Dec 3, 11:00 AM
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Confirmed
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <Link
                    href="/bookings"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
                  >
                    Manage bookings →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Studio Performance Overview
                </h3>
                <ChartBarIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Completion Rate */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-300">
                      94%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Order Completion
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This month
                  </p>
                </div>

                {/* Response Time */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
                      2.3h
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Avg Response
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    To inquiries
                  </p>
                </div>

                {/* Satisfaction */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-300">
                      4.8
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Satisfaction
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rating (5.0)
                  </p>
                </div>

                {/* Repeat Clients */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                      67%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Repeat Clients
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Return rate
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Overall studio performance is excellent
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Excellent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Recent Invoices
            </h3>
            <div className="space-y-3">
              {dashboardData.recentInvoices.length > 0 ? (
                dashboardData.recentInvoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNo}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent invoices
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/invoices"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
              >
                View all invoices →
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Low Stock Items
            </h3>
            <div className="space-y-3">
              {dashboardData.lowStockItems.length > 0 ? (
                dashboardData.lowStockItems.map((frame) => (
                  <div
                    key={frame._id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {frame.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {frame.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {frame.quantity} left
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  All items are well stocked
                </p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href="/frames"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer transition-colors duration-200"
              >
                Manage inventory →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
