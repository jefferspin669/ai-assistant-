import Image from "next/image";
import Link from "next/link";
import { digitalEmployeeRoster, intelligenceNetworkInsights } from "@/lib/atlas-platform";
import { audiences, industryPacks, marketplaceAssistants, phases } from "@/lib/data";

export default function HomePage() {
  return (
    <div>
      <nav className="site-nav" aria-label="Primary">
        <Link href="/" className="logo">
          Atlas <span>AI</span>
        </Link>
        <div className="site-nav-links">
          <a href="#autonomous">Autonomous</a>
          <a href="#simulator">Simulator</a>
          <a href="#os">Operating System</a>
          <Link className="btn btn-primary" href="/onboarding">
            Create your AI workforce
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
          <h1>Everyone deserves an AI employee.</h1>
          <p>
            Atlas — Your AI Workforce. Not one chatbot. An ecosystem of helpers for individuals,
            families, events, businesses, nonprofits, and schools.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/onboarding">
              Choose who Atlas helps
            </Link>
            <Link className="btn btn-ghost" href="/app">
              Open the business beachhead
            </Link>
          </div>
          <div className="exchange" aria-label="Atlas examples">
            <div className="exchange-line exchange-owner">“Atlas, plan my daughter’s birthday.”</div>
            <div className="exchange-line exchange-reply">“How many guests are you expecting?”</div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="everyone">
          <div className="container">
            <div className="section-head">
              <h2>One platform. Many kinds of help.</h2>
              <p>Create AI assistants that fit your life — then expand as your needs grow.</p>
            </div>
            <div className="module-grid">
              {audiences.map((audience) => (
                <article className="module" key={audience.id}>
                  <h3>
                    <span aria-hidden="true">{audience.emoji}</span> {audience.label}
                    {"beachhead" in audience && audience.beachhead ? (
                      <span className="badge" style={{ marginLeft: "0.5rem" }}>
                        Launch focus
                      </span>
                    ) : null}
                  </h3>
                  <p>{audience.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="workforce" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="sarah">
              <div>
                <h2>Your AI Workforce</h2>
                <p>
                  Personal AI for life admin. Event AI for celebrations. Business AI for the front
                  desk. Digital employees share one business memory — plus a marketplace and industry
                  packs.
                </p>
                <div className="cta-row">
                  <Link className="btn btn-primary" href="/app/digital-employees">
                    Meet digital employees
                  </Link>
                  <Link className="btn btn-ghost" href="/app/marketplace" style={{ color: "var(--foam)", borderColor: "rgba(244,248,247,0.28)" }}>
                    Browse marketplace
                  </Link>
                </div>
              </div>
              <div className="sarah-card">
                <h3>Digital staff</h3>
                <ul>
                  {digitalEmployeeRoster.slice(0, 6).map((employee) => (
                    <li key={employee.title}>
                      {employee.emoji} {employee.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="autonomous" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Autonomous Mode</h2>
              <p>
                Instead of waiting for commands, Atlas works continuously — then confirms with the
                owner when it matters.
              </p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-ai">
                Missed call → text sent → appointment booked → CRM updated → technician alerted →
                reminder queued → review requested.
              </div>
              <div className="bubble bubble-user">Owner only receives confirmation.</div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/autonomous">
                Open Autonomous Mode
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="simulator" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Business Simulator</h2>
              <p>Like SimCity — but for a real company. Ask what happens before you decide.</p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">What happens if minimum wage increases?</div>
              <div className="bubble bubble-ai">
                Payroll +$6,400/mo. Recommend +4% rates. Profit -1.2 pts. Defer one hire. Demand -2%
                short-term. Cash -$11k in Q1.
              </div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/simulator">
                Run a simulation
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="os" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Operating System</h2>
              <p>Email, phone, calendar, CRM, inventory, invoices, payroll, marketing, projects, documents, analytics — one login, one memory, one AI.</p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/os">
                Enter the workspace
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="network" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Atlas Intelligence Network</h2>
              <p>
                Thousands of businesses. Shared industry trends. Nobody’s private data exposed.
              </p>
            </div>
            <div className="module-grid">
              {intelligenceNetworkInsights.slice(0, 3).map((item) => (
                <article className="module" key={item.insight}>
                  <h3>{item.industry}</h3>
                  <p>{item.insight}</p>
                </article>
              ))}
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/network">
                Open Intelligence Network
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="dna" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Business DNA</h2>
              <p>
                Atlas learns your writing style, brand voice, discounts, service philosophy, and
                escalation rules — then behaves like your company.
              </p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">Can you do better on price?</div>
              <div className="bubble bubble-ai">
                I can honor 10% for returning customers on maintenance visits — emergency calls stay
                at the listed rate so we can keep crews ready.
              </div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/dna">
                View Business DNA
              </Link>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Marketplace + Industry Packs</h2>
              <p>Install the assistants you need. Specialize with knowledge packs.</p>
            </div>
            <div className="split">
              <div className="panel">
                <h3>Installable assistants</h3>
                <div className="list" style={{ marginTop: "0.8rem" }}>
                  {marketplaceAssistants.slice(0, 6).map((item) => (
                    <div className="list-row" key={item.name}>
                      <span className="badge">{item.category}</span>
                      <p>
                        <strong>{item.name}</strong> · {item.installs} installs
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h3>Industry packs</h3>
                <div className="pack-grid" style={{ marginTop: "0.8rem" }}>
                  {industryPacks.map((pack) => (
                    <div className="pack-chip" key={pack.name}>
                      <span aria-hidden="true">{pack.emoji}</span>
                      <strong>{pack.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="beachhead" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Start focused. Expand later.</h2>
              <p>
                Launch beachhead: small service businesses that need an AI receptionist and
                scheduling. Once that wins, expand into personal assistants and celebration planning
                on the same platform.
              </p>
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
          <h2>Everyone deserves an AI employee.</h2>
          <p>Start with business. Grow into life, family, and events.</p>
          <Link className="btn btn-dark" href="/onboarding">
            Create your first AI helper
          </Link>
        </section>
      </main>

      <footer className="container footer">
        <span>Atlas — Your AI Workforce</span>
        <span>Beachhead: small service businesses</span>
      </footer>
    </div>
  );
}
