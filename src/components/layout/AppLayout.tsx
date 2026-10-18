import type React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
}

export function PageShell({
  children,
  className = '',
  maxWidthClassName = 'max-w-[1440px]',
}: PageShellProps) {
  return (
    <div className={`w-full px-4 py-5 pb-32 sm:px-6 sm:py-6 lg:px-8 lg:py-8 lg:pb-8 ${className}`}>
      <div className={`mx-auto w-full ${maxWidthClassName}`}>
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-widest text-atelier-brass">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display mt-1 text-3xl italic tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

interface ModuleCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ModuleCard({ children, className = '' }: ModuleCardProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}
