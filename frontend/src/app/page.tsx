import Link from "next/link";
import AppButton from "./components/ui/AppButton";
import BrandLogo from "./components/ui/BrandLogo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#4a4a4a] p-4 text-white sm:p-10">
      <section className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden bg-[#1f261f] sm:min-h-[calc(100vh-5rem)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/design-assets/therapy-room.jpg')" }}
        />
        <div className="absolute inset-0 bg-[#2e2814]/72" />

        <div className="relative flex min-h-full w-full flex-col px-6 py-8 sm:px-16 sm:py-12">
          <nav className="flex flex-wrap items-center justify-end gap-6 text-sm font-semibold text-white/90">
            <Link
              href="/register?role=ADMIN"
              className="underline-offset-4 hover:underline"
            >
              Sign up as an administrator
            </Link>
            <Link href="/login" className="underline-offset-4 hover:underline">
              Login as an administrator
            </Link>
          </nav>

          <div className="flex flex-1 flex-col items-center justify-center gap-12 py-16 text-center">
            <div className="space-y-8">
              <h1 className="text-5xl font-bold tracking-normal sm:text-6xl">
                Welcome to
              </h1>
              <BrandLogo
                compact
                className="mx-auto w-[min(760px,90vw)] h-auto"
              />
            </div>

            <div className="grid w-full max-w-5xl gap-5 md:grid-cols-3">
              <AppButton
                href="/login"
                variant="outline"
                size="lg"
                className="border-white bg-transparent text-white hover:bg-white hover:text-[#073f63]"
              >
                Login
              </AppButton>
              <AppButton href="/register?role=PARENT" size="lg">
                Sign Up as a Parent
              </AppButton>
              <AppButton
                href="/register?role=THERAPIST"
                variant="secondary"
                size="lg"
              >
                Sign Up as a Therapist
              </AppButton>
            </div>
          </div>

          <footer className="flex flex-wrap justify-end gap-8 text-sm text-white/90">
            <Link href="/about" className="underline-offset-4 hover:underline">
              About Neuro Bridge
            </Link>
            <Link
              href="/privacy"
              className="underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <span>&copy;Neuro Bridge 2026</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
