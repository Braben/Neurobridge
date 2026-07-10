const PDFDocument = require("pdfkit");
const prisma = require("../../config/prisma");

exports.generateReport = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        intakeForm: true,
        parents: { include: { parent: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const isParent = child.parents.some((cp) => cp.parentId === req.user.id);
    const isTherapist = req.user.role === "THERAPIST";
    const isAdmin = req.user.role === "ADMIN";
    if (!isParent && !isTherapist && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [sessions, goals, behaviours] = await Promise.all([
      prisma.session.findMany({
        where: { childId },
        orderBy: { sessionDate: "asc" },
        include: { note: true, therapist: { select: { firstName: true, lastName: true } } },
      }),
      prisma.goal.findMany({ where: { childId }, orderBy: { createdAt: "asc" } }),
      prisma.behaviour.findMany({
        where: { childId },
        include: { logs: { orderBy: { recordedAt: "asc" } } },
      }),
    ]);

    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const goalCounts = { NOT_STARTED: 0, IN_PROGRESS: 0, ACHIEVED: 0, ARCHIVED: 0 };
    for (const g of goals) goalCounts[g.status]++;

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${child.firstName}-${child.lastName}.pdf"`);
    doc.pipe(res);

    const font = () => doc.font("Helvetica");
    const bold = () => doc.font("Helvetica-Bold");
    const grey = () => doc.fillColor("#666");
    const black = () => doc.fillColor("#000");
    const primary = () => doc.fillColor("#2563eb");
    const section = (title) => {
      doc.moveDown(0.5);
      primary();
      bold();
      doc.fontSize(13).text(title);
      black();
      font();
      doc.moveDown(0.3);
    };

    bold();
    doc.fontSize(20).text("Neurobridge Therapy Report", { align: "center" });
    black();
    font();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, { align: "center" });
    doc.moveDown(1);

    section("Child Information");
    font();
    doc.fontSize(11).text(`Name: ${child.firstName} ${child.lastName}`);
    doc.text(`Date of Birth: ${new Date(child.dateOfBirth).toLocaleDateString("en-GB")}`);
    doc.text(`Gender: ${child.gender}`);
    if (child.diagnosis) doc.text(`Diagnosis: ${child.diagnosis}`);
    if (child.school) doc.text(`School: ${child.school}`);
    doc.moveDown(0.5);

    section("Parent / Guardian");
    font();
    for (const cp of child.parents) {
      doc.text(`${cp.parent.firstName} ${cp.parent.lastName} (${cp.parent.email})`);
    }

    if (child.intakeForm) {
      section("Intake Summary");
      font();
      doc.fontSize(10);
      doc.text(`Developmental History: ${child.intakeForm.developmentalHistory.substring(0, 300)}...`);
      doc.text(`Behaviour Concerns: ${child.intakeForm.behaviourConcerns.substring(0, 300)}...`);
      doc.text(`Parent Goals: ${child.intakeForm.parentGoals.substring(0, 300)}...`);
    }

    section("Session Summary");
    font();
    doc.fontSize(11).text(`Total Sessions: ${totalSessions}`);
    doc.text(`Total Duration: ${totalDuration} minutes`);
    doc.text(`Average Duration: ${totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0} minutes`);
    doc.moveDown(0.5);

    if (sessions.length > 0) {
      doc.fontSize(10);
      doc.text("Recent Sessions:", { underline: true });
      doc.moveDown(0.2);
      const recent = sessions.slice(-5).reverse();
      for (const s of recent) {
        doc.text(
          `  ${new Date(s.sessionDate).toLocaleDateString("en-GB")} — ${s.duration || "?"} min — ${s.therapist.firstName} ${s.therapist.lastName}`
        );
      }
    }

    section("Goals Progress");
    font();
    doc.fontSize(11).text(`Not Started: ${goalCounts.NOT_STARTED}`);
    doc.text(`In Progress: ${goalCounts.IN_PROGRESS}`);
    doc.text(`Achieved: ${goalCounts.ACHIEVED}`);
    doc.text(`Archived: ${goalCounts.ARCHIVED}`);
    doc.moveDown(0.5);

    if (goals.length > 0) {
      doc.fontSize(10);
      for (const g of goals) {
        doc.text(`  • ${g.title} — ${g.status.replace(/_/g, " ")}`);
      }
    }

    if (behaviours.length > 0) {
      section("Behaviour Tracking");
      font();
      doc.fontSize(10);
      for (const b of behaviours) {
        const avgFreq = b.logs.length > 0
          ? Math.round(b.logs.reduce((s, l) => s + l.frequency, 0) / b.logs.length)
          : 0;
        doc.text(`  • ${b.name} — ${b.logs.length} logs, avg frequency: ${avgFreq}`);
      }
    }

    section("Notes");
    font();
    doc.fontSize(10);
    if (child.notes) {
      doc.text(child.notes);
    } else {
      doc.text("No additional notes recorded.");
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#999").text("Generated by Neurobridge — Digital Therapy Platform", { align: "center" });

    doc.end();
  } catch (error) {
    next(error);
  }
};
