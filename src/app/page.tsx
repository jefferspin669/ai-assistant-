import Image from "next/image";
import Link from "next/link";
import { digitalEmployeeRoster, intelligenceNetworkInsights } from "@/lib/atlas-platform";
import { audiences, industryPacks, marketplaceAssistants, phases } from "@/lib/data";
import { sitePath } from "@/lib/hard-nav";

export default function HomePage() {
  return (
    <div>
      <nav className="site-nav" aria-label="Primary">
        <a href={sitePath("/")} className="logo">
          Atlas <span>AI</span>
        </a>
        <div className="site-nav-links">
          <a href="#mission">Mission</a>
          <a href="#command-language">Command Language</a>
          <a href="#governance">Trust</a>
          <a href={sitePath("/login")}>Sign in</a>
          <a className="btn btn-primary" href={sitePath("/signup")}>
            Create account
          </a>
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
          <h1>Every business deserves an intelligent workforce, regardless of its size.</h1>
          <p>
            We don’t just sell software. We build the AI workforce any company can run — purpose
            beyond technology.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={sitePath("/signup")}>
              Create your account
            </a>
            <a className="btn btn-ghost" href={sitePath("/onboarding")}>
              Build your workforce
            </a>
          </div>
          <div className="exchange" aria-label="Atlas examples">
            <div className="exchange-line exchange-owner">
              “We’re five people. Can Atlas really staff us?”
            </div>
            <div className="exchange-line exchange-reply">
              “Yes — size shouldn’t decide who gets an intelligent workforce.”
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="mission">
          <div className="container">
            <div className="section-head">
              <h2>Atlas Mission</h2>
              <p>Don’t just sell software. Build around a mission.</p>
            </div>
            <div className="mission-band">
              <p className="mission-kicker">Our purpose</p>
              <h2>Every business deserves an intelligent workforce, regardless of its size.</h2>
              <p>
                Enterprise tools used to be reserved for companies with huge budgets and IT teams.
                Atlas exists so a five-person HVAC shop, a family clinic, or a growing franchise can
                run with the same kind of intelligent workforce — digital employees, memory, and
                judgment — that used to be out of reach. That message is the company. Technology is
                how we deliver it.
              </p>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/mission">
                Open the mission inside Atlas
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="everyone" style={{ paddingTop: 0 }}>
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
                  Built for the mission: digital employees that share one business memory — so a
                  small shop can run with the same intelligent workforce energy as a much larger
                  company. Marketplace and industry packs help you specialize.
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

        <section className="section" id="academy" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Atlas Academy</h2>
              <p>
                Teach employees with interactive lessons, role-playing, certifications, knowledge
                tests, and voice practice — managers see progress.
              </p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/training">
                Open Atlas Academy
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="builder" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Business Builder</h2>
              <p>
                Expand Atlas from running a business to helping create one — name, branding,
                website, pricing, domains, contracts, workflows, marketing, first customers.
              </p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/builder">
                Start building
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="memory-exec" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Executive Memory</h2>
              <p>Ask why you increased prices in 2025 — Atlas answers with context, data, and meeting notes.</p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">Why did we increase prices in 2025?</div>
              <div className="bubble bubble-ai">
                On September 18, 2025 you approved a 6% increase after parts inflation hit 11%. Meeting
                notes and Finance’s 4–8% model are attached.
              </div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/ceo-memory">
                Open Executive Memory
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="risk" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Risk Center</h2>
              <p>
                Warns before problems become expensive — satisfaction, burnout, compliance,
                equipment, cash flow, unusual activity.
              </p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/risk">
                Open Risk Center
              </Link>
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

        <section className="section" id="marketplace" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Marketplace</h2>
              <p>
                Developers create industry agents, dashboards, automations, reports, integrations,
                and templates. Businesses install what they need.
              </p>
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
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/marketplace">
                Open AI Marketplace
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="global-memory" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Global Business Memory</h2>
              <p>
                Operate across countries with languages, time zones, tax, regional hours, holidays,
                currency display, and local regulations — with human review where needed.
              </p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/global-memory">
                Open Global Memory
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="explainable" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Explainable AI</h2>
              <p>
                Instead of “Raise prices,” Atlas shows why, supporting data, risks, expected
                outcomes, confidence, and alternatives — so decision-makers can trust the call.
              </p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">Raise prices.</div>
              <div className="bubble bubble-ai">
                Recommend +6% with loyalty grandfathering (confidence 78). Parts COGS +11%, OT
                +18%. Risks: short-term cancels. Alternative: hold through Q4 (score 42).
              </div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/explainable">
                Open Explainable AI
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="command-language" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Business Command Language</h2>
              <p>
                Type plain English — Atlas turns it into automations with triggers, conditions,
                actions, and safeguards.
              </p>
            </div>
            <div className="vision-chat">
              <div className="bubble bubble-user">
                Increase Facebook ads by 20% if lead quality stays above last month’s average.
              </div>
              <div className="bubble bubble-ai">
                Compiled: daily quality check → +20% budget when score ≥ 72 → cap $400/day →
                auto-revert if quality drops.
              </div>
            </div>
            <div style={{ marginTop: "1.25rem" }}>
              <Link className="btn btn-dark" href="/app/command-language">
                Open Command Language
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="governance" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>AI Trust & Governance</h2>
              <p>
                Approval workflows, audit logs, role-based permissions, data retention, human
                approval for sensitive decisions, and compliance reporting — built for enterprise
                adoption.
              </p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/governance">
                Open Trust & Governance
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="customer-twin" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Customer Digital Twin</h2>
              <p>
                A living profile for every customer — purchase history, preferences, lifetime value,
                service history, satisfaction, loyalty, and upcoming needs — so Atlas personalizes
                every interaction.
              </p>
            </div>
            <div style={{ marginTop: "0.25rem" }}>
              <Link className="btn btn-dark" href="/app/customer-twin">
                Open Customer Twin
              </Link>
            </div>
          </div>
        </section>

        <section className="section" id="beachhead" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>Start where the mission bites hardest.</h2>
              <p>
                Small service businesses feel the gap first — no IT army, still drowning in calls and
                scheduling. Win there, then expand on the same platform.
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
          <h2>Every business deserves an intelligent workforce, regardless of its size.</h2>
          <p>Don’t just buy software. Join the mission.</p>
          <Link className="btn btn-dark" href="/onboarding">
            Create your AI workforce
          </Link>
        </section>
      </main>

      <footer className="container footer">
        <span>Atlas — intelligent workforce for every size</span>
        <span>Mission over features</span>
      </footer>
    </div>
  );
}
