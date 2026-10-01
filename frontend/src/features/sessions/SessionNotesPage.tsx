"use client"; // Search, sorting, and the native modal run in the authenticated browser.
import Image from "next/image"; // Preserve the original Figma assets and dynamic child images.
import Link from "next/link"; // Keep dashboard and public navigation within the app router.
import { useEffect, useMemo, useRef, useState } from "react"; // Manage request lifetime, derived rows, and dialog focus.
import { sessionsApi, type Session } from "@/app/services/sessions"; // Reuse the server-scoped session endpoint.
import { apiErrorMessage } from "@/app/utils/apiError"; // Keep request errors consistent with the other features.
import styles from "./SessionNotesPage.module.css"; // Scope the measured table and modal geometry to this screen.

const noteColumns = [{ key: "goalsWorkedOn", label: "Goals Worked On" }, { key: "observations", label: "Observations" }, { key: "recommendations", label: "Recommendations" }, { key: "extraNotes", label: "Extra Notes" }] as const; // Preserve the six-column Figma order after parent and child.
const sorts = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "child", label: "Child's name" }, { value: "parent", label: "Parent's name" }] as const; // Give the source sort control real, predictable options.
type ExpandedNote = { title: string; body: string }; // Expand a single field, as in node 673:6640.
function fullName(person: { firstName: string; lastName: string }) { return `${person.firstName} ${person.lastName}`.trim(); } // Reuse one name representation for display, search, and sorting.
function parentNames(session: Session) { return session.child.parents?.map(({ parent }) => fullName(parent)).join(", ") || "Not available"; } // Display all linked parents rather than guessing a single caregiver.
function ageLabel(value?: string) { // Use calendar birthdays instead of dividing milliseconds by a year.
  if (!value) return "Age unavailable"; // Older API responses may not contain birth dates.
  const born = new Date(value); const today = new Date(); // Read the date only after the client has loaded records.
  let age = today.getUTCFullYear() - born.getUTCFullYear(); // Start with complete calendar years.
  if (today.getUTCMonth() < born.getUTCMonth() || (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate())) age -= 1; // Subtract the birthday that has not occurred yet.
  return Number.isFinite(age) && age >= 0 ? `${age} ${age === 1 ? "year" : "years"} old` : "Age unavailable"; // Never show negative or invalid ages.
} // End the calendar age formatter.

