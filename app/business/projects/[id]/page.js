import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import OrdersManager from "@/components/OrdersManager";
import ContactsManager from "@/components/ContactsManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

const STATUS_COLOR = {
  planning: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  active: "bg-clay/15 text-clay dark:text-clay-soft",
  on_hold: "bg-dusk/20 text-dusk",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

// Everything about one project in one place: its own info, the orders
// tied to it, and the contacts tied to it — instead of hunting across
// three separate lists to piece a project's status together.
export default async function ProjectDetailPage({ params }) {
  const locale = getLocale();
  const strings = t(locale);
  const b = strings.business;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("business_projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: orders }, { data: contacts }, { data: suppliers }] = await Promise.all([
    supabase
      .from("supply_chain_orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase.from("supply_chain_suppliers").select("id, name").eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link
            href="/business/projects"
            className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-2"
          >
            {locale === "ar" ? <>‹ {b.backToProjects}</> : <>{b.backToProjects} ›</>}
          </Link>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="font-display text-3xl">{project.name}</h1>
              {project.client && <p className="text-ink-muted dark:text-moon-muted mt-1">{project.client}</p>}
            </div>
            <span className={`text-xs rounded-full px-3 py-1.5 font-medium ${STATUS_COLOR[project.status] || STATUS_COLOR.planning}`}>
              {b.status[project.status] || b.status.planning}
            </span>
          </div>
          {(project.deadline || project.budget) && (
            <p className="text-sm text-ink-muted dark:text-moon-muted mt-2">
              {project.deadline && `📅 ${project.deadline}`}
              {project.deadline && project.budget && " · "}
              {project.budget && `💰 ${project.budget}`}
            </p>
          )}
          {project.notes && <p className="text-sm mt-3 leading-6">{project.notes}</p>}
        </div>

        <div>
          <h2 className="font-display text-xl mb-3">{b.projectOrders}</h2>
          {(orders || []).length === 0 ? (
            <p className="text-sm text-ink-muted dark:text-moon-muted mb-3">{b.noProjectOrders}</p>
          ) : null}
          <OrdersManager
            userId={user.id}
            initialOrders={orders || []}
            suppliers={suppliers || []}
            projects={[project]}
            defaultProjectId={project.id}
            strings={strings}
          />
        </div>

        <div>
          <h2 className="font-display text-xl mb-3">{b.projectContacts}</h2>
          {(contacts || []).length === 0 ? (
            <p className="text-sm text-ink-muted dark:text-moon-muted mb-3">{b.noProjectContacts}</p>
          ) : null}
          <ContactsManager
            userId={user.id}
            initialContacts={contacts || []}
            projects={[project]}
            defaultProjectId={project.id}
            strings={strings}
          />
        </div>
      </main>
    </div>
  );
}
