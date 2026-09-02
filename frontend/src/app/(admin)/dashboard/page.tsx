"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppButton from "../../components/ui/AppButton";
import {
  DashboardPanel,
  EmptyState,
  LoadingState,
  StatCard,
  StatusBadge,
} from "../../components/ui/DashboardCards";
import GlobalMessage from "../../components/ui/GlobalMessage";
import RoleDashboard from "../../components/role-dashboard/RoleDashboard";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { api } from "../../services/api";
import { adminApi, AdminChild, AdminParent, AdminTherapist } from "../../services/admin";
import { Booking, BookingStatus, bookingsApi } from "../../services/bookings";
import { paymentsApi, Transaction } from "../../services/payments";
import { Resource, resourcesApi } from "../../services/resources";
import { Session, sessionsApi } from "../../services/sessions";
import { fetchChildren } from "../../store/slices/childSlice";

type AdminStats = {
  totalChildren: number;
  totalParents: number;
  totalTherapists: number;
  pendingTherapists: number;
  totalSessions: number;
};

type RevenueDashboard = {
  revenue: { total: number; monthly: number };
  activeSubscriptions: number;
  totalUsers: number;
  recentTransactions: (Transaction & {
    user?: { id: string; firstName: string; lastName: string; email: string | null };
  })[];
};

const statusLabels: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const statusTones: Record<BookingStatus, "blue" | "green" | "gold" | "red"> = {
  PENDING: "gold",
  CONFIRMED: "blue",
  CANCELLED: "red",
  COMPLETED: "green",
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrencyFromPesewas(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount / 100 : 0;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

function bookingStatusData(bookings: Booking[]) {
  const counts: Record<BookingStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };

  bookings.forEach((booking) => {
    counts[booking.status] += 1;
  });

  return Object.entries(counts).map(([status, count]) => ({
    status: statusLabels[status as BookingStatus],
    count,
  }));
}

function revenueChartData(transactions: RevenueDashboard["recentTransactions"]) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return { key, month: monthLabels[date.getMonth()], revenue: 0 };
  });

  transactions.forEach((transaction) => {
    if (transaction.status !== "SUCCESS") return;
    const date = new Date(transaction.paidAt || transaction.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = months.find((item) => item.key === key);
    if (bucket) bucket.revenue += Math.round(transaction.amount / 100);
  });

  return months;
}

function firstNameLabel(firstName?: string) {
  return firstName?.trim() || "there";
}

