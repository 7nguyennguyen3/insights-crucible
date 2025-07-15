// components/PrivacyPolicyModal.tsx
import React from "react";
import { PRIVACY_POLICY_JSON } from "@/lib/data";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const policy = PRIVACY_POLICY_JSON.privacyPolicy;

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
            {policy.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Effective Date: {policy.effectiveDate}
          </p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300">
            {/* Introduction */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.introduction.heading}
              </h3>
              <p className="text-sm">{policy.introduction.content}</p>
            </div>

            {/* Information We Collect */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.informationWeCollect.heading}
              </h3>
              <p className="text-sm mb-4">
                {policy.informationWeCollect.description}
              </p>
              {policy.informationWeCollect.sections.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-base mb-2">
                    {section.type}
                  </h4>
                  {section.description && (
                    <p className="text-sm mb-2">{section.description}</p>
                  )}
                  <ul className="list-disc pl-5 space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {item.title}:
                        </strong>{" "}
                        <span className="text-sm">{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* How We Use Your Information */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.howWeUseYourInformation.heading}
              </h3>
              <p className="text-sm mb-4">
                {policy.howWeUseYourInformation.description}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {policy.howWeUseYourInformation.purposes.map(
                  (purpose, index) => (
                    <li key={index}>{purpose}</li>
                  )
                )}
              </ul>
            </div>

            {/* How and Why We Share Your Information */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.howAndWhyWeShareYourInformation.heading}
              </h3>
              <p className="text-sm mb-4">
                {policy.howAndWhyWeShareYourInformation.description}
              </p>
              <h4 className="font-semibold text-base mb-2">
                Our primary Sub-processors include:
              </h4>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                      >
                        Provider
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                      >
                        Service
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                      >
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {policy.howAndWhyWeShareYourInformation.subProcessors.map(
                      (processor, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {processor.provider}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {processor.service}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                            {processor.purpose}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              <h4 className="font-semibold text-base mb-2">
                We may also share information:
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {policy.howAndWhyWeShareYourInformation.otherSharing.map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ul>
            </div>

            {/* Processing and Retention of Your Customer Data */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.processingAndRetentionOfYourCustomerData.heading}
              </h3>
              <p className="text-sm mb-4">
                {policy.processingAndRetentionOfYourCustomerData.policy}
              </p>
              <ul className="space-y-4">
                {policy.processingAndRetentionOfYourCustomerData.sections.map(
                  (section, index) => (
                    <li key={index}>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {section.title}:
                      </strong>{" "}
                      <span className="text-sm">{section.description}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Your Data Rights and Choices */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.yourDataRightsAndChoices.heading}
              </h3>
              <p className="text-sm mb-4">
                {policy.yourDataRightsAndChoices.description}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {policy.yourDataRightsAndChoices.rights.map((right, index) => (
                  <li key={index}>{right}</li>
                ))}
              </ul>
              <p className="text-sm mt-4">
                {policy.yourDataRightsAndChoices.contactForRights}
              </p>
            </div>

            {/* International Data Transfers */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.internationalDataTransfers.heading}
              </h3>
              <p className="text-sm">
                {policy.internationalDataTransfers.content}
              </p>
            </div>

            {/* Children's Privacy */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.childrensPrivacy.heading}
              </h3>
              <p className="text-sm">{policy.childrensPrivacy.content}</p>
            </div>

            {/* Changes to This Privacy Policy */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.changesToThisPrivacyPolicy.heading}
              </h3>
              <p className="text-sm">
                {policy.changesToThisPrivacyPolicy.content}
              </p>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {policy.contactUs.heading}
              </h3>
              <p className="text-sm mb-2">{policy.contactUs.description}</p>
              <ul className="space-y-1 text-sm">
                <li>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${policy.contactUs.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {policy.contactUs.email}
                  </a>
                </li>
                <li>
                  <strong>Company:</strong> {policy.contactUs.company}
                </li>
                <li>
                  <strong>Address:</strong>
                  <div>{policy.contactUs.address}</div>
                  <div>
                    {policy.contactUs.city}, {policy.contactUs.state},{" "}
                    {policy.contactUs.zipCode}
                  </div>
                  <div>{policy.contactUs.country}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
