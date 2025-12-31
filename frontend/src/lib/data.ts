export const TERMS_OF_SERVICE_JSON = {
  termsOfService: {
    title: "Terms of Service for Insights Crucible",
    effectiveDate: "January 22, 2025",
    introduction: {
      heading: "Introduction",
      content:
        'Welcome to Insights Crucible ("we," "us," or "our"). These Terms of Service ("Terms") govern your use of our website and services (collectively, the "Services") operated by Embercore LLC. By accessing or using our Services, you agree to be bound by these Terms.',
    },
    serviceDescription: {
      heading: "1. Service Description",
      content:
        "Insights Crucible is an AI-powered content analysis platform that processes audio, video, and text content to generate actionable insights, summaries, and analyses.",
      features: [
        "Audio and video file transcription",
        "AI-powered content analysis and insights generation",
        "Text processing and analysis",
        "Export capabilities (PDF, DOCX, Markdown)",
        "Public sharing functionality",
        "Analysis library and dashboard management",
      ],
    },
    acceptanceOfTerms: {
      heading: "2. Acceptance of Terms",
      content:
        "By creating an account or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our Services.",
    },
    eligibility: {
      heading: "3. Eligibility",
      content:
        "You must be at least 13 years old (or 16 in the European Economic Area) to use our Services. By using our Services, you represent and warrant that you meet this age requirement and have the authority to enter into this agreement.",
    },
    userAccounts: {
      heading: "4. User Accounts and Registration",
      content:
        "To access certain features of our Services, you must create an account using Google Firebase Authentication. You are responsible for:",
      responsibilities: [
        "Providing accurate and complete account information",
        "Maintaining the confidentiality of your account credentials",
        "All activities that occur under your account",
        "Promptly notifying us of any unauthorized access to your account",
      ],
    },
    paymentTerms: {
      heading: "5. Payment Terms and Credits",
      creditSystem: {
        title: "A. Credit System",
        description:
          "Our Services operate on a credit-based system. Each analysis consumes one credit. We offer the following credit packages:",
        packages: [
          { name: "Starter Pack", credits: 30, price: 5 },
          { name: "Professional Pack", credits: "75 (60 + 15 bonus)", price: 10 },
          { name: "Ultimate Pack", credits: "170 (120 + 50 bonus)", price: 20 },
        ],
      },
      paymentProcessing: {
        title: "B. Payment Processing",
        description:
          "All payments are processed securely through Stripe. By making a purchase, you agree to Stripe's terms of service. We do not store your payment information.",
      },
      creditsAndRefunds: {
        title: "C. Credits and Refunds",
        terms: [
          "Credits never expire",
          "New users receive 30 free credits upon registration",
          "Refunds are available within 30 days of purchase, subject to our discretion",
          "Unused credits remain in your account indefinitely",
        ],
      },
    },
    acceptableUse: {
      heading: "6. Acceptable Use Policy",
      description: "You agree not to use our Services to:",
      prohibitedActivities: [
        "Upload content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable",
        "Violate any applicable laws or regulations",
        "Infringe upon the intellectual property rights of others",
        "Attempt to gain unauthorized access to our systems or other users' accounts",
        "Distribute malware, viruses, or other harmful code",
        "Use the Services for commercial purposes without authorization",
        "Reverse engineer, decompile, or attempt to derive source code from our Services",
      ],
    },
    intellectualProperty: {
      heading: "7. Content and Intellectual Property",
      sections: [
        {
          title: "A. Your Content",
          description:
            'You retain ownership of all content you upload to our Services ("Your Content"). By uploading content, you grant us a limited, non-exclusive license to process, analyze, and store your content solely to provide our Services.',
        },
        {
          title: "B. Our Intellectual Property",
          description:
            "Our Services, including all software, technology, designs, and content provided by us, are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on our Services without our express written consent.",
        },
        {
          title: "C. Third-Party Content",
          description:
            "Our Services may include content from third parties. We do not claim ownership of such content and respect the intellectual property rights of others.",
        },
      ],
    },
    dataProcessing: {
      heading: "8. Data Processing and Privacy",
      content:
        "Our collection, use, and processing of your information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our Services, you consent to our data practices as described in our Privacy Policy.",
    },
    thirdPartyServices: {
      heading: "9. Third-Party Services",
      description:
        "Our Services integrate with the following third-party providers:",
      providers: [
        {
          name: "Google",
          services: "Firebase Authentication, Storage, Gemini AI",
          purpose: "User authentication, file storage, and AI analysis",
        },
        {
          name: "Stripe",
          services: "Payment processing",
          purpose: "Secure payment processing",
        },
        {
          name: "AssemblyAI",
          services: "Audio and video transcription",
          purpose: "Transcription services",
        },
        {
          name: "Tavily AI",
          services: "Web search functionality",
          purpose: "Enhanced research capabilities (when enabled)",
        },
      ],
      disclaimer:
        "Your use of these integrated services is subject to their respective terms of service and privacy policies.",
    },
    serviceAvailability: {
      heading: "10. Service Availability and Modifications",
      sections: [
        {
          title: "A. Availability",
          description:
            "We strive to maintain high availability of our Services but do not guarantee uninterrupted access. We may experience downtime for maintenance, updates, or technical issues.",
        },
        {
          title: "B. Modifications",
          description:
            "We reserve the right to modify, suspend, or discontinue any aspect of our Services at any time, with or without notice. We will make reasonable efforts to notify users of significant changes.",
        },
      ],
    },
    userGeneratedContent: {
      heading: "11. User-Generated Content",
      content:
        "You are solely responsible for any content you upload, submit, or share through our Services. We do not pre-screen content but reserve the right to remove content that violates these Terms or applicable laws.",
    },
    termination: {
      heading: "12. Termination",
      sections: [
        {
          title: "A. Termination by You",
          description:
            "You may terminate your account at any time through your account settings. Upon termination, your account information and associated content will be permanently deleted.",
        },
        {
          title: "B. Termination by Us",
          description:
            "We may terminate or suspend your account immediately, without prior notice, if you breach these Terms or engage in prohibited activities.",
        },
        {
          title: "C. Effect of Termination",
          description:
            "Upon termination, your right to use our Services ceases immediately. Sections of these Terms that by their nature should survive termination will remain in effect.",
        },
      ],
    },
    disclaimers: {
      heading: "13. Disclaimers",
      content:
        'OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      additionalDisclaimer:
        "We do not warrant that our Services will be uninterrupted, error-free, or completely secure. The AI-generated content and analysis provided by our Services are for informational purposes only and should not be considered as professional advice.",
    },
    limitationOfLiability: {
      heading: "14. Limitation of Liability",
      content:
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL EMBERCORE LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF OUR SERVICES.",
      damagesCap:
        "IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, OR CAUSES OF ACTION EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO LIABILITY.",
    },
    indemnification: {
      heading: "15. Indemnification",
      description:
        "You agree to defend, indemnify, and hold harmless Embercore LLC and its affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from:",
      scenarios: [
        "Your use of our Services",
        "Your violation of these Terms",
        "Your violation of any third-party rights",
        "Any content you upload or share through our Services",
      ],
    },
    disputeResolution: {
      heading: "16. Dispute Resolution",
      sections: [
        {
          title: "A. Governing Law",
          description:
            "These Terms are governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.",
        },
        {
          title: "B. Jurisdiction",
          description:
            "Any legal action or proceeding arising under these Terms will be brought exclusively in the federal or state courts located in California, and you consent to the jurisdiction of such courts.",
        },
      ],
    },
    generalProvisions: {
      heading: "17. General Provisions",
      sections: [
        {
          title: "A. Entire Agreement",
          description:
            "These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding our Services.",
        },
        {
          title: "B. Severability",
          description:
            "If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.",
        },
        {
          title: "C. No Waiver",
          description:
            "Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.",
        },
        {
          title: "D. Assignment",
          description:
            "You may not assign or transfer your rights under these Terms without our written consent. We may assign our rights and obligations under these Terms without notice.",
        },
      ],
    },
    changesToTerms: {
      heading: "18. Changes to Terms",
      content:
        'We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on our website and updating the "Last Updated" date. Your continued use of our Services after such modifications constitutes acceptance of the updated Terms.',
    },
    contactUs: {
      heading: "19. Contact Information",
      description:
        "If you have any questions about these Terms of Service, please contact us at:",
      email: "jimmy@insightscrucible.com",
      company: "Embercore LLC",
      address: "1401 21st ST #5866",
      city: "Sacramento",
      state: "CA",
      zipCode: "95811",
      country: "United States",
    },
  },
};

