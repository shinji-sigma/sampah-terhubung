import { redirect } from "next/navigation";
import { SUS_RESPONDENT_URL } from "@/lib/sus-destination";

export default function EvaluationPage() {
  redirect(SUS_RESPONDENT_URL);
}

