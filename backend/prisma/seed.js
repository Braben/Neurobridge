const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const prisma = require("../src/config/prisma");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

const hash = (pw) => bcrypt.hash(pw, SALT_ROUNDS);

const checkExists = async (model, field, value) => {
  const existing = await prisma[model].findUnique({ where: { [field]: value } });
  if (existing) {
    console.log(`  SKIP: ${model}.${field} = ${value} already exists`);
    return existing;
  }
  return null;
};

const run = async () => {
  // ─────────────────────────────────────────────
  // 1. ADMIN
  // ─────────────────────────────────────────────
  console.log("\n--- Admin ---");
  let admin = await checkExists("user", "email", "admin@neurobridge.com");
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        firstName: "System",
        lastName: "Admin",
        email: "admin@neurobridge.com",
        phone: "+233500000000",
        password: await hash("Admin@123"),
        role: "ADMIN",
        isApproved: true,
      },
    });
    console.log(`  Created admin: ${admin.email} / Admin@123`);
  }

  // ─────────────────────────────────────────────
  // 2. PARENTS
  // ─────────────────────────────────────────────
  console.log("\n--- Parents ---");
  const parentsData = [
    { firstName: "Demo", lastName: "Parent", email: "parent@neurobridge.com", phone: "+233501000000", password: "Parent@123" },
    { firstName: "Sarah", lastName: "Johnson", email: "sarah@example.com", phone: "+233501000001", password: "Parent@123" },
    { firstName: "Michael", lastName: "Chen", email: "michael@example.com", phone: "+233501000002", password: "Parent@123" },
    { firstName: "Amara", lastName: "Osei", email: "amara@example.com", phone: "+233501000003", password: "Parent@123" },
  ];

  const parents = {};
  for (const p of parentsData) {
    let user = await checkExists("user", "email", p.email);
    if (!user) {
      user = await prisma.user.create({
        data: { ...p, password: await hash(p.password), role: "PARENT", isApproved: true },
      });
      console.log(`  Created parent: ${user.email} / ${p.password}`);
    }
    parents[p.firstName] = user;
  }

  // ─────────────────────────────────────────────
  // 3. THERAPISTS  (2 approved, 1 pending)
  // ─────────────────────────────────────────────
  console.log("\n--- Therapists ---");
  const therapistsData = [
    { firstName: "Demo", lastName: "Therapist", email: "therapist@neurobridge.com", phone: "+233502000000", password: "Therapist@123", areaofexpertise: "Developmental Therapy", approved: true },
    { firstName: "Emily", lastName: "Watson", email: "emily@example.com", phone: "+233502000001", password: "Therapist@123", areaofexpertise: "Speech Therapy", approved: true },
    { firstName: "James", lastName: "Agyapong", email: "james@example.com", phone: "+233502000002", password: "Therapist@123", areaofexpertise: "Occupational Therapy", approved: true },
    { firstName: "Lisa", lastName: "Park", email: "lisa@example.com", phone: "+233502000003", password: "Therapist@123", areaofexpertise: "Behavioural Therapy", approved: false },
  ];

  const therapists = {};
  for (const t of therapistsData) {
    let user = await checkExists("user", "email", t.email);
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phone: t.phone,
          password: await hash(t.password),
          role: "THERAPIST",
          areaofexpertise: t.areaofexpertise,
          isApproved: t.approved,
        },
      });
      console.log(`  Created therapist: ${user.email} / ${t.password} (${t.approved ? "approved" : "pending approval"})`);
    }
    therapists[t.firstName] = user;
  }

  // ─────────────────────────────────────────────
  // 4. CHILDREN
  // ─────────────────────────────────────────────
  console.log("\n--- Children ---");
  const childrenData = [
    { firstName: "Liam", lastName: "Johnson", dateOfBirth: new Date("2019-03-15"), gender: "MALE", diagnosis: "Autism Spectrum Disorder", school: "Sunrise Elementary", notes: "Non-verbal, responds well to visual aids", parent: "Sarah" },
    { firstName: "Ava", lastName: "Johnson", dateOfBirth: new Date("2021-07-22"), gender: "FEMALE", diagnosis: null, school: null, notes: null, parent: "Sarah" },
    { firstName: "Ethan", lastName: "Chen", dateOfBirth: new Date("2018-11-02"), gender: "MALE", diagnosis: "Developmental Delay", school: "Bright Futures Academy", notes: "Improving fine motor skills", parent: "Michael" },
    { firstName: "Nia", lastName: "Osei", dateOfBirth: new Date("2020-01-10"), gender: "FEMALE", diagnosis: "Sensory Processing Disorder", school: "Harmony School", notes: "Struggles with transitions", parent: "Amara" },
  ];

  const children = {};
  for (const c of childrenData) {
    const key = c.firstName;
    let child = await prisma.child.findFirst({
      where: { firstName: c.firstName, lastName: c.lastName, dateOfBirth: c.dateOfBirth },
    });
    if (!child) {
      child = await prisma.child.create({
        data: {
          firstName: c.firstName,
          lastName: c.lastName,
          dateOfBirth: c.dateOfBirth,
          gender: c.gender,
          diagnosis: c.diagnosis,
          school: c.school,
          notes: c.notes,
        },
      });
      console.log(`  Created child: ${c.firstName} ${c.lastName}`);
    } else {
      console.log(`  SKIP: child ${c.firstName} ${c.lastName} already exists`);
    }
    children[key] = child;

    // Link child to parent
    const parent = parents[c.parent];
    const link = await prisma.childParent.findUnique({
      where: { childId_parentId: { childId: child.id, parentId: parent.id } },
    });
    if (!link) {
      await prisma.childParent.create({ data: { childId: child.id, parentId: parent.id, relationship: "Parent" } });
      console.log(`  Linked ${c.firstName} -> parent ${c.parent}`);
    }
  }

  // ─────────────────────────────────────────────
  // 5. THERAPIST ASSIGNMENTS
  // ─────────────────────────────────────────────
  console.log("\n--- Therapist Assignments ---");
  const assignments = [
    { child: "Liam", therapist: "Emily" },
    { child: "Ethan", therapist: "James" },
    { child: "Nia", therapist: "Emily" },
    { child: "Nia", therapist: "James" },
  ];

  for (const a of assignments) {
    const child = children[a.child];
    const therapist = therapists[a.therapist];
    const exists = await prisma.therapistAssignment.findUnique({
      where: { childId_therapistId: { childId: child.id, therapistId: therapist.id } },
    });
    if (!exists) {
      await prisma.therapistAssignment.create({ data: { childId: child.id, therapistId: therapist.id } });
      console.log(`  Assigned ${a.therapist} -> ${a.child}`);
    }
  }

  // ─────────────────────────────────────────────
  // 6. INTAKE FORMS
  // ─────────────────────────────────────────────
  console.log("\n--- Intake Forms ---");
  const intakes = [
    {
      child: "Liam",
      developmentalHistory: "Liam was born full-term with no complications. Sat up at 7 months, crawled at 10 months, walked at 15 months. First words around 18 months but regressed at 24 months. Diagnosed with ASD at age 3.",
      behaviourConcerns: "Frequent meltdowns during transitions. Aggressive towards peers when overstimulated. Sensory seeking behaviours including hand-flapping and spinning.",
      parentGoals: "Improve verbal communication. Reduce meltdown frequency. Develop age-appropriate social skills with peers.",
    },
    {
      child: "Nia",
      developmentalHistory: "Nia reached all early milestones on time. Began showing sensitivity to textures and sounds around 18 months. Diagnosed with SPD at age 3 after evaluation.",
      behaviourConcerns: "Avoids certain food textures. Overwhelmed by loud environments. Difficulty with clothing seams and tags. Occasional elopement in unfamiliar settings.",
      parentGoals: "Increase tolerance for sensory-rich environments. Improve ability to self-regulate during transitions. Build coping strategies for overwhelming situations.",
    },
  ];

  for (const i of intakes) {
    const child = children[i.child];
    const exists = await prisma.intakeForm.findUnique({ where: { childId: child.id } });
    if (!exists) {
      await prisma.intakeForm.create({
        data: {
          childId: child.id,
          developmentalHistory: i.developmentalHistory,
          behaviourConcerns: i.behaviourConcerns,
          parentGoals: i.parentGoals,
        },
      });
      console.log(`  Created intake form for ${i.child}`);
    }
  }

  // ─────────────────────────────────────────────
  // 7. GOALS
  // ─────────────────────────────────────────────
  console.log("\n--- Goals ---");
  const goalsData = [
    { child: "Liam", title: "Improve verbal communication", description: "Use at least 5 spoken words or AAC signs per session to request desired items.", status: "IN_PROGRESS", creator: "Emily" },
    { child: "Liam", title: "Reduce transitional meltdowns", description: "Decrease meltdown duration during transitions from preferred to non-preferred activities.", status: "IN_PROGRESS", creator: "Emily" },
    { child: "Ethan", title: "Improve fine motor skills", description: "Successfully grasp and manipulate small objects (blocks, crayons) for 5+ minutes.", status: "NOT_STARTED", creator: "James" },
    { child: "Nia", title: "Reduce self-stimulation during tasks", description: "Complete a 10-minute seated task with fewer than 3 instances of self-stimulatory behaviour.", status: "IN_PROGRESS", creator: "Emily" },
    { child: "Nia", title: "Tolerate noisy environments", description: "Remain in a moderately noisy environment for 15 minutes without distress.", status: "NOT_STARTED", creator: "James" },
  ];

  for (const g of goalsData) {
    const child = children[g.child];
    const creator = therapists[g.creator];
    const existing = await prisma.goal.findFirst({ where: { childId: child.id, title: g.title } });
    if (!existing) {
      await prisma.goal.create({
        data: {
          childId: child.id,
          title: g.title,
          description: g.description,
          status: g.status,
          createdById: creator.id,
        },
      });
      console.log(`  Created goal: "${g.title}" for ${g.child}`);
    }
  }

  // ─────────────────────────────────────────────
  // 8. BEHAVIOURS + LOGS
  // ─────────────────────────────────────────────
  console.log("\n--- Behaviours ---");
  const behavioursData = [
    { child: "Liam", name: "Physical Aggression", description: "Hitting, pushing, or kicking peers when overstimulated or during transitions." },
    { child: "Liam", name: "Hand-flapping", description: "Repetitive hand-flapping when excited or anxious." },
    { child: "Nia", name: "Self-stimulation", description: "Rocking and humming when asked to complete non-preferred tasks." },
    { child: "Nia", name: "Tactile avoidance", description: "Refusal to touch certain textures (play-doh, sand, paint)." },
  ];

  for (const b of behavioursData) {
    const child = children[b.child];
    const existing = await prisma.behaviour.findFirst({ where: { childId: child.id, name: b.name } });
    if (!existing) {
      await prisma.behaviour.create({
        data: { childId: child.id, name: b.name, description: b.description },
      });
      console.log(`  Created behaviour: "${b.name}" for ${b.child}`);
    }
  }

  // Behaviour logs
  console.log("  Adding behaviour logs...");
  const logEntries = [
    { child: "Liam", behaviour: "Physical Aggression", frequency: 3, notes: "Occurred during morning transition from play to circle time.", date: new Date("2026-06-28") },
    { child: "Liam", behaviour: "Physical Aggression", frequency: 1, notes: "Minor incident during snack time. Redirected quickly.", date: new Date("2026-07-02") },
    { child: "Liam", behaviour: "Hand-flapping", frequency: 8, notes: "Elevated throughout the day. Possibly related to change in classroom schedule.", date: new Date("2026-06-30") },
    { child: "Nia", behaviour: "Self-stimulation", frequency: 6, notes: "Rocking observed during math worksheet task.", date: new Date("2026-07-01") },
    { child: "Nia", behaviour: "Tactile avoidance", frequency: 2, notes: "Refused finger painting activity. Offered brush as alternative — accepted.", date: new Date("2026-07-03") },
  ];

  for (const log of logEntries) {
    const child = children[log.child];
    const behaviour = await prisma.behaviour.findFirst({ where: { childId: child.id, name: log.behaviour } });
    if (behaviour) {
      const existingLog = await prisma.behaviourLog.findFirst({
        where: { behaviourId: behaviour.id, recordedAt: log.date },
      });
      if (!existingLog) {
        await prisma.behaviourLog.create({
          data: { behaviourId: behaviour.id, frequency: log.frequency, notes: log.notes, recordedAt: log.date },
        });
      }
    }
  }
  console.log("  Behaviour logs added.");

  // ─────────────────────────────────────────────
  // 9. SESSIONS + NOTES
  // ─────────────────────────────────────────────
  console.log("\n--- Sessions ---");
  const sessionsData = [
    {
      child: "Liam", therapist: "Emily", sessionDate: new Date("2026-07-01"), duration: 45,
      goalsWorkedOn: "Verbal communication — practised requesting 'more' and 'help' using AAC device. Successfully initiated 3 requests.",
      observations: "Liam was initially dysregulated (arrived from a transition). Used deep pressure and preferred song to co-regulate. Once calm, engaged well with picture cards. Attempted vocalisation 'mmmm' for 'more' twice.",
      recommendations: "Continue AAC device practice at home during snack and play. Use first-then board for transitions.",
    },
    {
      child: "Ethan", therapist: "James", sessionDate: new Date("2026-07-02"), duration: 30,
      goalsWorkedOn: "Fine motor — grasping and releasing small objects. Used tweezers to pick up pom-poms, stacked 4 blocks.",
      observations: "Ethan showed good engagement. Hand dominance is emerging (right). Able to maintain grasp for up to 2 minutes. Frustrated when blocks fell — redirected with deep breath prompt.",
      recommendations: "Practice pincer grasp with small snacks at home (cheerios, raisins). Increase block stacking to 6.",
    },
    {
      child: "Nia", therapist: "Emily", sessionDate: new Date("2026-07-03"), duration: 40,
      goalsWorkedOn: "Self-regulation during seated tasks. Used visual timer and choice board to complete a 10-minute fine motor activity.",
      observations: "Nia chose the play-doh activity (previously avoided). Needed hand-over-hand support initially, then independently rolled 3 balls. Two instances of rocking — redirected with weighted lap pad. Completed full 10 minutes.",
      recommendations: "Introduce a 'sensory break' card Nia can use independently. Continue offering preferred activities first.",
    },
  ];

  for (const s of sessionsData) {
    const child = children[s.child];
    const therapist = therapists[s.therapist];
    const existing = await prisma.session.findFirst({
      where: { childId: child.id, sessionDate: s.sessionDate, therapistId: therapist.id },
    });
    if (!existing) {
      const session = await prisma.session.create({
        data: { childId: child.id, therapistId: therapist.id, sessionDate: s.sessionDate, duration: s.duration },
      });
      await prisma.sessionNote.create({
        data: {
          sessionId: session.id,
          goalsWorkedOn: s.goalsWorkedOn,
          observations: s.observations,
          recommendations: s.recommendations,
        },
      });
      console.log(`  Created session: ${s.therapist} with ${s.child} on ${s.sessionDate.toISOString().split("T")[0]}`);
    }
  }

  // ─────────────────────────────────────────────
  // 10. CONVERSATIONS + MESSAGES
  // ─────────────────────────────────────────────
  console.log("\n--- Conversations & Messages ---");
  const conversationsData = [
    {
      participants: ["Sarah", "Emily"],
      messages: [
        { from: "Emily", content: "Hi Sarah! Liam had a great session today. He used his AAC device to request 'more' three times! I'm so proud of him.", createdAt: new Date("2026-07-01T14:30:00Z") },
        { from: "Sarah", content: "That's wonderful news! He's been more interested in the device at home too. Thank you for the visual schedule tip — it's helping with morning transitions.", createdAt: new Date("2026-07-01T16:45:00Z") },
        { from: "Emily", content: "I'm glad it's helping! Let's keep using the same first-then board at home and in sessions for consistency. I'll send home a new set of picture cards tomorrow.", createdAt: new Date("2026-07-01T17:00:00Z") },
      ],
    },
    {
      participants: ["Michael", "James"],
      messages: [
        { from: "James", content: "Hello Michael, Ethan did well in today's OT session. We worked on stacking blocks and using tweezers. His hand dominance is becoming clearer — right-handed.", createdAt: new Date("2026-07-02T11:00:00Z") },
        { from: "Michael", content: "Good to hear! We've been practising with his cereal at breakfast as you suggested. He's getting better at picking up individual pieces.", createdAt: new Date("2026-07-02T19:15:00Z") },
      ],
    },
    {
      participants: ["Amara", "Emily"],
      messages: [
        { from: "Emily", content: "Hi Amara, great progress with Nia today! She used play-doh for the first time in our session and completed a full 10-minute activity. I've added notes in the system.", createdAt: new Date("2026-07-03T13:00:00Z") },
        { from: "Amara", content: "That's amazing! She's been avoiding anything messy at home. Thank you for working with her on this.", createdAt: new Date("2026-07-03T20:30:00Z") },
        { from: "Emily", content: "You're welcome! I recommend offering her play-doh at home using the weighted lap pad first. Even 2-3 minutes is a win. Let's keep building on this.", createdAt: new Date("2026-07-03T20:45:00Z") },
      ],
    },
  ];

  for (const conv of conversationsData) {
    const parts = conv.participants.map((name) => parents[name] || therapists[name]);
    const convRecord = await prisma.conversation.create({ data: {} });

    for (const p of parts) {
      await prisma.conversationParticipant.create({
        data: { conversationId: convRecord.id, userId: p.id },
      });
    }

    for (const msg of conv.messages) {
      const sender = parents[msg.from] || therapists[msg.from];
      await prisma.message.create({
        data: {
          conversationId: convRecord.id,
          senderId: sender.id,
          content: msg.content,
          createdAt: msg.createdAt,
          isRead: true,
        },
      });
    }

    console.log(`  Created conversation: ${conv.participants.join(" ↔ ")}`);
  }

  // ─────────────────────────────────────────────
  // 11. NOTIFICATIONS (sample)
  // ─────────────────────────────────────────────
  console.log("\n--- Notifications ---");
  const notifications = [
    { user: "Emily", title: "Session Reminder", body: "You have a session with Liam Johnson tomorrow at 10:00 AM.", createdAt: new Date("2026-06-30T08:00:00Z") },
    { user: "James", title: "New Goal Assigned", body: "Ethan Chen's parent has added a new goal: 'Improve fine motor skills'.", createdAt: new Date("2026-06-29T12:00:00Z") },
    { user: "Amara", title: "Intake Form Review", body: "Your intake form for Nia has been reviewed by the therapy team.", createdAt: new Date("2026-06-28T15:30:00Z") },
  ];

  for (const n of notifications) {
    const user = therapists[n.user] || parents[n.user];
    await prisma.notification.create({
      data: { userId: user.id, title: n.title, body: n.body, createdAt: n.createdAt },
    });
  }
  console.log("  Notifications added.");

  // ─────────────────────────────────────────────
  // 12. SUBSCRIPTION PLANS
  // ─────────────────────────────────────────────
  console.log("\n--- Subscription Plans ---");
  const plans = [
    { name: "Basic", description: "Access to standard therapy sessions and progress tracking", price: 5000, duration: 30, features: ["2 sessions per week", "Progress tracking", "Basic reports"] },
    { name: "Premium", description: "Priority booking, advanced reports, and unlimited messaging", price: 12000, duration: 30, features: ["4 sessions per week", "Priority booking", "Advanced reports", "Unlimited messaging", "Resource library access"] },
    { name: "Family", description: "Full access for up to 3 children with family discount", price: 25000, duration: 30, features: ["6 sessions per week", "Up to 3 children", "Priority support", "All Premium features", "Family therapy sessions"] },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
    if (existing) {
      console.log(`  SKIP: plan ${plan.name} already exists`);
    } else {
      await prisma.subscriptionPlan.create({
        data: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
        },
      });
      console.log(`  Created plan: ${plan.name} — GHS ${plan.price / 100}`);
    }
  }

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("        SEED COMPLETE");
  console.log("═══════════════════════════════════════");
  console.log("\nAccounts:");
  console.log("  Admin:     admin@neurobridge.com / Admin@123");
  console.log("  Demo Parent: parent@neurobridge.com / Parent@123");
  console.log("  Demo Therapist: therapist@neurobridge.com / Therapist@123");
  console.log("  Parents:   sarah@example.com / Parent@123");
  console.log("             michael@example.com / Parent@123");
  console.log("             amara@example.com / Parent@123");
  console.log("  Therapists: emily@example.com / Therapist@123 (approved)");
  console.log("              james@example.com / Therapist@123 (approved)");
  console.log("              lisa@example.com / Therapist@123 (PENDING)");
  console.log("\nPending Approvals:");
  console.log("  Lisa Park (lisa@example.com) — use Admin panel to approve");
};

run()
  .catch((err) => {
    console.error("\nSeed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
