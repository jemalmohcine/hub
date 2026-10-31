import { redirect } from "next/navigation";

export default function JobsRedirect() {
  redirect("/app/career?tab=jobs");
}
