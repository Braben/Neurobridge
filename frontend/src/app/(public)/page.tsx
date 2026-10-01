"use client";

// Import the framework image component so landing assets stay optimized in production.
import Image from "next/image";
// Import the framework link component so navigation remains client-side and accessible.
import Link from "next/link";
// Import React state for the expanded FAQ row.
import { useRef, useState } from "react"; // Preserve FAQ state and guard duplicate contact submissions.
import { contactApi } from "@/app/services/contact"; // Connect the existing landing form to durable inquiry storage.
import { apiErrorMessage } from "@/app/utils/apiError"; // Keep backend rejection feedback actionable.

// Keep the landing navigation labels and anchors aligned with the Figma top menu.
const navItems = [
  { href: "#home", label: "Home" },
  { href: "#who-its-for", label: "Who’s It For?" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faqs", label: "FAQs" },
  { href: "#contact-us", label: "Contact Us" },
];

// Reuse repository image exports so hosting does not depend on expiring Figma asset URLs.
const trustedAvatars = [
  "/design-assets/child-portrait.jpg",
  "/design-assets/therapy-room.jpg",
  "/design-assets/children-classroom.jpg",
  "/design-assets/child-portrait.jpg",
];

// Map every audience row to the board's title, copy, image order, and fixed desktop proportions.
const audienceSections = [
  {
    title: "For Parents",
    image: "/design-assets/child-portrait.jpg",
    imageAlt: "Parent and child supported by Neuro Bridge",
    copy: "Neuro Bridge is designed and developed with parents in mind. On Neuro Bridge, you can find special therapists to help you with all therapy seeds for your child.",
    imageFirst: true,
  },
  {
    title: "For Therapists",
    image: "/design-assets/therapy-room.jpg",
    imageAlt: "Therapist preparing a child therapy session",
    copy: "As a therapist on Neuro Bridge, you’ll get the opportunity to work with parents who’ll serve as clients to their children. Our system is meant to help you get more child therapy clients through special assignage based on strengths in your area of specialty.",
    imageFirst: false,
  },
  {
    title: "For Schools (Coming Soon)",
    image: "/design-assets/children-classroom.jpg",
    imageAlt: "Children learning together in a classroom",
    copy: "Schools who have special needs for some kids will be able to register them on Neuro Bridge so that our special therapists can attend to them with high quality therapy services.",
    imageFirst: true,
  },
];

// Keep the therapist workflow copy identical to the three numbered steps in the Figma panel.
const therapistSteps = [
  {
    title: "Sign Up in as a Therapist",
    copy: "Create your account and submit it for approval. Our admin team will review your application to ensure everything is in order.",
  },
  {
    title: "Get Assigned Children for Therapy Session",
    copy: "Admin, upon approval, will assign children added by their parents to you whom you’ll receive bookings from for therapy sessions.",
  },
  {
    title: "Receive Bookings While Leaving Session Notes",
    copy: "Prepare for the therapy session and meet the client on time. Leave session notes visible to the parent.",
  },
];

// Keep the parent workflow copy identical to the three numbered steps in the Figma panel.
const parentSteps = [
  {
    title: "Sign Up as a Parent and Add Your Child’s Profile",
    copy: "Create your account as a parent within a few minutes. Then, add your child(ren) profile(s).",
  },
  {
    title: "Get an Assigned Therapist for Your Child",
    copy: "Depending on your child’s special condition, a specialised therapist will be assigned to your child by our support team.",
  },
  {
    title: "Book Therapy Sessions for Your Child",
    copy: "Upon getting assigned a therapist for your child, you can book/schedule a therapy session for your child with ease.",
  },
];

// Store the FAQ copy so the accordion exposes useful answers without changing the Figma layout.
const faqItems = [
  {
    question: "How do I get started on NeuroBridge as a parent?",
    answer: "Create a parent account, add your child’s profile, and wait for our support team to connect your child with the right therapist.",
  },
  {
    question: "How do therapists document session details and track progress?",
    answer: "Therapists use a dedicated Therapist Dashboard to log daily Session Notes—recording the date, target goals worked on, observations, and recommendations. They also utilize a simple Behavior Tracking tool to log specific behaviors, record their frequencies, and add notes to monitor progress over time.",
  },
  {
    question: "How do parents and therapists communicate with each other?",
    answer: "Parents and therapists can coordinate through the child’s shared care workflow, session records, bookings, and platform notifications.",
  },
  {
    question: "What role does the System Administrator play on the platform?",
    answer: "Administrators review professional applications, assign children to suitable therapists, and keep the platform’s care workflows organized.",
  },
  {
    question: "How will payments and session bookings be handled?",
    answer: "Parents can schedule available sessions for their child while the platform keeps booking and service information connected to the child’s record.",
  },
];

// Render the gradient section headings with the board's desktop title scale.
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    // Keep headings centered and aligned to the Figma Title/Title 1 line-height token.
    <h2 className="nba-display-gradient text-center text-[44px] font-medium leading-[56px] tracking-[-0.4px] md:text-[72px] md:leading-[88px]">
      {children}
    </h2>
  );
}

