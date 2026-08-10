import Image from "next/image";
import Link from "next/link";
import AppButton from "../components/ui/AppButton";
import BrandLogo from "../components/ui/BrandLogo";

const collectedInformation = [
  "User Account Information: Names, email addresses, and contact details for parents, teachers, and therapists.",
  "Student/Child Profiles: Age, developmental milestones, and specific learning needs such as autism, ADHD, or communication delays.",
  "Educational & Clinical Data: Assessment results, therapy plans, progress tracking notes, and intervention goals.",
  "Usage Data: Information on how you interact with our tools to help us improve platform functionality.",
];

const usageItems = [
  {
    title: "Personalization",
    text: "Tailoring therapy planning and guidance to the child's specific needs.",
    color: "bg-[#073f63]",
  },
  {
    title: "Progress Tracking",
    text: "Allowing parents and professionals to monitor developmental growth over time.",
    color: "bg-[#008c87]",
  },
  {
    title: "Communication",
    text: "Facilitating seamless collaboration between the support network.",
    color: "bg-[#ffb84d] text-[#1d2b36]",
  },
  {
    title: "Research & Improvement",
    text: "Using de-identified, aggregate data to improve special needs education resources across Africa.",
    color: "bg-[#43d6c8] text-[#1d2b36]",
  },
];

const dataSecurity = [
  "Encryption: Data is encrypted both in transit and at rest.",
  "Access Controls: Strict permission-based access ensures child profiles are only seen by authorized parties.",
  "Regular Audits: Continuous monitoring helps prevent unauthorized access.",
];

function PublicNav() {
  return (
    <nav className="flex min-h-20 items-center justify-between gap-6 bg-white px-5 sm:px-8 lg:px-12">
      <Link href="/" aria-label="Neuro Bridge Africa home">
        <BrandLogo compact className="w-44 sm:w-52" />
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-4 text-xs font-semibold text-[#1d2b36] sm:gap-8">
        <Link href="/" className="hover:text-[#0078d4]">
          Home
        </Link>
        <Link href="/about" className="hover:text-[#0078d4]">
          About Us
        </Link>
        <AppButton href="/login" variant="outline" size="sm" className="min-w-24">
          Login
        </AppButton>
        <AppButton href="/register" variant="secondary" size="sm" className="min-w-24">
          Sign Up
        </AppButton>
      </div>
    </nav>
  );
}

function PublicFooter() {
  return (
    <footer className="flex flex-col gap-6 bg-[#073f63] px-5 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
      <p className="text-2xl font-bold">Neuro Bridge Africa</p>
      <div className="flex flex-wrap items-center gap-6 text-xs text-white/85">
        <Link href="/privacy" className="font-semibold text-white underline underline-offset-4">
          Privacy Policy
        </Link>
        <Link href="/about" className="hover:text-white hover:underline">
          About Us
        </Link>
        <span>&copy; 2026 Neuro Bridge Africa</span>
      </div>
    </footer>
  );
}

function StripedList({ items }: { items: string[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <p
          key={item}
          className={`border-l-4 pl-4 ${
            index % 3 === 0
              ? "border-[#43d6c8]"
              : index % 3 === 1
                ? "border-[#0078d4]"
                : "border-[#ffb84d]"
          }`}
        >
          <strong>{item.split(":")[0]}:</strong>
          {item.includes(":") ? item.slice(item.indexOf(":") + 1) : ""}
        </p>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#3f3f3f] p-4 text-[#1d2b36] sm:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden bg-white">
        <PublicNav />

        <section className="relative min-h-[420px]">
          <Image
            src="/design-assets/children-classroom.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative flex min-h-[420px] flex-col justify-center px-5 sm:px-8 lg:px-12">
            <h1 className="text-4xl font-bold tracking-normal text-white sm:text-5xl">
              Privacy <span className="text-[#43d6c8]">Policy</span>
            </h1>
            <p className="mt-3 text-sm font-medium text-white/85">Effective Date: 21st April 2026</p>
          </div>
        </section>

        <section className="space-y-10 px-5 py-8 text-sm leading-7 text-[#44515c] sm:px-8 lg:px-12">
          <p>
            At Neuro Bridge Africa, we are committed to protecting the privacy of the families,
            educators, and therapists who use our platform. Because our mission involves supporting
            children with developmental and learning differences, we handle all data with the
            highest level of sensitivity and security.
          </p>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
              Information We Collect
            </h2>
            <p className="mt-4">
              To provide a structured and personalized experience, we collect the following types of
              information:
            </p>
            <div className="mt-5">
              <StripedList items={collectedInformation} />
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
              How We Use Your Information
            </h2>
            <p className="mt-4">
              We use the data collected to bridge the gap between home, school, and therapy:
            </p>
            <div className="mt-5 space-y-4">
              {usageItems.map((item) => (
                <p
                  key={item.title}
                  className={`rounded-md px-4 py-3 text-sm font-semibold text-white ${item.color}`}
                >
                  {item.title}: <span className="font-normal">{item.text}</span>
                </p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
              Data Sharing and Disclosure
            </h2>
            <p className="mt-4">
              We do not sell your personal data. Information is only shared under the following
              circumstances:
            </p>
            <div className="mt-4 space-y-3">
              <p>Authorized Access: Data is shared with parents, teachers, and therapists you have authorized.</p>
              <p>Service Providers: We may use trusted services that comply with strict processing agreements.</p>
              <p>Legal Requirements: We may disclose information if required by law or to protect users.</p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">Data Security</h2>
            <div className="mt-5">
              <StripedList items={dataSecurity} />
            </div>
          </section>
        </section>

        <section className="space-y-8 bg-[#eaf8fc] px-5 py-8 text-sm leading-7 text-[#44515c] sm:px-8 lg:px-12">
          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
              Your Rights and Choices
            </h2>
            <div className="mt-4 space-y-3">
              <p>Access & Export: Request a copy of the data stored on the platform.</p>
              <p>Correction: Update or correct inaccuracies in your profile or the child&apos;s profile.</p>
              <p>Deletion: Request permanent deletion, subject to local legal record-keeping requirements.</p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
              Children&apos;s Privacy
            </h2>
            <p className="mt-4">
              Given our focus on special needs education, we take children&apos;s privacy seriously.
              We only collect data about minors with explicit consent from a parent or legal
              guardian.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">Contact Us</h2>
            <p className="mt-4 border-l-4 border-[#ffb84d] pl-4">
              For questions regarding this policy or how your data is handled, reach us at:
              <strong> privacy@neurobridgeafrica.com</strong>
            </p>
          </section>
        </section>

        <PublicFooter />
      </section>
    </main>
  );
}
