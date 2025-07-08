// components/Footer.tsx

"use client";

import Image from "next/image"; // Import the Next.js Image component
import Link from "next/link";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
                  href="/pricing"
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
                <Link
                  href="/legal/terms"
                  className="text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-base text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social and Branding */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-icon.svg" // Assumes logo.svg is in the /public directory
                alt="Insights Crucible Logo"
                width={40} // Adjust width as needed
                height={40} // Adjust height as needed
                className="h-16 w-auto" // Example sizing
              />
              <span className="sr-only">Insights Crucible</span>
            </Link>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Transforming content into actionable insights.
            </p>
            <div className="flex space-x-5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-500"
              >
                <span className="sr-only">Twitter</span>
                <FaXTwitter className="h-6 w-6" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="sr-only">GitHub</span>
                <FaGithub className="h-6 w-6" />
              </a>
              <a
                href="https://linkedin.com"
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
            &copy; {currentYear} Insights Crucible. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
