// components/Footer.tsx

"use client";

import { PRIVACY_POLICY_JSON } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import React, { useState, useEffect } from "react"; // Import useEffect
import PrivacyPolicyModal from "./PrivacyPolicyModel";
import TermsOfServiceModal from "./TermsOfServiceModal";

const Footer = () => {
  // Initialize currentYear as null or an empty string for SSR
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  // Use useEffect to set the year only after the component mounts on the client
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []); // Empty dependency array means this runs once on mount

  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsOfServiceOpen, setIsTermsOfServiceOpen] = useState(false);

  const handleOpenPrivacyPolicy = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPrivacyPolicyOpen(true);
  };

  const handleClosePrivacyPolicy = () => {
    setIsPrivacyPolicyOpen(false);
  };

  const handleOpenTermsOfService = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsOfServiceOpen(true);
  };

  const handleCloseTermsOfService = () => {
    setIsTermsOfServiceOpen(false);
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#pricing"
                  className="text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/engine"
                  className="text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Launch Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact-us"
                  className="text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help-center"
                  className="text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  onClick={handleOpenTermsOfService}
                  className="cursor-pointer text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={handleOpenPrivacyPolicy}
                  className="cursor-pointer text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social and Branding */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-icon.svg"
                alt="Insights Crucible Logo"
                width={40}
                height={40}
                className="h-16 w-auto"
              />
              <span className="sr-only">Insights Crucible</span>
            </Link>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Transform Content into Actionable Intelligence.
            </p>
            <div className="flex space-x-5">
              <a
                href="https://x.com/ICrucibleHQ" // Example new Twitter handle
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-500"
              >
                <span className="sr-only">Twitter</span>
                <FaXTwitter className="h-6 w-6" />
              </a>

              <a
                href="https://github.com/7nguyennguyen3/insights-crucible"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="sr-only">GitHub</span>
                <FaGithub className="h-6 w-6" />
              </a>

              <a
                href="https://www.linkedin.com/company/insights-crucible"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-700 dark:hover:text-blue-600"
              >
                <span className="sr-only">LinkedIn</span>
                <FaLinkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-base text-slate-500 dark:text-slate-400 text-center">
            &copy; {currentYear ? currentYear : ""} Insights Crucible. All
            rights reserved.
            {/* Added a conditional render for currentYear */}
          </p>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={handleClosePrivacyPolicy}
      />

      {/* Terms of Service Modal */}
      <TermsOfServiceModal
        isOpen={isTermsOfServiceOpen}
        onClose={handleCloseTermsOfService}
      />
    </footer>
  );
};

export default Footer;
