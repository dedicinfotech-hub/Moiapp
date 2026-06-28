import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy – Moi App',
  description: 'Learn how Moi App collects, uses, stores, and protects your personal information.',
};

const sections = [
  {
    title: '1. About Moi App',
    content:
      'Moi App is a digital platform designed for Tamil family celebrations, allowing users to create events and send or receive Moi Panam securely through digital payment methods.',
    note: 'Our goal is to preserve traditional gifting while providing a safe and convenient digital experience.',
  },
  {
    title: '2. Information We Collect',
    content: 'To provide our services, we may collect the following information:',
    groups: [
      {
        label: 'Personal Information',
        items: [
          'Full Name',
          'Mobile Number',
          'Email Address (Optional)',
          'Profile Photo (Optional)',
          'City or Location (Optional)',
        ],
      },
      {
        label: 'Event Information',
        items: ['Event Name', 'Event Type', 'Event Date', 'Event Location', 'Event Image'],
      },
      {
        label: 'Transaction Information',
        items: [
          'Transaction ID',
          'Payment Amount',
          'Payment Status',
          'Date and Time',
          'Sender and Receiver Details',
        ],
      },
      {
        label: 'Device Information',
        intro: 'We may automatically collect:',
        items: [
          'Device Model',
          'Operating System',
          'App Version',
          'IP Address',
          'Device Identifier',
          'Crash Reports',
        ],
        note: 'This information helps improve app performance and security.',
      },
    ],
  },
  {
    title: '3. How We Use Your Information',
    content: 'Your information is used to:',
    list: [
      'Create and manage your account',
      'Create family events',
      'Generate event QR Codes',
      'Process Moi payments',
      'Display transaction history',
      'Improve application performance',
      'Detect fraud and unauthorized activity',
      'Respond to customer support requests',
      'Send important service notifications',
    ],
    note: 'We only collect information necessary to provide these services.',
  },
  {
    title: '4. Payment Security',
    content: 'Moi App does not store:',
    list: [
      'Bank Account Numbers',
      'Debit Card Details',
      'Credit Card Details',
      'UPI PIN',
      'Internet Banking Passwords',
    ],
    note: 'Payments are securely processed through trusted UPI and payment gateway partners.',
  },
  {
    title: '5. Data Storage',
    content:
      'Your information is stored securely using industry-standard security practices. We regularly review our systems to protect against unauthorized access, loss, misuse, or alteration of your information.',
  },
  {
    title: '6. Information Sharing',
    content: 'We respect your privacy. We do not sell, rent, or trade your personal information.',
    listPrefix: 'Your information may only be shared:',
    list: [
      'With payment service providers',
      'With cloud hosting providers',
      'To comply with legal requirements',
      'To protect the safety and security of our users',
    ],
  },
  {
    title: '7. Your Rights',
    content: 'You have the right to:',
    list: [
      'View your account information',
      'Update your profile',
      'Edit your events',
      'Delete your account',
      'Request deletion of your personal data',
      'Contact us regarding privacy concerns',
    ],
  },
  {
    title: '8. Cookies and Analytics',
    content: 'Moi App may use cookies, analytics tools, and similar technologies to:',
    list: [
      'Improve user experience',
      'Understand app usage',
      'Measure performance',
      'Fix technical issues',
    ],
    note: 'No sensitive financial information is collected through these technologies.',
  },
  {
    title: "9. Children's Privacy",
    content: 'Moi App is intended for users aged 18 years or older.',
    note: 'We do not knowingly collect personal information from children without appropriate consent.',
  },
  {
    title: '10. Third-Party Services',
    content: 'Moi App may integrate with trusted third-party services including:',
    list: [
      'UPI Payment Providers',
      'Firebase',
      'Cloud Storage Services',
      'Analytics Services',
    ],
    note: 'Each third-party service has its own privacy policy.',
  },
  {
    title: '11. Changes to this Privacy Policy',
    content: 'We may update this Privacy Policy periodically.',
    list: [
      'Any significant changes will be announced within the application.',
      'Continued use of Moi App indicates acceptance of the updated Privacy Policy.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg">

      {/* Decorative blobs — same as homepage hero */}
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 -left-20 w-72 h-72 rounded-full bg-tn-yellow/8 blur-2xl pointer-events-none" />

      {/* Header banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tn-yellow-bg via-tn-yellow-light to-tn-yellow-bg border-b border-tn-gold-border py-14 px-4">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-tn-yellow/15 border border-tn-gold-border/40 text-tn-gold px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
            Moi App · Legal
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-tn-text mb-4">
            Privacy Policy
          </h1>
          <p className="text-tn-muted text-sm lg:text-base leading-relaxed max-w-2xl mx-auto">
            Welcome to Moi App. Your privacy is important to us. This Privacy Policy explains how
            we collect, use, store, and protect your personal information when you use our
            application and services.
          </p>
          <p className="text-tn-subtle text-xs mt-3">
            By accessing or using Moi App, you agree to the practices described in this Privacy Policy.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border border-tn-gold-border rounded-2xl shadow-sm divide-y divide-tn-yellow-light">

          {sections.map((section, i) => (
            <div key={section.title} className="px-6 lg:px-8 py-6">
              {/* Number badge + title */}
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-tn-yellow text-tn-text text-xs font-extrabold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
                <h2 className="text-base lg:text-lg font-bold text-tn-text leading-snug pt-0.5">
                  {section.title.replace(/^\d+\.\s/, '')}
                </h2>
              </div>

              <div className="pl-10">
                <p className="text-sm text-tn-text leading-relaxed">{section.content}</p>

                {/* Simple list */}
                {'list' in section && section.list && !('listPrefix' in section) && (
                  <ul className="mt-3 space-y-1.5">
                    {section.list.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-tn-text">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tn-yellow flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* List with prefix label */}
                {'listPrefix' in section && section.list && (
                  <>
                    <p className="text-sm text-tn-text leading-relaxed mt-2">
                      {(section as any).listPrefix}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-tn-text">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tn-yellow flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Grouped lists (section 2) */}
                {'groups' in section && section.groups && (
                  <div className="mt-4 space-y-4">
                    {section.groups.map((group) => (
                      <div key={group.label} className="bg-tn-yellow-bg border border-tn-gold-border rounded-xl px-4 py-3">
                        {group.intro && (
                          <p className="text-xs text-tn-muted mb-1">{group.intro}</p>
                        )}
                        <p className="text-xs font-bold text-tn-gold uppercase tracking-wide mb-2">
                          {group.label}
                        </p>
                        <ul className="space-y-1.5">
                          {group.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-tn-text">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tn-yellow flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                        {group.note && (
                          <p className="text-xs text-tn-muted mt-2 italic">{group.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Note */}
                {'note' in section && !('groups' in section) && section.note && (
                  <div className="mt-3 flex items-start gap-2 bg-tn-yellow-bg border border-tn-gold-border rounded-lg px-3 py-2">
                    <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <p className="text-xs text-tn-gold leading-relaxed">{section.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Section 12 — Contact */}
          <div className="px-6 lg:px-8 py-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-tn-yellow text-tn-text text-xs font-extrabold flex items-center justify-center shadow-sm">
                12
              </span>
              <h2 className="text-base lg:text-lg font-bold text-tn-text leading-snug pt-0.5">
                Contact Us
              </h2>
            </div>
            <div className="pl-10">
              <p className="text-sm text-tn-text leading-relaxed mb-4">
                If you have any questions regarding this Privacy Policy, please contact us.
              </p>
              <div className="bg-tn-yellow-bg border border-tn-gold-border rounded-xl px-5 py-4 space-y-3">
                <p className="text-sm font-bold text-tn-text">Moi App Support</p>
                <div className="flex items-center gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tn-gold">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <a href="mailto:support@moiapp.in" className="text-sm text-tn-gold font-semibold hover:underline">
                    support@moiapp.in
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tn-gold">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <a href="https://www.moiapp.com" target="_blank" rel="noopener noreferrer" className="text-sm text-tn-gold font-semibold hover:underline">
                    www.moiapp.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thank you */}
        <p className="text-center text-sm text-tn-subtle mt-8">
          Thank you for trusting{' '}
          <span className="font-bold text-tn-gold">Moi App</span>.
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-tn-yellow hover:bg-tn-yellow-2 text-tn-text px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-tn-yellow/30"
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
