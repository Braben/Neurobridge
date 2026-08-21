import Image from "next/image";
import Link from "next/link";
import AppButton from "../../components/ui/AppButton";
import BrandLogo from "../../components/ui/BrandLogo";

const missionItems = [
  { text: "supports early identification of developmental challenges", color: "bg-[#073f63]" },
  { text: "provides structured therapy and learning tools", color: "bg-[#008c87]" },
  {
    text: "enables collaboration between parents, teachers, and therapists",
    color: "bg-[#ffb84d] text-[#1d2b36]",
  },
  {
    text: "increases access to inclusive education resources across Africa.",
    color: "bg-[#43d6c8] text-[#1d2b36]",
  },
];

const problems = [
  "limited access to trained specialists",
  "limited support resources for parents",
  "late identification of developmental delays",
  "insufficient inclusive education practices in schools",
  "lack of structured therapy planning tools",
  "fragmented communication between caregivers, therapists, and educators.",
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
        <Link href="/about" className="text-[#0078d4] underline underline-offset-4">
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
        <Link href="/privacy" className="hover:text-white hover:underline">
          Privacy Policy
        </Link>
        <Link href="/about" className="font-semibold text-white underline underline-offset-4">
          About Us
        </Link>
        <span>&copy; 2026 Neuro Bridge Africa</span>
      </div>
    </footer>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#3f3f3f] p-4 text-[#1d2b36] sm:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden bg-white">
        <PublicNav />

        <section className="relative min-h-[420px]">
          <Image
            src="/design-assets/therapy-room.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex min-h-[420px] items-center px-5 sm:px-8 lg:px-12">
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-white sm:text-5xl">
              About <span className="text-[#43d6c8]">Neuro Bridge</span>{" "}
              <span className="text-[#ffd12f]">Africa</span>
            </h1>
          </div>
        </section>

        <section className="space-y-10 px-5 py-8 text-sm leading-7 text-[#44515c] sm:px-8 lg:px-12">
          <p>
            Neuro Bridge Africa is a digital platform designed to improve access to therapy service
            and special needs education across Africa. The platform equips parents, teachers,
            therapists, and schools with structured tools that support children with developmental
            and learning differences such as autism, ADHD, communication delays, and learning
            disabilities. Our goal is to simplify how support is delivered by providing a centralised
            system for assessment, therapy planning, progress tracking, and parent guidance.
          </p>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">Our Vision</h2>
            <div className="mt-4 space-y-4 border-l-4 border-[#43d6c8] pl-4">
              <p>
                To create an Africa where every child with special needs has access to quality
                education, therapy, and support systems, regardless of location or financial
                background.
              </p>
              <p>
                We envision a future where inclusive education is standard practice and families
                have access to tools that help children reach their full developmental potential.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">Our Mission</h2>
            <p className="mt-4">
              Our mission is to improve developmental outcomes for children with special needs by
              providing a digital platform that:
            </p>
            <div className="mt-4 space-y-4">
              {missionItems.map((item, index) => (
                <p
                  key={item.text}
                  className={`rounded-md px-4 py-3 text-sm font-semibold text-white ${item.color}`}
                >
                  {index + 1}. {item.text}
                </p>
              ))}
            </div>
          </section>
        </section>

        <section className="bg-[#eaf8fc] px-5 py-8 sm:px-8 lg:px-12">
          <div className="space-y-10 text-sm leading-7 text-[#44515c]">
            <section>
              <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
                Problems We Solve in Africa
              </h2>
              <p className="mt-4">
                Many children with developmental and learning challenges in Africa face significant
                barriers to receiving appropriate support. Key challenges include:
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {problems.map((problem, index) => (
                  <p
                    key={problem}
                    className={`border-l-4 pl-4 ${
                      index % 3 === 0
                        ? "border-[#43d6c8]"
                        : index % 3 === 1
                          ? "border-[#0078d4]"
                          : "border-[#ffb84d]"
                    }`}
                  >
                    {problem}
                  </p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
                Why This Platform Was Created
              </h2>
              <p className="mt-4">
                The platform was created in response to the growing need for accessible, structured,
                and scalable support systems for children with special needs across Africa. Many
                families and schools are willing to support children but lack practical tools,
                guidance, and coordinated systems.
              </p>
              <p className="mt-4">
                Technology provides an opportunity to bridge these gaps by delivering structured
                resources that improve collaboration and consistency in how support is provided.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-semibold tracking-normal text-[#1d2b36]">
                Founder&apos;s Story
              </h2>
              <div className="mt-4 space-y-4 border-l-4 border-[#43d6c8] pl-4">
                <p>
                  The platform was founded by an education professional with experience supporting
                  children with special needs and working closely with families and schools.
                </p>
                <p>
                  Through practical experience, the founder observed recurring challenges including
                  limited access to therapy services, lack of structured intervention systems, and
                  the need for greater collaboration between caregivers and educators.
                </p>
              </div>
            </section>
          </div>
        </section>

        <PublicFooter />
      </section>
    </main>
  );
}
