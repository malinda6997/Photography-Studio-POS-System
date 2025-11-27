"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  // Test if JavaScript is working
  console.log("🎯 SignIn component loaded!", new Date().toLocaleTimeString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Form submitted!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password ? "***provided***" : "empty");

    setLoading(true);
    setError("");

    try {
      console.log("🔄 Calling login function...");
      const result = await login(email, password);
      console.log("📋 Login result:", result);

      if (result && result.success) {
        console.log("✅ Login successful, redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        console.log("❌ Login failed:", result?.error);
        setError(result?.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto text-center">
            <h1 className="text-3xl font-bold text-indigo-600">
              Shine Art Studio
            </h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-600 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-600 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:opacity-75"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Quick fill buttons for testing */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@shine.com");
                setPassword("admin123");
              }}
              className="flex-1 py-1 px-2 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200"
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("staff@shine.com");
                setPassword("staff123");
              }}
              className="flex-1 py-1 px-2 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200"
            >
              Fill Staff
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              onClick={() =>
                console.log(
                  "🔘 Button clicked! Email:",
                  email,
                  "Password:",
                  password ? "provided" : "empty"
                )
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo Credentials:</p>
            <p>
              <strong>Admin:</strong> admin@shine.com / admin123
            </p>
            <p>
              <strong>Staff:</strong> staff@shine.com / staff123
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  console.log("Attempting to seed users...");
                  const response = await fetch("/api/seed/users", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });

                  console.log("Response status:", response.status);
                  console.log("Response headers:", response.headers);

                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Error response:", errorText);
                    alert(
                      "Failed to seed users. Check console for details. Status: " +
                        response.status
                    );
                    return;
                  }

                  const data = await response.json();
                  console.log("Success response:", data);
                  alert(data.message || "Users seeded successfully!");
                } catch (error) {
                  console.error("Fetch error:", error);
                  alert(
                    "Failed to seed users: " +
                      error.message +
                      ". Check console for details."
                  );
                }
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500 underline cursor-pointer"
            >
              First time? Click here to create demo users
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
