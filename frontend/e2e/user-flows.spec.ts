import { expect, Page, Route, test } from "@playwright/test";

type Role = "ADMIN" | "PARENT" | "THERAPIST";

type TestUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  areaofexpertise: string | null;
  role: Role;
  avatar: string | null;
  isApproved: boolean;
  createdAt: string;
};

const now = "2026-08-24T10:00:00.000Z";

const parentUser: TestUser = {
  id: "parent-e2e",
  firstName: "Adwoa",
  lastName: "Mensah",
  email: "parent.e2e@example.com",
  phone: "+233501111111",
  dateOfBirth: "1991-02-01T00:00:00.000Z",
  areaofexpertise: null,
  role: "PARENT",
  avatar: null,
  isApproved: true,
  createdAt: now,
};

const adminUser: TestUser = {
  id: "admin-e2e",
  firstName: "Akosua",
  lastName: "Admin",
  email: "admin@neurobridge.com",
  phone: "+233502222222",
  dateOfBirth: null,
  areaofexpertise: null,
  role: "ADMIN",
  avatar: null,
  isApproved: true,
  createdAt: now,
};

const therapist = {
  id: "therapist-e2e",
  firstName: "Ama",
  lastName: "Boateng",
  avatar: null,
  areaofexpertise: "Speech Therapy",
  email: "ama.therapist@example.com",
  phone: "+233503333333",
};

const resource = {
  id: "resource-video",
  title: "Practical Tools for Parents: Supporting ADHD at Home",
  description: "A parent-friendly guide.",
  type: "VIDEO",
  url: "https://example.com/watch",
  thumbnailUrl: null,
  uploadedById: "admin-e2e",
  createdAt: now,
  uploadedBy: { id: "admin-e2e", firstName: "Akosua", lastName: "Admin" },
};

const pendingTherapists = [
  {
    id: "therapist-pending",
    firstName: "Akosua",
    lastName: "Mensa",
    fullName: "Akosua Mensa",
    email: "akosua.mensa@example.com",
    phone: "+233504444444",
    dateOfBirth: "1988-05-12T00:00:00.000Z",
    age: 38,
    role: "THERAPIST",
    isApproved: false,
    areaofexpertise: "Occupational Therapy",
    avatar: null,
    accountStatus: "ACTIVE",
    createdAt: now,
    assignedChildren: [],
    assignedChildrenCount: 0,
    bookingsCount: 0,
  },
  {
    id: "therapist-approved",
    firstName: "Kojo",
    lastName: "Boateng",
    fullName: "Kojo Boateng",
    email: "kojo.boateng@example.com",
    phone: "+233505555555",
    dateOfBirth: "1984-09-02T00:00:00.000Z",
    age: 42,
    role: "THERAPIST",
    isApproved: true,
    areaofexpertise: "Speech Therapy",
    avatar: null,
    accountStatus: "ACTIVE",
    createdAt: now,
    assignedChildren: [{ id: "child-assigned", firstName: "Kofi", lastName: "Mensah" }],
    assignedChildrenCount: 1,
    bookingsCount: 3,
  },
];

function childProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "child-e2e",
    firstName: "Kofi",
    lastName: "Mensah",
    dateOfBirth: "2019-04-03T00:00:00.000Z",
    gender: "MALE",
    diagnosis: "ADHD",
    coExistingConditions: "Speech delay",
    currentMedications: "None",
    profileImage: null,
    school: null,
    notes: "Kofi responds well to visual routines.",
    supportMessage: "Please help us with communication goals.",
    createdAt: now,
    updatedAt: now,
    therapists: [],
    ...overrides,
  };
}

function childDetail(child: ReturnType<typeof childProfile>) {
  return {
    ...child,
    parents: [{
      id: "child-parent-e2e",
      parentId: parentUser.id,
      relationship: "Parent",
      parent: {
        id: parentUser.id,
        firstName: parentUser.firstName,
        lastName: parentUser.lastName,
        email: parentUser.email,
      },
    }],
    therapists: child.therapists || [],
    intakeForm: null,
    goals: [],
    sessions: [],
    behaviours: [],
  };
}