export const PRIVACY_POLICY_JSON = {
  privacyPolicy: {
    title: "Privacy Policy for Insights Crucible",
    effectiveDate: "July 15, 2025",
    introduction: {
      heading: "1. Introduction",
      content:
        'Welcome to Insights Crucible ("we," "us," or "our"), operated by Embercore LLC. We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, process, and share your information when you use our website and services (collectively, the "Services"). This policy applies to all users of our Services. By using our Services, you agree to the collection and use of information in accordance with this policy.',
    },
    informationWeCollect: {
      heading: "2. Information We Collect",
      description:
        "We collect information in a few different ways to provide and improve our Services.",
      sections: [
        {
          type: "A. Information You Provide to Us",
          items: [
            {
              title: "Account Information",
              description:
                "When you register for an account, we collect your name and email address. We use Google Firebase Authentication for sign-up and login, which handles your authentication securely. We do not collect or store your password.",
            },
            {
              title: "Payment Information",
              description:
                "When you subscribe to a paid plan, we create a customer record in Stripe, our payment processor. We redirect you to Stripe's secure checkout page to complete the transaction. We do not collect, store, or have access to your full payment card details. We only store the Stripe Customer ID associated with your account for subscription management purposes.",
            },
          ],
        },
        {
          type: "B. Customer Data You Process Through Our Service",
          description:
            'This is the data you upload or submit for analysis. We are a "Data Processor" for this information.',
          items: [
            {
              title: "Transcripts and Text",
              description:
                "You may directly paste text transcripts into our Service for analysis.",
            },
            {
              title: "Audio and Video Files",
              description:
                "You may upload audio or video files (e.g., MP3, MP4) for transcription and analysis.",
            },
          ],
        },
        {
          type: "C. Information We Collect Automatically",
          items: [
            {
              title: "Cookies",
              description:
                "When you sign in, we place a persistent cookie in your browser to keep you logged in for your convenience. This cookie currently expires after seven (7) days. You can clear cookies through your browser settings at any time.",
            },
            {
              title: "Log Data",
              description:
                'Like most websites, our servers automatically record information ("Log Data") created by your use of the Services. This may include your IP address, browser type, operating system, and the date and time of your requests.',
            },
          ],
        },
      ],
    },
    howWeUseYourInformation: {
      heading: "3. How We Use Your Information",
      description:
        "We use the information we collect for the following purposes:",
      purposes: [
        "To Provide and Operate the Services: To authenticate you, operate your account, and provide the core analysis features of Insights Crucible.",
        "To Process Payments: To manage your subscription and process payments through our integration with Stripe.",
        "To Communicate With You: To send you service-related notifications, security alerts, billing information, and updates about our Services. You can opt-out of marketing communications.",
        "To Improve Our Services: To understand how users interact with our platform so we can enhance its functionality and user experience.",
        "For Security and Compliance: To protect the security of our Services and to comply with legal obligations.",
      ],
    },
    howAndWhyWeShareYourInformation: {
      heading: "4. How and Why We Share Your Information",
      description:
        'We are committed to your privacy. We do not sell your personal information or Customer Data. We only share information with third-party service providers ("Sub-processors") who help us operate our Services. These providers are contractually obligated to protect your data and are not permitted to use it for any other purpose.',
      subProcessors: [
        {
          provider: "Google",
          service:
            "Firebase Authentication, Firebase Storage, Gemini/Vertex AI",
          purpose:
            "For user authentication, temporary storage of uploaded files, and processing text data for analysis.",
        },
        {
          provider: "Stripe, Inc.",
          service: "Payment Processing",
          purpose: "To manage subscriptions and process payments securely.",
        },
        {
          provider: "AssemblyAI",
          service: "AI Speech-to-Text Transcription",
          purpose:
            "To transcribe audio and video files into text before analysis.",
        },
        {
          provider: "Tavily AI",
          service: "AI Research Agent & API",
          purpose:
            'To perform web searches and scraping for the "5 Angles Perspective" feature, only when you explicitly enable it.',
        },
      ],
      otherSharing: [
        "To Comply with Law: If we receive a legal request like a subpoena or court order, we may disclose information if we believe in good faith that the law requires us to do so.",
        "In a Business Transfer: If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in control.",
      ],
    },
    processingAndRetentionOfYourCustomerData: {
      heading: "5. Processing and Retention of Your Customer Data",
      policy:
        "We have a strict policy for handling the data you upload for analysis:",
      sections: [
        {
          title: "Audio/Video Files",
          description:
            "When you upload an audio or video file, it is temporarily stored in a secure Firebase Storage bucket. After the file has been processed by AssemblyAI for transcription and the analysis is complete, the original audio/video file is immediately and permanently deleted from our storage. This deletion occurs whether the analysis succeeds or fails.",
        },
        {
          title: "Transcripts and Analysis Results",
          description:
            "We retain the text transcript (either from your upload or from AssemblyAI) and the resulting analysis generated by our service. This data is stored securely and is accessible to you at any time through your dashboard. You have the right to delete any specific analysis result from your dashboard, which will permanently remove the associated transcript and analysis.",
        },
        {
          title: "Account Data",
          description:
            "We retain your account information (name, email) for as long as your account is active. If you delete your account, we will permanently delete this information in accordance with our data deletion cycle.",
        },
      ],
    },
    yourDataRightsAndChoices: {
      heading: "6. Your Data Rights and Choices (CCPA & GDPR)",
      description:
        "You have specific rights regarding your personal information. As a resident of California or a jurisdiction with similar privacy laws (like the EU's GDPR), you have the right to:",
      rights: [
        "Know and Access: Request a copy of the personal information we hold about you.",
        "Correct: Request that we correct any inaccurate or incomplete personal information.",
        "Delete: Request that we delete your personal information or specific analysis results.",
        "Opt-Out: You can opt-out of marketing communications at any time.",
        "Object to Processing: You have the right to object to our processing of your personal information.",
      ],
      contactForRights:
        "To exercise any of these rights, please contact us at jimmy@insightscrucible.com.",
    },
    internationalDataTransfers: {
      heading: "7. International Data Transfers",
      content:
        "Our services and our Sub-processors operate globally, which means your information may be transferred to, and maintained on, computers located outside of your state, province, or country where the data protection laws may differ. By using our Services, you consent to this transfer.",
    },
    childrensPrivacy: {
      heading: "8. Children's Privacy",
      content:
        "Our Services are not intended for or directed at individuals under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If we become aware that we have, we will take steps to delete such information promptly.",
    },
    changesToThisPrivacyPolicy: {
      heading: "9. Changes to This Privacy Policy",
      content:
        'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" at the top. We encourage you to review this Privacy Policy periodically for any changes.',
    },
    contactUs: {
      heading: "10. Contact Us",
      description:
        "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:",
      email: "jimmy@insightscrucible.com",
      company: "Embercore LLC",
      address: "1401 21st ST #5866",
      city: "Sacramento",
      state: "CA",
      zipCode: "95811",
      country: "US",
    },
  },
};