export default function SessionNotesPage() { // Render the full-table and expanded-note reference screens.
  const [sessions, setSessions] = useState<Session[]>([]); // Keep only the server-authorized records.
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); // Separate loading, error, and empty states.
  const [attempt, setAttempt] = useState(0); // Retry without reloading the user's entire workspace.
  const [search, setSearch] = useState(""); const [sort, setSort] = useState<string>("newest"); // Default to the API's newest-first ordering.
  const [expanded, setExpanded] = useState<ExpandedNote | null>(null); // Show the selected field without changing the table state.
  const dialog = useRef<HTMLDialogElement>(null); const sortMenu = useRef<HTMLDetailsElement>(null); // Use native dialog focus trapping and an accessible disclosure.
  useEffect(() => { // Ignore a response after navigation or after a newer retry starts.
    let active = true; // Do not update a screen that has unmounted.
    sessionsApi.list().then(({ sessions: records }) => { if (active) setSessions(records.filter((session) => session.note)); }).catch((cause: unknown) => { if (active) setError(apiErrorMessage(cause, "Unable to load session notes. Please try again.")); }).finally(() => { if (active) setLoading(false); }); // Fetch all of this therapist's notes in one authorized request.
    return () => { active = false; }; // Discard stale completions without cancelling shared authentication refresh.
  }, [attempt]); // A retry starts one new request.
  useEffect(() => { // Let the browser trap focus and restore it to the selected table button.
    if (!expanded || !dialog.current) return; // The closed state needs no modal side effects.
    const element = dialog.current; const overflow = document.body.style.overflow; // Preserve any pre-existing body scroll setting.
    element.showModal(); document.body.style.overflow = "hidden"; // Prevent background interaction and scrolling while reading.
    return () => { element.close(); document.body.style.overflow = overflow; }; // Restore the page when closing or navigating away.
  }, [expanded]); // Update modal content for the selected note field.
  const rows = useMemo(() => { // Derive the displayed records without mutating the API response.
    const query = search.trim().toLocaleLowerCase(); // Treat incidental spaces and case consistently.
    const filtered = sessions.filter((session) => [fullName(session.child), parentNames(session), ...noteColumns.map(({ key }) => session.note?.[key] || "")].some((value) => value.toLocaleLowerCase().includes(query))); // Search names and all note fields, including off-screen columns.
    return filtered.sort((a, b) => sort === "child" ? fullName(a.child).localeCompare(fullName(b.child)) : sort === "parent" ? parentNames(a).localeCompare(parentNames(b)) : (sort === "oldest" ? 1 : -1) * (Date.parse(a.sessionDate) - Date.parse(b.sessionDate))); // Preserve a deterministic chronological or alphabetical order.
  }, [sessions, search, sort]); // Recompute only when input or data changes.
  function retry() { setError(""); setLoading(true); setAttempt((value) => value + 1); } // Clear stale feedback before issuing another request.
  return ( // Use normal document flow for the desktop reference and responsive adaptation.
    <div className={styles.page}> {/* Own the full-width canvas instead of nesting inside the dashboard sidebar. */}
      <header className={styles.header}> {/* Match the source's 40px inset and 87px logo slot. */}
        <Link href="/dashboard" className={styles.logoSlot} aria-label="Neuro Bridge Africa dashboard"><Image src="/design-assets/table-logo.png" alt="Neuro Bridge Africa" width={512} height={512} unoptimized priority className={styles.logo} /></Link> {/* Crop the original source bitmap without replacing its artwork. */}
        <nav aria-label="Main navigation"><Link href="/dashboard">Home</Link><Link href="/about">About Us</Link></nav> {/* Keep the two source links functional. */}
      </header> {/* End the source top menu. */}
      <main className={styles.main}> {/* Keep the toolbar and table within the viewport width. */}
        <div className={styles.titleBar}><Link href="/dashboard#session-notes" className={styles.back}><Image src="/design-assets/icons/table-back.svg" alt="" width={24} height={24} unoptimized /><span>Go Back</span></Link><h1>Recent Session Notes - Full Table</h1></div> {/* Preserve the centered 40px title and independent back link. */}
        <div className={styles.toolbar}> {/* Match the 80px toolbar with a 48px search control. */}
          <label className={styles.search}><input type="search" aria-label="Search session notes" placeholder="Search your item ..." value={search} onChange={(event) => setSearch(event.target.value)} /><Image src="/design-assets/icons/table-search.svg" alt="" width={32} height={24} unoptimized /></label> {/* Search the complete authorized note collection. */}
          <details ref={sortMenu} className={styles.sort}><summary aria-label="Sort session notes" title="Sort session notes">Sort by<Image src="/design-assets/icons/table-sort.svg" alt="" width={32} height={32} unoptimized /></summary><fieldset><legend>Sort session notes</legend>{sorts.map((option) => <label key={option.value}><input type="radio" name="note-sort" value={option.value} checked={sort === option.value} onChange={() => { setSort(option.value); if (sortMenu.current) sortMenu.current.open = false; }} />{option.label}</label>)}</fieldset></details> {/* Use a keyboard-operable option menu without changing the source closed state. */}
        </div> {/* End table actions. */}
        {loading ? <p className={styles.state} role="status">Loading session notes...</p> : error ? <div className={styles.state} role="alert"><p>{error}</p><button type="button" onClick={retry}>Try again</button></div> : rows.length === 0 ? <p className={styles.state} role="status">{search ? "No session notes match your search." : "No session notes yet."}</p> : <div className={styles.scroller} role="region" aria-label="Session notes table" tabIndex={0}> {/* Distinguish genuine empty data from failed requests and keep horizontal scrolling keyboard accessible. */}
          <table className={styles.table} aria-label="Recent session notes">{/* Keep semantic rows without invalid whitespace children inside the table. */}
            <colgroup>{[226, 260, 245, 486, 382, 481].map((width, index) => <col key={index} style={{ width }} />)}</colgroup>{/* Match the 2080px full content inside the 1360px clipping window. */}
            <thead><tr><th scope="col">Parent&apos;s Name</th><th scope="col">Child&apos;s Name &amp; Age</th>{noteColumns.map(({ key, label }) => <th scope="col" key={key}>{label}</th>)}</tr></thead>{/* Retain every source column, including those reached by horizontal scrolling. */}
            <tbody>{rows.map((session) => <tr key={session.id}>{/* Render real sessions instead of shipping the Figma sample identities. */}
              <td><span className={styles.truncated} title={parentNames(session)}>{parentNames(session)}</span></td>{/* Keep long caregiver names within the fixed row. */}
              <td><div className={styles.child}>{session.child.profileImage ? <Image src={session.child.profileImage} alt="" width={40} height={40} unoptimized className={styles.avatar} /> : <span className={styles.initials} aria-hidden="true">{`${session.child.firstName[0] || ""}${session.child.lastName[0] || ""}`}</span>}<div><Link href={`/children/${session.childId}`} title={fullName(session.child)}>{fullName(session.child)}</Link><small>{ageLabel(session.child.dateOfBirth)}</small></div></div></td>{/* Use uploaded photos or truthful initials in the source's 40px avatar slot. */}
              {noteColumns.map(({ key, label }) => <td key={key}><div className={styles.noteCell}><span className={styles.truncated}>{session.note?.[key] || "Not added"}</span>{session.note?.[key] && <button type="button" className={key === "goalsWorkedOn" ? styles.goalExpand : styles.expand} title={`Read ${label.toLowerCase()}`} aria-label={`Read ${label.toLowerCase()} for ${fullName(session.child)}`} onClick={() => setExpanded({ title: label, body: session.note?.[key] || "" })}><Image src="/design-assets/icons/table-expand.svg" alt="" width={24} height={24} unoptimized /></button>}</div></td>)}{/* Expand full text without inserting a whitespace text node into the table row. */}
            </tr>)}</tbody>{/* Finish real, individually keyed session rows. */}
          </table> {/* End the semantic table. */}
        </div>} {/* The scrollbar replaces the static Figma scrolling-line illustration. */}
      </main> {/* End the complete table surface. */}
      <footer className={styles.footer}><strong>Neuro Bridge Africa</strong><nav aria-label="Footer navigation"><Link href="/privacy">Privacy Policy</Link><Link href="/about">About Us</Link><span>&copy; 2026 Neuro Bridge Africa</span></nav></footer> {/* Match the source footer band and real policy routes. */}
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="expanded-note-title" onCancel={() => setExpanded(null)}> {/* Native modal behavior supplies Escape dismissal and background inertness. */}
        <div className={styles.dialogHeader}><h2 id="expanded-note-title">{expanded?.title}</h2><button type="button" aria-label="Close session note" title="Close session note" onClick={() => setExpanded(null)}><Image src="/design-assets/icons/table-close.svg" alt="" width={20} height={20} unoptimized /></button></div> {/* Preserve the 40px source close control and 24px heading. */}
        <p className={styles.noteBody}>{expanded?.body}</p> {/* Render plain text with paragraphs preserved, never API-provided HTML. */}
      </dialog> {/* End the expanded field view. */}
    </div> // End the page-owned layout.
  ); // Finish rendering the source-derived screen.
} // End the session notes feature.
