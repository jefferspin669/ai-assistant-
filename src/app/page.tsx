import Image from "next/image";
import Link from "next/link";
import { aiEmployees, phases } from "@/lib/data";

const pillars = [
  {
    title: "One AI brain",
    copy: "Type, speak, upload a PDF, invoice, or photo — Atlas understands and acts across the business.",
  },
  {
    title: "Never sleeps",
    copy: "At 2 AM Atlas answers, asks questions, books, collects photos, creates estimates, and schedules techs.",
  },
  {
    title: "Your own employee",
    copy: "Name them Sarah. Set personality, language, and business knowledge. They learn every week.",
  },
  {
    title: "Perfect memory",
    copy: "Prefers mornings. Has three dogs. Always requests John. No employee ever forgets.",
  },
  {
    title: "Specialized staff",
    copy: "CEO Assistant, Receptionist, Sales, Success, Marketing, Finance, Scheduler, Ops, HR.",
  },
  {
    title: "Built in phases",
    copy: "Start with missed calls and CRM. Grow into voice, marketing, inventory, and marketplace.",
  },
];

export default function HomePage() {
  return (
    <div>
      <nav className="site-nav" aria-label="Primary">
        <Link href="/" className="logo">
          Atlas <span>AI</span>
        </Link>
        <div className="site-nav-links">
          <a href="#vision">Vision</a>
          <a href="#employees">Employees</a>
          <a href="#phases">Phases</a>
          <Link className="btn btn-primary" href="/onboarding">
            Create your AI employee
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="container hero-content">
          <p className="brand-mark">
            Atlas <span>AI</span>
          </p>
          <h1>The world’s first AI employee that can actually run a business.</h1>
          <p>
            Instead of opening 10 apps, open Atlas. It already knows what happened — and what to do
            next.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/app">
              Open Atlas
            </Link>
            <Link className="btn btn-ghost" href="/onboarding">
              Hire your AI employee
            </Link>
          </div>
          <div className="exchange" aria-label="Morning briefing tease">
            <div className="exchange-line exchange-owner">Good morning, Jeff.</div>
            <div className="exchange-line exchange-reply">
              I handled 94 routine tasks overnight. Your top priority is approving Johnson
              Construction — $18,400.
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="vision">
          <div className="container">
            <div className="section-head">
              <h2>Nothing else needs to be checked.</h2>
              <p>
                Revenue, overnight bookings, cancellations, overdue invoices, late technicians,
                schedule health, and revenue opportunities — ready before you sit down.
              </p>
            </div>
            <div className="module-grid">
              {pillars.map((pillar) => (
                <article className="module" key={pillar.title}>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="converse" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Ask Atlas what matters.</h2>
              <p>The owner simply asks — Atlas already handled the rest.</p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">
                Atlas, what’s the most important thing I should focus on today?
              </div>
              <div className="bubble bubble-ai">
                Your business is running well. I handled 94 routine tasks overnight. Your top
                priority today is approving the estimate for Johnson Construction, worth $18,400.
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="employees" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="sarah">
              <div>
                <h2>One assistant. A full AI staff.</h2>
                <p>
                  You talk to Atlas. Behind the scenes, specialized employees run reception, sales,
                  finance, marketing, scheduling, operations, and HR.
                </p>
                <Link className="btn btn-primary" href="/app/employees">
                  Meet the AI employees
                </Link>
              </div>
              <div className="sarah-card">
                <h3>Roster</h3>
                <ul>
                  {aiEmployees.map((employee) => (
                    <li key={employee.id}>
                      {employee.emoji} {employee.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="phases" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Ambitious vision. Achievable phases.</h2>
              <p>Build the AI employee over time — not everything at once.</p>
            </div>
            <div className="roadmap">
              {phases.map((phase) => (
                <div className="road-item" key={phase.phase}>
                  <span>{phase.phase}</span>
                  <strong>{phase.title}</strong>
                  <p style={{ marginTop: "0.45rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                    {phase.items.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container final-cta">
          <h2>Don’t open QuickBooks. Don’t dig through Gmail.</h2>
          <p>Open Atlas. The business is already moving.</p>
          <Link className="btn btn-dark" href="/onboarding">
            Create your AI employee
          </Link>
        </section>
      </main>

      <footer className="container footer">
        <span>Atlas AI · Project Codename</span>
        <span>Understand. Remember. Act.</span>
      </footer>
    </div>
  );
}
