import Image from "next/image";
import { DemoConsole } from "@/components/DemoConsole";

const features = [
  {
    title: "AI receptionist",
    copy: "Greets callers and website visitors in your voice, routes urgent needs, and keeps the line covered after hours.",
  },
  {
    title: "Appointment booking",
    copy: "Checks availability, books the slot, confirms by text, and sends reminders so no-shows drop.",
  },
  {
    title: "Customer follow-up",
    copy: "Nudges leads who went quiet, confirms jobs, and keeps warm conversations moving without another spreadsheet.",
  },
  {
    title: "Quotes",
    copy: "Turns service details into clean estimates and sends them while the customer is still deciding.",
  },
  {
    title: "Review requests",
    copy: "Asks happy customers for Google reviews at the right moment — not when you’re packing up for the night.",
  },
  {
    title: "FAQ chatbot",
    copy: "Answers hours, pricing ranges, parking, and prep questions on your site so people don’t bounce.",
  },
  {
    title: "Missed-call handling",
    copy: "Picks up when you can’t, takes a message, offers booking, and texts you a summary.",
  },
];

export default function HomePage() {
  return (
    <div className="site">
      <nav className="nav" aria-label="Primary">
        <a className="logo" href="#top" style={{ color: "#f7faf8" }}>
          Vera
        </a>
        <div className="nav-links">
          <a href="#features">Capabilities</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a className="nav-cta" href="#demo">
            Try Vera
          </a>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-media" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="container hero-content">
          <p className="brand-mark">Vera</p>
          <h1>Your local business AI employee</h1>
          <p>
            One subscription that covers the front desk — so your people can stay on the work that
            actually needs them.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#demo">
              Start a walkthrough
            </a>
            <a className="btn btn-ghost" href="#features">
              See what Vera handles
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section" id="features">
          <div className="container">
            <div className="section-head">
              <h2>Repetitive work, covered.</h2>
              <p>
                Vera doesn’t replace your team. It takes the calls, texts, and follow-ups that steal
                hours from the people who run the business.
              </p>
            </div>
            <div className="features">
              {features.map((feature, index) => (
                <article className="feature" key={feature.title}>
                  <span className="feature-index">0{index + 1}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how" style={{ paddingTop: 0 }}>
          <div className="container story">
            <div className="story-visual">
              <Image
                src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1600&q=80"
                alt="Small business owner talking with a customer at the counter"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
              <div className="story-panel">
                <strong>While you’re with a customer</strong>
                <span>Vera answers the missed call, books Thursday at 2:30, and texts you a note.</span>
              </div>
            </div>
            <div>
              <div className="section-head" style={{ marginBottom: "0.5rem" }}>
                <h2>Live in a day. Useful in an hour.</h2>
                <p>
                  Connect your calendar, number, and FAQ once. Vera learns your services, hours, and
                  tone — then starts covering the front desk.
                </p>
              </div>
              <div className="steps">
                <div className="step">
                  <span className="step-num">1</span>
                  <div>
                    <h3>Connect the basics</h3>
                    <p>Phone line, calendar, service menu, and the questions customers ask most.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-num">2</span>
                  <div>
                    <h3>Set the guardrails</h3>
                    <p>Approve what Vera can book, quote, and escalate — you stay in control.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-num">3</span>
                  <div>
                    <h3>Let it run</h3>
                    <p>Reception, follow-ups, reviews, and missed calls stay covered every day.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="pricing" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="pricing">
              <div>
                <h2>One subscription. A full front desk.</h2>
                <p>
                  Built for salons, clinics, contractors, studios, and neighborhood shops that can’t
                  afford another hire — but can’t afford missed calls either.
                </p>
                <a className="btn btn-primary" href="#demo">
                  Talk to us
                </a>
              </div>
              <div className="price-box">
                <div>
                  <div className="price-amount">
                    $149<small>/month</small>
                  </div>
                  <p style={{ marginTop: "0.7rem", color: "rgba(247,250,248,0.75)" }}>
                    Everything in one plan. No per-seat surprise.
                  </p>
                </div>
                <ul>
                  <li>Receptionist + missed-call recovery</li>
                  <li>Booking, quotes, and follow-up</li>
                  <li>FAQ chatbot + review requests</li>
                  <li>Setup help and ongoing tuning</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="demo">
          <div className="container">
            <div className="section-head">
              <h2>See Vera answer like your shop.</h2>
              <p>
                Leave your details for a walkthrough, or type a question into the live demo on the
                right.
              </p>
            </div>
            <DemoConsole />
          </div>
        </section>

        <section className="container final-cta">
          <h2>Keep the craft. Automate the busywork.</h2>
          <p>Vera handles the repetitive front-desk loop so your team can stay human where it counts.</p>
          <a className="btn btn-primary" href="#demo">
            Get Vera for your business
          </a>
        </section>
      </main>

      <footer className="container footer">
        <span>Vera — local business AI employee</span>
        <span>Built for owners who answer the phone between jobs.</span>
      </footer>
    </div>
  );
}
