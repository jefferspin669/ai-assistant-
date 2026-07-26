import { AppShell } from "@/components/AppShell";
import { team } from "@/lib/data";

export default function TeamPage() {
  return (
    <AppShell
      title="Team Management"
      subtitle="Add employees, set permissions, assign jobs, and track performance."
      action={<button className="btn btn-dark">Add employee</button>}
    >
      <section className="panel">
        <h2>Roster</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Jobs</th>
              <th>Rating</th>
              <th>Permissions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member) => (
              <tr key={member.name}>
                <td>
                  <strong>{member.name}</strong>
                </td>
                <td>{member.role}</td>
                <td>{member.jobs}</td>
                <td>{member.rating}</td>
                <td>{member.perms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Internal chat</h2>
          <div className="chat-mock">
            <div className="bubble bubble-ai">Alex: Running 10 minutes behind on Oak Ave.</div>
            <div className="bubble bubble-user">Owner: All good — Sarah already texted the next customer.</div>
          </div>
        </section>
        <section className="panel">
          <h2>Job assignment</h2>
          <div className="list">
            <div className="list-row">
              <span className="badge">Assign</span>
              <p>Water heater install · Jamie Cole → Sam</p>
            </div>
            <div className="list-row">
              <span className="badge">Assign</span>
              <p>Leak inspection · Marcus Nguyen → Alex</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
