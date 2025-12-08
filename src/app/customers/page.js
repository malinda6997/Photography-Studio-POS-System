"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../../components/ui/toast";
import { useConfirm } from "../../components/ui/confirm";
import Layout from "../components/Layout";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function CustomersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (user?.role !== "admin") {
      toast.error("Access denied. Admin only.");
      window.location.href = "/dashboard";
      return;
    }
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTransactions = async (customerId) => {
    try {
      setLoadingTransactions(true);
      const response = await fetch(
        `/api/customers/${customerId}/transactions`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCustomerTransactions(data);
      } else {
        toast.error("Failed to fetch customer transactions");
      }
    } catch (error) {
      console.error("Fetch transactions error:", error);
      toast.error("Failed to fetch customer transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer._id}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingCustomer
            ? "Customer updated successfully!"
            : "Customer created successfully!"
        );
        await fetchCustomers();
        handleCloseForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save customer");
      }
    } catch (error) {
      console.error("Save customer error:", error);
      toast.error("Failed to save customer");
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customerId, customerName) => {
    const confirmed = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete customer "${customerName}"? This will also affect their transaction history. This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          toast.success(`Customer "${customerName}" deleted successfully`);
          await fetchCustomers();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to delete customer");
        }
      } catch (error) {
        console.error("Delete customer error:", error);
        toast.error("Failed to delete customer");
      }
    }
  };

  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    await fetchCustomerTransactions(customer._id);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({
      name: "",
      mobile: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedCustomer(null);
    setCustomerTransactions([]);
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.mobile.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">
                Customer Management
              </h1>
              <p className="mt-2 text-sm text-gray-300">
                View and manage all customers and their transaction history
                (Admin Only)
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, mobile, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
              />
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {filteredCustomers.length} customer(s) found
            </div>
          </div>

          {/* Customers Table */}
          <div className="mt-8 bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-300">Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">
                    No customers found
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    {searchTerm
                      ? "Try adjusting your search"
                      : "Get started by adding a new customer"}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                      >
                        <PlusIcon className="h-4 w-4 mr-2 inline" />
                        Add Customer
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Stats
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer._id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {customer.name}
                            </div>
                            {customer.notes && (
                              <div className="text-xs text-gray-400 mt-1">
                                {customer.notes.substring(0, 50)}
                                {customer.notes.length > 50 && "..."}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-300">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {customer.mobile}
                            </div>
                            {customer.email && (
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                {customer.email}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {customer.address ? (
                              <div className="flex items-start text-sm text-gray-300 max-w-xs">
                                <MapPinIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">
                                  {customer.address}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">
                                No address
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              <div className="flex items-center">
                                <DocumentTextIcon className="h-4 w-4 mr-1" />
                                {customer.metadata?.totalInvoices || 0}{" "}
                                invoice(s)
                              </div>
                              <div className="flex items-center mt-1 text-indigo-400">
                                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                LKR{" "}
                                {(
                                  customer.metadata?.totalSpent || 0
                                ).toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(customer)}
                              className="text-indigo-400 hover:text-indigo-300 mr-3"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5 inline" />
                            </button>
                            <button
                              onClick={() => handleEdit(customer)}
                              className="text-blue-400 hover:text-blue-300 mr-3"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5 inline" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(customer._id, customer.name)
                              }
                              className="text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      placeholder="0771234567"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="customer@example.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="123 Main St, City, Country"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="Additional notes about the customer..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingCustomer ? "Update Customer" : "Create Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-gray-800 mb-10">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCustomer.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-gray-300">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {selectedCustomer.mobile}
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center text-gray-300">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        {selectedCustomer.email}
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start text-gray-300">
                        <MapPinIcon className="h-4 w-4 mr-2 mt-0.5" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Total Invoices</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {selectedCustomer.metadata?.totalInvoices || 0}
                  </div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Total Spent</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">
                    LKR{" "}
                    {(
                      selectedCustomer.metadata?.totalSpent || 0
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Member Since</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Transaction History
                </h4>
                {loadingTransactions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-2 text-gray-400">
                      Loading transactions...
                    </p>
                  </div>
                ) : customerTransactions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-700 rounded-lg">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-400">
                      No transactions found for this customer
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-600">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                            Invoice #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                            Items
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-600">
                        {customerTransactions.map((invoice) => (
                          <tr key={invoice._id} className="hover:bg-gray-700">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {invoice.items?.length || 0} item(s)
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-400 font-semibold">
                              LKR {invoice.total?.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  invoice.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : invoice.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {invoice.status || "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedCustomer.notes && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Notes
                  </h4>
                  <div className="bg-gray-700 p-4 rounded-lg text-gray-300">
                    {selectedCustomer.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