export type DemoVideo = {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  resultUrl: string;
  duration: string;
  sourceUrl: string;
};

// Array of pre-made demo video data
export const demoVideos: DemoVideo[] = [
  {
    id: "huberman-dopamine",
    title: "Controlling Your Dopamine For Motivation, Focus & Satisfaction",
    channelName: "Andrew Huberman",
    thumbnailUrl: "https://i.ytimg.com/vi/QmOF0crdyRU/hqdefault.jpg",
    resultUrl: "https://www.insightscrucible.com/share/1y9Ys53QVlwyhaTPpzizOm",
    duration: "PT2H16M32S",
    sourceUrl: "https://www.youtube.com/watch?v=QmOF0crdyRU",
  },
  {
    id: "hormozi-truths",
    title: "23 Harsh Truths Nobody Wants To Admit - Alex Hormozi (4K)",
    channelName: "Chris Williamson",
    thumbnailUrl: "https://i.ytimg.com/vi/M4PzOjM5BJQ/hqdefault.jpg",
    resultUrl: "https://www.insightscrucible.com/share/FKXbH-GjJF29Xl5D84sNVq",
    duration: "PT2H54M29S",
    sourceUrl: "https://www.youtube.com/watch?v=M4PzOjM5BJQ",
  },
  {
    id: "naval-life-truths",
    title: "44 Harsh Truths About The Game Of Life - Naval Ravikant (4K)",
    channelName: "Chris Williamson",
    thumbnailUrl: "https://i.ytimg.com/vi/KyfUysrNaco/hqdefault.jpg",
    resultUrl: "https://www.insightscrucible.com/share/CCI6SORWG7TZHxyh98ZkP3",
    duration: "PT3H16M19S",
    sourceUrl: "https://www.youtube.com/watch?v=KyfUysrNaco",
  },
];
