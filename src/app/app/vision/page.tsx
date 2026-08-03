"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VisionStudio } from "@/components/VisionStudio";

export default function VisionPage() {
  const [uploadSignal, setUploadSignal] = useState(0);

  return (
    <AppShell
      title="Atlas Vision"
      subtitle="Take a picture or upload files — Atlas understands HVAC, restaurant, retail, construction, and more."
      action={
        <button className="btn btn-dark" type="button" onClick={() => setUploadSignal((n) => n + 1)}>
          Upload photo
        </button>
      }
    >
      <VisionStudio uploadSignal={uploadSignal} />
    </AppShell>
  );
}
