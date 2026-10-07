import { redirect } from "next/navigation";

// Settings has a single section for now.
export default function SettingsPage() {
  redirect("/admin/settings/groups");
}
