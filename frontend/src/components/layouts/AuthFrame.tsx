import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image"; // Render the exact exported auth assets without substituting the navigation logo.
import styles from "./AuthFrame.module.css"; // Keep shared panel geometry separate from route-specific form styling.

interface AuthFrameProps {
  children: ReactNode;
  footerMinimal?: boolean;
  contentAlignment?: "center" | "rail"; // OTP uses the source frame's left content rail rather than a centered narrow column.
}

export default function AuthFrame({
  children,
  footerMinimal = false,
  contentAlignment = "center", // Preserve existing form alignment until each screen's composition is audited.
}: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-[#fafafa] text-[#111111]">
      {/* Zero-minimum content tracks let reference-width forms shrink on narrow screens. */}
      <div className="grid min-h-screen grid-cols-1 bg-[#fafafa] lg:grid-cols-[minmax(360px,483px)_minmax(0,1fr)]">
        <aside className={styles.side}> {/* Match the common 483px desktop panel without affecting mobile form space. */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/design-assets/children-classroom.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-[#2c2916]/80" />
          <div className={styles.sideContent}> {/* Keep the back link and welcome block in their measured source positions. */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-normal leading-6 text-white"
            >
              <Image src="/design-assets/icons/auth-back.png" alt="" width={24} height={24} unoptimized /> {/* Use the exported arrow at its 24px reference size. */}
              Go Back
            </Link>
            <div className={styles.welcome}> {/* Figma places the 414px welcome block at x40/y281 on its 1024px canvas. */}
              <div className={styles.logoSlot}> {/* Preserve the 414x216 Figma crop without flattening its transparent background. */}
                <Image src="/design-assets/auth-logo.png" alt="Neuro Bridge Africa Logo" width={1280} height={1280} className={styles.logo} unoptimized priority /> {/* Use the original unmodified transparent image supplied by the design. */}
              </div> {/* Finish the logo's measured clipping window. */}
              <p className={styles.vision}> {/* Use the reference 20px regular body text and normal line height. */}
                We envision a future where inclusive education is standard
                practice and families have access to tools that help children
                reach their full developmental potential.
              </p>
            </div>
          </div>
        </aside>

        {/* Prevent the form's intrinsic reference width from expanding its grid column. */}
        <section className={styles.content} data-alignment={contentAlignment}> {/* Balance the top inset against the footer so OTP content centers vertically on the canvas. */}
          <div className={styles.formArea}> {/* Allow fluid child form widths without changing default horizontal alignment. */}
            {children}
          </div>
          <footer
            className={styles.footer} // Match the Figma 32px link spacing and 40px desktop bottom/right insets.
          >
            {!footerMinimal && (
              <>
                <Link href="/about" className="font-medium hover:underline"> {/* Preserve the source footer's medium-weight links. */}
                  About Neuro Bridge
                </Link>
                <Link href="/privacy" className="font-medium hover:underline"> {/* Preserve the source footer's medium-weight links. */}
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
