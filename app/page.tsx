import { ClipboardList, ShieldCheck, Table2 } from "lucide-react";
import { parseEnv } from "@/lib/env";
export default function Home() {
  parseEnv(process.env);
  return <main className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6"><div><p className="text-sm font-semibold tracking-widest text-primary">DAWSON & DAWSON</p><p className="mt-1 text-sm">Home Care · KPI Portal</p></div><span className="rounded-full bg-[#ece6f2] px-4 py-2 text-sm text-primary">Development setup</span></header>
    <section className="py-14"><p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">A clearer week, together</p><h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">One place for your team’s weekly numbers.</h1><p className="mt-6 max-w-xl leading-7 text-gray-600">The portal foundation is ready. Connect a development copy of the KPI workbook to begin validating the Sheets integration.</p><p className="mt-5 text-sm font-medium text-primary">Weekly updates are due every Monday by 10 AM.</p></section>
    <section className="grid gap-5 sm:grid-cols-3" aria-label="Development foundations">{[
      { Icon: Table2, title: "Your workbook stays central", text: "KPI values and calculations stay in Google Sheets. The portal will edit approved input cells only." },
      { Icon: ShieldCheck, title: "Access with accountability", text: "User approval, department permissions, and an audit trail are planned for the authentication phase." },
      { Icon: ClipboardList, title: "Built one phase at a time", text: "Setup comes first, followed by formula-safe Sheets access, sign-in, and weekly entry forms." },
    ].map(({ Icon, title, text }) => <article key={title} className="rounded-2xl border border-border bg-white p-6"><Icon className="mb-6 text-primary" size={26} aria-hidden="true"/><h2 className="font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-gray-600">{text}</p></article>)}</section>
    <aside className="mt-8 rounded-xl bg-[#ece6f2] p-5 text-sm leading-6"><strong>Setup preview.</strong> No live KPI data is displayed. Sign-in and editing will become available after the Sheets integration checks pass.</aside>
  </main>;
}
