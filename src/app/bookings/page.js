"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import Layout from "../components/Layout";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerMobile: "",
    appointmentDate: "",
    appointmentTime: "",
    serviceType: "portrait",
    duration: 60,
    notes: "",
    status: "confirmed",
  });

  useEffect(() => {
    fetchBookings();
    fetchCustomers();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingBooking
        ? `/api/bookings/${editingBooking._id}`
        : "/api/bookings";
      const method = editingBooking ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchBookings();
        handleCloseForm();
        alert(
          editingBooking
            ? "Booking updated successfully!"
            : "Booking created successfully!"
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save booking");
      }
    } catch (error) {
      console.error("Save booking error:", error);
      alert("Failed to save booking");
    }
  };

  const handleEdit = (booking) => {
    setFormData({
      customerId: booking.customer?._id || "",
      customerName: booking.customerName,
      customerMobile: booking.customerMobile,
      appointmentDate: new Date(booking.appointmentDate)
        .toISOString()
        .split("T")[0],
      appointmentTime: booking.appointmentTime,
      serviceType: booking.serviceType,
      duration: booking.duration,
      notes: booking.notes || "",
      status: booking.status,
    });
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleDelete = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBookings();
        alert("Booking deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete booking");
      }
    } catch (error) {
      console.error("Delete booking error:", error);
      alert("Failed to delete booking");
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchBookings();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Update booking error:", error);
      alert("Failed to update booking status");
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerMobile: customer.mobile,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerMobile: "",
      }));
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBooking(null);
    setFormData({
      customerId: "",
      customerName: "",
      customerMobile: "",
      appointmentDate: "",
      appointmentTime: "",
      serviceType: "portrait",
      duration: 60,
      notes: "",
      status: "confirmed",
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerMobile.includes(searchTerm) ||
      booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;

    const matchesDate =
      !filterDate ||
      new Date(booking.appointmentDate).toISOString().split("T")[0] ===
        filterDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bookings
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage photography session appointments
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Booking
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />

              <div className="flex justify-end">
                <span className="text-sm text-gray-600 self-center">
                  {filteredBookings.length} booking(s) found
                </span>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No bookings found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-500"
              >
                Create your first booking
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <li key={booking._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <UserIcon className="h-10 w-10 text-gray-400" />
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {booking.customerName}
                              </p>
                              <span
                                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  booking.status
                                )}`}
                              >
                                {booking.status}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(booking.appointmentDate)}
                              <ClockIcon className="h-4 w-4 ml-4 mr-1" />
                              {booking.appointmentTime}
                              <span className="ml-4">•</span>
                              <span className="ml-1 capitalize">
                                {booking.serviceType}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={booking.status}
                            onChange={(e) =>
                              handleStatusChange(booking._id, e.target.value)
                            }
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleEdit(booking)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <strong>Mobile:</strong> {booking.customerMobile}
                        </p>
                        <p>
                          <strong>Duration:</strong> {booking.duration} minutes
                        </p>
                        {booking.notes && (
                          <p>
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-600 w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {editingBooking ? "Edit Booking" : "New Booking"}
                  </h3>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer
                      </label>
                      <select
                        value={formData.customerId}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">
                          Select existing customer or enter new details below
                        </option>
                        {customers.map((customer) => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name} - {customer.mobile}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        value={formData.customerMobile}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customerMobile: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Date *
                      </label>
                      <input
                        type="date"
                        value={formData.appointmentDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            appointmentDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Time *
                      </label>
                      <input
                        type="time"
                        value={formData.appointmentTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            appointmentTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Type *
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            serviceType: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="portrait">Portrait Session</option>
                        <option value="wedding">Wedding Photography</option>
                        <option value="event">Event Photography</option>
                        <option value="family">Family Portraits</option>
                        <option value="commercial">Commercial Shoot</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <select
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duration: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
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
                      placeholder="Special requirements, preferences, etc..."
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
                      {editingBooking ? "Update Booking" : "Create Booking"}
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
