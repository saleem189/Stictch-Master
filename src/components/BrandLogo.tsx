import logoUrl from '../assets/stitchmaster-logo.png';

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
  dark?: boolean;
}

export default function BrandLogo({
  className = '',
  markClassName = 'h-10 w-10',
  textClassName = '',
  showText = true,
  dark = false,
}: BrandLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 overflow-hidden rounded-2xl border ${dark ? 'border-white/10 bg-white' : 'border-slate-200 bg-white'} shadow-sm ${markClassName}`}>
        <img
          src={logoUrl}
          alt="Tailoring ERP logo"
          className="absolute left-1/2 top-[38%] h-[185%] w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </div>
      {showText && (
        <span className={`min-w-0 font-black uppercase tracking-tight ${dark ? 'text-white' : 'text-slate-900'} ${textClassName}`}>
          Tailoring<span className="text-indigo-600">ERP</span>
        </span>
      )}
    </div>
  );
}
