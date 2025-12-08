"use client";
import Layout from "../components/Layout";
import Image from "next/image";
import {
  CodeBracketIcon,
  CameraIcon,
  ShieldCheckIcon,
  CloudIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CubeIcon,
  CalendarIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

export default function AboutPage() {
  const features = [
    {
      icon: DocumentTextIcon,
      title: "Invoice Management",
      description:
        "Create, manage, and track invoices with ease. Generate professional PDF invoices instantly.",
    },
    {
      icon: UserGroupIcon,
      title: "Customer Management",
      description:
        "Maintain detailed customer records with transaction history and contact information.",
    },
    {
      icon: CubeIcon,
      title: "Inventory Control",
      description:
        "Track frame stocks, manage pricing, and monitor stock levels in real-time.",
    },
    {
      icon: CalendarIcon,
      title: "Booking System",
      description:
        "Schedule and manage photography sessions with integrated calendar system.",
    },
    {
      icon: ChartBarIcon,
      title: "Reports & Analytics",
      description:
        "Comprehensive business insights with revenue tracking and performance metrics.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Role-Based Access",
      description:
        "Secure authentication with admin and staff roles for controlled access.",
    },
  ];

  const techStack = [
    { name: "Next.js 16", description: "React framework with App Router" },
    { name: "MongoDB", description: "NoSQL database with Mongoose ODM" },
    { name: "Tailwind CSS", description: "Utility-first CSS framework" },
    { name: "JWT Auth", description: "Secure token-based authentication" },
    { name: "React Hooks", description: "Modern state management" },
    { name: "Heroicons", description: "Beautiful SVG icons" },
  ];

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <CameraIcon className="h-16 w-16 text-indigo-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Support & About the POS System
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A comprehensive Point of Sale system designed specifically for
              photography studios to manage their business operations
              efficiently.
            </p>
            <div className="mt-4 flex justify-center items-center space-x-2 text-gray-400">
              <span className="px-3 py-1 bg-indigo-900 rounded-full text-sm">
                Version 1.2.0.6
              </span>
              <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                2025
              </span>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <feature.icon className="h-10 w-10 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <div className="mb-16 bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-6">
              <CodeBracketIcon className="h-8 w-8 text-indigo-500 mr-3" />
              <h2 className="text-2xl font-bold text-white">
                Built With Modern Technology
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <h3 className="text-white font-semibold mb-1">{tech.name}</h3>
                  <p className="text-gray-400 text-xs">{tech.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About Developer */}
          <div className="bg-linear-to-r from-indigo-900 to-purple-900 p-8 rounded-lg shadow-xl mb-16">
            <div className="flex items-center mb-6">
              <HeartIcon className="h-8 w-8 text-red-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">
                About the Developer
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Developer Photo */}
              <div className="flex justify-center items-start">
                <div className="relative">
                  <Image
                    src="/malinda.jpg"
                    alt="Malinda Prabath"
                    width={300}
                    height={300}
                    className="rounded-lg shadow-2xl object-cover border-4 border-indigo-400"
                    priority
                  />
                  <div className="absolute -bottom-4 -right-4 bg-indigo-600 rounded-full p-3 shadow-lg">
                    <CodeBracketIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Developer Info */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Malinda Prabath
                </h3>
                <p className="text-gray-200 mb-4 leading-relaxed">
                  Full-stack developer passionate about creating efficient and
                  user-friendly business solutions. Specialized in modern web
                  technologies and database management systems.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-200">
                    <EnvelopeIcon className="h-5 w-5 mr-2 text-indigo-300" />
                    <span className="text-sm">malindaprabath876@gmail.com</span>
                  </div>
                  <div className="flex items-center text-gray-200">
                    <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-indigo-300" />
                    <span className="text-sm">+94 76 220 6157</span>
                  </div>
                  <div className="flex items-center text-gray-200">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-indigo-300" />
                    <span className="text-sm">Sri Lanka</span>
                  </div>
                </div>
              </div>

              {/* Expertise */}
              <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React.js",
                    "Next.js",
                    "Node.js",
                    "MongoDB",
                    "JavaScript",
                    "TypeScript",
                    "Tailwind CSS",
                    "REST APIs",
                    "Authentication",
                    "Database Design",
                  ].map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-700 text-white text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <CloudIcon className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Cloud Ready
              </h3>
              <p className="text-gray-400 text-sm">
                Designed to work seamlessly with cloud database services
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <DevicePhoneMobileIcon className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Responsive Design
              </h3>
              <p className="text-gray-400 text-sm">
                Works perfectly on desktop, tablet, and mobile devices
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <ShieldCheckIcon className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-400 text-sm">
                Built with security best practices and data protection
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">
              Need Support or Customization?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              For technical support, feature requests, or custom development
              services, feel free to reach out. I&apos;m here to help make your
              photography business more efficient.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="mailto:malindaprabath876@gmail.com"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center transition-colors"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Contact Developer
              </a>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-500 text-sm">
                © 2025 Shine Art Studio POS System. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Developed with ❤️ by Malinda Prabath
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
