"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { useRouter } from "next/navigation";
import { fetchChildren } from "../store/slices/childSlice";
import AppButton from "../components/ui/AppButton";
import { DashboardPanel, EmptyState, StatCard } from "../components/ui/DashboardCards";
import GlobalMessage from "../components/ui/GlobalMessage";

const userGrowth = [
  { day: "Mon", parents: 54, therapists: 42, children: 76 },
  { day: "Tue", parents: 48, therapists: 45, children: 68 },
  { day: "Wed", parents: 49, therapists: 43, children: 65 },
  { day: "Thu", parents: 52, therapists: 58, children: 78 },
  { day: "Fri", parents: 59, therapists: 40, children: 75 },
];

const bookings = [
  { day: "Mon", sessions: 120 },
  { day: "Tue", sessions: 200 },
  { day: "Wed", sessions: 150 },
  { day: "Thu", sessions: 82 },
  { day: "Fri", sessions: 72 },
  { day: "Sat", sessions: 112 },
  { day: "Sun", sessions: 132 },
];

const revenue = [
  { month: "Jan", value: 22 },
  { month: "Feb", value: 38 },
  { month: "Mar", value: 45 },
  { month: "Apr", value: 34 },
  { month: "May", value: 78 },
  { month: "Jun", value: 80 },
  { month: "Jul", value: 72 },
  { month: "Aug", value: 68 },
  { month: "Sep", value: 44 },
  { month: "Oct", value: 49 },
  { month: "Nov", value: 54 },
  { month: "Dec", value: 74 },
];