function sessionForChild() {
  return {
    id: "session-e2e",
    childId: "child-e2e",
    therapistId: therapist.id,
    bookingId: "booking-e2e",
    sessionDate: now,
    duration: 45,
    createdAt: now,
    child: { id: "child-e2e", firstName: "Kofi", lastName: "Mensah" },
    therapist,
    note: {
      id: "note-e2e",
      goalsWorkedOn: "Joint attention and turn taking",
      observations: "Kofi followed two-step instructions.",
      recommendations: "Practice picture-card choices daily.",
      extraNotes: null,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function bookingForChild() {
  return {
    id: "booking-e2e",
    slotId: "slot-e2e",
    childId: "child-e2e",
    parentId: parentUser.id,
    therapistId: therapist.id,
    status: "CONFIRMED",
    notes: "Parent requested morning session.",
    createdAt: now,
    updatedAt: now,
    child: { id: "child-e2e", firstName: "Kofi", lastName: "Mensah" },
    therapist,
    parent: { id: parentUser.id, firstName: parentUser.firstName, lastName: parentUser.lastName },
    slot: { id: "slot-e2e", startTime: "09:00", endTime: "10:00", dayOfWeek: null, specificDate: now },
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function postBody(route: Route) {
  const raw = route.request().postData();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function mockApi(page: Page, options: {
  user?: TestUser;
  children?: ReturnType<typeof childProfile>[];
  bookings?: ReturnType<typeof bookingForChild>[];
  sessions?: ReturnType<typeof sessionForChild>[];
  resources?: typeof resource[];
  therapists?: typeof pendingTherapists;
} = {}) {
  const state = {
    user: options.user || parentUser,
    children: [...(options.children || [])],
    bookings: [...(options.bookings || [])],
    sessions: [...(options.sessions || [])],
    resources: [...(options.resources || [resource])],
    therapists: [...(options.therapists || pendingTherapists)],
  };

  await page.route("**/socket.io/**", (route) => route.abort());
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();

    if (path === "/auth/login" && method === "POST") {
      return fulfillJson(route, { message: "Login successful", accessToken: "e2e-access-token", user: state.user });
    }

    if (path === "/auth/request-password-reset" && method === "POST") {
      const body = await postBody(route);
      const identifier = String(body.identifier || "parent.e2e@example.com");
      return fulfillJson(route, {
        message: "If an account exists, password reset instructions will be sent shortly.",
        resetIdentifier: identifier,
        resetChannel: identifier.includes("@") ? "EMAIL" : "SMS",
      });
    }

    if (path === "/auth/reset-password" && method === "POST") {
      return fulfillJson(route, { message: "Password reset successfully. You can now sign in." });
    }

    if (path === "/auth/send-otp" || path === "/auth/verify-otp" || path === "/auth/resend-otp") {
      return fulfillJson(route, { message: "OTP verified successfully. Account confirmed.", isApproved: true });
    }

    if (path === "/users/me") {
      return fulfillJson(route, { user: state.user });
    }

    if (path === "/children" && method === "GET") {
      return fulfillJson(route, { children: state.children });
    }

    if (path === "/children" && method === "POST") {
      const body = await postBody(route);
      const created = childProfile({
        ...body,
        id: "child-created-e2e",
        createdAt: now,
        updatedAt: now,
        therapists: [],
      });
      state.children = [created];
      return fulfillJson(route, { message: "Child created successfully", child: created }, 201);
    }

    if (path.match(/^\/children\/[^/]+\/assign$/) && method === "POST") {
      const childId = path.split("/")[2];
      const body = await postBody(route);
      const selectedTherapist = state.therapists.find((item) => item.id === body.therapistId) || state.therapists[0];
      state.children = state.children.map((child) => child.id === childId ? {
        ...child,
        therapists: [{
          id: "assignment-created-e2e",
          therapistId: selectedTherapist.id,
          assignedAt: now,
          therapist: {
            id: selectedTherapist.id,
            firstName: selectedTherapist.firstName,
            lastName: selectedTherapist.lastName,
            avatar: selectedTherapist.avatar,
            areaofexpertise: selectedTherapist.areaofexpertise,
            email: selectedTherapist.email,
            phone: selectedTherapist.phone,
          },
        }],
      } : child);
      return fulfillJson(route, {
        message: "Therapist assigned successfully",
        assignment: {
          id: "assignment-created-e2e",
          childId,
          therapistId: selectedTherapist.id,
          assignedAt: now,
        },
      });
    }

    if (path.match(/^\/children\/[^/]+$/) && method === "GET") {
      const childId = path.split("/")[2];
      const child = state.children.find((item) => item.id === childId) || state.children[0];
      return fulfillJson(route, { child: childDetail(child) });
    }

    if (path === "/upload" && method === "GET") {
      return fulfillJson(route, { attachments: [] });
    }

    if (path === "/bookings") {
      return fulfillJson(route, { bookings: state.bookings });
    }

    if (path === "/resources") {
      return fulfillJson(route, { resources: state.resources });
    }

    if (path === "/sessions") {
      return fulfillJson(route, { sessions: state.sessions });
    }

    if (path === "/admin/stats") {
      return fulfillJson(route, {
        stats: {
          totalChildren: 1,
          totalParents: 1,
          totalTherapists: state.therapists.length,
          pendingTherapists: state.therapists.filter((item) => !item.isApproved).length,
          totalSessions: state.sessions.length,
        },
      });
    }

    if (path === "/admin/parents") {
      return fulfillJson(route, {
        parents: [{
          ...parentUser,
          fullName: "Adwoa Mensah",
          age: 35,
          accountStatus: "ACTIVE",
          children: state.children.map((child) => ({ id: child.id, firstName: child.firstName, lastName: child.lastName })),
        }],
      });
    }

    if (path === "/admin/therapists" && method === "GET") {
      return fulfillJson(route, { therapists: state.therapists });
    }

    if (path.match(/^\/admin\/users\/.+\/approve$/) && method === "PATCH") {
      const id = path.split("/")[3];
      state.therapists = state.therapists.map((item) => item.id === id ? { ...item, isApproved: true } : item);
      return fulfillJson(route, { message: "Therapist approved.", user: state.therapists.find((item) => item.id === id) });
    }

    if (path === "/admin/children") {
      return fulfillJson(route, {
        children: state.children.map((child) => ({
          ...child,
          shortId: "NB-001",
          fullName: `${child.firstName} ${child.lastName}`,
          age: 7,
          developmentalHistorySummary: child.notes,
          parents: [{ ...parentUser, fullName: "Adwoa Mensah", age: 35 }],
          therapists: child.therapists?.map((assignment) => ({
            ...assignment.therapist,
            fullName: `${assignment.therapist.firstName} ${assignment.therapist.lastName}`,
            role: "THERAPIST",
            isApproved: true,
            dateOfBirth: "1988-05-12T00:00:00.000Z",
            age: 38,
            accountStatus: "ACTIVE",
            createdAt: now,
          })) || [],
        })),
      });
    }

    if (path === "/admin/sessions") {
      return fulfillJson(route, { sessions: [] });
    }

    if (path === "/payments/revenue") {
      return fulfillJson(route, {
        revenue: { total: 250000, monthly: 50000 },
        activeSubscriptions: 2,
        totalUsers: 4,
        recentTransactions: [],
      });
    }

    if (path === "/notifications/unread-count") {
      return fulfillJson(route, { unreadCount: 0 });
    }

    return fulfillJson(route, {});
  });
}

async function loginAs(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByLabel("Email / Phone Number").fill(user.email || user.phone || "");
  await page.getByLabel("Your Password").fill("TestPass123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("password reset supports email and phone/SMS handoff", async ({ page }) => {
  await mockApi(page);

  await page.goto("/forgot-password");
  await page.getByLabel("Email / Phone Number").fill("+233501111111");
  await page.getByRole("button", { name: "Get Password Reset Code" }).click();

  await expect(page.getByText("Create New Password")).toBeVisible();
  await expect(page.getByLabel("Account Email / Phone Number")).toHaveValue("+233501111111");

  await page.getByLabel("Reset Code").fill("123456");
  await page.getByRole("textbox", { name: "New Password *", exact: true }).fill("ResetPass123!");
  await page.getByRole("textbox", { name: "Confirm New Password *", exact: true }).fill("ResetPass123!");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Password Reset Successful.")).toBeVisible();
});

test("parent flow goes from empty dashboard to child profile to waiting therapist state", async ({ page }) => {
  await mockApi(page, { user: parentUser, children: [] });

  await loginAs(page, parentUser);
  await expect(page.getByText("How our system works")).toBeVisible();
  await expect(page.getByText("Your Therapist's Information")).toHaveCount(0);

  await page.getByRole("link", { name: /Add Your Child's Profile/i }).first().click();
  await expect(page.getByText("Step 1/2 - Core Child Profile Details")).toBeVisible();

  await page.getByPlaceholder("Enter your child's first name").fill("Kofi");
  await page.getByPlaceholder("Enter your child's last name").fill("Mensah");
  await page.locator('select[name="gender"]').selectOption("MALE");
  await page.locator('input[name="dateOfBirth"]').fill("2019-04-03");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByPlaceholder("Eg. Autism, ADHD, Speech delay, etc").fill("ADHD");
  await page.getByPlaceholder("Add any co-existing child health conditions").fill("Speech delay");
  await page.getByPlaceholder("Enter any medications your child is on").fill("None");
  await page.getByPlaceholder("Maximum of 1000 characters").fill("Kofi responds well to visual routines.");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Your child's information has been taken successfully")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
  await expect(page.getByText("Waiting to be Assigned a Therapist").first()).toBeVisible();
  await expect(page.getByText("Our team will assign you to a therapist soon")).toBeVisible();
});

test("assigned parent dashboard exposes therapist, session notes, resources, and booking actions", async ({ page }) => {
  const assignedChild = childProfile({
    therapists: [{ id: "assignment-e2e", therapistId: therapist.id, assignedAt: now, therapist }],
  });

  await mockApi(page, {
    user: parentUser,
    children: [assignedChild],
    bookings: [bookingForChild()],
    sessions: [sessionForChild()],
    resources: [resource],
  });

  await loginAs(page, parentUser);

  await expect(page.getByRole("heading", { name: "Your Therapist's Information" })).toBeVisible();
  await expect(page.locator("#therapist-info").getByText("Ama Boateng")).toBeVisible();
  await expect(page.getByRole("link", { name: "Talk to Your Therapist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit Your Child's Profile" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent Session Notes" })).toBeVisible();
  await expect(page.getByText("Joint attention and turn taking")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Video Content to Watch" })).toBeVisible();
  await expect(page.getByText("Practical Tools for Parents: Supporting ADHD at Home")).toBeVisible();
});

test("admin therapist accounts support search, filters, multi-select, and bulk approve", async ({ page }) => {
  await mockApi(page, {
    user: adminUser,
    children: [childProfile()],
    therapists: pendingTherapists,
  });

  await loginAs(page, adminUser);
  await page.goto("/admin/therapists");

  await expect(page.getByRole("heading", { name: "Therapists Accounts" })).toBeVisible();
  await expect(page.getByText("Akosua Mensa")).toBeVisible();
  await expect(page.getByText("Kojo Boateng")).toBeVisible();

  await page.getByPlaceholder("Search your item ...").fill("Akosua");
  await expect(page.getByText("Akosua Mensa")).toBeVisible();
  await expect(page.getByText("Kojo Boateng")).toHaveCount(0);

  await page.getByPlaceholder("Search your item ...").fill("");
  await page.getByRole("button", { name: /Filter by/i }).click();
  await page.locator("select").first().selectOption("PENDING");
  await expect(page.getByText("Akosua Mensa")).toBeVisible();
  await expect(page.getByText("Kojo Boateng")).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Select Akosua Mensa" }).click();
  await expect(page.getByText("1 therapist account selected")).toBeVisible();
  await page.getByRole("button", { name: "Approve Selected" }).click();
  await expect(page.getByText("1 therapist account(s) approved.")).toBeVisible();
});

test("admin children database supports the Figma table search, filters, and selection", async ({ page }) => {
  const approvedAssignmentTherapists = [
    ...pendingTherapists,
    {
      id: therapist.id,
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      fullName: "Ama Boateng",
      email: therapist.email,
      phone: therapist.phone,
      dateOfBirth: "1987-07-19T00:00:00.000Z",
      age: 39,
      role: "THERAPIST" as const,
      isApproved: true,
      areaofexpertise: therapist.areaofexpertise,
      avatar: therapist.avatar,
      accountStatus: "ACTIVE",
      createdAt: now,
      assignedChildren: [],
      assignedChildrenCount: 0,
      bookingsCount: 0,
    },
  ];
  const assignedChild = childProfile({
    id: "child-assigned",
    firstName: "Kofi",
    lastName: "Mensah",
    gender: "MALE",
    therapists: [{ id: "assignment-e2e", therapistId: therapist.id, assignedAt: now, therapist }],
  });
  const unassignedChild = childProfile({
    id: "child-unassigned",
    firstName: "Ama",
    lastName: "Blankson",
    gender: "FEMALE",
    notes: "Ama prefers visual schedules and consistent routines.",
    therapists: [],
  });

  await mockApi(page, {
    user: adminUser,
    children: [unassignedChild, assignedChild],
    therapists: approvedAssignmentTherapists,
  });

  await loginAs(page, adminUser);
  await page.goto("/admin/children");

  await expect(page.getByRole("heading", { name: "All Children's Data on NeuroBridge" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Child's Name and Age" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Developmental History Summary" })).toBeVisible();
  await expect(page.getByText("null")).toBeVisible();
  await expect(page.getByText("Ama Boateng")).toBeVisible();

  await page.getByRole("button", { name: "Change therapist for Kofi Mensah" }).click();
  await expect(page.getByRole("combobox").last()).toHaveValue(therapist.id);
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByPlaceholder("Search your item ...").fill("Kofi");
  await expect(page.getByText("Kofi Mensah")).toBeVisible();
  await expect(page.getByText("Ama Blankson")).toHaveCount(0);

  await page.getByPlaceholder("Search your item ...").fill("");
  await page.getByRole("button", { name: /Filter by/i }).click();
  await page.getByLabel("Filter children by therapist assignment").selectOption("UNASSIGNED");
  await expect(page.getByText("Ama Blankson")).toBeVisible();
  await expect(page.getByText("Kofi Mensah")).toHaveCount(0);

  await page.getByRole("checkbox", { name: "Select Ama Blankson" }).click();
  await expect(page.getByText("1 child profile(s) selected")).toBeVisible();

  await page.getByRole("button", { name: "Assign therapist for Ama Blankson" }).click();
  await page.getByRole("combobox").last().selectOption("therapist-approved");
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(page.getByText("Kojo Boateng has been assigned to Ama Blankson.")).toBeVisible();
});

test("admin assigns an approved therapist from a child profile", async ({ page }) => {
  await mockApi(page, {
    user: adminUser,
    children: [childProfile()],
    therapists: pendingTherapists,
  });

  await loginAs(page, adminUser);
  await page.goto("/admin/children/child-e2e");

  await expect(page.getByRole("heading", { name: "Therapists" })).toBeVisible();
  await expect(page.getByText("No therapist assigned yet.")).toBeVisible();
  await page.getByLabel("Assign an approved therapist").selectOption("therapist-approved");
  await page.getByRole("button", { name: "Assign Therapist" }).click();

  await expect(page.getByText("Kojo Boateng has been assigned to Kofi Mensah.")).toBeVisible();
  await expect(page.getByText("Speech Therapy", { exact: true })).toBeVisible();
});
