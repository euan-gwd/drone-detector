import { useState } from 'react';
import type { JSX } from 'react';
import { ChevronDown } from 'lucide-react';

const sections = [
  { title: "Home", items: [] },
  { title: "Flyer", items: ["Add a flyer", "Manage flyers"] },
  { title: "Aircraft", items: ["Add an aircraft", "Manage aircraft"] },
  { title: "Organisation", items: ["Add an organisation", "Manage organisation"] }
];

function ChevronIcon({ open }: { open: boolean }): JSX.Element {
  return <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />;
}

function SidebarSection({ title, items }: { title: string; items: string[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const hasItems = items.length > 0;

  return (
    <div className="border-b border-slate-700 pb-4 last:border-none">
      <button
        type="button"
        onClick={() => hasItems && setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-md border border-slate-500 px-3 py-2 text-left text-sm font-medium transition-colors hover:border-mapGlow ${!hasItems ? "cursor-default" : "cursor-pointer"}`}
      >
        <span>{title}</span>
        {hasItems && <ChevronIcon open={open} />}
      </button>
      {hasItems && open && (
        <ul className="mt-3 space-y-1 pl-2 text-xs text-slate-300">
          {items.map((item) => (
            <li
              key={item}
              className="cursor-pointer rounded px-2 py-1 hover:bg-slate-700 hover:text-slate-100"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeftSidebar(): JSX.Element {
  return (
    <aside className="hidden h-full w-72 border-r border-slate-700 bg-surface px-4 py-6 lg:block">
      <div className="mb-8 text-xs uppercase tracking-[0.18em] text-slate-400">Drone Detect</div>
      <nav className="space-y-5 text-sm text-slate-100">
        {sections.map((section) => (
          <SidebarSection key={section.title} title={section.title} items={section.items} />
        ))}
      </nav>
    </aside>
  );
}

export default LeftSidebar;
