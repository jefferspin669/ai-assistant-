"use client";

import {
  executiveBills,
  executiveCashFlow,
  executiveEmails,
  executiveMetrics,
  executiveRecommendations,
  executiveSchedule,
  executiveTasks,
  executiveWeatherTraffic,
} from "@/lib/atlas-platform";

export function ExecutiveDashboardStudio() {
  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        {executiveMetrics.map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <div className="exec-grid">
        <section className="panel">
          <h2>Today’s schedule</h2>
          <div className="list">
            {executiveSchedule.map((item) => (
              <div className="list-row" key={item.time + item.title}>
                <span className="time">{item.time}</span>
                <p>
                  <strong>{item.title}</strong>
                  <span className="muted-line">{item.place}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Tasks</h2>
          <div className="list">
            {executiveTasks.map((task) => (
              <div className="list-row" key={task.title}>
                <span className={`badge${task.priority === "High" ? " warn" : ""}`}>
                  {task.due}
                </span>
                <p>
                  {task.title}
                  <span className="muted-line">{task.priority} priority</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Emails requiring attention</h2>
          <div className="list">
            {executiveEmails.map((email) => (
              <div className="list-row" key={email.subject}>
                <span className="badge">Inbox</span>
                <p>
                  <strong>{email.from}</strong>
                  <span className="muted-line">{email.subject}</span>
                  <span className="muted-line">{email.why}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Upcoming bills</h2>
          <div className="list">
            {executiveBills.map((bill) => (
              <div className="list-row" key={bill.name}>
                <span className="badge warn">{bill.due}</span>
                <p>
                  <strong>{bill.amount}</strong>
                  <span className="muted-line">{bill.name}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Cash flow</h2>
          <div className="stat-grid metrics-dense">
            {executiveCashFlow.map((item) => (
              <div className="stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Weather & traffic</h2>
          <div className="memory-card">
            <div className="label">Field conditions</div>
            <p>{executiveWeatherTraffic.weather}</p>
            <p style={{ marginTop: "0.6rem" }}>{executiveWeatherTraffic.traffic}</p>
            <p className="muted-line" style={{ marginTop: "0.6rem" }}>
              {executiveWeatherTraffic.airQuality}
            </p>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>AI recommendations</h2>
        <p className="panel-lead">Highest-impact moves for this morning.</p>
        <div className="list">
          {executiveRecommendations.map((item) => (
            <div className="list-row" key={item.title}>
              <span className="badge ok">Do next</span>
              <p>
                <strong>{item.title}</strong>
                <span className="muted-line">{item.detail}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
