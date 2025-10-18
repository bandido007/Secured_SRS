import { cn } from '../../utils/cn';

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={cn(
          'h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent',
          className
        )}
      />
      {label ? <p className="text-sm text-gray-500">{label}</p> : null}
    </div>
  );
}
