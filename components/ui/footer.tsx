import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t py-6 mt-auto z-0 relative">
      <div className="container flex flex-col items-center justify-center gap-4 px-4 md:flex-row md:justify-between">
        <p className="text-sm text-muted-foreground">
          © 2025 Fitness Trainer Scheduler. All rights reserved.
        </p>
        <nav className="flex gap-4">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