function fullName(person?: { firstName?: string; lastName?: string; fullName?: string }) {
  return person?.fullName || `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "N/A";
}

function formatShortDate(value?: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB").replace(/\//g, "-");
}

function adminResourceImage(resource: Resource, index: number) {
  if (resource.thumbnailUrl) return resource.thumbnailUrl;
  return index % 2 === 0 ? "/design-assets/children-classroom.jpg" : "/design-assets/therapy-room.jpg";
}

const adminDashboardRoutes = {
  users: "/admin/users",
  parents: "/admin/parents",
  therapists: "/admin/therapists",
  children: "/admin/children",
  sessions: "/admin/sessions",
  content: "/admin/content",
  revenue: "/admin/revenue",
  messages: "/admin/messages",
  notifications: "/admin/notifications",
  complaints: "/admin/complaints",
};

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { children, isLoading: childrenLoading } = useAppSelector((state) => state.child);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [adminParents, setAdminParents] = useState<AdminParent[]>([]);
  const [adminTherapists, setAdminTherapists] = useState<AdminTherapist[]>([]);
  const [adminChildren, setAdminChildren] = useState<AdminChild[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    dispatch(fetchChildren());
  }, [isAuthenticated, router, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let active = true;
    const role = user.role;

    async function loadDashboardData() {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const [bookingResult, resourceResult, sessionResult] = await Promise.all([
          bookingsApi.list(),
          resourcesApi.list(),
          sessionsApi.list(),
        ]);

        if (!active) return;
        setBookings(bookingResult.bookings);
        setResources(resourceResult.resources);
        setSessions(sessionResult.sessions);

        if (role === "ADMIN") {
          const [statsResult, revenueResult, parentResult, therapistResult, childResult] = await Promise.all([
            api.get<{ stats: AdminStats }>("/admin/stats").then((response) => response.data),
            paymentsApi.revenueDashboard(),
            adminApi.parents(),
            adminApi.therapists(),
            adminApi.children(),
          ]);

          if (!active) return;
          setAdminStats(statsResult.stats);
          setRevenue(revenueResult);
          setAdminParents(parentResult.parents);
          setAdminTherapists(therapistResult.therapists);
          setAdminChildren(childResult.children);
        } else {
          setAdminStats(null);
          setRevenue(null);
          setAdminParents([]);
          setAdminTherapists([]);
          setAdminChildren([]);
        }
      } catch {
        if (!active) return;
        setDashboardError("Some dashboard data could not be loaded. Refresh the page to try again.");
      } finally {
        if (active) setDashboardLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  const bookingChart = useMemo(() => bookingStatusData(bookings), [bookings]);
  const revenueChart = useMemo(() => revenueChartData(revenue?.recentTransactions || []), [revenue]);

  if (!user) return null;

  const firstName = firstNameLabel(user.firstName);
  const childLabel = user.role === "PARENT" ? "Your children" : user.role === "THERAPIST" ? "Assigned children" : "Children";
  const pendingSetup = children.filter((child) => !child.diagnosis).length;
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING").length;
  const confirmedBookings = bookings.filter((booking) => booking.status === "CONFIRMED").length;
  const notedSessions = sessions.filter((session) => session.note).length;

  if (user.role !== "ADMIN") {
    return (
      <RoleDashboard
        bookings={bookings}
        childProfiles={children}
        resources={resources}
        sessions={sessions}
        user={user}
      />
    );
  }

  if (user.role === "ADMIN") {
    const totalUsers = revenue?.totalUsers ?? ((adminStats?.totalParents || 0) + (adminStats?.totalTherapists || 0));
    const successfulTransactions = revenue?.recentTransactions.filter((transaction) => transaction.status === "SUCCESS") || [];

    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-10">
        <section className="border-b border-[#9dc7df] pb-8">
          <h1 className="text-[32px] font-medium leading-tight tracking-normal text-[#111111] sm:text-[44px]">
            Welcome back <span className="text-[#0a3d62]">&quot;{firstName}&quot;</span> to your admin dashboard
          </h1>
          <p className="mt-4 max-w-6xl text-base leading-7 text-[#111111]">
            Find out all the information about Neuro Bridge and how the platform is helping to drive business across the different user base of the system.
          </p>
        </section>

        {dashboardError && (
          <GlobalMessage fixed={false} variant="error">
            {dashboardError}
          </GlobalMessage>
        )}

        <DashboardPanel title="Overview" description="Here's a summary of the impact and revenue statistics of Neuro Bridge">
          {dashboardLoading ? (
            <LoadingState />
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <StatCard
                value={totalUsers}
                label="Users Registered"
                trend={`(+${Math.max(adminParents.length + adminTherapists.length - totalUsers, 0)} today)`}
                action={<Link href={adminDashboardRoutes.users}>See All Platform Users -&gt;</Link>}
              />
              <StatCard
                value={adminStats?.totalSessions || sessions.length}
                label="Therapy Sessions So Far"
                trend={`(+${bookings.filter((booking) => booking.status === "CONFIRMED").length} this week)`}
                action={<Link href={adminDashboardRoutes.sessions}>View Therapy &amp; Session Management -&gt;</Link>}
              />
              <StatCard
                value={formatCurrencyFromPesewas(revenue?.revenue.total || 0)}
                label="In Earnings So Far"
                trend={`(+${formatCurrencyFromPesewas(revenue?.revenue.monthly || 0)} this month)`}
                action={<Link href={adminDashboardRoutes.revenue}>View Revenue Income History -&gt;</Link>}
              />
            </div>
          )}
        </DashboardPanel>

        <div className="grid gap-10 xl:grid-cols-2">
          <DashboardPanel title="User Accounts" description="Breakdown of parents, therapists, and child profiles currently in the system.">
            <div className="h-80 w-full border border-[#b5d3ee] bg-white p-4">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { role: "Parents", count: adminStats?.totalParents || 0 },
                    { role: "Therapists", count: adminStats?.totalTherapists || 0 },
                    { role: "Children", count: adminStats?.totalChildren || children.length },
                  ]}
                >
                  <CartesianGrid stroke="#edf4f8" />
                  <XAxis dataKey="role" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0078d4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Therapists' Bookings" description="How booked therapy sessions are moving through the platform.">
            <div className="h-80 w-full border border-[#b5d3ee] bg-white p-4">
              <ResponsiveContainer>
                <BarChart data={bookingChart}>
                  <CartesianGrid stroke="#edf4f8" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0a3d62" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel
          title="Revenue Metrics"
          description="Monthly income generated from payments and active subscription activity."
          action={<Link href={adminDashboardRoutes.revenue} className="font-semibold text-[#0078d4]">See Revenue Income History</Link>}
        >
          <div className="h-80 w-full border border-[#b5d3ee] bg-white p-4">
            <ResponsiveContainer>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#9dcefb" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#dff4ff" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf4f8" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`GHS ${value}`, "Revenue"]} />
                <Area dataKey="revenue" stroke="#073f63" strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Parents' Accounts"
          action={<Link href={adminDashboardRoutes.parents} className="text-sm font-semibold text-[#0078d4]">See All</Link>}
        >
          <div className="overflow-hidden border border-[#b5d3ee] bg-white">
            <div className="overflow-x-auto">
              <table className="admin-data-table w-full min-w-[980px] table-fixed text-left text-sm">
                <thead className="bg-[#f6fbfd] text-[#111827]">
                  <tr>
                    <th className="w-64 px-4 py-4">Parent&apos;s Full Name</th>
                    <th className="w-56 px-4 py-4">Email / Phone Number</th>
                    <th className="px-4 py-4">Children&apos;s Name(s)</th>
                    <th className="w-40 px-4 py-4">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b5d3ee]">
                  {adminParents.slice(0, 5).map((parent, index) => (
                    <tr key={parent.id} className={index === 1 ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                      <td className="px-4 py-4 font-medium text-[#111827]">{parent.fullName}</td>
                      <td className="px-4 py-4">{parent.email || parent.phone || "N/A"}</td>
                      <td className="px-4 py-4">
                        <span className="line-clamp-1">
                          {parent.children.map((child) => `${child.firstName} ${child.lastName}`).join(", ") || "No child profiles"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge tone={parent.accountStatus === "ACTIVE" ? "green" : parent.accountStatus === "DORMANT" ? "gold" : "red"}>
                          {parent.accountStatus || "INACTIVE"}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                  {adminParents.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#536471]" colSpan={4}>No parent accounts yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Therapists Accounts and Their Bookings"
          action={<Link href={adminDashboardRoutes.therapists} className="text-sm font-semibold text-[#0078d4]">See All</Link>}
        >
          <div className="overflow-hidden border border-[#b5d3ee] bg-white">
            <div className="overflow-x-auto">
              <table className="admin-data-table w-full min-w-[980px] table-fixed text-left text-sm">
                <thead className="bg-[#f6fbfd] text-[#111827]">
                  <tr>
                    <th className="w-64 px-4 py-4">Therapist&apos;s Full Name</th>
                    <th className="w-56 px-4 py-4">Email / Phone Number</th>
                    <th className="px-4 py-4">Assigned Child(ren)&apos;s Name(s)</th>
                    <th className="w-44 px-4 py-4">No of Assigned Children</th>
                    <th className="w-40 px-4 py-4">Number of Bookings</th>
                    <th className="w-32 px-4 py-4">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b5d3ee]">
                  {adminTherapists.slice(0, 5).map((therapist, index) => (
                    <tr key={therapist.id} className={index === 1 ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                      <td className="px-4 py-4 font-medium text-[#111827]">{therapist.fullName}</td>
                      <td className="px-4 py-4">{therapist.email || therapist.phone || "N/A"}</td>
                      <td className="px-4 py-4">
                        <span className="line-clamp-1">
                          {therapist.assignedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(", ") || "No assigned children"}
                        </span>
                      </td>
                      <td className="px-4 py-4">{therapist.assignedChildrenCount}</td>
                      <td className="px-4 py-4">{therapist.bookingsCount}</td>
                      <td className="px-4 py-4">
                        <StatusBadge tone={therapist.isApproved ? "green" : "gold"}>{therapist.isApproved ? "Approved" : "Pending"}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                  {adminTherapists.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#536471]" colSpan={6}>No therapist accounts yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="All Children's Data on NeuroBridge"
          action={<Link href={adminDashboardRoutes.children} className="text-sm font-semibold text-[#0078d4]">See All</Link>}
        >
          <div className="overflow-hidden border border-[#b5d3ee] bg-white">
            <div className="overflow-x-auto">
              <table className="admin-data-table w-full min-w-[1200px] table-fixed text-left text-sm">
                <thead className="bg-[#f6fbfd] text-[#111827]">
                  <tr>
                    <th className="w-20 px-4 py-4">ID</th>
                    <th className="w-56 px-4 py-4">Child&apos;s Name and Age</th>
                    <th className="w-56 px-4 py-4">Parent&apos;s Name</th>
                    <th className="w-44 px-4 py-4">Main Diagnosis</th>
                    <th className="w-56 px-4 py-4">Co-Existing Conditions</th>
                    <th className="w-52 px-4 py-4">Current Medications</th>
                    <th className="px-4 py-4">Developmental History Summary</th>
                    <th className="w-56 px-4 py-4">Assigned Therapist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b5d3ee]">
                  {adminChildren.slice(0, 5).map((child, index) => (
                    <tr key={child.id} className={index === 1 ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                      <td className="px-4 py-4">{child.shortId}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#111827]">{child.fullName}</p>
                        <p className="text-xs text-[#707070]">{child.age ?? "N/A"} years old</p>
                      </td>
                      <td className="px-4 py-4">{child.parents.map((parent) => parent.fullName).join(", ") || "Unassigned"}</td>
                      <td className="px-4 py-4">{child.diagnosis || "N/A"}</td>
                      <td className="px-4 py-4">{child.coExistingConditions || "N/A"}</td>
                      <td className="px-4 py-4">{child.currentMedications || "N/A"}</td>
                      <td className="px-4 py-4"><span className="line-clamp-2">{child.developmentalHistorySummary || "N/A"}</span></td>
                      <td className="px-4 py-4">{child.therapists.map((therapist) => therapist.fullName).join(", ") || "Unassigned"}</td>
                    </tr>
                  ))}
                  {adminChildren.length === 0 && (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#536471]" colSpan={8}>No child profiles yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardPanel>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <DashboardPanel
            title="Content Management"
            action={<Link href={adminDashboardRoutes.content} className="text-sm font-semibold text-[#0078d4]">See All</Link>}
          >
            {resources.length === 0 ? (
              <EmptyState title="No content yet" message="Uploaded learning content will appear here." />
            ) : (
              <div className="grid gap-5 md:grid-cols-3">
                {resources.slice(0, 3).map((resource, index) => (
                  <Link key={resource.id} href={adminDashboardRoutes.content} className="group overflow-hidden border border-[#b5d3ee] bg-white">
                    <div className="relative h-40">
                      <Image
                        src={adminResourceImage(resource, index)}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover brightness-75 transition group-hover:scale-105"
                      />
                      {resource.type === "VIDEO" && (
                        <span className="absolute inset-0 m-auto flex h-12 w-16 items-center justify-center rounded-xl bg-white text-[#111111]">
                          <span className="ml-1 h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-[#111111]" />
                        </span>
                      )}
                    </div>
                    <p className="p-4 text-sm font-semibold leading-6 text-[#111111]">{resource.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Revenue Income History" action={<Link href={adminDashboardRoutes.revenue} className="text-sm font-semibold text-[#0078d4]">See All</Link>}>
            {!successfulTransactions.length ? (
              <EmptyState title="No payments yet" message="Successful platform payments will appear here once transactions are verified." />
            ) : (
              <div className="overflow-hidden border border-[#b5d3ee] bg-white">
                <table className="admin-data-table w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-[#f6fbfd] text-[#111827]">
                    <tr>
                      <th className="px-4 py-4">User</th>
                      <th className="px-4 py-4">Date</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b5d3ee]">
                    {successfulTransactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-4 py-4 font-semibold text-[#111827]">
                          {transaction.user ? fullName(transaction.user) : transaction.email}
                        </td>
                        <td className="px-4 py-4">{formatShortDate(transaction.paidAt || transaction.createdAt)}</td>
                        <td className="px-4 py-4">{formatCurrencyFromPesewas(transaction.amount)}</td>
                        <td className="px-4 py-4"><StatusBadge tone="green">{transaction.status}</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardPanel>
        </div>
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

      {dashboardError && (
        <GlobalMessage fixed={false} variant="error">
          {dashboardError}
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
              Add your child&apos;s profile so the care team can understand their needs and begin matching your family with the right support.
            </p>
            <AppButton href="/children/add" className="mt-7" variant="secondary">
              Add Your Child&apos;s Profile
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
              ? "Track therapist bookings, child profiles, session notes, and resources for your family."
              : "Review assigned children, bookings, availability, and therapy session notes."}
          </p>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard value={childrenLoading ? "..." : children.length} label={childLabel} accent="teal" />
        <StatCard value={user.role === "PARENT" ? pendingSetup : pendingBookings} label={user.role === "PARENT" ? "Profiles pending setup" : "Pending bookings"} accent="gold" />
        <StatCard value={user.role === "PARENT" ? confirmedBookings : sessions.length} label={user.role === "PARENT" ? "Confirmed bookings" : "Sessions recorded"} accent="blue" />
      </div>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <DashboardPanel
          title={childLabel}
          description={user.role === "PARENT" ? "Your child profiles and care information." : "Children currently assigned to your care."}
          action={<Link href="/children" className="font-semibold text-[#0078d4]">View all</Link>}
        >
          {childrenLoading ? (
            <LoadingState />
          ) : children.length === 0 ? (
            <EmptyState
              title={user.role === "PARENT" ? "No child profile yet" : "No assigned children yet"}
              message={user.role === "PARENT" ? "Create the first child profile to unlock intake and matching workflows." : "Assigned child profiles will appear here when the admin team links them to you."}
              action={user.role === "PARENT" && <AppButton href="/children/add">Add Child</AppButton>}
            />
          ) : (
            <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
              <table className="admin-data-table w-full min-w-[720px] text-left text-sm">
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
                        <Link href={`/admin/children/${child.id}`} className="font-semibold text-[#0078d4] hover:underline">
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

        <DashboardPanel title="Booking Status" description="Your live booking workload from the backend.">
          {dashboardLoading ? (
            <LoadingState />
          ) : bookings.length === 0 ? (
            <EmptyState title="No bookings yet" message={user.role === "PARENT" ? "Book a therapist session when you are ready." : "Parent booking requests will appear here."} />
          ) : (
            <div className="space-y-3">
              {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as BookingStatus[]).map((status) => (
                <Link
                  key={status}
                  href="/bookings"
                  className="flex items-center justify-between rounded-md border border-[#d7e6f2] bg-white px-4 py-3 shadow-sm transition hover:border-[#9dcefb]"
                >
                  <StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge>
                  <span className="text-xl font-bold text-[#123c55]">
                    {bookings.filter((booking) => booking.status === status).length}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        <DashboardPanel
          title={user.role === "PARENT" ? "Caregiver Resources" : "Session Activity"}
          description={user.role === "PARENT" ? "Recently published learning content for families." : "Recent sessions and note coverage."}
          action={<Link href={user.role === "PARENT" ? "/resources" : "/children"} className="font-semibold text-[#0078d4]">Open</Link>}
        >
          {user.role === "PARENT" ? (
            resources.length === 0 ? (
              <EmptyState title="No resources yet" message="Care team resources will appear here when published." />
            ) : (
              <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-2">
                {resources.slice(0, 4).map((resource) => (
                  <Link key={resource.id} href="/resources" className="group overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
                    <Image src="/design-assets/therapy-room.jpg" alt="" width={500} height={320} className="h-32 w-full object-cover transition group-hover:scale-105" />
                    <div className="p-4">
                      <p className="font-semibold text-[#123c55]">{resource.title}</p>
                      <p className="mt-1 text-xs uppercase text-[#536471]">{resource.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard value={sessions.length} label="Sessions recorded" accent="green" />
              <StatCard value={notedSessions} label="Sessions with notes" accent="teal" />
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Recent Bookings" description="Latest booking records matched to your role.">
          {bookings.length === 0 ? (
            <EmptyState title="No booking records" message="Booking activity will appear here once sessions are requested." />
          ) : (
            <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
              <table className="admin-data-table w-full min-w-[520px] text-left text-sm">
                <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                  <tr>
                    <th className="px-5 py-3">Child</th>
                    <th className="px-5 py-3">{user.role === "PARENT" ? "Therapist" : "Parent"}</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f8]">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-5 py-4 font-semibold text-[#111827]">
                        {booking.child ? `${booking.child.firstName} ${booking.child.lastName}` : "Child profile"}
                      </td>
                      <td className="px-5 py-4 text-[#536471]">
                        {user.role === "PARENT"
                          ? booking.therapist ? `${booking.therapist.firstName} ${booking.therapist.lastName}` : "Therapist"
                          : booking.parent ? `${booking.parent.firstName} ${booking.parent.lastName}` : "Parent"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={statusTones[booking.status]}>{statusLabels[booking.status]}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