// Render the small progress indicator beneath each audience image.
function ProgressSwipes() {
  return (
    // Keep the indicator at the exact 51px by 12px footprint from the board.
    <div className="flex h-3 w-[51px] items-center justify-center gap-[2px]" aria-hidden="true">
      {/* Draw the active line before the two circular positions. */}
      <span className="h-px w-[23px] bg-[#0071d7]" />
      {/* Draw the first position as the active six-pixel circle. */}
      <span className="h-3 w-3 rounded-full border border-[#0071d7] bg-[#0071d7]" />
      {/* Draw the second position as the inactive outlined circle. */}
      <span className="h-3 w-3 rounded-full border border-[#0071d7] bg-transparent" />
    </div>
  );
}

// Render one audience row while preserving the alternating image and copy order from Figma.
function AudienceRow({
  title,
  image,
  imageAlt,
  copy,
  imageFirst,
}: {
  title: string;
  image: string;
  imageAlt: string;
  copy: string;
  imageFirst: boolean;
}) {
  return (
    // Keep each desktop row at the board's 710px height and 1,359px width.
    <article className="flex min-h-[710px] flex-col items-center justify-between gap-10 lg:flex-row lg:gap-20">
      {/* Keep the picture group at 575px by 710px with its 674px framed image. */}
      <div className={`flex w-full flex-col items-center gap-6 lg:w-[575px] ${imageFirst ? "lg:order-1" : "lg:order-2"}`}>
        {/* Keep the image border and radius aligned with the Figma picture component. */}
        <div className="h-[520px] w-full overflow-hidden rounded-[16px] border-4 border-[#b5d3ee] lg:h-[674px] lg:w-[575px]">
          {/* Use a local asset so production hosting remains independent of temporary Figma URLs. */}
          <Image src={image} alt={imageAlt} width={575} height={674} className="h-full w-full object-cover" />
        </div>
        {/* Keep the board's progress indicator under every picture. */}
        <ProgressSwipes />
      </div>
      {/* Keep the copy column at the board's 704px desktop width and centered vertically. */}
      <div className={`flex w-full flex-col gap-8 lg:w-[704px] ${imageFirst ? "lg:order-2" : "lg:order-1"}`}>
        {/* Match the board's gradient audience heading treatment. */}
        <h3 className="nba-display-gradient text-[44px] font-medium leading-[56px] tracking-[-0.4px] md:text-[72px] md:leading-[88px]">
          {title}
        </h3>
        {/* Match the board's 24px medium audience body copy. */}
        <p className="max-w-[704px] text-[20px] font-medium leading-[30px] tracking-[-0.1px] md:text-[24px]">{copy}</p>
      </div>
    </article>
  );
}

