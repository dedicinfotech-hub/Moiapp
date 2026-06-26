import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service – Moi App',
  description: 'Read the Terms of Service governing your use of Moi App.',
};

const sections = [
  {
    title: '1. Eligibility',
    content: 'To use Moi App, you must:',
    list: [
      'Be at least 18 years old',
      'Provide accurate information',
      'Use the app only for lawful purposes',
    ],
  },
  {
    title: '2. Account Registration',
    content: 'To access certain features, you must create an account.',
    listPrefix: 'You are responsible for:',
    list: [
      'Keeping your login credentials secure',
      'Maintaining accurate profile information',
      'All activities performed using your account',
    ],
  },
  {
    title: '3. Event Creation',
    content: 'Users may create events including:',
    list: [
      'Weddings',
      'Puberty Functions',
      'Housewarming Ceremonies',
      'Baby Showers',
      'Birthday Celebrations',
      'Other Family Events',
    ],
    note: 'The creator is responsible for ensuring all event information is accurate.',
  },
  {
    title: '4. Moi Payments',
    content: 'Moi App facilitates digital gifting through supported payment providers.',
    listPrefix: 'We do not guarantee:',
    list: [
      'Instant payment processing',
      'Bank availability',
      'Third-party payment success',
    ],
    note: 'Payment processing depends on participating banks and payment gateways.',
  },
  {
    title: '5. User Responsibilities',
    content: 'You agree to:',
    list: [
      'Provide truthful information',
      'Respect other users',
      'Use the app responsibly',
      'Follow applicable laws',
    ],
    doNotList: [
      'Create fake events',
      'Misrepresent your identity',
      'Attempt unauthorized access',
      'Use the app for fraud or illegal activities',
      'Disrupt the platform or other users',
    ],
  },
  {
    title: '6. Payment Responsibility',
    content: 'Moi App only provides the platform to facilitate payments.',
    listPrefix: 'Users are responsible for:',
    list: [
      'Verifying recipient details',
      'Confirming payment amounts',
      'Ensuring transaction accuracy before payment',
    ],
    note: 'Completed transactions may not be reversible.',
  },
  {
    title: '7. Intellectual Property',
    content: 'All content within Moi App including:',
    list: [
      'Logo',
      'Brand Name',
      'User Interface',
      'Illustrations',
      'Icons',
      'Source Code',
      'Graphics',
    ],
    note: 'is the intellectual property of Moi App unless otherwise stated. Unauthorized copying or distribution is prohibited.',
  },
  {
    title: '8. Account Suspension',
    content: 'We reserve the right to suspend or terminate accounts that:',
    list: [
      'Violate these Terms',
      'Engage in fraudulent activities',
      'Abuse the platform',
      'Attempt unauthorized access',
    ],
  },
  {
    title: '9. Limitation of Liability',
    content: 'Moi App is provided on an "as available" and "as is" basis.',
    listPrefix: 'We are not liable for:',
    list: [
      'Payment delays',
      'Bank failures',
      'Network interruptions',
      'Device failures',
      'Indirect or consequential damages resulting from use of the app',
    ],
  },
  {
    title: '10. Service Availability',
    content:
      'While we strive for uninterrupted service, we cannot guarantee that Moi App will always be available without maintenance or technical interruptions.',
  },
  {
    title: '11. Privacy',
    content:
      'Your use of Moi App is also governed by our Privacy Policy. Please read both documents carefully.',
    privacyLink: true,
  },
  {
    title: '12. Changes to the Terms',
    content: 'We may modify these Terms of Service at any time.',
    list: [
      'Updated versions will be published within the application.',
      'Continued use of Moi App indicates acceptance of the revised Terms.',
    ],
  },
  {
    title: '13. Governing Law',
    content: 'These Terms shall be governed by the laws of India.',
    note: 'Any disputes shall be subject to the jurisdiction of the appropriate courts in India.',
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFDF5] via-white to-[#FFF8E1]">

      {/* Decorative blobs */}
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-[#FFC107]/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#FFC107]/8 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FFFDF5] via-[#FFF8E1] to-[#FFFCF5] border-b border-[#F0E8C8] py-14 px-4">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#FFC107]/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#FFC107]/15 border border-[#FFC107]/40 text-[#B8860B] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
            Moi App · Legal
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#101010] mb-3">
            Terms of Service
          </h1>
          <p className="text-[#888] text-xs font-medium mb-4">Effective Date: DD/MM/YYYY</p>
          <p className="text-[#555] text-sm lg:text-base leading-relaxed max-w-2xl mx-auto">
            Welcome to Moi App. These Terms of Service govern your use of the Moi App mobile
            application and related services.
          </p>
          <p className="text-[#888] text-xs mt-3">
            By using Moi App, you agree to comply with these Terms.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border border-[#FFE082] rounded-2xl shadow-sm divide-y divide-[#FFF3CD]">

          {sections.map((section, i) => (
            <div key={section.title} className="px-6 lg:px-8 py-6">
              {/* Number badge + title */}
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FFC107] text-black text-xs font-extrabold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
                <h2 className="text-base lg:text-lg font-bold text-[#101010] leading-snug pt-0.5">
                  {section.title.replace(/^\d+\.\s/, '')}
                </h2>
              </div>

              <div className="pl-10 space-y-3">
                <p className="text-sm text-[#444] leading-relaxed">{section.content}</p>

                {/* You agree to list */}
                {'list' in section && section.list && !('listPrefix' in section) && (
                  <ul className="space-y-1.5">
                    {section.list.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#444]">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FFC107] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* List with prefix */}
                {'listPrefix' in section && section.list && (
                  <>
                    <p className="text-sm text-[#444]">{(section as any).listPrefix}</p>
                    <ul className="space-y-1.5">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-[#444]">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FFC107] flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* You must NOT list */}
                {'doNotList' in section && (section as any).doNotList && (
                  <div className="bg-[#FFFCF5] border border-[#FFE082] rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-[#B8860B] uppercase tracking-wide mb-2">
                      You must not:
                    </p>
                    <ul className="space-y-1.5">
                      {(section as any).doNotList.map((item: string) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-[#444]">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Privacy link */}
                {'privacyLink' in section && (
                  <Link
                    href="/privacy-policy"
                    className="inline-flex items-center gap-1.5 text-sm text-[#B8860B] font-semibold hover:underline"
                  >
                    Read our Privacy Policy →
                  </Link>
                )}

                {/* Note */}
                {'note' in section && section.note && (
                  <div className="flex items-start gap-2 bg-[#FFFCF5] border border-[#FFE082] rounded-lg px-3 py-2">
                    <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <p className="text-xs text-[#B8860B] leading-relaxed">{section.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Section 14 — Contact */}
          <div className="px-6 lg:px-8 py-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FFC107] text-black text-xs font-extrabold flex items-center justify-center shadow-sm">
                14
              </span>
              <h2 className="text-base lg:text-lg font-bold text-[#101010] leading-snug pt-0.5">
                Contact Us
              </h2>
            </div>
            <div className="pl-10">
              <p className="text-sm text-[#444] leading-relaxed mb-4">
                For questions about these Terms of Service, please contact:
              </p>
              <div className="bg-[#FFFCF5] border border-[#FFE082] rounded-xl px-5 py-4 space-y-3">
                <p className="text-sm font-bold text-[#101010]">Moi App Support</p>
                <div className="flex items-center gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <a href="mailto:support@moiapp.com" className="text-sm text-[#B8860B] font-semibold hover:underline">
                    support@moiapp.com
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <a href="https://www.moiapp.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#B8860B] font-semibold hover:underline">
                    www.moiapp.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-[#888] mt-8">
          Thank you for trusting{' '}
          <span className="font-bold text-[#B8860B]">Moi App</span>.
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#FFC107] hover:bg-[#E6AC00] text-black px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-[#FFC107]/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
