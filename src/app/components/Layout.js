import { useState } from "react";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  DocumentTextIcon,
  CubeIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  UserIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "New Transaction", href: "/invoices/create", icon: DocumentTextIcon },
  { name: "Invoices", href: "/invoices", icon: DocumentTextIcon },
  { name: "Categories", href: "/categories", icon: TagIcon },
  { name: "Inventory", href: "/frames", icon: CubeIcon },
  { name: "Bookings", href: "/bookings", icon: CalendarIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
];

const adminNavigation = [
  { name: "Reports", href: "/reports", icon: ChartBarIcon },
  { name: "Users", href: "/users", icon: UserGroupIcon },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <div>{children}</div>;
  }

  const isAdmin = user.role === "admin";
  const allNavigation = isAdmin
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-700 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-indigo-700 dark:bg-indigo-800 transition ease-in-out duration-300 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white cursor-pointer hover:bg-indigo-600"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="shrink-0 flex items-center px-4">
              <h1 className="text-white text-lg font-bold">Studio POS</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {allNavigation.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md cursor-pointer transition-colors duration-200 ${
                      isActive
                        ? "bg-indigo-800 text-white"
                        : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-4 h-6 w-6 text-indigo-300" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="shrink-0 w-14" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-indigo-700 dark:bg-indigo-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center shrink-0 px-4">
                <h1 className="text-white text-xl font-bold">Studio POS</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {allNavigation.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 ${
                        isActive
                          ? "bg-indigo-800 text-white"
                          : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      <item.icon className="mr-3 h-6 w-6 text-indigo-300" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Welcome, {user.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                {isAdmin ? "Admin" : "Staff"}
              </span>
              <button
                onClick={logout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
