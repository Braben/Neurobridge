"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../../hooks/useRedux";
import { fetchChild } from "../../../store/slices/childSlice";
import { ArrowLeftIcon, XIcon } from "../../../components/ui/Icons";

function formatAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return "N/A";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? `${age} years` : "N/A";
}

function textOrNone(value?: string | null) {
  return value?.trim() || "None";
}

function safeProfileImage(src?: string | null) {
  if (!src) return "/design-assets/child-portrait.jpg";
  if (src.startsWith("/") || src.startsWith("https://res.cloudinary.com")) return src;
  return "/design-assets/child-portrait.jpg";
}

function DetailBlock({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <dt className="text-[20px] font-medium leading-[30px] tracking-normal text-[#111111] sm:text-2xl">
        {label}
      </dt>
      <dd className="text-base leading-7 tracking-normal text-[#111111] sm:text-lg">
        {value}
      </dd>
    </div>
  );
}

function ChildProfileLoading() {
  return (
    <main className="grid min-h-[calc(100vh-105px)] place-items-center bg-[#edf4f8] px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0a3d62] border-t-transparent" />
    </main>
  );
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentChild: child, isLoading, error } = useAppSelector((state) => state.child);

  const isAdminRoute = pathname.startsWith("/admin/");
  const childrenIndexPath = isAdminRoute ? "/admin/children" : "/children";
  const childEditPath = isAdminRoute ? `/admin/children/${id}/edit` : `/children/${id}/edit`;
  const childSessionsPath = isAdminRoute ? `/admin/children/${id}/sessions` : `/children/${id}/sessions`;
  const childIntakePath = isAdminRoute ? `/admin/children/${id}/intake` : `/children/${id}/intake`;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    dispatch(fetchChild(id));
  }, [dispatch, id, isAuthenticated, router]);

  if (isLoading || !child) {
    return <ChildProfileLoading />;
  }

  if (error) {
    return (
      <main className="grid min-h-[calc(100vh-105px)] place-items-center bg-[#edf4f8] px-4">
        <div className="w-full max-w-md border border-[#b5d3ee] bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#bd302d]">{error}</p>
          <Link href={childrenIndexPath} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0078d4] hover:underline">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Children
          </Link>
        </div>
      </main>
    );
  }

  const parentName = child.parents.length
    ? child.parents.map((parent) => `${parent.parent.firstName} ${parent.parent.lastName}`).join(", ")
    : "N/A";
  const developmentalSummary = child.intakeForm?.developmentalHistory || child.supportMessage || child.notes || "N/A";

  return (
    <main className="relative min-h-[calc(100vh-105px)] overflow-hidden bg-[#fafafa]">
      <div className="absolute inset-0 bg-[#152c47]/40 backdrop-blur-[2px]" aria-hidden="true">
        <div className="mx-auto mt-24 w-[min(1500px,calc(100%-32px))] opacity-35">
          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <ArrowLeftIcon className="h-4 w-4" />
              Go Back
            </span>
            <div className="h-12 w-[361px] max-w-[45vw] rounded-xl border border-[#b5d3ee] bg-white" />
          </div>
          <div className="grid h-[56px] grid-cols-[70px_180px_260px_240px_220px_1fr_170px_220px] border border-[#b5d3ee] bg-white text-sm font-bold text-[#111111]">
            {["ID", "Date Added", "Child's Name and Age", "Parent's Name", "Main Diagnosis", "Developmental History Summary", "View Full Profile", "Assigned Therapist"].map((header) => (
              <div key={header} className="flex items-center border-r border-[#b5d3ee] px-4 last:border-r-0">
                {header}
              </div>
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className={`grid h-[56px] grid-cols-[70px_180px_260px_240px_220px_1fr_170px_220px] border-x border-b border-[#b5d3ee] text-sm text-[#111111] ${
                index === 0 ? "bg-[#e0f4ff]" : index === 1 ? "bg-[#e0e0e0]" : "bg-white"
              }`}
            >
              <div className="border-r border-[#b5d3ee] px-4 py-4">{index === 0 ? "1374" : "3933"}</div>
              <div className="border-r border-[#b5d3ee] px-4 py-4">24-06-2026</div>
              <div className="border-r border-[#b5d3ee] px-4 py-4">{child.firstName} {child.lastName}</div>
              <div className="border-r border-[#b5d3ee] px-4 py-4">{parentName}</div>
              <div className="border-r border-[#b5d3ee] px-4 py-4">{textOrNone(child.diagnosis)}</div>
              <div className="border-r border-[#b5d3ee] px-4 py-4">Hello Neuro Bridge Africa...</div>
              <div className="border-r border-[#b5d3ee] px-4 py-4 text-center">View</div>
              <div className="px-4 py-4">Assigned Therapist</div>
            </div>
          ))}
        </div>
      </div>

      <section className="relative z-10 flex min-h-[calc(100vh-105px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[995px] rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] p-6 shadow-2xl sm:p-10">
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e0f4ff] text-xl font-bold text-[#0a3d62]" aria-hidden="true">
                {child.firstName.charAt(0)}
              </span>
              <h1 className="text-3xl font-semibold leading-tight tracking-normal text-[#0a3d62] sm:text-[40px] sm:leading-[48px]">
                Child&apos;s Full Profile
              </h1>
            </div>
            <button
              type="button"
              onClick={() => router.push(childrenIndexPath)}
              aria-label="Close child profile"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-[#e57373] text-[#e53935] hover:bg-[#fff0f0] focus:outline-none focus:ring-2 focus:ring-[#e53935]/20"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[251px_1fr] lg:items-start">
            <div className="relative h-[402px] w-full overflow-hidden rounded-2xl bg-[#d9edf8] lg:w-[251px]">
              <Image
                src={safeProfileImage(child.profileImage)}
                alt={`${child.firstName} ${child.lastName}`}
                fill
                sizes="(max-width: 1024px) calc(100vw - 80px), 251px"
                className="object-cover"
                priority
              />
            </div>

            <dl className="grid gap-x-12 gap-y-6 text-[#111111] sm:grid-cols-[minmax(190px,224px)_minmax(260px,344px)]">
              <DetailBlock label="Child's Name" value={`${child.firstName} ${child.lastName}`} />
              <DetailBlock label="Current Medications" value={textOrNone(child.currentMedications)} />
              <DetailBlock label="Parent's Name" value={parentName} />
              <DetailBlock className="sm:row-span-4" label="Developmental History Summary" value={developmentalSummary} />
              <DetailBlock label="Age" value={formatAge(child.dateOfBirth)} />
              <DetailBlock label="Main Diagnosis" value={textOrNone(child.diagnosis)} />
              <DetailBlock label="Co-existing Conditions" value={textOrNone(child.coExistingConditions)} />
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <Link href={childIntakePath} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#b5d3ee] px-4 text-sm font-semibold text-[#0a3d62] hover:border-[#0078d4] hover:text-[#0078d4]">
              Intake
            </Link>
            <Link href={childSessionsPath} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#b5d3ee] px-4 text-sm font-semibold text-[#0a3d62] hover:border-[#0078d4] hover:text-[#0078d4]">
              Sessions
            </Link>
            <Link href={childEditPath} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a3d62] px-4 text-sm font-semibold text-white hover:bg-[#0071d7]">
              Edit Profile
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
