import Image from "next/image";
import Link from "next/link";

const authActions = [
  {
    href: "/login",
    label: "Login",
    className:
      "border border-white/90 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white",
  },
  {
    href: "/register?role=PARENT",
    label: "Sign Up as a Parent",
    className:
      "border border-[#0071d7] bg-[#0071d7] text-white hover:border-[#1687ea] hover:bg-[#1687ea] focus-visible:ring-[#66b4ff]",
  },
  {
    href: "/register?role=THERAPIST",
    label: "Sign Up as a Therapist",
    className:
      "border border-[#0a4a73] bg-[#0a4a73] text-white hover:border-[#0a3d62] hover:bg-[#0a3d62] focus-visible:ring-[#66b4ff]",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#2f302b] text-white">
      <Image
        src="/design-assets/children-classroom.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#2c2916]/72" />

      <section className="relative z-10 flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:px-[clamp(48px,8vw,112px)]">
        <header className="flex justify-center sm:justify-end">
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium leading-5 text-white sm:text-base">
            <Link
              href="/register/admin"
              className="underline underline-offset-4 hover:text-[#ffd56b]"
            >
              Sign up as an administrator
            </Link>
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-[#ffd56b]"
            >
              Login as an administrator
            </Link>
          </nav>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <h1 className="text-[clamp(44px,6vw,72px)] font-bold leading-none tracking-normal">
            Welcome to
          </h1>

          <Image
            src="/design-assets/logo-transparent.png"
            alt="Neuro Bridge Africa"
            width={940}
            height={260}
            priority
            className="mt-8 h-auto w-full max-w-[760px] object-contain"
          />

          <div className="mt-14 grid w-full max-w-[1260px] gap-6 md:grid-cols-3">
            {authActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={[
                  "inline-flex h-[68px] items-center justify-center rounded-[10px] px-6 text-lg font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  action.className,
                ].join(" ")}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-9 gap-y-3 text-sm font-medium leading-5 text-white sm:justify-end sm:text-base">
          <Link
            href="/about"
            className="underline underline-offset-4 hover:text-[#ffd56b]"
          >
            About Neuro Bridge
          </Link>
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-[#ffd56b]"
          >
            Privacy Policy
          </Link>
          <span>&copy; Neuro Bridge 2026</span>
        </footer>
      </section>
    </main>
  );
}