// Render one of the two numbered workflow panels in the How It Works section.
function HowItWorksCard({
  label,
  steps,
  reverse,
}: {
  label: string;
  steps: typeof therapistSteps;
  reverse?: boolean;
}) {
  return (
    // Keep the two desktop panels at 668px by 512px with the board's opposing blue fills.
    <div className={`w-full rounded-[24px] p-6 lg:w-[668px] ${reverse ? "bg-[linear-gradient(128deg,#9fceff_8%,#e0f4ff_106%)]" : "bg-[linear-gradient(128deg,#e0f4ff_6%,#9fceff_107%)]"}`}>
      {/* Keep the inner content inset at 23px on desktop to match the Figma card. */}
      <div className="flex min-h-[464px] flex-col gap-8">
        {/* Use the uppercase panel label from the board's Heading H5 token. */}
        <h3 className="text-[24px] font-semibold leading-[30px] tracking-[-0.15px]">{label}</h3>
        {/* Keep the three steps evenly separated by 48px as designed. */}
        <div className="flex flex-col gap-12">
          {steps.map((step, index) => (
            // Keep each number and text block aligned on a 48px number circle.
            <div key={step.title} className="flex items-start gap-4">
              {/* Render the step number using the Figma bright-blue circle. */}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0071d7] text-[24px] font-semibold leading-[30px] text-[#fafafa]">{index + 1}</span>
              {/* Keep each step's copy at the 558px desktop text width. */}
              <div className="flex min-w-0 flex-col gap-4">
                {/* Match the step title to the board's 24px semibold heading. */}
                <h4 className="text-[21px] font-semibold leading-[30px] tracking-[-0.15px] md:text-[24px]">{step.title}</h4>
                {/* Match the step description to the board's 18px regular body token. */}
                <p className="text-[17px] leading-7 md:text-[18px]">{step.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Render the board's FAQ rows with one expanded answer and keyboard-friendly buttons.
function FaqList() {
  // Keep the second FAQ open initially because that is the expanded state shown in the Figma frame.
  const [openIndex, setOpenIndex] = useState(1);

  return (
    // Keep the FAQ list inset at 90px and constrained to the board's 1,180px desktop width.
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
      {faqItems.map((item, index) => {
        // Derive the open state once so row height and answer visibility stay synchronized.
        const isOpen = openIndex === index;

        return (
          // Keep the expanded second row at 220px and collapsed rows at 104px on desktop.
          <div key={item.question} className={`overflow-hidden rounded-[16px] border border-[#b5d3ee] bg-[#f5f5f5] ${isOpen ? "lg:min-h-[220px]" : "lg:min-h-[104px]"}`}>
            {/* Use a button so screen readers and keyboard users can operate each accordion item. */}
            <button type="button" aria-expanded={isOpen} onClick={() => setOpenIndex(isOpen ? -1 : index)} className="flex min-h-[104px] w-full items-center justify-between gap-6 px-6 py-5 text-left lg:px-10">
              {/* Keep the FAQ question in the board's 16px medium body style. */}
              <span className="text-[16px] font-medium leading-6">{item.question}</span>
              {/* Use a familiar 24px caret footprint from the Figma icon slot. */}
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[22px] text-[#0a3d62] transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
            </button>
            {/* Expose the answer only for the active row so collapsed rows preserve their compact height. */}
            {isOpen ? <p className="border-t border-[#b5d3ee] px-10 py-4 text-[16px] leading-6 text-[#424242]">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

// Render a direct contact card using the board's 517px by 120px card proportions.
function ContactCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    // Keep each contact card light, bordered, and rounded at 16px like the design system fields.
    <div className="flex min-h-[120px] w-full items-center rounded-[16px] border border-[#b5d3ee] bg-[#f5f5f5] px-8 py-6">
      {/* Keep the Figma icon slot at 36px before the two-line contact label. */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[30px] leading-9 text-[#0a3d62]" aria-hidden="true">{icon}</span>
      {/* Keep the contact text block separated from the icon by 16px. */}
      <div className="ml-4 flex flex-col gap-2">
        {/* Match the contact label to the 16px bold body token. */}
        <span className="text-[16px] font-bold leading-6">{label}</span>
        {/* Match the contact value to the 16px regular body token. */}
        <span className="text-[16px] leading-6">{value}</span>
      </div>
    </div>
  );
}

// Export the complete landing page aligned to the HOME - LANDING PAGE Figma frame.
export default function Home() {
  const [contactPending, setContactPending] = useState(false); // Expose actual contact request state.
  const [contactFeedback, setContactFeedback] = useState<{ error: boolean; text: string } | null>(null); // Distinguish acceptance from failed persistence.
  const contactLock = useRef(false); // Prevent duplicate requests before React disables controls.
  async function submitContact(event: React.FormEvent<HTMLFormElement>) { // Submit the existing landing fields without replacing their layout.
    event.preventDefault(); // Keep the current landing-page position.
    if (contactLock.current) return; // Ignore repeat activation during a pending request.
    const form = event.currentTarget; // Retain the native form for a success-only reset.
    const values = new FormData(form); // Parse structured form values with the browser API.
    const payload = { fullName: String(values.get("name") || "").trim(), email: String(values.get("email") || "").trim().toLowerCase(), subject: String(values.get("subject") || ""), message: String(values.get("message") || "").trim() }; // Map the visible fields to the backend contract.
    if (!payload.fullName || !payload.email || !payload.message) { setContactFeedback({ error: true, text: "Enter your name, email address, and message." }); return; } // Reject blank and whitespace-only submissions locally.
    contactLock.current = true; // Acquire the synchronous request lock.
    setContactPending(true); // Disable every submitted value during the request.
    setContactFeedback(null); // Remove previous feedback before a deliberate retry.
    try { // Do not clear typed details after a failure.
      await contactApi.submit(payload); // Await a real saved inquiry before confirming receipt.
      setContactFeedback({ error: false, text: "Your message has been received." }); // Describe persistence, not unverified email delivery.
      form.reset(); // Remove submitted personal details only after successful storage.
    } catch (error) { // Preserve the native form values for retry.
      setContactFeedback({ error: true, text: apiErrorMessage(error, "Unable to send your message. Please try again.") }); // Show validation, rate-limit, or service failure.
    } finally { // Release both successful and failed submissions.
      contactLock.current = false; // Permit the next deliberate request.
      setContactPending(false); // Restore field editing.
    } // Finish contact persistence.
  } // Finish the landing form handler.
  return (
    // Keep the entire composition on the Figma neutral background.
    <main className="min-h-screen overflow-hidden bg-[#fafafa] text-[#111111]">
      {/* Recreate the 696px hero with the board's two layered gradients and 40px top menu offset. */}
      <section id="home" className="nba-hero-gradient min-h-[696px] px-5 pt-6 sm:px-8 lg:px-10 lg:pt-10">
        {/* Keep the header at 1,360px wide, 88px tall, and separated by the board's fine rule. */}
        <header className="mx-auto flex min-h-[88px] max-w-[1360px] items-center justify-between gap-6 border-b border-[#d4d2ad]/80">
          {/* Keep the logo slot wide enough for the Figma desktop layout. */}
          <Link href="/" aria-label="Neuro Bridge Africa home" className="shrink-0">
            {/* Use the local transparent logo export so the deployed app has a stable brand asset. */}
            <Image src="/design-assets/logo-transparent.png" alt="Neuro Bridge Africa" width={295} height={70} priority className="h-auto w-[190px] object-contain sm:w-[240px] lg:w-[295px]" />
          </Link>
          {/* Keep the five Figma navigation items at 18px medium weight on desktop. */}
          <nav aria-label="Landing page navigation" className="hidden items-center gap-8 whitespace-nowrap text-[18px] font-medium leading-7 lg:flex">
            {navItems.map((item, index) => (
              // Keep the first item blue and underlined as shown in the board's active state.
              <Link key={item.href} href={item.href} className={`decoration-2 underline-offset-[7px] transition-colors hover:text-[#0071d7] hover:underline ${index === 0 ? "text-[#0071d7] underline" : ""}`}>{item.label}</Link>
            ))}
          </nav>
          {/* Keep the two top-right actions at the Figma 158px by 60px small-button size. */}
          <div className="flex shrink-0 items-center gap-4">
            {/* Keep Login outlined as the secondary button. */}
            <Link href="/login" className="inline-flex h-[60px] w-[118px] items-center justify-center rounded-[16px] border border-[#0a3d62] bg-transparent text-[16px] font-medium text-[#0a3d62] transition-colors hover:bg-white/40 sm:w-[158px] sm:text-[18px]">Login</Link>
            {/* Keep Sign Up filled as the primary button. */}
            <Link href="/register?role=PARENT" className="inline-flex h-[60px] w-[118px] items-center justify-center rounded-[16px] bg-[#0a3d62] text-[16px] font-medium text-[#fafafa] transition-colors hover:bg-[#083c5d] sm:w-[158px] sm:text-[18px]">Sign Up</Link>
          </div>
        </header>
        {/* Keep a compact horizontal menu available on mobile without changing desktop geometry. */}
        <nav aria-label="Mobile landing page navigation" className="mx-auto flex max-w-[1360px] gap-6 overflow-x-auto py-4 text-[14px] font-medium lg:hidden">
          {navItems.map((item) => (
            // Keep mobile anchors readable and touch-friendly inside the horizontal scroller.
            <Link key={item.href} href={item.href} className="shrink-0 hover:text-[#0071d7]">{item.label}</Link>
          ))}
        </nav>
        {/* Keep the trust indicator centered at y=188 and hero text beginning at y=288 on desktop. */}
        <div className="mx-auto flex max-w-[720px] flex-col items-center pt-8 lg:pt-[60px]">
          {/* Keep the avatar row at 145px by 40px with overlapping circles. */}
          <div className="flex items-center gap-3 text-center text-[18px] font-medium leading-7 md:text-[20px]">
            {/* Keep the four trusted avatars inside the fixed 145px board slot. */}
            <div className="flex h-10 w-[145px] items-center">
              {trustedAvatars.map((src, index) => (
                // Keep each avatar at 40px and overlap subsequent images by 12px.
                <Image key={`${src}-${index}`} src={src} alt="" width={40} height={40} className="-ml-3 h-10 w-10 rounded-full border-2 border-white object-cover first:ml-0" />
              ))}
            </div>
            {/* Keep the count blue and bold inside the trust statement. */}
            <p className="whitespace-nowrap">Trusted by <span className="font-bold text-[#0071d7]">100+</span> therapists &amp; parents across Africa</p>
          </div>
          {/* Keep the hero content width and vertical spacing faithful to the Figma text group. */}
          <div className="flex w-full flex-col items-center pt-12 text-center lg:pt-[60px]">
            {/* Match the board's 72px gradient title and single-line desktop fit. */}
            <h1 className="nba-display-gradient text-[48px] font-medium leading-[60px] tracking-[-0.6px] sm:text-[60px] sm:leading-[72px] lg:text-[72px] lg:leading-[88px]">Bridging Therapy, School &amp; more</h1>
            {/* Match the board's 18px body copy and 1,043px maximum line width. */}
            <p className="mt-6 max-w-[1043px] text-[16px] leading-7 md:text-[18px]">Neuro Bridge Africa is a digital platform designed to improve access to therapy service and special needs education across Africa. The platform equips parents, teachers, therapists, and schools with structured tools that support children with developmental and learning differences such as autism, ADHD, communication delays, and learning disabilities.</p>
            {/* Keep the demo and signup actions separated by the board's 16px gap. */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {/* Keep View Demo outlined as the secondary small action. */}
              <Link href="#how-it-works" className="inline-flex h-[60px] w-[158px] items-center justify-center rounded-[16px] border border-[#0a3d62] text-[18px] font-medium text-[#0a3d62] transition-colors hover:bg-white/40">View Demo</Link>
              {/* Keep Get Started filled as the primary small action. */}
              <Link href="/register?role=PARENT" className="inline-flex h-[60px] w-[158px] items-center justify-center rounded-[16px] bg-[#0a3d62] text-[18px] font-medium text-[#fafafa] transition-colors hover:bg-[#083c5d]">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Keep the audience section 60px below the hero and 1,359px wide at desktop. */}
      <section id="who-its-for" className="scroll-mt-8 px-5 pt-[60px] sm:px-8 lg:px-10">
        {/* Keep the Figma section heading at the top of the audience composition. */}
        <div className="mx-auto max-w-[1359px]">
          {/* Use the exact board heading text and title treatment. */}
          <SectionHeading>Who’s It For?</SectionHeading>
          {/* Keep the first audience row 40px below the heading. */}
          <div className="mt-10 flex flex-col gap-10">
            {audienceSections.map((section) => (
              // Preserve the Figma row order and content for every audience.
              <AudienceRow key={section.title} {...section} />
            ))}
          </div>
        </div>
      </section>

      {/* Keep How It Works 60px below the audience section with the board's 1,360px width. */}
      <section id="how-it-works" className="scroll-mt-8 px-5 pt-[60px] sm:px-8 lg:px-10">
        {/* Keep the workflow content centered inside the Figma section frame. */}
        <div className="mx-auto max-w-[1360px]">
          {/* Use the board's gradient section heading. */}
          <SectionHeading>How It Works</SectionHeading>
          {/* Keep the two cards 40px below the title and 24px apart on desktop. */}
          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:justify-between">
            {/* Render the therapist workflow first, matching the left card in Figma. */}
            <HowItWorksCard label="FOR THERAPISTS" steps={therapistSteps} />
            {/* Render the parent workflow second, matching the right card in Figma. */}
            <HowItWorksCard label="FOR PARENTS" steps={parentSteps} reverse />
          </div>
        </div>
      </section>

      {/* Keep FAQs 60px below the workflow cards and preserve the five-row board structure. */}
      <section id="faqs" className="scroll-mt-8 px-5 pt-[60px] sm:px-8 lg:px-10">
        {/* Keep the FAQ section constrained to the board's 1,360px frame. */}
        <div className="mx-auto max-w-[1360px]">
          {/* Use the exact Figma FAQ heading. */}
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          {/* Keep the accordion 40px below the heading and 90px inset on desktop. */}
          <div className="mt-10 lg:px-[90px]">
            {/* Render accessible interactive FAQ rows. */}
            <FaqList />
          </div>
        </div>
      </section>

      {/* Keep the contact frame 60px below FAQ content and use the board's soft gray surface. */}
      <section id="contact-us" className="scroll-mt-8 px-5 pb-20 pt-[60px] sm:px-8 lg:px-10">
        {/* Keep the outer contact panel at the board's 1,360px width with 40px corners. */}
        <div className="mx-auto max-w-[1360px] rounded-[40px] bg-black/[0.08] px-6 py-10 md:px-10 md:py-[60px]">
          {/* Match the board's 40px bold contact heading. */}
          <h2 className="text-[34px] font-bold leading-[48px] tracking-[-0.3px] md:text-[40px]">Get in Touch</h2>
          {/* Keep the form and direct-contact columns 156px below the heading. */}
          <div className="mt-10 flex flex-col gap-12 lg:mt-[48px] lg:flex-row lg:items-center lg:gap-[91px]">
            {/* Keep the form at the board's 576px desktop width. */}
            <form className="flex w-full flex-col gap-10 lg:w-[576px]" onSubmit={submitContact} aria-busy={contactPending}> {/* Map the existing Figma form to the real contact endpoint. */}
              {contactFeedback && <p role={contactFeedback.error ? "alert" : "status"} className={contactFeedback.error ? "text-[#e53935]" : "text-[#008080]"}>{contactFeedback.text}</p>} {/* Show truthful persistence feedback in normal flow. */}
              <fieldset disabled={contactPending} className="contents"> {/* Lock the existing form fields without changing their layout. */}
              {/* Keep the name field label and control grouped by a 12px gap. */}
              <label className="flex flex-col gap-3 text-[16px] font-bold leading-6">
                {/* Keep the Figma label text. */}
                <span>Your Name</span>
                {/* Keep the input height, background, border, and radius from the board. */}
                <input name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Enter your name" className="h-[60px] rounded-[16px] border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-[16px] font-medium outline-none placeholder:text-[#757575] focus:border-[#0071d7]" /> {/* Match backend name validation. */}
              </label>
              {/* Keep the email field aligned to the same board component. */}
              <label className="flex flex-col gap-3 text-[16px] font-bold leading-6">
                {/* Keep the Figma label text. */}
                <span>Email Address</span>
                {/* Keep the Figma email placeholder and field dimensions. */}
                <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="E.g: name@email.com" className="h-[60px] rounded-[16px] border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-[16px] font-medium outline-none placeholder:text-[#757575] focus:border-[#0071d7]" /> {/* Collect a valid bounded reply address. */}
              </label>
              {/* Keep the subject field as the board's dropdown control. */}
              <label className="flex flex-col gap-3 text-[16px] font-bold leading-6">
                {/* Keep the Figma label text. */}
                <span>Subject</span>
                {/* Keep the dropdown height, border, and neutral fill from the text-field component. */}
                <select name="subject" aria-label="Subject" defaultValue="" className="h-[60px] rounded-[16px] border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-[16px] font-medium text-[#757575] outline-none focus:border-[#0071d7]"> {/* Keep the accessible name independent of nested option text. */}
                  {/* Keep the empty placeholder as the initial state. */}
                  <option value="" disabled>E.g: Partnership inquiry</option>
                  {/* Keep useful contact topics available in the real control. */}
                  <option value="parent-support">Parent support</option>
                  <option value="therapist-support">Therapist support</option>
                  <option value="school-support">School support</option>
                </select>
              </label>
              {/* Keep the multiline message field at the board's 120px control height. */}
              <label className="flex flex-col gap-3 text-[16px] font-bold leading-6">
                {/* Keep the Figma label text. */}
                <span>Message</span>
                {/* Keep the board's 1,000-character guidance inside the textarea placeholder. */}
                <textarea name="message" required maxLength={1000} placeholder="Maximum of 1000 characters" className="h-[120px] resize-y rounded-[16px] border border-[#b5d3ee] bg-[#f5f5f5] p-3 text-[16px] font-medium outline-none placeholder:text-[#757575] focus:border-[#0071d7]" /> {/* Preserve the source's stricter message limit. */}
              </label>
              {/* Keep Submit as the full-width 576px primary large button from Figma. */}
              <button type="submit" disabled={contactPending} className="h-[60px] w-full rounded-[16px] bg-[#0a3d62] px-3 text-[18px] font-medium text-[#fafafa] transition-colors hover:bg-[#083c5d] disabled:cursor-wait">{contactPending ? "Submitting" : "Submit"}</button> {/* Prevent duplicate requests while preserving the action size. */}
              </fieldset> {/* Finish the request-locked group. */}
            </form>
            {/* Keep the direct contact stack at the board's 517px desktop width. */}
            <div className="flex w-full flex-col gap-10 lg:w-[517px]">
              {/* Match the Figma email card copy and icon slot. */}
              <ContactCard icon="@" label="Email" value="info@neurobridge.com" />
              {/* Match the Figma phone card copy and icon slot. */}
              <ContactCard icon="+" label="Phone" value="+233 54 980 7606 (9AM - 5 PM GMT)" />
              {/* Match the Figma address card copy and icon slot. */}
              <ContactCard icon="⌖" label="Address" value="Adenta, Accra - Ghana" />
            </div>
          </div>
        </div>
      </section>

      {/* Keep the footer at the board's 138px height and primary blue background. */}
      <footer className="min-h-[138px] bg-[#0a3d62] px-5 py-10 text-[#fafafa] sm:px-8 lg:px-10">
        {/* Keep the footer content at the board's 1,360px inner width. */}
        <div className="mx-auto flex max-w-[1360px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Match the Figma footer brand text at 48px bold. */}
          <p className="text-[36px] font-bold leading-[58px] tracking-[-0.4px] md:text-[48px]">Neuro Bridge Africa</p>
          {/* Keep footer links in the same 48px-spaced row as the board. */}
          <div className="flex flex-wrap items-center gap-6 text-[16px] font-medium leading-7 md:gap-12 md:text-[18px]">
            {/* Keep About Us linked to the landing page introduction. */}
            <Link href="/about" className="hover:text-[#b5d3ee]">About Us</Link> {/* Map the footer to the existing about route. */}
            {/* Keep the privacy label present in the board footer. */}
            <Link href="/privacy" className="hover:text-[#b5d3ee]">Privacy Policy</Link> {/* Make the policy label a real navigable route. */}
            {/* Keep the copyright copy aligned with the Figma footer. */}
            <span>© 2026 Neuro Bridge Africa</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
