import { redirect } from "next/navigation";

export default function CvBuilderRedirect() {
  redirect("/app/career?tab=cv");
}
