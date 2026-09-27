import { redirect } from "next/navigation";

// Consolidated into the "My World" hub (/world) as an internal tab.
// This route now just redirects so old links/bookmarks keep working.
export default function Redirect() {
  redirect("/world");
}
