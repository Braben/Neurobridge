import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "./BrandLogo";

interface AuthFrameProps {
  children: ReactNode;
  footerMinimal?: boolean;
}

export default function AuthFrame({
  children,
  footerMinimal = false,
}: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-[#fafafa] text-[#111111]">
      <div className="grid min-h-screen bg-[#fafafa] lg:grid-cols-[minmax(360px,483px)_1fr]">
        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/design-assets/children-classroom.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-[#2c2916]/80" />
          <div className="relative flex h-full flex-col px-10 py-16 text-white">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-normal leading-6 text-white"
            >
              <span aria-hidden>&larr;</span>
              Go Back
            </Link>
            <div className="mt-auto mb-auto space-y-10">
              <BrandLogo
                compact
                variant="transparent"
                className="w-full max-w-[414px]"
              />
              <p className="max-w-[414px] text-xl leading-normal text-white">
                We envision a future where inclusive education is standard
                practice and families have access to tools that help children
                reach their full developmental potential.
              </p>
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-screen flex-col px-5 py-8 sm:px-10 lg:px-[clamp(48px,8vw,120px)]">
          <div className="flex flex-1 items-center justify-center py-10">
            {children}
          </div>
          <footer
            className={[
              "flex flex-wrap items-center gap-8 pb-7 text-base leading-6 text-[#0a3d62]",
              footerMinimal
                ? "justify-center lg:justify-end"
                : "justify-center lg:justify-end",
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
