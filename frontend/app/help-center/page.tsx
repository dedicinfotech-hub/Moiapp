import Link from 'next/link';

export const metadata = {
  title: 'Help Center – Moi PassBook',
  description: 'Find answers to common questions about Moi PassBook.',
};

const categories = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    label: 'Account',
    faqs: [
      {
        q: 'How do I create an account?',
        a: 'Download the Moi PassBook, open it, and tap "Register". Enter your mobile number, verify with OTP, and complete your profile.',
      },
      {
        q: 'How do I reset my password?',
        a: 'On the login screen, tap "Forgot Password". Enter your registered mobile number or email to receive a reset link.',
      },
      {
        q: 'How do I update my profile information?',
        a: 'Go to Dashboard → Settings → Profile. You can update your name, photo, and contact details from there.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Dashboard → Settings → Account → Delete Account. Note that this action is permanent and all your data will be removed.',
      },
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    label: 'Events',
    faqs: [
      {
        q: 'How do I create an event?',
        a: 'Log in and tap "New Event" from your Dashboard. Fill in the event name, type, date, and location, then publish.',
      },
      {
        q: 'What types of events can I create?',
        a: 'You can create Weddings, Puberty Functions, Housewarming Ceremonies, Baby Showers, Birthday Celebrations, and other family events.',
      },
      {
        q: 'How do I share my event with guests?',
        a: 'After creating an event, a unique QR code and shareable link are generated. Share these with your guests via WhatsApp or any messaging app.',
      },
      {
        q: 'Can I edit or delete an event?',
        a: 'Yes. Go to Dashboard → My Events, select the event, and choose Edit or Delete.',
      },
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: 'Payments',
    faqs: [
      {
        q: 'How does Moi payment work?',
        a: 'Guests scan the event QR code or open the event link, enter their name and amount, and pay securely via UPI.',
      },
      {
        q: 'Which payment methods are supported?',
        a: 'Moi PassBook supports all major UPI apps including GPay, PhonePe, Paytm, and bank UPI.',
      },
      {
        q: 'Does Moi PassBook store my bank details?',
        a: 'No. Moi PassBook never stores your bank account numbers, UPI PIN, card details, or any banking credentials. Payments are handled by trusted payment gateways.',
      },
      {
        q: 'What if my payment fails?',
        a: 'Failed payments are not deducted. If an amount was deducted but the transaction shows as failed, it will be refunded by your bank within 5–7 business days.',
      },
      {
        q: 'Can I view my transaction history?',
        a: 'Yes. Go to Dashboard → Transactions to see a full history of all Moi payments received and sent.',
      },
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    label: 'QR Code',
    faqs: [
      {
        q: 'Where do I find my event QR code?',
        a: 'Open the event from your Dashboard and tap the QR Code icon. You can download and print it for display at your event.',
      },
      {
        q: 'Can guests pay without scanning the QR?',
        a: 'Yes. Every event has a unique URL link that guests can open directly on their phone without scanning.',
      },
    ],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    label: 'General',
    faqs: [
      {
        q: 'Is Moi PassBook free to use?',
        a: 'Yes. Creating an account and listing events is free. Applicable payment gateway charges may apply on transactions.',
      },
      {
        q: 'Is Moi PassBook available on iOS?',
        a: 'Currently Moi PassBook is available on Android. iOS support is coming soon.',
      },
      {
        q: 'What languages does Moi PassBook support?',
        a: 'Moi PassBook currently supports English and Tamil.',
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-tn-yellow-bg via-white to-tn-yellow-bg">

      {/* Decorative blobs */}
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-20 -left-20 w-72 h-72 rounded-full bg-tn-yellow/8 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tn-yellow-bg via-tn-yellow-light to-tn-yellow-bg border-b border-tn-gold-border py-14 px-4">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-tn-yellow/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-tn-yellow/15 border border-tn-gold-border/40 text-tn-gold px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
            Moi PassBook · Support
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-tn-text mb-4">
            Help Center
          </h1>
          <p className="text-tn-muted text-sm lg:text-base leading-relaxed max-w-xl mx-auto">
            Find answers to the most common questions about Moi PassBook.
          </p>
        </div>
      </div>

      {/* Category tabs strip */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-tn-gold-border overflow-x-auto">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 py-2">
          {categories.map((cat) => (
            <a
              key={cat.label}
              href={`#${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-tn-muted hover:bg-tn-yellow-light hover:text-tn-gold transition-colors whitespace-nowrap"
            >
              <span className="text-tn-yellow">{cat.icon}</span>
              {cat.label}
            </a>
          ))}
        </div>
      </div>

      {/* FAQ sections */}
      <div className="relative max-w-3xl mx-auto px-4 py-10 space-y-8">

        {categories.map((cat) => (
          <section
            key={cat.label}
            id={cat.label.toLowerCase().replace(/\s+/g, '-')}
            className="scroll-mt-16"
          >
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-tn-yellow text-black flex items-center justify-center shadow-sm flex-shrink-0">
                {cat.icon}
              </div>
              <h2 className="text-lg font-bold text-tn-text">{cat.label}</h2>
            </div>

            {/* FAQ cards */}
            <div className="bg-white border border-tn-gold-border rounded-2xl divide-y divide-tn-yellow-light shadow-sm">
              {cat.faqs.map((faq, idx) => (
                <details key={idx} className="group px-6 py-4">
                  <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
                    <span className="text-sm font-semibold text-tn-text group-open:text-tn-gold transition-colors">
                      {faq.q}
                    </span>
                    <svg
                      className="w-4 h-4 text-tn-gold flex-shrink-0 transition-transform group-open:rotate-180"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-tn-muted leading-relaxed border-t border-tn-yellow-light pt-3">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Still need help */}
        <div className="bg-tn-yellow-bg border border-tn-gold-border rounded-2xl px-6 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-tn-yellow text-black flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h3 className="text-base font-bold text-tn-text mb-2">Still need help?</h3>
          <p className="text-sm text-tn-muted mb-5">
            Can't find what you're looking for? Our support team is happy to help.
          </p>
          <a
            href="mailto:support@moipassbook.com"
            className="inline-flex items-center gap-2 bg-tn-yellow hover:bg-tn-yellow-2 text-tn-text text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-tn-yellow/30"
          >
            Contact Support
          </a>
        </div>

        {/* Back to Home */}
        <div className="text-center pt-2">
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
