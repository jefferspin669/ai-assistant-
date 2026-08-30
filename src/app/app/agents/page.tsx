import { agentsHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function AgentsPage() {
  return (
    <SectionHub
      title="Agents"
      subtitle="You talk to Atlas. Atlas routes to specialists — you do not pick an agent first."
      items={agentsHub}
    />
  );
}
