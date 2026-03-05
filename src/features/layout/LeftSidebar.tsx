import type { JSX } from 'react';

const sections = [
  { title: "Home", items: [] },
  { title: "Flyer", items: ["Add a flyer", "Manage flyers"] },
  { title: "Aircraft", items: ["Add an aircraft", "Manage aircraft"] },
  { title: "Organisation", items: ["Add an organisation", "Manage organisation"] },
  // { title: "Flight", items: [] }
];

function LeftSidebar(): JSX.Element {
  return (
    <aside className="hidden h-full w-72 border-r border-slate-700 bg-surface px-4 py-6 lg:block">
      <div className="mb-8 text-xs uppercase tracking-[0.18em] text-slate-400">Drone Detector</div>
      <nav className="space-y-5 text-sm text-slate-100">
        {sections.map((section) => (
          <div key={section.title} className="border-b border-slate-700 pb-4 last:border-none">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-slate-500 px-3 py-2 text-left text-sm font-medium hover:border-mapGlow"
            >
              <span>{section.title}</span>
              <span className="text-slate-400">{section.items.length > 0 ? "v" : ">"}</span>
            </button>
            {section.items.length > 0 ? (
              <ul className="mt-3 space-y-1 pl-2 text-xs text-slate-300">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default LeftSidebar;
