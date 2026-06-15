export function MandalaBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.12]">
      <svg className="absolute -top-10 -left-10 w-48 h-48 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="25" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line key={deg} x1="50" y1="5" x2="50" y2="95" transform={`rotate(${deg} 50 50)`} />
        ))}
      </svg>
      <svg className="absolute top-1/4 -right-8 w-40 h-40 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
        <circle cx="50" cy="50" r="40" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line key={deg} x1="50" y1="10" x2="50" y2="90" transform={`rotate(${deg} 50 50)`} />
        ))}
      </svg>
      <svg className="absolute bottom-20 left-4 w-32 h-32 text-white" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="0.5">
        <path d="M40 5 Q55 20 40 35 Q25 20 40 5" />
        <path d="M40 35 Q55 50 40 65 Q25 50 40 35" />
        <path d="M40 65 Q55 75 40 78 Q25 75 40 65" />
      </svg>
    </div>
  );
}

export function FloralCorner() {
  return (
    <div className="absolute top-0 left-0 pointer-events-none opacity-[0.15]">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <path d="M10 60 Q30 30 60 10 Q40 40 10 60Z" fill="#7C3AED" />
        <path d="M30 80 Q50 50 80 30 Q55 60 30 80Z" fill="#A78BFA" />
        <circle cx="25" cy="25" r="8" fill="#C4B5FD" />
        <path d="M5 90 Q25 70 45 90" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

export function SkylineFooter() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-[0.2]">
      <svg className="w-full h-24" viewBox="0 0 400 80" preserveAspectRatio="none" fill="#7C3AED">
        <path d="M0 80 L0 55 L20 55 L20 45 L35 45 L35 30 L50 30 L50 20 L65 20 L65 40 L80 40 L80 25 L95 25 L95 50 L110 50 L110 35 L125 35 L125 15 L140 15 L140 45 L155 45 L155 30 L170 30 L170 55 L185 55 L185 40 L200 40 L200 25 L215 25 L215 50 L230 50 L230 35 L245 35 L245 20 L260 20 L260 45 L275 45 L275 30 L290 30 L290 55 L305 55 L305 40 L320 40 L320 25 L335 25 L335 50 L350 50 L350 35 L365 35 L365 55 L400 55 L400 80 Z" />
      </svg>
    </div>
  );
}

export function FamilyIllustration() {
  return (
    <svg className="w-64 h-44 mx-auto" viewBox="0 0 256 176" fill="none">
      {/* Grandfather */}
      <ellipse cx="48" cy="158" rx="18" ry="6" fill="#000" opacity="0.1" />
      <rect x="34" y="95" width="28" height="55" rx="6" fill="#F59E0B" />
      <circle cx="48" cy="78" r="16" fill="#FCD34D" />
      <path d="M32 78 Q48 62 64 78" fill="#374151" />
      {/* Grandmother */}
      <ellipse cx="96" cy="158" rx="16" ry="5" fill="#000" opacity="0.1" />
      <path d="M80 100 L112 100 L108 150 L84 150 Z" fill="#EC4899" />
      <circle cx="96" cy="82" r="14" fill="#FCD34D" />
      <path d="M82 84 Q96 70 110 84" fill="#1F2937" />
      {/* Father */}
      <ellipse cx="148" cy="158" rx="17" ry="5" fill="#000" opacity="0.1" />
      <rect x="134" y="98" width="28" height="52" rx="5" fill="#7C3AED" />
      <circle cx="148" cy="80" r="15" fill="#FCD34D" />
      <path d="M133 80 Q148 66 163 80" fill="#374151" />
      {/* Mother */}
      <ellipse cx="192" cy="158" rx="15" ry="5" fill="#000" opacity="0.1" />
      <path d="M178 102 L206 102 L202 150 L182 150 Z" fill="#A855F7" />
      <circle cx="192" cy="84" r="13" fill="#FCD34D" />
      <path d="M179 86 Q192 74 205 86" fill="#1F2937" />
      {/* Child boy */}
      <ellipse cx="220" cy="145" rx="12" ry="4" fill="#000" opacity="0.1" />
      <rect x="210" y="108" width="20" height="32" rx="4" fill="#3B82F6" />
      <circle cx="220" cy="98" r="10" fill="#FCD34D" />
      {/* Child girl */}
      <ellipse cx="128" cy="145" rx="11" ry="4" fill="#000" opacity="0.1" />
      <path d="M118 110 L138 110 L135 142 L121 142 Z" fill="#F472B6" />
      <circle cx="128" cy="100" r="9" fill="#FCD34D" />
    </svg>
  );
}

export function OtpPhoneIllustration() {
  return (
    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-[#EDE9FE] flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="22" y="12" width="28" height="48" rx="4" stroke="#7C3AED" strokeWidth="2" fill="white" />
        <circle cx="36" cy="52" r="3" fill="#7C3AED" />
        <rect x="28" y="20" width="16" height="22" rx="2" fill="#EDE9FE" />
        <path d="M32 28 L40 28 M32 32 L40 32 M32 36 L38 36" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="44" y="18" width="20" height="14" rx="4" fill="#7C3AED" />
        <text x="48" y="28" fill="white" fontSize="8" fontWeight="bold">***</text>
        <circle cx="36" cy="8" r="5" fill="#7C3AED" />
        <path d="M33 8 L36 5 L39 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function StepProgress({ currentStep }: { currentStep: number }) {
  const steps = ['Profile', 'Event Type', 'Function Details', 'Finish'];
  return (
    <div className="px-6 py-5 border-t border-[#F3F4F6] bg-white">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <div key={label} className="flex flex-col items-center flex-1 relative">
              {index > 0 && (
                <div className={`absolute right-1/2 top-4 w-full h-0.5 -translate-y-1/2 ${isDone || isActive ? 'bg-[#7C3AED]' : 'bg-[#E5E7EB]'}`} style={{ width: '100%', left: '-50%' }} />
              )}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-[#7C3AED] text-white' : isDone ? 'bg-[#7C3AED] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'
              }`}>
                {stepNum}
              </div>
              <p className={`text-[10px] mt-1.5 font-medium text-center ${isActive ? 'text-[#7C3AED]' : 'text-[#9CA3AF]'}`}>
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
