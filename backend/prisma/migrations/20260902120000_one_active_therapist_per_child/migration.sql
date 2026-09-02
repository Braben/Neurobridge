-- The admin designs model "Assigned Therapist" as a single current value.
-- Keep the newest assignment for any child that already has several rows,
-- then enforce one active therapist assignment per child at the database level.
DELETE FROM "TherapistAssignment" existing
USING "TherapistAssignment" newer
WHERE existing."childId" = newer."childId"
  AND (
    newer."assignedAt" > existing."assignedAt"
    OR (
      newer."assignedAt" = existing."assignedAt"
      AND newer."id" > existing."id"
    )
  );

CREATE UNIQUE INDEX "TherapistAssignment_childId_key"
  ON "TherapistAssignment"("childId");

CREATE INDEX "TherapistAssignment_therapistId_idx"
  ON "TherapistAssignment"("therapistId");