const resourceCards = [
  { title: "Speech practice", image: "/design-assets/children-classroom.jpg" },
  { title: "Daily routines", image: "/design-assets/therapy-room.jpg" },
  { title: "Caregiver tips", image: "/design-assets/child-portrait.jpg" },
];

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { children, isLoading: childrenLoading } = useAppSelector((state) => state.child);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    dispatch(fetchChildren());
  }, [isAuthenticated, router, dispatch]);

  if (!user) return null;

  const firstName = user.firstName || "there";
  const childLabel = user.role === "PARENT" ? "Your children" : "Assigned children";
  const pendingSetup = children.filter((child) => !child.diagnosis).length;

  if (user.role === "ADMIN") {
    return (
      <div className="space-y-12">
        <section>
          <h1 className="text-4xl font-bold tracking-normal text-[#111827]">
            Welcome back <span className="text-[#073f63]">&quot;{firstName}&quot;</span> to your admin dashboard
          </h1>
          <p className="mt-4 max-w-5xl text-base text-[#3f4f5c]">
            Find out all the information about Neuro Bridge and how the platform is helping to drive
            care across the different user base of the system.
          </p>
        </section>

        <DashboardPanel
          title="Overview"
          description="Here's a summary of the impact and revenue statistics of Neuro Bridge"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <StatCard value="300" label="Users Registered" trend="(+4 today)" action={<Link href="/admin">See All Users &larr;</Link>} />
            <StatCard value="250" label="Therapy sessions so far" trend="(+15 this week)" action={<Link href="/bookings">View Therapists' Booking History &larr;</Link>} />
            <StatCard value="GH¢400,000" label="In earnings so far" trend="(+GH¢4k this week)" action={<Link href="/admin/revenue">View Revenue Income History &larr;</Link>} />
          </div>
        </DashboardPanel>

        <div className="grid gap-10 xl:grid-cols-2">
          <DashboardPanel title="User Growth" description="Check out the user growth statistics on Neuro bridge">
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={userGrowth} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid stroke="#edf4f8" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="day" axisLine={false} tickLine={false} />
                  <Bar dataKey="parents" stackId="a" fill="#073f63" />
                  <Bar dataKey="therapists" stackId="a" fill="#1f8fff" />
                  <Bar dataKey="children" stackId="a" fill="#9dcefb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Session Bookings" description="Check out the session booking metrics here">
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={bookings}>
                  <CartesianGrid stroke="#edf4f8" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Bar dataKey="sessions" fill="#0078d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel
          title="Revenue Metrics"
          description="Check out the revenue growth metrics on Neuro bridge"
          action={<Link href="/admin/revenue" className="font-semibold text-[#0078d4]">See Payments History &larr;</Link>}
        >
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#9dcefb" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#dff4ff" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Area dataKey="value" stroke="#073f63" strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!user.isApproved && (
        <GlobalMessage fixed={false} variant="warning">
          Your account is pending approval. Some features may be limited.
        </GlobalMessage>
      )}

      {user.role === "PARENT" && children.length === 0 ? (
        <section className="relative -m-4 overflow-hidden px-6 py-16 text-white sm:-m-7 sm:px-12">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/design-assets/children-classroom.jpg')" }} />
          <div className="absolute inset-0 bg-[#25311f]/65" />
          <div className="relative max-w-4xl">
            <h1 className="text-4xl font-bold tracking-normal">
              Welcome &quot;{firstName}&quot; to <span className="text-[#0bd3df]">Neuro Bridge Africa</span>
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/90">
              Add your child's profile so the Neuro Bridge team can understand their needs and begin
              matching your family with the right support.
            </p>
            <AppButton href="/children/add" className="mt-7" variant="secondary">
              Add Your Child's Profile
            </AppButton>
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-[#d7e6f2] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#111827]">
            Welcome back &quot;{firstName}&quot; to your dashboard
          </h1>
          <p className="mt-2 text-sm text-[#536471]">
            {user.role === "PARENT"
              ? "Track therapist information, session notes, and learning content for your child."
              : "Review your assigned children, bookings, and therapy session notes."}
          </p>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard value={childrenLoading ? "..." : children.length} label={childLabel} accent="teal" />
        <StatCard value={pendingSetup} label="Pending setup" accent="gold" />
        <StatCard value={user.role === "THERAPIST" ? "8" : "3"} label={user.role === "THERAPIST" ? "Bookings this week" : "Recent session notes"} accent="blue" />
      </div>

      <DashboardPanel
        title={childLabel}
        description={user.role === "PARENT" ? "Your child's profile and care information." : "Children currently assigned to your care."}
        action={<Link href="/children" className="font-semibold text-[#0078d4]">View all &larr;</Link>}
      >
        {childrenLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0078d4] border-t-transparent" />
          </div>
        ) : children.length === 0 ? (
          <EmptyState
            title={user.role === "PARENT" ? "No child profile yet" : "No assigned children yet"}
            message={user.role === "PARENT" ? "Create the first child profile to unlock intake and matching workflows." : "Assigned child profiles will appear here when the admin team links them to you."}
            action={user.role === "PARENT" && <AppButton href="/children/add">Add Child</AppButton>}
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Gender</th>
                  <th className="px-5 py-3">Diagnosis</th>
                  <th className="px-5 py-3">School</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf4f8]">
                {children.slice(0, 6).map((child) => (
                  <tr key={child.id} className="hover:bg-[#f8fbfd]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Image src="/design-assets/child-portrait.jpg" alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                        <span className="font-semibold text-[#111827]">{child.firstName} {child.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize text-[#536471]">{child.gender.toLowerCase()}</td>
                    <td className="px-5 py-4 text-[#536471]">{child.diagnosis || "Pending"}</td>
                    <td className="px-5 py-4 text-[#536471]">{child.school || "Not provided"}</td>
                    <td className="px-5 py-4">
                      <Link href={`/children/${child.id}`} className="font-semibold text-[#0078d4] hover:underline">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {user.role === "PARENT" && (
        <DashboardPanel title="Video Content to Watch" description="Helpful resources selected for caregivers.">
          <div className="grid gap-5 md:grid-cols-3">
            {resourceCards.map((resource) => (
              <Link key={resource.title} href="/resources" className="group overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
                <Image src={resource.image} alt="" width={500} height={320} className="h-36 w-full object-cover transition group-hover:scale-105" />
                <div className="p-4">
                  <p className="font-semibold text-[#123c55]">{resource.title}</p>
                  <p className="mt-1 text-xs text-[#536471]">Watch now</p>
                </div>
              </Link>
            ))}
          </div>
        </DashboardPanel>
      )}
    </div>
  );
}
