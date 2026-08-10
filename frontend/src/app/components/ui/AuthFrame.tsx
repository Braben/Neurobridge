import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "./BrandLogo";

interface AuthFrameProps {
  children: ReactNode;
  footerMinimal?: boolean;
}

export default function AuthFrame({ children, footerMinimal = false }: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f7] p-0 text-[#111827] sm:p-8">
      <div className="mx-auto grid min-h-screen max-w-7xl bg-white shadow-sm sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="relative hidden overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/design-assets/therapy-room.jpg')" }}
          />
          <div className="absolute inset-0 bg-[#2e2814]/70" />
          <div className="relative flex h-full flex-col justify-between px-8 py-9 text-white">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-white/90">
              <span aria-hidden>&larr;</span>
              Go Back
            </Link>
            <div className="space-y-7">
              <BrandLogo variant="white" className="w-56" />
              <p className="max-w-xs text-sm leading-6 text-white/90">
                We envision a future where inclusive education is standard practice and families
                have access to tools that help children reach their full developmental potential.
              </p>
            </div>
            <span />
          </div>
        </aside>

        <section className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:min-h-0 lg:px-20">
          {children}
          <footer
            className={[
              "mt-12 flex flex-wrap items-center gap-5 text-[11px] text-[#0b4a6f]",
              footerMinimal ? "justify-end" : "justify-center lg:justify-end",
            ].join(" ")}
          >
            {!footerMinimal && (
              <>
                <Link href="/about" className="hover:underline">
                  About Neuro Bridge
                </Link>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </>
            )}
            <span>&copy; 2026 Neuro Bridge Africa</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
