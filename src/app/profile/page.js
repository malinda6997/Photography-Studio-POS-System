"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../../components/ui/toast";
import Layout from "../components/Layout";
import {
  UserCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function Profile() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // Track if we're in the middle of an update to prevent form data override
  const [isUpdating, setIsUpdating] = useState(false);

  // Debug profileData changes
  useEffect(() => {
    console.log("ProfileData state changed:", profileData);
  }, [profileData]);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data initially and sync when not updating
  useEffect(() => {
    if (user && !isUpdating) {
      console.log("Profile page - Syncing user data to form:", {
        userName: user.name,
        userEmail: user.email,
        currentFormName: profileData.name,
        currentFormEmail: profileData.email,
        isUpdating,
      });
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, isUpdating]);

  // Force dark mode on load
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    console.log("Attempting to update profile:", {
      name: profileData.name,
      email: profileData.email,
    });

    try {
      setLoading(true);
      setIsUpdating(true);

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
        }),
      });

      console.log("Profile update response status:", response.status);

      const data = await response.json();
      console.log("Profile update response data:", data);

      if (response.ok) {
        toast.success("Profile updated successfully!");
        console.log("Profile update successful, refreshing user context...");

        // Refresh user context to get updated data from database
        await refreshUser();
        console.log("User context refreshed, allowing form sync in 100ms...");

        // Allow a brief moment for the user context to update, then allow form sync
        setTimeout(() => {
          console.log("Enabling form sync after successful update");
          setIsUpdating(false);
        }, 200);
      } else {
        toast.error(
          data.error || `Failed to update profile (${response.status})`
        );
        setIsUpdating(false);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(`Failed to update profile: ${error.message}`);
      setIsUpdating(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-900/20 border border-green-800 text-green-300"
                : "bg-red-900/20 border border-red-800 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Profile Avatar
              </h2>

              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                  <UserCircleIcon className="w-20 h-20 text-white" />
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-white">
                    {profileData.name || user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {profileData.email || user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information and Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Profile Information
              </h2>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                    {user && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Current in DB: "{user.name}")
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">
                Change Password
              </h2>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-700 text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
