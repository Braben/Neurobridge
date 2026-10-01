import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image"; // Render the exact exported auth assets without substituting the navigation logo.
import styles from "./AuthFrame.module.css"; // Keep shared panel geometry separate from route-specific form styling.

interface AuthFrameProps {
  children: ReactNode;
  footerMinimal?: boolean;
  contentAlignment?: "center" | "rail"; // OTP uses the source frame's left content rail rather than a centered narrow column.
  contactVariant?: boolean; // The contact frame uses its own original photo crop and omits the footer.
}

export default function AuthFrame({
  children,
  footerMinimal = false,
  contentAlignment = "center", // Preserve existing form alignment until each screen's composition is audited.
  contactVariant = false, // Keep existing authentication screens unchanged.
}: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-[#fafafa] text-[#111111]">
      {/* Zero-minimum content tracks let reference-width forms shrink on narrow screens. */}
      <div className="grid min-h-screen grid-cols-1 bg-[#fafafa] lg:grid-cols-[minmax(360px,483px)_minmax(0,1fr)]">
        <aside className={styles.side}> {/* Match the common 483px desktop panel without affecting mobile form space. */}
          {contactVariant ? <Image src="/design-assets/contact-side.png" alt="" width={4096} height={2731} unoptimized className={styles.contactPhoto} /> : <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/design-assets/children-classroom.jpg')",
            }}
          />} {/* Preserve the source-specific side image without substituting the authentication photo. */}
          <div className="absolute inset-0 bg-[#2c2916]/80" />
          <div className={styles.sideContent}> {/* Keep the back link and welcome block in their measured source positions. */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-normal leading-6 text-white"
            >
              <Image src="/design-assets/icons/auth-back.png" alt="" width={24} height={24} unoptimized /> {/* Use the exported arrow at its 24px reference size. */}
              <span>Go Back</span> {/* Keep adjacent icon and text nodes identical during server rendering and hydration. */}
            </Link>
            <div className={styles.welcome}> {/* Figma places the 414px welcome block at x40/y281 on its 1024px canvas. */}
              <div className={styles.logoSlot}> {/* Preserve the 414x216 Figma crop without flattening its transparent background. */}
                <Image src="/design-assets/auth-logo.png" alt="Neuro Bridge Africa Logo" width={1280} height={1280} className={styles.logo} unoptimized priority /> {/* Use the original unmodified transparent image supplied by the design. */}
              </div> {/* Finish the logo's measured clipping window. */}
              <p className={styles.vision}>{"We envision a future where inclusive education is standard practice and families have access to tools that help children reach their full developmental potential."}</p> {/* Keep the reference paragraph as one deterministic text node. */}
            </div>
          </div>
        </aside>

        {/* Prevent the form's intrinsic reference width from expanding its grid column. */}
        <section className={styles.content} data-alignment={contentAlignment} data-contact={contactVariant}> {/* Keep contact centered without reserving an absent footer. */}
          <div className={styles.formArea}> {/* Allow fluid child form widths without changing default horizontal alignment. */}
            {children}
          </div>
          {!contactVariant && <footer
            className={styles.footer} // Match the Figma 32px link spacing and 40px desktop bottom/right insets.
          >
            {!footerMinimal && (
              <>
                <Link href="/about" className="font-medium hover:underline">About Neuro Bridge</Link> {/* Preserve source typography with deterministic link text. */}
                <Link href="/privacy" className="font-medium hover:underline">Privacy Policy</Link> {/* Preserve source typography with deterministic link text. */}
              </>
            )}
            <span>&copy; 2026 Neuro Bridge Africa</span>
          </footer>} {/* Contact's Figma frame does not contain the standard auth footer. */}
        </section>
      </div>
    </main>
  );
}
