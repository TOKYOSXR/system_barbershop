import Link from "next/link";
import { Scissors } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scissors className="h-5 w-5" />
        </span>
        BarberFlow
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
