export const PRIVACY_POLICY_JSON = {
  privacyPolicy: {
    title: "Privacy Policy for Insights Crucible",
    effectiveDate: "July 15, 2025",
    introduction: {
      heading: "1. Introduction",
      content:
        'Welcome to Insights Crucible ("we," "us," or "our"). We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, process, and share your information when you use our website and services (collectively, the "Services"). This policy applies to all users of our Services. By using our Services, you agree to the collection and use of information in accordance with this policy.',
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
