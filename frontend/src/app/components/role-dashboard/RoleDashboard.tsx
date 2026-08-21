"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import AppButton from "../ui/AppButton";
import { EmptyState, StatusBadge } from "../ui/DashboardCards";
import type { Booking, BookingStatus } from "../../services/bookings";
import type { Child } from "../../services/children";
import type { Resource } from "../../services/resources";
import { Session, sessionsApi } from "../../services/sessions";
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

function localAvatar(src?: string | null) {
  return src?.startsWith("/") ? src : "/design-assets/child-portrait.jpg";
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

function SidebarProfile({ user, roleLabel }: { user: User; roleLabel: "Parent" | "Therapist" }) {
  return (
    <aside className="sticky top-[96px] hidden h-[calc(100vh-120px)] w-[288px] shrink-0 flex-col justify-between rounded-none bg-[#e0ffff] px-7 py-10 lg:flex">
      <Link href="/dashboard" aria-label="Neuro Bridge Africa dashboard">
        <Image src="/design-assets/logo-transparent.png" alt="Neuro Bridge Africa" width={210} height={64} className="h-auto w-44" />
      </Link>
      <nav className="space-y-3 text-sm text-[#0a3d62]">
        <a href="#welcome" className="block rounded-md bg-[#0a3d62] px-4 py-2 text-white">Welcome</a>
        {roleLabel === "Parent" ? (
          <>
            <a href="#therapist-info" className="block rounded-md px-4 py-2 hover:bg-white/70">Your Therapist&apos;s Information</a>
            <a href="#session-notes" className="block rounded-md px-4 py-2 hover:bg-white/70">Recent Session Notes</a>
            <a href="#resources" className="block rounded-md px-4 py-2 hover:bg-white/70">Video Content to Watch</a>
          </>
        ) : (
          <>
            <a href="#assigned-children" className="block rounded-md px-4 py-2 hover:bg-white/70">Assigned Children</a>
            <a href="#bookings" className="block rounded-md px-4 py-2 hover:bg-white/70">Bookings</a>
            <a href="#session-notes" className="block rounded-md px-4 py-2 hover:bg-white/70">Add Session Notes</a>
          </>
        )}
        <Link href="/login" className="mt-5 block border-t border-[#95cad3] px-4 py-5 hover:text-[#0071d7]">Logout</Link>
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
      <h2 className="text-3xl font-semibold tracking-normal text-[#111]">Video Content to Watch</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((resource, index) => (
          <a key={resource.id} href={resource.url} className="group rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-3 transition hover:border-[#0071d7]">
            <div className="relative h-36 overflow-hidden rounded-xl">
              <Image
                src={resource.thumbnailUrl || (index % 2 === 0 ? "/design-assets/children-classroom.jpg" : "/design-assets/therapy-room.jpg")}
                alt=""
                fill
                className="object-cover brightness-75 transition group-hover:scale-105"
              />
              <span className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0a3d62]">Play</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#111]">{index + 1}. {resource.title}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function EmptyParentDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-10">
      <section id="welcome" className="relative -mx-4 -mt-4 overflow-hidden px-6 py-20 text-white sm:-mx-7 sm:-mt-7 sm:px-10">
        <Image src="/design-assets/children-classroom.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative max-w-5xl">
          <h1 className="text-4xl font-bold tracking-normal md:text-5xl">
            Welcome &quot;{user.firstName}&quot; to <span className="text-[#40e0d0]">Neuro Bridge</span> <span className="text-[#ffd700]">Africa</span>
          </h1>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-white/90">
            We envision a future where inclusive education is standard practice across all communities, with families connected to the right tools, resources, and support systems.
          </p>
          <AppButton href="/children/add" className="mt-7 border-white text-white hover:bg-white hover:text-[#0a3d62]" variant="secondary">
            Add Your Child&apos;s Profile
          </AppButton>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-3xl font-semibold tracking-normal text-[#111]">How our system works</h2>
        <div className="grid gap-5 md:grid-cols-4">
          {[
            "Parent signs up to Neuro Bridge",
            "Parent fills child profile details",
            "Admin assigns a verified therapist",
            "Meet and book your therapist",
          ].map((title, index) => (
            <div key={title} className="relative min-h-56 overflow-hidden rounded-2xl p-4 text-white">
              <Image src={index % 2 === 0 ? "/design-assets/child-portrait.jpg" : "/design-assets/therapy-room.jpg"} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#003333] via-[#003333]/70 to-transparent" />
              <p className="relative mt-28 text-base font-semibold">{index + 1}. {title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="text-3xl font-semibold tracking-normal text-[#111]">About Neuro Bridge Africa</h2>
          <p className="mt-5 border-l-4 border-[#008080] pl-4 text-sm leading-6 text-[#111]">
            Neuro Bridge Africa improves access to therapy services and special needs education across Africa. The platform helps parents, therapists, and schools organize assessment, therapy planning, progress tracking, and guidance.
          </p>
        </div>
        <div className="relative min-h-52 overflow-hidden rounded-2xl p-5 text-white">
          <Image src="/design-assets/therapy-room.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <p className="relative mt-24 text-base font-semibold">Get quality therapy service for your child today on Neuro Bridge Africa</p>
        </div>
      </section>
    </div>
  );
}

function ParentDashboard({ bookings, childProfiles, resources, sessions, user }: RoleDashboardProps) {
  if (childProfiles.length === 0) {
    return <EmptyParentDashboard user={user} />;
  }

  const child = childProfiles[0];
  const assignedBooking = bookings.find((booking) => booking.childId === child.id && booking.therapist);
  const notedSessions = sessions.filter((session) => session.note);

  return (
    <div className="flex gap-8">
      <SidebarProfile user={user} roleLabel="Parent" />
      <div className="min-w-0 flex-1 space-y-10">
        <section id="welcome" className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-normal text-[#111]">
            Welcome to Neuro Bridge Africa, <span className="text-[#0a3d62]">&quot;{user.firstName}&quot;</span>
          </h1>
          <p className="max-w-4xl text-sm leading-6 text-[#111]">
            Based on your child&apos;s information, {child.firstName} is currently marked for {child.diagnosis || "therapist review"}. The care team uses this profile to guide matching, sessions, and parent support.
          </p>
          <div className="flex flex-wrap gap-4">
            <AppButton href="/messages">Talk to Your Therapist</AppButton>
            <AppButton href={`/children/${child.id}/edit`} variant="secondary">Edit Your Child&apos;s Profile</AppButton>
          </div>
        </section>

        <section id="therapist-info" className="space-y-5">
          <h2 className="text-3xl font-semibold tracking-normal text-[#111]">Your Therapist&apos;s Information</h2>
          {assignedBooking?.therapist ? (
            <div className="grid gap-6 md:grid-cols-[320px_1fr]">
              <Image src="/design-assets/therapy-room.jpg" alt="" width={360} height={360} className="h-80 w-full rounded-2xl object-cover" />
              <div className="space-y-5">
                <div><p className="text-xl font-semibold">Name</p><p>{fullName(assignedBooking.therapist)}</p></div>
                <div><p className="text-xl font-semibold">Area of Expertise</p><p>{assignedBooking.therapist.lastName ? "Specialist Therapist" : "Pending"}</p></div>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-72">
                    <label className="text-sm">Select a preferred date to book a session</label>
                    <input type="date" className="mt-2 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4" />
                  </div>
                  <AppButton href="/bookings/new">Book</AppButton>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Waiting for therapist assignment" message="An admin will assign a verified therapist after reviewing the child profile." />
          )}
        </section>

        <section id="session-notes" className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-normal text-[#111]">Recent Session Notes</h2>
            <Link href="/children" className="font-semibold text-[#0a3d62]">See All</Link>
          </div>
          {notedSessions.length === 0 ? (
            <EmptyState title="No session notes yet" message="Therapist notes will appear here once sessions are completed." />
          ) : (
            <div className="rounded-2xl border border-[#0a3d62] p-5">
              {notedSessions.slice(0, 2).map((session) => <NoteCard key={session.id} session={session} viewer="parent" />)}
            </div>
          )}
        </section>

        <VideoResources resources={resources} />
      </div>
    </div>
  );
}

function TherapistNoteForm({ bookings, childProfiles, onSaved }: { bookings: Booking[]; childProfiles: Child[]; onSaved: (session: Session) => void }) {
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
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
      setMessage("Session note saved and sent to the parent.");
    } catch {
      setMessage("Unable to save the session note. Confirm this child is assigned to you and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-dashed border-[#6085a6] p-5">
      {message && <p className="rounded-md bg-[#e8f9ff] px-4 py-3 text-sm font-semibold text-[#0a3d62]">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-[#111]">
          Child
          <select value={form.childId} onChange={(event) => setForm((prev) => ({ ...prev, childId: event.target.value, bookingId: "" }))} className="mt-2 h-12 w-full rounded-xl border border-[#b5d3ee] bg-white px-3">
            {childProfiles.map((child) => <option key={child.id} value={child.id}>{child.firstName} {child.lastName}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#111]">
          Related booking
          <select value={form.bookingId} onChange={(event) => setForm((prev) => ({ ...prev, bookingId: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-[#b5d3ee] bg-white px-3">
            <option value="">No booking selected</option>
            {selectedBookings.map((booking) => <option key={booking.id} value={booking.id}>{formatDate(booking.slot?.specificDate)} {booking.slot?.startTime}</option>)}
          </select>
        </label>
      </div>
      {[
        ["goalsWorkedOn", "Goals worked on"],
        ["observations", "Observations"],
        ["recommendations", "Recommendations"],
        ["extraNotes", "Extra Notes"],
      ].map(([name, label]) => (
        <label key={name} className="block text-sm font-semibold text-[#111]">
          {label}
          <textarea
            required={name !== "extraNotes"}
            rows={name === "extraNotes" ? 4 : 2}
            value={form[name as keyof typeof form]}
            onChange={(event) => setForm((prev) => ({ ...prev, [name]: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#b5d3ee] bg-white px-4 py-3 text-sm focus:border-[#0071d7] focus:outline-none"
          />
        </label>
      ))}
      <AppButton type="submit" disabled={saving || !form.childId}>{saving ? "Saving..." : "Add Session Notes"}</AppButton>
    </form>
  );
}

function TherapistDashboard({ bookings, childProfiles, sessions, user }: RoleDashboardProps) {
  const [localSessions, setLocalSessions] = useState(sessions);
  const notedSessions = localSessions.filter((session) => session.note);
  const recentChild = childProfiles[0];

  const bookingRows = useMemo(() => bookings.slice(0, 5), [bookings]);

  return (
    <div className="flex gap-8">
      <SidebarProfile user={user} roleLabel="Therapist" />
      <div className="min-w-0 flex-1 space-y-10">
        <section id="welcome" className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-normal text-[#111]">
            Welcome back <span className="text-[#0a3d62]">&quot;{user.firstName}&quot;</span> to your therapist dashboard
          </h1>
          <p className="max-w-4xl text-sm leading-6 text-[#111]">
            Find booking schedules, review assigned children, and add session notes that parents can read after therapy sessions.
          </p>
          <div className="flex flex-wrap gap-4">
            <AppButton href="#bookings">View Your Bookings</AppButton>
            <AppButton href="#session-notes" variant="secondary">Add Session Notes</AppButton>
          </div>
        </section>

        <section id="assigned-children" className="space-y-5">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-semibold tracking-normal text-[#111]">Your Assigned Children</h2>
            <Link href="/children" className="font-semibold text-[#0071d7]">See All</Link>
          </div>
          {!recentChild ? (
            <EmptyState title="No assigned children yet" message="Assigned children will appear here after an admin links families to your account." />
          ) : (
            <div className="grid gap-5 rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-4 md:grid-cols-[220px_1fr_1fr]">
              <Image src="/design-assets/child-portrait.jpg" alt="" width={260} height={300} className="h-64 w-full rounded-xl object-cover" />
              <div className="space-y-4">
                <div><p className="text-xl font-semibold">Name</p><p>{fullName(recentChild)}</p></div>
                <div><p className="text-xl font-semibold">Age</p><p>{childAge(recentChild.dateOfBirth)}</p></div>
                <div><p className="text-xl font-semibold">Main Diagnosis</p><p>{recentChild.diagnosis || "Pending"}</p></div>
                <div><p className="text-xl font-semibold">Co-existing Conditions</p><p>{recentChild.coExistingConditions || "None"}</p></div>
              </div>
              <div className="space-y-4">
                <div><p className="text-xl font-semibold">Current Medications</p><p>{recentChild.currentMedications || "None"}</p></div>
                <div><p className="text-xl font-semibold">Developmental History Summary</p><p className="text-sm leading-6">{recentChild.notes || "No summary has been added yet."}</p></div>
              </div>
            </div>
          )}
        </section>

        <section id="bookings" className="space-y-5">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-semibold tracking-normal text-[#111]">Your Bookings</h2>
            <Link href="/bookings" className="font-semibold text-[#0071d7]">See Full Table</Link>
          </div>
          {bookingRows.length === 0 ? (
            <EmptyState title="No bookings yet" message="Parent booking requests will appear here." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-[#b5d3ee] bg-white">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[#f5f5f5]">
                  <tr>
                    <th className="px-4 py-3">Parent&apos;s Name</th>
                    <th className="px-4 py-3">Child&apos;s Name</th>
                    <th className="px-4 py-3">Booking Date</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f8]">
                  {bookingRows.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-3">{fullName(booking.parent)}</td>
                      <td className="px-4 py-3">{fullName(booking.child)}</td>
                      <td className="px-4 py-3 text-[#0071d7]">{formatDate(booking.slot?.specificDate)}</td>
                      <td className="px-4 py-3"><StatusBadge tone={statusTones[booking.status]}>{booking.status}</StatusBadge></td>
                      <td className="px-4 py-3"><Link href={`/bookings/${booking.id}`} className="text-[#0071d7]">Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section id="session-notes" className="space-y-5">
          <h2 className="text-3xl font-semibold tracking-normal text-[#111]">Session Notes</h2>
          {childProfiles.length > 0 && <TherapistNoteForm bookings={bookings} childProfiles={childProfiles} onSaved={(session) => setLocalSessions((prev) => [session, ...prev])} />}
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-semibold text-[#111]">Recent Session Notes</h3>
            <Link href="/children" className="font-semibold text-[#0071d7]">See Full Table</Link>
          </div>
          {notedSessions.length === 0 ? (
            <EmptyState title="No session notes yet" message="Use the form above after a session to share progress with parents." />
          ) : (
            <div className="rounded-2xl border border-[#0a3d62] p-5">
              {notedSessions.slice(0, 3).map((session) => <NoteCard key={session.id} session={session} viewer="therapist" />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function RoleDashboard(props: RoleDashboardProps) {
  if (props.user.role === "PARENT") return <ParentDashboard {...props} />;
  return <TherapistDashboard {...props} />;
}
