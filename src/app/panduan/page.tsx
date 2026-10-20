import Dashboard from "@/components/dashboard";
import { configured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default function PanduanPage() {
  return (
    <Dashboard
      configured={configured()}
      demo={process.env.DEMO_MODE !== "false"}
      initialNow={new Date().toISOString()}
      initialView="guide"
    />
  );
}
