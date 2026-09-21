import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <img
      src="/invoice-desk-logo.png"
      alt="InvoiceDesk"
      width={832}
      height={184}
      className={cn(
        "block object-contain object-left",
        compact ? "h-7 w-7 object-cover object-left" : "h-8 w-auto max-w-[190px]",
        className,
      )}
    />
  );
}