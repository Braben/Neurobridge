"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import AppButton from "../ui/AppButton";
import { EmptyState, StatusBadge } from "../ui/DashboardCards";
import { BellIcon, MessageCircleIcon, PlusIcon, XIcon } from "../ui/Icons";
import { useAppDispatch } from "../../hooks/useRedux";
import type { Booking, BookingStatus } from "../../services/bookings";
import type { Child } from "../../services/children";
import type { Resource } from "../../services/resources";
import { Session, sessionsApi } from "../../services/sessions";
import { logoutUser } from "../../store/slices/authSlice";
import type { User } from "../../store/slices/authSlice";

type RoleDashboardProps = {
  bookings: Booking[];
  childProfiles: Child[];
  resources: Resource[];
  sessions: Session[];
  user: User;
};

const statusTones: Record<BookingStatus, "blue" | "green" | "gold" | "red"> = {
  PENDING: "gold",
  CONFIRMED: "blue",
  CANCELLED: "red",
  COMPLETED: "green",
};

function fullName(person?: { firstName?: string; lastName?: string }) {
  return `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Not assigned";
}

function isSafeDashboardImage(src?: string | null) {
  if (!src) return false;
  if (src.startsWith("/design-assets/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function localAvatar(src?: string | null): string {
  // Keep user-controlled image URLs inside the domains allowed by Next Image.
  return src && isSafeDashboardImage(src) ? src : "/design-assets/child-portrait.jpg";
}

function safeResourceImage(src: string | null | undefined, fallbackIndex: number): string {
  if (src && isSafeDashboardImage(src)) return src;
  return fallbackIndex % 2 === 0 ? "/design-assets/children-classroom.jpg" : "/design-assets/therapy-room.jpg";
}

function safeExternalHref(href?: string | null): string {
  if (!href) return "#";

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "#";
  } catch {
    return href.startsWith("/") ? href : "#";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(value));
}

function childAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Number.isFinite(age) ? `${age} years` : "Age unavailable";
}

function ParentActionIcon() {
  return <PlusIcon className="h-5 w-5 shrink-0" />;
}

const parentJourneyStages = [
  {
    title: "Parent signs up to Neuro Bridge",
    description: "You first sign up as a parent on Neuro Bridge to get internal access to our therapeutic services.",
    image: "/design-assets/child-portrait.jpg",
  },
  {
    title: "Parent fills child profile details",
    description: "After signing up, you can add your child's profile, including details relevant to their developmental journey.",
    image: "/design-assets/therapy-room.jpg",
  },
  {
    title: "Wait patiently for Neuro Bridge Admin to assign you to a therapist",
    description: "After filling your child's details, an admin will assign you to a verified therapist for you to start booking your live sessions.",
    image: "/design-assets/children-classroom.jpg",
  },
  {
    title: "Meet & Book your therapist",
    description: "After assignment, begin your sessions with the therapist and start your journey to a better future for your child.",
    image: "/design-assets/therapy-room.jpg",
  },
];

type TherapistSummary = {
  id?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  areaofexpertise?: string | null;
  email?: string | null;
  phone?: string | null;
};

function contactLine(person?: TherapistSummary) {
  return person?.email || person?.phone || "Contact will be shared after confirmation";
}

function SidebarProfile({
  isLoggingOut = false,
  onLogout,
  user,
  roleLabel,
}: {
  isLoggingOut?: boolean;
  onLogout?: () => void;
  user: User;
  roleLabel: "Parent" | "Therapist";
}) {
  const parentLinks = [
    { href: "#welcome", label: "Welcome", active: true },
    { href: "#therapist-info", label: "Your Therapist's Information" },
    { href: "#session-notes", label: "Recent Session Notes" },
    { href: "#resources", label: "Video Content to Watch" },
  ];
  const therapistLinks = [
    { href: "#welcome", label: "Welcome", active: true },
    { href: "#assigned-children", label: "Assigned Children" },
    { href: "#bookings", label: "Bookings" },
    { href: "#session-notes", label: "Add Session Notes" },
  ];
  const links = roleLabel === "Parent" ? parentLinks : therapistLinks;

  return (
    <aside className="sticky top-0 hidden min-h-screen w-[296px] shrink-0 flex-col justify-between bg-[#e0ffff] px-8 py-14 lg:flex">
      <Link href="/dashboard" aria-label="Neuro Bridge Africa dashboard">
        <Image src="/design-assets/logo-transparent.png" alt="Neuro Bridge Africa" width={210} height={64} className="h-auto w-40" />
      </Link>
      <nav className="space-y-3 text-[13px] font-medium text-[#0a3d62]">
        {links.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`block rounded-md px-4 py-2 ${item.active ? "bg-[#0a3d62] text-white" : "hover:bg-white/70"}`}
          >
            {item.label}
          </a>
        ))}
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut || !onLogout}
          className="mt-5 flex w-full items-center gap-2 border-t border-[#95cad3] px-4 py-5 text-left hover:text-[#0071d7] disabled:opacity-70"
        >
          <XIcon className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </nav>
      <div className="flex items-center gap-4">
        <Image src={localAvatar(user.avatar)} alt="" width={58} height={58} className="h-14 w-14 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#111]">{fullName(user)}</p>
          <p className="truncate text-xs text-[#405766]">{user.email || user.phone || "No contact"}</p>
          <span className="mt-1 inline-flex rounded-full bg-[#b0bec5] px-2 py-1 text-[11px] text-[#111]">{roleLabel}</span>
        </div>
      </div>
    </aside>
  );
}

function ParentMarketingHeader({ waiting }: { waiting?: boolean }) {
  return (
    <header className="flex h-[143px] items-center justify-between px-8 sm:px-14">
      <Link href="/dashboard" aria-label="Neuro Bridge Africa dashboard">
        <Image src="/design-assets/logo-transparent.png" alt="Neuro Bridge Africa" width={260} height={90} className="h-auto w-44 sm:w-56" />
      </Link>
      <div className="flex items-center gap-8 text-sm font-medium">
        <a href="#welcome" className="font-bold text-[#0071d7] underline underline-offset-2">Home</a>
        <a href="#about" className="text-[#111] hover:text-[#0071d7]">About Us</a>
        {waiting ? (
          <button disabled className="hidden h-[60px] items-center gap-2 rounded-2xl bg-[#b5d3ee] px-7 text-base font-medium text-white sm:inline-flex">
            <ParentActionIcon />
            Waiting to be Assigned a Therapist
          </button>
        ) : (
          <AppButton href="/children/add" size="lg" className="hidden sm:inline-flex" leftIcon={<ParentActionIcon />}>
            Add Your Child&apos;s Profile
          </AppButton>
        )}
      </div>
    </header>
  );
}

function ParentMarketingFooter() {
  return (
    <footer className="mt-24 flex min-h-32 items-center justify-between bg-[#0a3d62] px-8 text-white sm:px-14">
      <p className="text-3xl font-bold tracking-normal">Neuro Bridge Africa</p>
      <div className="flex flex-wrap items-center justify-end gap-8 text-sm">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/about">About Us</Link>
        <span>© 2026 Neuro Bridge Africa</span>
      </div>
    </footer>
  );
}

function ParentHero({
  action,
  notice,
  user,
}: {
  action: ReactNode;
  notice?: string;
  user: User;
}) {
  return (
    <section id="welcome" className="relative min-h-[560px] overflow-hidden px-8 py-20 text-white sm:px-14">
      <Image
        src="/design-assets/children-classroom.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      {notice && (
        <div className="absolute right-8 top-6 z-10 max-w-2xl rounded-xl bg-[#757575] px-5 py-3 text-sm leading-5 text-white shadow-lg sm:right-14">
          {notice}
        </div>
      )}
      <div className="relative max-w-6xl pt-20">
        <h1 className="text-4xl font-bold tracking-normal md:text-[56px] md:leading-[68px]">
          Welcome &quot;{user.firstName}&quot; to <span className="text-[#40e0d0]">Neuro Bridge</span> <span className="text-[#ffd700]">Africa</span>
        </h1>
        <p className="mt-6 max-w-5xl text-base leading-7 text-white/90">
          We envision a future where inclusive education is not just an aspiration but the standard practice across all communities. In this future, families everywhere will have access to the right tools, resources, and support systems that empower their children to thrive. By removing barriers and creating opportunities, we believe every child can be guided to reach their full developmental potential, unlocking talents and abilities that might otherwise remain hidden. Our commitment is to help build an environment where learning is equitable, nurturing, and designed to ensure that no child is left behind.
        </p>
        <div className="mt-7">{action}</div>
      </div>
    </section>
  );
}

function SystemWorksSection() {
  return (
    <section className="space-y-7 px-8 pt-12 sm:px-14">
      <h2 className="text-4xl font-medium tracking-normal text-[#111] md:text-5xl">How our system works</h2>
      <div className="grid gap-6 md:grid-cols-4">
        {parentJourneyStages.map((stage, index) => (
          <article key={stage.title} className="relative min-h-[326px] overflow-hidden rounded-2xl p-4 text-white">
            <Image
              src={stage.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#003333] via-[#003333]/75 to-transparent" />
            <div className="relative flex min-h-[294px] flex-col justify-end space-y-3">
              <p className="text-xl font-semibold leading-6">{index + 1}. {stage.title}</p>
              <p className="text-base leading-7 text-white/90">{stage.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutNeuroBridgeSection() {
  return (
    <section id="about" className="grid gap-8 px-8 pt-24 lg:grid-cols-[1fr_270px] sm:px-14">
      <div>
        <h2 className="text-4xl font-medium tracking-normal text-[#111] md:text-5xl">About Neuro Bridge Africa</h2>
        <p className="mt-10 border-l-4 border-[#008080] py-3 pl-4 text-base leading-8 text-[#111]">
          Neuro Bridge Africa is a digital platform designed to improve access to therapy service and special needs education across Africa. The platform equips parents, teachers, therapists, and schools with structured tools that support children with developmental and learning differences such as autism, ADHD, communication delays, and learning disabilities. Our goal is to simplify how support is delivered by providing a centralized system for assessment, therapy planning, progress tracking, and parent guidance. We believe every child deserves the opportunity to develop their abilities and participate meaningfully in education and society.
        </p>
        <AppButton href="/about" className="mt-9">Learn More</AppButton>
      </div>
      <div className="relative min-h-[268px] overflow-hidden rounded-2xl p-5 text-white">
        <Image
          src="/design-assets/therapy-room.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 280px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <p className="relative mt-28 text-xl font-medium leading-6">Get quality therapy service for your struggling child today on Neuro Bridge Africa</p>
      </div>
    </section>
  );
}

function NoteCard({ session, viewer }: { session: Session; viewer: "parent" | "therapist" }) {
  const note = session.note;
  if (!note) return null;

  return (
    <article className="rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-5 text-sm leading-6 text-[#111]">
      <div className="mb-3 flex items-center gap-3">
        <Image src={localAvatar(session.therapist.avatar)} alt="" width={42} height={42} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="font-semibold">{fullName(session.therapist)}</p>
          <p className="text-xs text-[#757575]">{formatDate(session.sessionDate)}</p>
        </div>
      </div>
      {viewer === "therapist" && <p><strong>Child:</strong> {fullName(session.child)}</p>}
      <p><strong>Goals worked on:</strong> {note.goalsWorkedOn}</p>
      <p><strong>Observations:</strong> {note.observations}</p>
      <p><strong>Recommendations:</strong> {note.recommendations}</p>
      {note.extraNotes && <p><strong>Extra Notes:</strong> {note.extraNotes}</p>}
    </article>
  );
}

function VideoResources({ resources }: { resources: Resource[] }) {
  const fallback = [
    "Understanding ADHD: Challenges and Strengths",
    "Practical Tools for Parents: Supporting ADHD at Home",
    "Focus, Energy, and Growth: ADHD Strategies for Kids",
  ];
  const videos = resources.filter((resource) => resource.type === "VIDEO").slice(0, 3);
  const items = videos.length ? videos : fallback.map((title, index) => ({ id: `fallback-${index}`, title, thumbnailUrl: null, url: "#" } as Resource));

  return (
    <section id="resources" className="space-y-5">
      <h2 className="text-[32px] font-medium tracking-normal text-[#111] md:text-5xl">Video Content to Watch</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((resource, index) => (
          <a
            key={resource.id}
            href={safeExternalHref(resource.url)}
            target={resource.url?.startsWith("http") ? "_blank" : undefined}
            rel={resource.url?.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-3 transition hover:border-[#0071d7]"
          >
            <div className="relative h-36 overflow-hidden rounded-xl">
              <Image
                src={safeResourceImage(resource.thumbnailUrl, index)}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 280px"
                className="object-cover brightness-75 transition group-hover:scale-105"
              />
              <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0a3d62]">
                <span className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-current" />
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#111]">{index + 1}. {resource.title}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function WaitingSupportModal({
  onClose,
  resources,
}: {
  onClose: () => void;
  resources: Resource[];
}) {
  const fallback = [
    "Understanding ADHD: Challenges and Strengths",
    "Practical Tools for Parents: Supporting ADHD at Home",
  ];
  const videos = resources.filter((resource) => resource.type === "VIDEO").slice(0, 2);
  const items = videos.length ? videos : fallback.map((title, index) => ({ id: `waiting-${index}`, title, thumbnailUrl: null, url: "#" } as Resource));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#152c47]/40 px-4 backdrop-blur-sm">
      <section className="w-full max-w-3xl rounded-3xl bg-[#fafafa] px-6 py-7 shadow-2xl sm:px-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support message"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e57373] text-[#bd302d] hover:bg-[#fff0f0]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <h2 className="mx-auto mt-4 max-w-2xl text-center text-2xl font-medium leading-8 text-[#111]">
          Our support team is expected to assign your child to a therapist within 24 hours. Here are some content to keep you engaged
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {items.map((resource, index) => (
            <a
              key={resource.id}
              href={safeExternalHref(resource.url)}
              target={resource.url?.startsWith("http") ? "_blank" : undefined}
              rel={resource.url?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-3 transition hover:border-[#0071d7]"
            >
              <div className="relative h-40 overflow-hidden rounded-xl">
                <Image
                  src={safeResourceImage(resource.thumbnailUrl, index)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 340px"
                  className="object-cover brightness-75"
                />
                <span className="absolute inset-0 m-auto flex h-12 w-14 items-center justify-center rounded-xl bg-white text-[#111]">
                  <span className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[12px] border-y-transparent border-l-current" />
                </span>
              </div>
              <p className="mt-3 text-base font-medium leading-7 text-[#111]">{index + 1}. {resource.title}</p>
            </a>
          ))}
        </div>
        <p className="mt-7 text-center text-base leading-7 text-[#111]">
          You can also opt to contact our support team to fast track your application
        </p>
        <div className="mt-6 flex justify-center">
          <AppButton href="/messages" className="min-w-64 rounded-2xl">
            Contact Admin
          </AppButton>
        </div>
      </section>
    </div>
  );
}

function EmptyParentDashboard({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ParentMarketingHeader />
      <ParentHero
        user={user}
        action={(
          <AppButton href="/children/add" size="lg" className="border-white text-white hover:bg-white hover:text-[#0a3d62]" variant="secondary" leftIcon={<ParentActionIcon />}>
            Add Your Child&apos;s Profile
          </AppButton>
        )}
      />
      <SystemWorksSection />
      <AboutNeuroBridgeSection />
      <ParentMarketingFooter />
    </div>
  );
}

function WaitingTherapistParentDashboard({
  child,
  resources,
  user,
}: {
  child: Child;
  resources: Resource[];
  user: User;
}) {
  const [showSupportModal, setShowSupportModal] = useState(false);
  void child;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ParentMarketingHeader waiting />
      <ParentHero
        user={user}
        notice="Our team will assign you to a therapist soon. We will email and contact you when we are done."
        action={(
          <AppButton
            type="button"
            onClick={() => setShowSupportModal(true)}
            size="lg"
            className="border-white text-white"
            variant="secondary"
            leftIcon={<ParentActionIcon />}
          >
            Waiting to be Assigned a Therapist
          </AppButton>
        )}
      />
      <SystemWorksSection />
      <AboutNeuroBridgeSection />
      <ParentMarketingFooter />
      {showSupportModal && (
        <WaitingSupportModal resources={resources} onClose={() => setShowSupportModal(false)} />
      )}
    </div>
  );
}

function ParentDashboardTopbar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-6 text-sm font-medium text-[#0a3d62] sm:gap-8">
      <Link href="/" className="hover:text-[#0071d7]">
        Home
      </Link>
      <Link href="/dashboard" className="font-bold text-[#0071d7] underline underline-offset-4">
        Dashboard
      </Link>
      <Link href="/messages" aria-label="Open messages" className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent hover:border-[#b5d3ee]">
        <MessageCircleIcon className="h-5 w-5" />
      </Link>
      <Link href="/notifications" aria-label="Open notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent hover:border-[#b5d3ee]">
        <BellIcon className="h-5 w-5" />
      </Link>
    </div>
  );
}

function ParentDashboard({ bookings, childProfiles, resources, sessions, user }: RoleDashboardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await dispatch(logoutUser());
    router.push("/login");
  }

  if (childProfiles.length === 0) {
    return <EmptyParentDashboard user={user} />;
  }

  // Parent data is sourced from protected API endpoints; these filters only shape
  // the dashboard view and do not replace backend authorization checks.
  const child = childProfiles[0];
  const assignment = child.therapists?.[0];
  const assignedBooking = bookings.find((booking) => booking.childId === child.id && booking.therapist);
  const assignedSession = sessions.find((session) => session.childId === child.id && session.therapist);
  const assignedTherapist = assignment?.therapist || assignedBooking?.therapist || assignedSession?.therapist;
  const latestBooking = bookings.find(
    (booking) => booking.childId === child.id && (!assignedTherapist?.id || booking.therapistId === assignedTherapist.id),
  );
  const notedSessions = sessions
    .filter((session) => session.childId === child.id && session.note)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  if (!assignedTherapist) {
    return <WaitingTherapistParentDashboard child={child} resources={resources} user={user} />;
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <SidebarProfile
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        user={user}
        roleLabel="Parent"
      />
      <main className="relative min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-14 lg:py-14">
        <ParentDashboardTopbar />
      <div className="mx-auto mt-10 max-w-[1040px] space-y-12">
        <section id="welcome" className="space-y-4">
          <h1 className="text-[32px] font-medium leading-tight tracking-normal text-[#111] md:text-5xl">
            Welcome to Neuro Bridge Africa, <span className="text-[#0a3d62]">&quot;{user.firstName}&quot;</span>
          </h1>
          <p className="max-w-4xl text-base leading-7 text-[#111]">
            Based on your child&apos;s information submitted, your child is suffering from {child.diagnosis || "therapist review"} and therefore needs a therapist. That is why we are here to help you.
          </p>
          <div className="flex flex-wrap gap-4">
            <AppButton href="/messages" leftIcon={<MessageCircleIcon className="h-4 w-4" />}>
              Talk to Your Therapist
            </AppButton>
            <AppButton href={`/children/${child.id}/edit`} variant="secondary">
              Edit Your Child&apos;s Profile
            </AppButton>
            <AppButton href="/children/add" variant="outline" leftIcon={<PlusIcon className="h-4 w-4" />}>
              Add a New Child&apos;s Profile
            </AppButton>
          </div>
          {latestBooking && (
            <div className="inline-flex flex-wrap items-center gap-3 rounded-xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 py-3 text-sm text-[#111]">
              <span>Latest booking</span>
              <StatusBadge tone={statusTones[latestBooking.status]}>{latestBooking.status}</StatusBadge>
              <span>{formatDate(latestBooking.slot?.specificDate)}</span>
            </div>
          )}
        </section>

        <section id="therapist-info" className="space-y-5">
          <h2 className="text-[32px] font-medium tracking-normal text-[#111] md:text-5xl">Your Therapist&apos;s Information</h2>
          <div className="grid gap-8 md:grid-cols-[minmax(240px,369px)_1fr]">
            <Image src={localAvatar(assignedTherapist.avatar)} alt="" width={369} height={369} className="aspect-square w-full rounded-2xl object-cover" />
            <div className="flex flex-col justify-between gap-6">
              <div className="space-y-5 text-sm text-[#111]">
                <div><p className="text-xl font-semibold">Name</p><p>{fullName(assignedTherapist)}</p></div>
                <div><p className="text-xl font-semibold">Age</p><p>Not provided</p></div>
                <div><p className="text-xl font-semibold">Area of Expertise</p><p>{assignedTherapist.areaofexpertise || "ADHD Specialist"}</p></div>
                <div><p className="text-xl font-semibold">Contact</p><p>{contactLine(assignedTherapist)}</p></div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-72 flex-1">
                  <label className="text-sm text-[#111]">Select a preferred date to book a session with him</label>
                  <input type="date" className="mt-2 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-sm text-[#111]" />
                </div>
                <AppButton href="/bookings/new" className="h-[60px] min-w-40 rounded-2xl">Book</AppButton>
              </div>
            </div>
          </div>
        </section>

        <section id="session-notes" className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[32px] font-medium tracking-normal text-[#111] md:text-5xl">Recent Session Notes</h2>
            <Link href={`/children/${child.id}/sessions`} className="text-sm font-semibold text-[#0a3d62]">See All</Link>
          </div>
          {notedSessions.length === 0 ? (
            <EmptyState title="No session notes yet" message="Therapist notes will appear here once sessions are completed." />
          ) : (
            <div className="space-y-4 rounded-2xl border border-[#0a3d62] p-4">
              {notedSessions.slice(0, 2).map((session) => <NoteCard key={session.id} session={session} viewer="parent" />)}
              <p className="text-right text-sm font-medium text-[#111]">
                1-{Math.min(notedSessions.length, 2)} /{notedSessions.length}
              </p>
            </div>
          )}
        </section>

        <VideoResources resources={resources} />
        <footer className="flex items-center justify-end gap-8 pb-8 pt-12 text-xs text-[#111]">
          <Link href="/privacy">Privacy Policy</Link>
          <span>© 2026 Neuro Bridge Africa</span>
        </footer>
      </div>
      <Link
        href="/messages"
        aria-label="Open chat with your therapist"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full border border-[#b5d3ee] bg-[#e8f9ff] text-[#0a3d62] shadow-lg transition hover:border-[#0071d7] hover:bg-white"
      >
        <MessageCircleIcon className="h-7 w-7" />
      </Link>
      </main>
    </div>
  );
}

function formatBookingDate(booking: Booking) {
  const rawDate = booking.slot?.specificDate;
  if (!rawDate) return "Not scheduled";

  const date = new Date(rawDate);
  if (!Number.isFinite(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");
}

function bookingTime(booking: Booking) {
  if (!booking.slot?.startTime) return "";
  return booking.slot.endTime ? `${booking.slot.startTime} - ${booking.slot.endTime}` : booking.slot.startTime;
}

function childLabel(child?: Child | Booking["child"]) {
  if (!child) return "Not assigned";
  return fullName(child);
}

function childProfileText(child: Child, key: keyof Pick<Child, "diagnosis" | "coExistingConditions" | "currentMedications" | "notes">) {
  const value = child[key];
  if (value && value.trim()) return value;
  return key === "diagnosis" ? "Pending" : "N/A";
}

function TherapistDashboardTopbar() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-6 text-sm font-medium text-[#0a3d62] sm:gap-8">
      <Link href="/" className="font-bold hover:text-[#0071d7]">
        Home
      </Link>
      <Link href="/notifications" aria-label="Open notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent hover:border-[#b5d3ee]">
        <BellIcon className="h-5 w-5" />
      </Link>
    </div>
  );
}

function TherapistSectionHeader({
  action,
  title,
}: {
  action?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 className="text-[32px] font-medium leading-tight tracking-normal text-[#111] md:text-5xl">{title}</h2>
      {action}
    </div>
  );
}

function TherapistChildSummary({
  child,
  index,
  onOpen,
}: {
  child: Child;
  index: number;
  onOpen: (child: Child) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-4">
      <div className="grid gap-6 md:grid-cols-[251px_1fr]">
        <Image
          src={localAvatar(child.profileImage)}
          alt=""
          width={251}
          height={342}
          className="h-[342px] w-full rounded-2xl object-cover"
        />
        <div className="grid gap-6 text-[#111] sm:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="text-xl font-medium">Name</p>
              <p className="mt-1 text-sm">{fullName(child)}</p>
            </div>
            <div>
              <p className="text-xl font-medium">Age</p>
              <p className="mt-1 text-sm">{childAge(child.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-xl font-medium">Main Diagnosis</p>
              <p className="mt-1 text-sm">{childProfileText(child, "diagnosis")}</p>
            </div>
            <div>
              <p className="text-xl font-medium">Co-existing Conditions</p>
              <p className="mt-1 text-sm">{childProfileText(child, "coExistingConditions")}</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xl font-medium">Current Medications</p>
              <p className="mt-1 text-sm">{childProfileText(child, "currentMedications")}</p>
            </div>
            <div>
              <p className="text-xl font-medium">Developmental History Summary</p>
              <p className="mt-1 text-sm leading-6">{childProfileText(child, "notes")}</p>
            </div>
            <button
              type="button"
              onClick={() => onOpen(child)}
              className="inline-flex h-11 w-fit items-center justify-center rounded-xl border border-[#b5d3ee] px-4 text-sm font-semibold text-[#0a3d62] transition hover:border-[#0071d7]"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-right text-sm font-medium text-[#111]">
        {index + 1}-{index + 1} /{index + 1}
      </p>
    </div>
  );
}

function TherapistEmptyAssignedChildren() {
  return (
    <div className="space-y-8">
      <p className="text-sm leading-6 text-[#111]">
        You don&apos;t have any assigned children yet. When the admin assigns you at least a child, it&apos;ll appear here.
      </p>
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl">
        <Image
          src="/design-assets/therapy-room.jpg"
          alt=""
          width={640}
          height={360}
          className="h-64 w-full object-cover"
        />
      </div>
    </div>
  );
}

function TherapistChildProfileModal({
  child,
  onClose,
}: {
  child: Child;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#152c47]/40 px-4 backdrop-blur-sm">
      <section className="w-full max-w-4xl rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-6 shadow-2xl sm:p-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-normal text-[#0a3d62]">Child&apos;s Full Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close child profile"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e57373] text-[#bd302d] hover:bg-[#fff0f0]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <TherapistChildSummary child={child} index={0} onOpen={() => undefined} />
      </section>
    </div>
  );
}

function TherapistBookingsPreview({
  bookings,
  childById,
  limit = 4,
}: {
  bookings: Booking[];
  childById: Map<string, Child>;
  limit?: number;
}) {
  const rows = bookings.slice(0, limit);

  if (rows.length === 0) {
    return <EmptyState title="No bookings yet" message="Parent booking requests will appear here." />;
  }

  return (
    <div className="overflow-x-auto border border-[#b5d3ee] bg-white">
      <table className="admin-data-table w-full min-w-[820px] text-left text-sm">
        <thead className="bg-[#fafafa]">
          <tr>
            <th className="px-4 py-4">Parent&apos;s Name</th>
            <th className="px-4 py-4">Child&apos;s Name &amp; Age</th>
            <th className="px-4 py-4">Booking Date</th>
            <th className="px-4 py-4">Payment Status</th>
            <th className="px-4 py-4">Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((booking) => {
            const profile = childById.get(booking.childId);
            return (
              <tr key={booking.id} className="border-t border-[#b5d3ee]">
                <td className="px-4 py-3 font-medium text-[#111]">{fullName(booking.parent)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Image src={localAvatar(profile?.profileImage)} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="font-medium text-[#111]">{childLabel(booking.child || profile)}</p>
                      <p className="text-xs text-[#757575]">{profile ? childAge(profile.dateOfBirth) : "Age unavailable"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-[#0071d7]">
                  {formatBookingDate(booking)}
                  {bookingTime(booking) && <span className="block text-xs font-medium text-[#757575]">{bookingTime(booking)}</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge tone={statusTones[booking.status]}>{booking.status}</StatusBadge></td>
                <td className="px-4 py-3">
                  <Link href="/bookings" className="text-[#0071d7] hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TherapistRecentNotes({
  sessions,
}: {
  sessions: Session[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="space-y-6 py-4 text-center">
        <Image
          src="/design-assets/logo-blue-card.png"
          alt=""
          width={220}
          height={120}
          className="mx-auto h-auto w-48 opacity-80"
        />
        <p className="text-sm text-[#111]">You haven&apos;t written any session notes yet for your client.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#0a3d62] p-5">
      <div className="space-y-4">
        {sessions.slice(0, 2).map((session) => <NoteCard key={session.id} session={session} viewer="therapist" />)}
      </div>
      <p className="mt-4 text-right text-sm font-medium text-[#111]">
        1-{Math.min(sessions.length, 2)} /{sessions.length}
      </p>
    </div>
  );
}

function TherapistNoteModal({
  bookings,
  childProfiles,
  onClose,
  onSaved,
}: {
  bookings: Booking[];
  childProfiles: Child[];
  onClose: () => void;
  onSaved: (session: Session) => void;
}) {
  const [form, setForm] = useState({
    childId: childProfiles[0]?.id || "",
    bookingId: "",
    goalsWorkedOn: "",
    observations: "",
    recommendations: "",
    extraNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedBookings = bookings.filter((booking) => booking.childId === form.childId && ["CONFIRMED", "COMPLETED"].includes(booking.status));

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const childIsAssigned = childProfiles.some((child) => child.id === form.childId);
    const bookingIsValid = !form.bookingId || selectedBookings.some((booking) => booking.id === form.bookingId);
    if (!childIsAssigned || !bookingIsValid) {
      setMessage("Select one of your assigned children and an eligible session before saving.");
      return;
    }

    setSaving(true);
    try {
      const created = await sessionsApi.create({
        childId: form.childId,
        bookingId: form.bookingId || null,
        sessionDate: new Date().toISOString(),
        duration: 60,
      });
      const savedNote = await sessionsApi.upsertNote(created.session.id, {
        goalsWorkedOn: form.goalsWorkedOn,
        observations: form.observations,
        recommendations: form.recommendations,
        extraNotes: form.extraNotes || null,
      });
      onSaved({ ...created.session, note: savedNote.note });
      setForm((prev) => ({ ...prev, goalsWorkedOn: "", observations: "", recommendations: "", extraNotes: "" }));
      onClose();
    } catch {
      setMessage("Unable to save the session note. Confirm this child is assigned to you and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#152c47]/40 px-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-[560px] rounded-3xl bg-[#fafafa] px-6 py-8 shadow-2xl sm:px-10">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-normal text-[#111]">Add a Session Note</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session note form"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e57373] text-[#bd302d] hover:bg-[#fff0f0]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {message && <p className="mb-5 rounded-xl bg-[#fff5dc] px-4 py-3 text-sm font-semibold text-[#946200]">{message}</p>}
        <div className="space-y-5">
          <label className="block text-sm font-medium text-[#111]">
            Child
            <select
              name="childId"
              value={form.childId}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, childId: event.target.value, bookingId: "" }));
                setMessage("");
              }}
              required
              className="mt-2 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-sm text-[#111] outline-none focus:border-[#0071d7]"
            >
              <option value="">Select the child you had the therapy session with</option>
              {childProfiles.map((child) => <option key={child.id} value={child.id}>{fullName(child)}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-[#111]">
            Session
            <select
              name="bookingId"
              value={form.bookingId}
              onChange={updateField}
              className="mt-2 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-sm text-[#111] outline-none focus:border-[#0071d7]"
            >
              <option value="">Which session do you want to leave notes on?</option>
              {selectedBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {formatBookingDate(booking)} {bookingTime(booking)}
                </option>
              ))}
            </select>
          </label>
          {[
            ["goalsWorkedOn", "Goals Worked On", "Enter the goals you worked on in the therapy session"],
            ["observations", "Your Observations", "Enter the observations you noticed during the period."],
            ["recommendations", "Your Recommendations", "Enter the recommendation you have for the parent"],
          ].map(([name, label, placeholder]) => (
            <label key={name} className="block text-sm font-medium text-[#111]">
              {label}
              <input
                name={name}
                required
                value={form[name as keyof typeof form]}
                onChange={updateField}
                placeholder={placeholder}
                className="mt-2 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-sm text-[#111] outline-none focus:border-[#0071d7]"
              />
            </label>
          ))}
          <label className="block text-sm font-medium text-[#111]">
            Extra Notes about the child to the parent
            <textarea
              name="extraNotes"
              rows={4}
              maxLength={1000}
              value={form.extraNotes}
              onChange={updateField}
              placeholder="Maximum of 1000 characters"
              className="mt-2 min-h-[120px] w-full resize-y rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 py-3 text-sm text-[#111] outline-none focus:border-[#0071d7]"
            />
          </label>
        </div>
        <AppButton type="submit" disabled={saving || !form.childId} fullWidth className="mt-7">
          {saving ? "Saving..." : "Add Session Notes"}
        </AppButton>
      </form>
    </div>
  );
}

function TherapistDashboard({ bookings, childProfiles, sessions, user }: RoleDashboardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [localSessions, setLocalSessions] = useState(sessions);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [savedMessage, setSavedMessage] = useState("");

  // The API already scopes children/bookings for the therapist. These sets keep
  // client-side selectors from mixing stale or unrelated cached records.
  const assignedChildIds = useMemo(() => new Set(childProfiles.map((child) => child.id)), [childProfiles]);
  const scopedBookings = useMemo(
    () => bookings.filter((booking) => assignedChildIds.has(booking.childId)),
    [assignedChildIds, bookings],
  );
  const childById = useMemo(() => new Map(childProfiles.map((child) => [child.id, child])), [childProfiles]);
  const notedSessions = useMemo(
    () => localSessions
      .filter((session) => session.note && assignedChildIds.has(session.childId))
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()),
    [assignedChildIds, localSessions],
  );
  const recentChild = childProfiles[0];

  async function handleLogout() {
    setIsLoggingOut(true);
    await dispatch(logoutUser());
    router.push("/login");
  }

  function handleSaved(session: Session) {
    setLocalSessions((prev) => [session, ...prev]);
    setSavedMessage("Session note saved and sent to the parent.");
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <SidebarProfile
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        user={user}
        roleLabel="Therapist"
      />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-14 lg:py-14">
        <TherapistDashboardTopbar />
        <div className="mx-auto mt-10 max-w-[1040px] space-y-12">
          <section id="welcome" className="space-y-4">
            <h1 className="max-w-4xl text-[32px] font-medium leading-tight tracking-normal text-[#111] md:text-5xl">
              Welcome back <span className="text-[#0a3d62]">&quot;{user.firstName}&quot;</span> to your therapist dashboard
            </h1>
            <p className="max-w-4xl text-sm leading-6 text-[#111]">
              Find more information about your booking schedule. View your assigned children for therapeutic works. Add session notes to be seen by the parents of the children assigned to you.
            </p>
            <div className="flex flex-wrap gap-4">
              <AppButton href="#bookings">View Your Bookings</AppButton>
              <AppButton type="button" onClick={() => setShowNoteModal(true)} variant="secondary">Add Session Notes</AppButton>
            </div>
            {savedMessage && <p className="rounded-xl bg-[#eaf8ee] px-4 py-3 text-sm font-semibold text-[#2e7d32]">{savedMessage}</p>}
          </section>

          <section id="assigned-children" className="space-y-5">
            <TherapistSectionHeader
              title="Your Assigned Children"
              action={<Link href="/children" className="font-semibold text-[#0071d7] hover:underline">See All</Link>}
            />
            {!recentChild ? (
              <TherapistEmptyAssignedChildren />
            ) : (
              <TherapistChildSummary child={recentChild} index={0} onOpen={setActiveChild} />
            )}
          </section>

          <section id="bookings" className="space-y-5">
            <TherapistSectionHeader
              title="Your Bookings"
              action={<Link href="/bookings" className="font-semibold text-[#0071d7] hover:underline">See Full Table</Link>}
            />
            <TherapistBookingsPreview bookings={scopedBookings} childById={childById} />
          </section>

          <section id="session-notes" className="space-y-7">
            <TherapistSectionHeader title="Session Notes" />
            <button
              type="button"
              onClick={() => setShowNoteModal(true)}
              disabled={childProfiles.length === 0}
              className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-[#6085a6] px-8 py-6 text-left text-sm text-[#6085a6] transition hover:border-[#0071d7] hover:text-[#0071d7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusIcon className="h-5 w-5 shrink-0" />
              Add Session Notes to your just ended meeting with a parent ...
            </button>
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-2xl font-semibold tracking-normal text-[#111]">Recent Session Notes</h3>
              <Link href="/children" className="font-semibold text-[#0071d7] hover:underline">See Full Table</Link>
            </div>
            <TherapistRecentNotes sessions={notedSessions} />
          </section>

          <footer className="flex items-center justify-end gap-8 pb-8 pt-12 text-xs text-[#111]">
            <Link href="/privacy">Privacy Policy</Link>
            <span>© 2026 Neuro Bridge Africa</span>
          </footer>
        </div>
        {showNoteModal && (
          <TherapistNoteModal
            bookings={scopedBookings}
            childProfiles={childProfiles}
            onClose={() => setShowNoteModal(false)}
            onSaved={handleSaved}
          />
        )}
        {activeChild && <TherapistChildProfileModal child={activeChild} onClose={() => setActiveChild(null)} />}
      </main>
    </div>
  );
}

export default function RoleDashboard(props: RoleDashboardProps) {
  if (props.user.role === "PARENT") return <ParentDashboard {...props} />;
  return <TherapistDashboard {...props} />;
}
