// components/TermsOfServiceModal.tsx
import React from "react";
import { TERMS_OF_SERVICE_JSON } from "@/lib/data";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const terms = TERMS_OF_SERVICE_JSON.termsOfService;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {terms.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Effective Date: {terms.effectiveDate}
          </p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300">
            {/* Introduction */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.introduction.heading}
              </h3>
              <p className="text-sm">{terms.introduction.content}</p>
            </div>

            {/* Service Description */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.serviceDescription.heading}
              </h3>
              <p className="text-sm mb-4">{terms.serviceDescription.content}</p>
              <ul className="list-disc pl-5 space-y-2">
                {terms.serviceDescription.features.map((feature, index) => (
                  <li key={index} className="text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Acceptance of Terms */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.acceptanceOfTerms.heading}
              </h3>
              <p className="text-sm">{terms.acceptanceOfTerms.content}</p>
            </div>

            {/* Eligibility */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.eligibility.heading}
              </h3>
              <p className="text-sm">{terms.eligibility.content}</p>
            </div>

            {/* User Accounts */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.userAccounts.heading}
              </h3>
              <p className="text-sm mb-4">{terms.userAccounts.content}</p>
              <ul className="list-disc pl-5 space-y-2">
                {terms.userAccounts.responsibilities.map((responsibility, index) => (
                  <li key={index} className="text-sm">
                    {responsibility}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Terms */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.paymentTerms.heading}
              </h3>

              {/* Credit System */}
              <div className="mb-4">
                <h4 className="font-semibold text-base mb-2">
                  {terms.paymentTerms.creditSystem.title}
                </h4>
                <p className="text-sm mb-3">{terms.paymentTerms.creditSystem.description}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {terms.paymentTerms.creditSystem.packages.map((pkg, index) => (
                    <li key={index} className="text-sm">
                      <strong>{pkg.name}:</strong> {pkg.credits} credits for ${pkg.price}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Processing */}
              <div className="mb-4">
                <h4 className="font-semibold text-base mb-2">
                  {terms.paymentTerms.paymentProcessing.title}
                </h4>
                <p className="text-sm">{terms.paymentTerms.paymentProcessing.description}</p>
              </div>

              {/* Credits and Refunds */}
              <div className="mb-4">
                <h4 className="font-semibold text-base mb-2">
                  {terms.paymentTerms.creditsAndRefunds.title}
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {terms.paymentTerms.creditsAndRefunds.terms.map((term, index) => (
                    <li key={index} className="text-sm">
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Acceptable Use */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.acceptableUse.heading}
              </h3>
              <p className="text-sm mb-4">{terms.acceptableUse.description}</p>
              <ul className="list-disc pl-5 space-y-2">
                {terms.acceptableUse.prohibitedActivities.map((activity, index) => (
                  <li key={index} className="text-sm">
                    {activity}
                  </li>
                ))}
              </ul>
            </div>

            {/* Intellectual Property */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.intellectualProperty.heading}
              </h3>
              {terms.intellectualProperty.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-base mb-2">
                    {section.title}
                  </h4>
                  <p className="text-sm">{section.description}</p>
                </div>
              ))}
            </div>

            {/* Data Processing */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.dataProcessing.heading}
              </h3>
              <p className="text-sm">{terms.dataProcessing.content}</p>
            </div>

            {/* Third-Party Services */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.thirdPartyServices.heading}
              </h3>
              <p className="text-sm mb-4">{terms.thirdPartyServices.description}</p>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Services
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {terms.thirdPartyServices.providers.map((provider, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {provider.name}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                          {provider.services}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                          {provider.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {terms.thirdPartyServices.disclaimer}
              </p>
            </div>

            {/* Service Availability */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.serviceAvailability.heading}
              </h3>
              {terms.serviceAvailability.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-base mb-2">
                    {section.title}
                  </h4>
                  <p className="text-sm">{section.description}</p>
                </div>
              ))}
            </div>

            {/* User-Generated Content */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.userGeneratedContent.heading}
              </h3>
              <p className="text-sm">{terms.userGeneratedContent.content}</p>
            </div>

            {/* Termination */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.termination.heading}
              </h3>
              {terms.termination.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-base mb-2">
                    {section.title}
                  </h4>
                  <p className="text-sm">{section.description}</p>
                </div>
              ))}
            </div>

            {/* Disclaimers */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.disclaimers.heading}
              </h3>
              <p className="text-sm mb-4">{terms.disclaimers.content}</p>
              <p className="text-sm">{terms.disclaimers.additionalDisclaimer}</p>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.limitationOfLiability.heading}
              </h3>
              <p className="text-sm mb-4">{terms.limitationOfLiability.content}</p>
              <p className="text-sm">{terms.limitationOfLiability.damagesCap}</p>
            </div>

            {/* Indemnification */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.indemnification.heading}
              </h3>
              <p className="text-sm mb-4">{terms.indemnification.description}</p>
              <ul className="list-disc pl-5 space-y-1">
                {terms.indemnification.scenarios.map((scenario, index) => (
                  <li key={index} className="text-sm">
                    {scenario}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dispute Resolution */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.disputeResolution.heading}
              </h3>
              {terms.disputeResolution.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-base mb-2">
                    {section.title}
                  </h4>
                  <p className="text-sm">{section.description}</p>
                </div>
              ))}
            </div>

            {/* General Provisions */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.generalProvisions.heading}
              </h3>
              {terms.generalProvisions.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-base mb-2">
                    {section.title}
                  </h4>
                  <p className="text-sm">{section.description}</p>
                </div>
              ))}
            </div>

            {/* Changes to Terms */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.changesToTerms.heading}
              </h3>
              <p className="text-sm">{terms.changesToTerms.content}</p>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {terms.contactUs.heading}
              </h3>
              <p className="text-sm mb-2">{terms.contactUs.description}</p>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${terms.contactUs.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {terms.contactUs.email}
                  </a>
                </li>
                <li>
                  <strong>Company:</strong> {terms.contactUs.company}
                </li>
                <li>
                  <strong>Address:</strong>
                  <div>{terms.contactUs.address}</div>
                  <div>
                    {terms.contactUs.city}, {terms.contactUs.state},{" "}
                    {terms.contactUs.zipCode}
                  </div>
                  <div>{terms.contactUs.country}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;