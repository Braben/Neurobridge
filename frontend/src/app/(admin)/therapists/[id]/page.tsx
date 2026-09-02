"use client";

// Therapist Profile Page — public-facing profile for a single therapist
// Shows basic info (name, avatar, expertise), aggregate stats (children assigned,
// sessions logged), and contact details. This page is linked from the resource
// library and can be shared with parents to help them choose a therapist.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "../../../hooks/useRedux";
import { therapistsApi, TherapistProfile } from "../../../services/therapists";

export default function TherapistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users; fetch therapist profile on mount
  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    therapistsApi.get(id).then((d) => setTherapist(d.therapist)).finally(() => setLoading(false));
  }, [isAuthenticated, id, router]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );

  if (!therapist) return <p className="p-6 text-gray-500">Therapist not found.</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/resources" className="text-sm text-blue-600 hover:text-blue-500">&larr; Back</Link>

      <div className="mt-4 rounded-xl bg-white p-6 shadow">
        {/* Avatar + name header — shows image or fallback initials */}
        <div className="flex items-center gap-4">
          {therapist.avatar ? (
            <Image
              src={therapist.avatar}
              alt={`${therapist.firstName} ${therapist.lastName}`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
              {therapist.firstName[0]}{therapist.lastName[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{therapist.firstName} {therapist.lastName}</h1>
            {therapist.areaofexpertise && (
              <span className="inline-block mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {therapist.areaofexpertise}
              </span>
            )}
          </div>
        </div>

        {/* Stats cards — aggregate counts at a glance */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{therapist.childCount}</p>
            <p className="text-xs text-gray-500">Children Assigned</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{therapist.sessionCount}</p>
            <p className="text-xs text-gray-500">Sessions Logged</p>
          </div>
        </div>

        {/* Contact and membership details */}
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Email:</span> {therapist.email}</p>
          <p><span className="font-medium">Phone:</span> {therapist.phone}</p>
          <p><span className="font-medium">Member since:</span> {new Date(therapist.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
