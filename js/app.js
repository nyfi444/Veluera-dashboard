const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// NEVER change storeKey — doing so would erase all user data.
// If a schema migration is ever needed, add the old key to legacyKeys below
// and update storeKey to the new value. Data will auto-migrate on next load.
const storeKey = "myUniverseDashboard.v1";
const legacyKeys = []; // e.g. ["myUniverseDashboard.v0"]
const today = new Date();
const iso = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (d, opts) => new Intl.DateTimeFormat("en-US", opts).format(d);

const seed = {
  route: "dashboard",
  calView: "month",
  calDate: iso(today),
  selectedBusiness: "lunar-love",
  selectedAgent: "personal-assistant",
  selectedNote: "welcome-note",
  cycleStart: "2026-05-28",
  cycleLength: 28,
  periodLength: 5,
  tasks: [
    { id: uid(), title: "Map tomorrow's top three goals", category: "personal", due: iso(today), priority: "high", done: false },
    { id: uid(), title: "Review Lunar Love content ideas", category: "business", business: "lunar-love", due: iso(today), priority: "medium", done: false },
    { id: uid(), title: "Check assignment deadlines", category: "school", due: iso(today), priority: "medium", done: false }
  ],
  businesses: [
    { id: "lunar-love", name: "Lunar Love", emoji: "🌙", desc: "Cosmic brand, rituals, astrology offers", color: "linear-gradient(135deg,#9B59B6,#F48FB1)", revenue: 2400, expenses: 780 },
    { id: "halo-house", name: "Halo House Collective Co", emoji: "✨", desc: "Creative studio and collective", color: "linear-gradient(135deg,#48CAE4,#C39BD3)", revenue: 1800, expenses: 620 },
    { id: "love-sativa", name: "Love Sativa", emoji: "🌿", desc: "Lifestyle, wellness, education", color: "linear-gradient(135deg,#57C99E,#FF9F7F)", revenue: 1200, expenses: 430 },
    { id: "drop-shipping", name: "Drop Shipping", emoji: "📦", desc: "Products, testing, storefronts", color: "linear-gradient(135deg,#FF9F7F,#E91E8C)", revenue: 950, expenses: 510 }
  ],
  assignments: [
    { id: uid(), title: "Weekly discussion post", course: "Psychology", due: iso(today), done: false },
    { id: uid(), title: "Research paper outline", course: "Business", due: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)), done: false }
  ],
  courses: ["Psychology", "Business", "Writing"],
  notes: [
    { id: "root", type: "folder", name: "Notebooks", parent: null, open: true },
    { id: "personal-folder", type: "folder", name: "Personal", parent: "root", open: true },
    { id: "business-folder", type: "folder", name: "Business", parent: "root", open: true },
    { id: "welcome-note", type: "note", name: "Dashboard Vision", parent: "personal-folder", content: "This is your notebook space. Add folders inside folders, create notes under any topic, and print everything into a clean PDF from the toolbar." },
    { id: "brand-note", type: "note", name: "Brand Ideas", parent: "business-folder", content: "Lunar Love: moon rituals, daily astrology texts, numerology readings, matrix of destiny content, launch calendar." }
  ],
  manifests: [
    { id: uid(), type: "affirmation", text: "I organize my life with ease, beauty, and consistency." },
    { id: uid(), type: "goal", text: "Build a daily dashboard rhythm that supports school, business, body, and spirit." }
  ],
  agents: [
    { id: "personal-assistant", emoji: "💌", name: "Personal Assistant", role: "Daily planning, reminders, life admin, supportive check-ins", messages: [{ from: "assistant", text: "Assign me a task and I can break it into next steps, reminders, and calendar actions." }] },
    { id: "task-manager", emoji: "✅", name: "Task Manager", role: "Sorts tasks, priorities, deadlines, and follow-up plans", messages: [{ from: "assistant", text: "Send me a messy list and I will organize it by business, personal, and school." }] },
    { id: "lunar-love-agent", emoji: "🌙", name: "Lunar Love Agent", role: "Astrology offers, brand content, launch planning", messages: [{ from: "assistant", text: "I can help shape Lunar Love into content, products, and weekly rituals." }] }
  ],
  links: [
    { name: "Pinterest", url: "https://www.pinterest.com", icon: "📌" },
    { name: "Spotify", url: "https://open.spotify.com", icon: "🎵" }
  ]
};

let state = load();

function load() {
  const raw = localStorage.getItem(storeKey);
  if (raw) {
    try { return { ...seed, ...JSON.parse(raw) }; }
    catch {
      // Primary data corrupted — try rolling backup before giving up
      const backup = localStorage.getItem(storeKey + ".bak");
      if (backup) { try { return { ...seed, ...JSON.parse(backup) }; } catch {} }
    }
  }
  // Migrate from any legacy key (used when storeKey is ever bumped)
  for (const old of legacyKeys) {
    const legacy = localStorage.getItem(old);
    if (legacy) {
      try {
        const migrated = { ...seed, ...JSON.parse(legacy) };
        localStorage.setItem(storeKey, JSON.stringify(migrated));
        localStorage.removeItem(old);
        return migrated;
      } catch {}
    }
  }
  return structuredClone(seed);
}
function save() {
  const json = JSON.stringify(state);
  // Write backup before overwriting primary so a failed write doesn't lose data
  localStorage.setItem(storeKey + ".bak", localStorage.getItem(storeKey) || json);
  localStorage.setItem(storeKey, json);
}
function setState(patch) { Object.assign(state, patch); save(); render(); }
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

const nav = [
  ["Core", [["dashboard", "🏠", "Dashboard"], ["calendar", "📅", "Calendar"], ["tasks", "✅", "Tasks"], ["university", "🎓", "University Hub"]]],
  ["Soul", [["cosmic", "🔮", "Cosmic"], ["period", "🌸", "Cycle Tracker"], ["manifest", "🕯️", "Manifestation"]]],
  ["Create", [["notebook", "📓", "Notebook"], ["business", "💼", "Business Hub"], ["agents", "🤖", "AI Agents"], ["apps", "🔗", "Linked Apps"]]]
];

function render() {
  renderSidebar();
  const route = state.route || "dashboard";
  const pages = { dashboard, calendar, tasks, university, cosmic, period, notebook, business, agents, manifest, apps };
  $("#content").innerHTML = (pages[route] || dashboard)();
  bindPage();
}

function renderSidebar() {
  const phase = cyclePhase(new Date());
  $("#sidebar").innerHTML = `
    <div class="sidebar-brand"><h1>My Universe</h1><p>soft structure for a big life</p></div>
    <div class="sidebar-nav">
      ${nav.map(([label, items]) => `<div class="nav-label">${label}</div>${items.map(([id, icon, name]) => `
        <div class="nav-item ${state.route === id ? "active" : ""}" data-route="${id}">
          <span class="nav-icon">${icon}</span><span>${name}</span>
        </div>`).join("")}`).join("")}
    </div>
    <div class="sidebar-cycle-badge" style="background:${phase.bg};color:${phase.text}">
      <span class="cycle-dot" style="background:${phase.color}"></span>${phase.name} phase
    </div>
    <div class="sidebar-quick">
      <h3>Quick add</h3>
      <div class="quick-add"><input id="quickTask" placeholder="Add task for today"><button id="quickAdd">+</button></div>
      ${state.tasks.filter(t => !t.done).slice(0, 5).map(t => `
        <label class="quick-task"><input type="checkbox" data-done="${t.id}"><span>${esc(t.title)}</span></label>`).join("")}
    </div>
    <div class="sidebar-data-btns">
      <button id="exportBtn" title="Download a backup of all your data">⬇ Export</button>
      <label id="importLbl" title="Restore data from a backup file">⬆ Import<input type="file" id="importFile" accept=".json" style="display:none"></label>
    </div>`;
}

function header(title, sub, actions = "") {
  return `<div class="page-header"><div class="page-header-left"><h1>${title}</h1><p>${sub}</p></div><div class="page-header-right">${actions}</div></div>`;
}

function dashboard() {
  const dueToday = state.tasks.filter(t => t.due === iso(today) && !t.done);
  const assignments = state.assignments.filter(a => !a.done).slice(0, 4);
  return `
    <div class="dashboard-welcome">Welcome back, Nylah</div>
    <div class="dashboard-date">${fmt(today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} • ${moonPhase(today).name}</div>
    <div class="grid-4">
      ${stat("✅", dueToday.length, "tasks today")}
      ${stat("🎓", assignments.length, "open assignments")}
      ${stat("💼", state.businesses.length, "businesses")}
      ${stat("🌙", cyclePhase(today).name, "cycle phase")}
    </div>
    <div class="grid-2" style="margin-top:20px">
      <div class="card">${cardTitle("Today", `<button class="btn btn-sm btn-primary" data-open-task>Add task</button>`)}${taskList(dueToday)}</div>
      <div class="card">${cardTitle("Moon + Astrology", "")}
        <div class="cycle-info-strip"><div class="cycle-circle" style="background:${cyclePhase(today).bg}">${moonPhase(today).emoji}</div>
          <div><strong>${moonPhase(today).name}</strong><br><span style="color:var(--text-mid)">Good day for planning, reflection, and choosing one clear intention.</span></div>
        </div>
        <div class="app-links-row"><button class="app-link-btn" data-route="cosmic"><span class="app-link-icon">🔮</span>Cosmic section</button><button class="app-link-btn" data-route="manifest"><span class="app-link-icon">🕯️</span>Manifestation</button></div>
      </div>
      <div class="card">${cardTitle("University", `<button class="btn btn-sm btn-soft" data-route="university">Open</button>`)}${assignmentList(assignments)}</div>
      <div class="card">${cardTitle("Business Pulse", `<button class="btn btn-sm btn-soft" data-route="business">Open</button>`)}
        ${state.businesses.slice(0, 4).map(b => `<div class="task-item"><span>${b.emoji}</span><div class="task-title">${esc(b.name)}</div><span class="badge badge-mint">$${b.revenue}</span></div>`).join("")}
      </div>
    </div>`;
}

function calendar() {
  const d = new Date(state.calDate + "T00:00:00");
  const label = state.calView === "year" ? d.getFullYear() : fmt(d, { month: "long", year: "numeric" });
  return header("Calendar", "Daily, weekly, monthly, quarterly, and yearly planning with tasks, moon phases, and cycle dots.",
    `<button class="btn btn-ghost btn-sm" id="prevCal">‹</button><button class="btn btn-soft btn-sm" id="todayCal">Today</button><button class="btn btn-ghost btn-sm" id="nextCal">›</button><button class="btn btn-primary btn-sm" data-open-task>Add task</button>`) +
    `<div class="card">
      <div class="cal-nav"><div class="cal-nav-title">${label}</div><div class="cal-view-tabs">${["day","week","month","quarter","year"].map(v => `<button class="tab ${state.calView === v ? "active" : ""}" data-cal-view="${v}">${v}</button>`).join("")}</div></div>
      ${phaseLegend()}${calendarView(d)}
    </div>`;
}

function calendarView(d) {
  if (state.calView === "day") return dayView(d);
  if (state.calView === "week") return weekView(d);
  if (state.calView === "quarter") return `<div class="quarterly-grid">${[0,1,2].map(i => monthGrid(new Date(d.getFullYear(), Math.floor(d.getMonth()/3)*3+i, 1), true)).join("")}</div>`;
  if (state.calView === "year") return `<div class="year-grid-wrap">${Array.from({ length: 12 }, (_, i) => yearMonth(new Date(d.getFullYear(), i, 1))).join("")}</div>`;
  return monthGrid(d);
}

function monthGrid(d, compact = false) {
  const y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1), start = first.getDay(), days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(`<div class="cal-cell empty"></div>`);
  for (let day = 1; day <= days; day++) cells.push(dayCell(new Date(y, m, day), compact));
  return `<div>${compact ? `<div class="year-month-title">${fmt(d,{month:"long"})}</div>` : ""}<div class="cal-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x => `<div class="cal-header-cell">${x}</div>`).join("")}${cells.join("")}</div></div>`;
}

function dayCell(d, compact = false) {
  const iday = iso(d), tasks = state.tasks.filter(t => t.due === iday), phase = cyclePhase(d), moon = moonPhase(d);
  return `<div class="cal-cell ${iday === iso(today) ? "today" : ""}" data-day="${iday}">
    <div class="cal-cell-top"><span class="cal-date ${iday === iso(today) ? "today-badge" : ""}">${d.getDate()}</span><span class="cal-moon" title="${moon.name}">${moon.emoji}</span></div>
    <div class="cal-cell-indicators"><span class="cycle-dot" title="${phase.name}" style="background:${phase.color}"></span></div>
    ${compact ? "" : tasks.slice(0, 3).map(t => `<div class="cal-event" style="background:${categoryColor(t.category)}">${esc(t.title)}</div>`).join("")}
    ${tasks.length > 3 ? `<div class="cal-more">+${tasks.length - 3} more</div>` : ""}</div>`;
}

function weekView(d) {
  const start = new Date(d); start.setDate(d.getDate() - d.getDay());
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return `<div class="week-container"><div class="week-grid"><div class="week-header-cell"></div>${days.map(x => `<div class="week-header-cell ${iso(x)===iso(today)?"today":""}"><div class="week-header-day">${x.getDate()}</div>${fmt(x,{weekday:"short"})} ${moonPhase(x).emoji}</div>`).join("")}
    ${[8,10,12,14,16,18].map(h => `<div class="week-time-col">${h}:00</div>${days.map(x => `<div class="week-slot" data-day="${iso(x)}">${state.tasks.filter(t => t.due === iso(x)).slice(0,2).map(t => `<div class="cal-event" style="background:${categoryColor(t.category)}">${esc(t.title)}</div>`).join("")}</div>`).join("")}`).join("")}
  </div></div>`;
}

function dayView(d) {
  const tasks = state.tasks.filter(t => t.due === iso(d));
  return `<div class="cycle-info-strip"><div class="cycle-circle" style="background:${cyclePhase(d).bg}">${moonPhase(d).emoji}</div><div><strong>${fmt(d,{weekday:"long",month:"long",day:"numeric"})}</strong><br>${cyclePhase(d).name} phase • ${moonPhase(d).name}</div></div>
  <div class="day-view">${[7,8,9,10,11,12,13,14,15,16,17,18,19].map(h => `<div class="week-time-col">${h}:00</div><div class="day-slot" data-day="${iso(d)}">${h === 9 ? taskList(tasks) : ""}</div>`).join("")}</div>`;
}

function yearMonth(d) {
  const y = d.getFullYear(), m = d.getMonth(), start = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  return `<div class="year-month-card"><div class="year-month-title">${fmt(d,{month:"long"})}</div><div class="mini-cal-grid">${["S","M","T","W","T","F","S"].map(x=>`<div class="mini-cal-header">${x}</div>`).join("")}${Array.from({length:start},()=>`<div class="mini-cal-day empty"></div>`).join("")}${Array.from({length:days},(_,i)=>{const dd=new Date(y,m,i+1), key=iso(dd);return `<div class="mini-cal-day ${key===iso(today)?"today":""} ${state.tasks.some(t=>t.due===key)?"has-event":""}" data-day="${key}">${i+1}</div>`}).join("")}</div></div>`;
}

function tasks() {
  return header("Tasks", "Separated by business, personal, and school. Tasks added here can appear on the calendar.",
    `<button class="btn btn-primary" data-open-task>Add task</button>`) +
    `<div class="grid-3">${["business","personal","school"].map(cat => `<div class="card">${cardTitle(cat[0].toUpperCase()+cat.slice(1), "")}${taskList(state.tasks.filter(t => t.category === cat))}</div>`).join("")}</div>`;
}

function university() {
  return header("University Hub", "Courses, assignments, due dates, and school tasks in one place.",
    `<button class="btn btn-primary" id="addAssignment">Add assignment</button>`) +
    `<div class="grid-2"><div class="card">${cardTitle("Courses", `<button class="btn btn-sm btn-soft" id="addCourse">Add course</button>`)}
      <div class="app-links-row">${state.courses.map(c => `<span class="course-pill" style="background:var(--lavender);color:var(--purple)">${esc(c)}</span>`).join("")}</div></div>
      <div class="card">${cardTitle("Assignments", "")}${assignmentList(state.assignments)}</div></div>`;
}

function cosmic() {
  const signs = [["♈","Aries","Mar 21-Apr 19"],["♉","Taurus","Apr 20-May 20"],["♊","Gemini","May 21-Jun 20"],["♋","Cancer","Jun 21-Jul 22"],["♌","Leo","Jul 23-Aug 22"],["♍","Virgo","Aug 23-Sep 22"],["♎","Libra","Sep 23-Oct 22"],["♏","Scorpio","Oct 23-Nov 21"],["♐","Sagittarius","Nov 22-Dec 21"],["♑","Capricorn","Dec 22-Jan 19"],["♒","Aquarius","Jan 20-Feb 18"],["♓","Pisces","Feb 19-Mar 20"]];
  return header("Cosmic Section", "Astrology, numerology, moon phase, and matrix of destiny planning.",
    `<button class="btn btn-pink" data-route="manifest">Turn insight into goals</button>`) +
    `<div class="grid-2"><div class="card span-2">${cardTitle("Astrology", "")}<div class="zodiac-grid">${signs.map(s => `<div class="zodiac-card"><div class="zodiac-sign">${s[0]}</div><div class="zodiac-name">${s[1]}</div><div class="zodiac-dates">${s[2]}</div></div>`).join("")}</div></div>
      <div class="card">${cardTitle("Numerology", "")}<input class="input" id="numName" placeholder="Type your full name"><div class="num-display" id="numOut">7</div></div>
      <div class="card">${cardTitle("Matrix of Destiny", "")}<textarea class="input" placeholder="Add destiny chart notes, archetypes, lessons, and readings."></textarea></div></div>`;
}

function period() {
  const ph = cyclePhase(today);
  return header("Cycle Tracker", "Menstrual, ovulation, luteal, and follicular colors show as dots on the calendar.",
    `<button class="btn btn-soft" data-route="calendar">View calendar</button>`) +
    `<div class="grid-2"><div class="card">${cardTitle("Current Phase", "")}<div class="cycle-info-strip"><div class="cycle-circle" style="background:${ph.bg}"><span class="cycle-dot" style="background:${ph.color};width:16px;height:16px"></span></div><div><strong>${ph.name}</strong><br><span style="color:var(--text-mid)">${ph.note}</span></div></div>${phaseLegend()}</div>
    <div class="card">${cardTitle("Cycle Settings", "")}<label>Last period start</label><input class="input" type="date" id="cycleStart" value="${state.cycleStart}"><div class="form-row" style="margin-top:14px"><div><label>Cycle length</label><input class="input" type="number" id="cycleLength" value="${state.cycleLength}"></div><div><label>Period length</label><input class="input" type="number" id="periodLength" value="${state.periodLength}"></div></div><button class="btn btn-primary" id="saveCycle" style="margin-top:16px">Save cycle</button></div></div>`;
}

function notebook() {
  const note = state.notes.find(n => n.id === state.selectedNote && n.type === "note");
  return header("Notebook", "Obsidian-style folders, subfolders, notes, and print-ready PDF output.",
    `<button class="btn btn-soft" id="printNotes">Print PDF</button><button class="btn btn-primary" id="addRootFolder">Add folder</button>`) +
    `<div class="notebook-layout"><div class="notebook-sidebar"><div class="notebook-sidebar-header"><h3>Notebooks</h3><button class="btn btn-sm btn-soft" id="addNote">Note</button></div><div class="tree-area">${tree("root")}</div></div>
    <div class="notebook-editor">${note ? `<input class="note-title-input" id="noteTitle" value="${esc(note.name)}"><textarea class="note-content-area" id="noteContent">${esc(note.content)}</textarea>` : `<div class="note-empty-state"><div class="emoji">📓</div><p>Select or create a note</p></div>`}</div></div>`;
}

function business() {
  const b = state.businesses.find(x => x.id === state.selectedBusiness) || state.businesses[0];
  return header("Business Hub", "Financial planning, brand building, business plans, content, and launches.",
    `<button class="btn btn-primary" id="addBusiness">Add business</button>`) +
    `<div class="biz-cards">${state.businesses.map(x => `<div class="biz-card ${x.id===b.id?"selected":""}" data-biz="${x.id}" style="background:${x.color}"><span class="biz-emoji">${x.emoji}</span><div class="biz-name">${esc(x.name)}</div><div class="biz-desc">${esc(x.desc)}</div></div>`).join("")}</div>
    <div class="grid-3"><div class="card">${cardTitle("Financial Plan", "")}<div class="fin-summary"><div class="fin-sum-card" style="background:var(--mint)"><div class="fin-sum-amount">$${b.revenue}</div><div class="fin-sum-label">Revenue</div></div><div class="fin-sum-card" style="background:var(--blush)"><div class="fin-sum-amount">$${b.expenses}</div><div class="fin-sum-label">Expenses</div></div></div><button class="btn btn-soft btn-sm" id="editFinance">Edit numbers</button></div>
    <div class="card">${cardTitle("Brand Builder", "")}<textarea class="input" placeholder="Voice, colors, offers, dream client, content pillars...">${esc(b.desc)}</textarea></div>
    <div class="card">${cardTitle("Business Plan", "")}<textarea class="input" placeholder="Mission, offers, marketing plan, operations, launch timeline..."></textarea></div></div>`;
}

function agents() {
  const a = state.agents.find(x => x.id === state.selectedAgent) || state.agents[0];
  return header("AI Agents", "Create agents for personal life, tasks, school, and each business.",
    `<button class="btn btn-primary" id="addAgent">Create agent</button>`) +
    `<div class="agents-layout"><div class="agents-list-panel">${state.agents.map(x => `<div class="agent-card ${x.id===a.id?"active":""}" data-agent="${x.id}"><div class="agent-card-header"><span class="agent-emoji-big">${x.emoji}</span><div><div class="agent-name">${esc(x.name)}</div></div></div><div class="agent-card-desc">${esc(x.role)}</div></div>`).join("")}</div>
    <div class="chat-panel"><div class="chat-header"><span class="agent-emoji-big">${a.emoji}</span><div><strong>${esc(a.name)}</strong><br><span style="color:var(--text-light);font-size:12px">${esc(a.role)}</span></div></div><div class="chat-messages">${a.messages.map(m => `<div class="chat-msg ${m.from}">${esc(m.text)}</div>`).join("")}</div><div class="chat-input-row"><input class="input" id="agentMsg" placeholder="Assign a task or ask for help"><button class="btn btn-primary" id="sendAgent">Send</button></div></div></div>`;
}

function manifest() {
  return header("Manifestation Station", "Turn visions into goals, beliefs, affirmations, and scripting.",
    `<button class="btn btn-primary" id="addManifest">Add manifestation</button>`) +
    `<div class="grid-2"><div class="card">${cardTitle("Manifestations", "")}${state.manifests.map(m => `<div class="manifest-item" style="background:${m.type==="goal"?"var(--mint)":m.type==="belief"?"var(--sky)":m.type==="script"?"var(--peach)":"var(--blush)"}"><button class="manifest-delete" data-del-manifest="${m.id}">×</button><div class="manifest-type-tag">${esc(m.type)}</div><div class="manifest-text">${esc(m.text)}</div></div>`).join("")}</div><div class="card">${cardTitle("Vision Board", "")}<div class="vision-grid">${["Goal","Belief","Affirmation","Scripting","Image","Launch"].map(x => `<div class="vision-item"><span>＋</span><span>${x}</span></div>`).join("")}</div></div></div>`;
}

function apps() {
  return header("Linked Apps", "Easy launch links for tools you use often.",
    `<button class="btn btn-primary" id="addLink">Add app</button>`) +
    `<div class="card"><div class="app-links-row">${state.links.map(l => `<a class="app-link-btn" href="${esc(l.url)}" target="_blank" rel="noreferrer"><span class="app-link-icon">${l.icon}</span>${esc(l.name)}</a>`).join("")}</div></div>`;
}

function bindPage() {
  $$("[data-route]").forEach(el => el.onclick = () => setState({ route: el.dataset.route }));
  $("#quickAdd")?.addEventListener("click", () => addTask({ title: $("#quickTask").value, category: "personal", due: iso(today) }));
  $$("[data-done]").forEach(el => el.onchange = () => toggleTask(el.dataset.done));
  $$("[data-del-task]").forEach(el => el.onclick = () => delTask(el.dataset.delTask));
  $$("[data-open-task]").forEach(el => el.onclick = () => taskModal(el.dataset.day || iso(today)));
  $$("[data-day], .week-slot, .day-slot").forEach(el => el.onclick = () => taskModal(el.dataset.day || iso(today)));
  $$("[data-cal-view]").forEach(el => el.onclick = () => setState({ calView: el.dataset.calView }));
  $("#todayCal")?.addEventListener("click", () => setState({ calDate: iso(today) }));
  $("#prevCal")?.addEventListener("click", () => shiftCal(-1));
  $("#nextCal")?.addEventListener("click", () => shiftCal(1));
  $("#saveCycle")?.addEventListener("click", () => setState({ cycleStart: $("#cycleStart").value, cycleLength: +$("#cycleLength").value || 28, periodLength: +$("#periodLength").value || 5 }));
  $("#addAssignment")?.addEventListener("click", assignmentModal);
  $("#addCourse")?.addEventListener("click", () => simplePrompt("Course name", "", v => setState({ courses: [...state.courses, v] })));
  $("#numName")?.addEventListener("input", e => $("#numOut").textContent = numerology(e.target.value));
  $$("[data-biz]").forEach(el => el.onclick = () => setState({ selectedBusiness: el.dataset.biz }));
  $("#addBusiness")?.addEventListener("click", businessModal);
  $("#editFinance")?.addEventListener("click", financeModal);
  $$("[data-agent]").forEach(el => el.onclick = () => setState({ selectedAgent: el.dataset.agent }));
  $("#addAgent")?.addEventListener("click", agentModal);
  $("#sendAgent")?.addEventListener("click", sendAgent);
  $("#addManifest")?.addEventListener("click", manifestModal);
  $$("[data-del-manifest]").forEach(el => el.onclick = () => setState({ manifests: state.manifests.filter(m => m.id !== el.dataset.delManifest) }));
  $("#addLink")?.addEventListener("click", linkModal);
  $("#addRootFolder")?.addEventListener("click", () => addFolder("root"));
  $("#addNote")?.addEventListener("click", () => addNote(state.selectedNote || "root"));
  $("#printNotes")?.addEventListener("click", printNotes);
  $$("[data-note]").forEach(el => el.onclick = () => setState({ selectedNote: el.dataset.note }));
  $$("[data-add-folder]").forEach(el => el.onclick = ev => { ev.stopPropagation(); addFolder(el.dataset.addFolder); });
  $$("[data-add-note]").forEach(el => el.onclick = ev => { ev.stopPropagation(); addNote(el.dataset.addNote); });
  $("#noteTitle")?.addEventListener("input", e => updateNote({ name: e.target.value }));
  $("#noteContent")?.addEventListener("input", e => updateNote({ content: e.target.value }));
  $$("[data-assignment-done]").forEach(el => el.onchange = () => toggleAssignment(el.dataset.assignmentDone));
  // These live in the sidebar so they're always present after every render
  document.getElementById("exportBtn")?.addEventListener("click", exportData);
  document.getElementById("importFile")?.addEventListener("change", e => importData(e.target.files[0]));
}

function stat(icon, value, label) { return `<div class="stat-card"><div class="stat-icon">${icon}</div><div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div></div>`; }
function cardTitle(name, right) { return `<div class="card-title"><span>${name}</span><span>${right}</span></div>`; }
function categoryColor(cat) { return { business: "var(--lavender)", personal: "var(--blush)", school: "var(--sky)" }[cat] || "var(--cream)"; }
function taskList(items) {
  return items.length ? items.map(t => `<div class="task-item ${t.done ? "done" : ""}"><button class="task-check ${t.done ? "checked" : ""}" data-done="${t.id}">${t.done ? "✓" : ""}</button><div class="task-title">${esc(t.title)}</div><div class="task-meta"><span class="badge badge-${t.category==="school"?"sky":t.category==="business"?"purple":"pink"}">${t.category}</span><span class="task-due">${t.due || ""}</span><button class="task-delete" data-del-task="${t.id}">×</button></div></div>`).join("") : `<div class="empty-state"><div class="es-emoji">♡</div><p>No items here yet.</p></div>`;
}
function assignmentList(items) {
  return items.length ? items.map(a => `<label class="assignment-row ${a.done ? "done" : ""}"><input type="checkbox" data-assignment-done="${a.id}" ${a.done ? "checked" : ""}><div><div class="assignment-title">${esc(a.title)}</div><div class="assignment-meta"><span>${esc(a.course)}</span><span class="${new Date(a.due) <= today ? "assignment-due-urgent" : ""}">${a.due}</span></div></div></label>`).join("") : `<div class="empty-state"><div class="es-emoji">🎓</div><p>No assignments yet.</p></div>`;
}
function phaseLegend() {
  return `<div class="phase-legend">${["menstrual","follicular","ovulation","luteal"].map(k => `<div class="phase-legend-item"><span class="cycle-dot" style="background:var(--${k})"></span>${k}</div>`).join("")}</div>`;
}
function cyclePhase(d) {
  const start = new Date((state.cycleStart || iso(today)) + "T00:00:00");
  const len = +state.cycleLength || 28, day = (((Math.floor((d - start) / 86400000) % len) + len) % len) + 1;
  if (day <= (+state.periodLength || 5)) return { name: "Menstrual", color: "var(--menstrual)", bg: "#FFE5E9", text: "#B82042", note: "Rest, simplify, hydrate, and let the dashboard carry the details." };
  if (day <= 12) return { name: "Follicular", color: "var(--follicular)", bg: "#F1E3F7", text: "#7D3C98", note: "Fresh-start energy. Good for planning, learning, and beginning." };
  if (day <= 16) return { name: "Ovulation", color: "var(--ovulation)", bg: "#FFE3EF", text: "#B01070", note: "Visibility, connection, launches, conversations, and creative output." };
  return { name: "Luteal", color: "var(--luteal)", bg: "#E4F0FF", text: "#2860A8", note: "Edit, complete, organize, and protect your energy." };
}
function moonPhase(d) {
  const phases = [["🌑","New Moon"],["🌒","Waxing Crescent"],["🌓","First Quarter"],["🌔","Waxing Gibbous"],["🌕","Full Moon"],["🌖","Waning Gibbous"],["🌗","Last Quarter"],["🌘","Waning Crescent"]];
  const lp = 2551443, now = d.getTime() / 1000, nm = new Date("2000-01-06T18:14:00Z").getTime() / 1000;
  return Object.assign({ emoji: phases[Math.floor((((now - nm) % lp) / lp) * 8 + 0.5) & 7][0], name: phases[Math.floor((((now - nm) % lp) / lp) * 8 + 0.5) & 7][1] });
}
function numerology(v) { let n = [...v.toUpperCase()].filter(c => /[A-Z]/.test(c)).reduce((s,c)=>s+c.charCodeAt(0)-64,0); while (n > 9 && ![11,22,33].includes(n)) n = [...String(n)].reduce((s,c)=>s + +c,0); return n || 7; }

function addTask(t) {
  if (!t.title?.trim()) return;
  state.tasks.push({ id: uid(), title: t.title.trim(), category: t.category || "personal", due: t.due || iso(today), priority: t.priority || "medium", done: false, business: t.business || "" });
  save(); render(); toast("Task added to your calendar");
}
function toggleTask(id) { state.tasks = state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t); setState({ tasks: state.tasks }); }
function delTask(id) { setState({ tasks: state.tasks.filter(t => t.id !== id) }); }
function toggleAssignment(id) { state.assignments = state.assignments.map(a => a.id === id ? { ...a, done: !a.done } : a); setState({ assignments: state.assignments }); }
function shiftCal(dir) {
  const d = new Date(state.calDate + "T00:00:00");
  if (state.calView === "day") d.setDate(d.getDate() + dir);
  else if (state.calView === "week") d.setDate(d.getDate() + dir * 7);
  else if (state.calView === "year") d.setFullYear(d.getFullYear() + dir);
  else d.setMonth(d.getMonth() + dir * (state.calView === "quarter" ? 3 : 1));
  setState({ calDate: iso(d) });
}

function tree(parent) {
  return `<ul class="tree-list">${state.notes.filter(n => n.parent === parent).map(n => n.type === "folder" ? `<li><div class="tree-folder-row"><span class="tree-folder-toggle">▾</span><span class="tree-folder-icon">📁</span><span class="tree-folder-name">${esc(n.name)}</span><span class="tree-folder-actions"><button class="tree-btn" data-add-folder="${n.id}">＋📁</button><button class="tree-btn" data-add-note="${n.id}">＋</button></span></div><div class="tree-children">${tree(n.id)}</div></li>` : `<li><div class="tree-note-row ${state.selectedNote===n.id?"active":""}" data-note="${n.id}">📄 <span>${esc(n.name)}</span></div></li>`).join("")}</ul>`;
}
function addFolder(parent) { simplePrompt("Folder name", "New Folder", name => { state.notes.push({ id: uid(), type: "folder", name, parent, open: true }); setState({ notes: state.notes }); }); }
function addNote(parent) {
  const folder = state.notes.find(n => n.id === parent)?.type === "folder" ? parent : "root";
  const id = uid(); state.notes.push({ id, type: "note", name: "Untitled Note", parent: folder, content: "" }); setState({ notes: state.notes, selectedNote: id });
}
function updateNote(patch) { const n = state.notes.find(x => x.id === state.selectedNote); Object.assign(n, patch); save(); }
function printNotes() {
  const html = state.notes.filter(n => n.type === "note").map(n => `<h1>${esc(n.name)}</h1><p>${esc(n.content).replace(/\n/g,"<br>")}</p>`).join("<hr>");
  const w = window.open("", "_blank"); w.document.write(`<title>My Universe Notes</title><style>body{font:14px Georgia,serif;line-height:1.7;padding:40px;color:#2d2438}h1{page-break-before:auto}hr{border:0;border-top:1px solid #ddd;margin:30px 0}</style>${html}`); w.document.close(); w.print();
}

function modal(title, body, footer) {
  $("#modal").innerHTML = `<div class="modal-title">${title}</div>${body}<div class="modal-footer">${footer}<button class="btn btn-ghost" onclick="closeModal()">Cancel</button></div>`;
  $("#overlay").classList.add("show"); $("#modal-wrap").classList.add("show");
}
function closeModal() { $("#overlay").classList.remove("show"); $("#modal-wrap").classList.remove("show"); }
window.closeModal = closeModal;
function taskModal(date = iso(today)) {
  modal("Add task", `<div class="form-group"><label>Task</label><input class="input" id="mTask"></div><div class="form-row"><div><label>Category</label><select class="input" id="mCat"><option>personal</option><option>business</option><option>school</option></select></div><div><label>Due date</label><input class="input" id="mDue" type="date" value="${date}"></div></div>`, `<button class="btn btn-primary" id="saveTask">Save</button>`);
  $("#saveTask").onclick = () => { addTask({ title: $("#mTask").value, category: $("#mCat").value, due: $("#mDue").value }); closeModal(); };
}
function assignmentModal() {
  modal("Add assignment", `<div class="form-group"><label>Assignment</label><input class="input" id="mAssign"></div><div class="form-row"><div><label>Course</label><input class="input" id="mCourse" value="${esc(state.courses[0] || "")}"></div><div><label>Due</label><input class="input" id="mDue" type="date" value="${iso(today)}"></div></div>`, `<button class="btn btn-primary" id="saveAssign">Save</button>`);
  $("#saveAssign").onclick = () => { state.assignments.push({ id: uid(), title: $("#mAssign").value, course: $("#mCourse").value, due: $("#mDue").value, done: false }); save(); closeModal(); render(); };
}
function businessModal() {
  modal("Add business", `<div class="form-group"><label>Name</label><input class="input" id="mBiz"></div><div class="form-group"><label>Description</label><input class="input" id="mDesc"></div>`, `<button class="btn btn-primary" id="saveBiz">Save</button>`);
  $("#saveBiz").onclick = () => { const id = $("#mBiz").value.toLowerCase().replace(/[^a-z0-9]+/g,"-"); state.businesses.push({ id, name: $("#mBiz").value, emoji: "✨", desc: $("#mDesc").value, color: "linear-gradient(135deg,#C39BD3,#48CAE4)", revenue: 0, expenses: 0 }); setState({ selectedBusiness: id }); closeModal(); };
}
function financeModal() {
  const b = state.businesses.find(x => x.id === state.selectedBusiness);
  modal("Edit finances", `<div class="form-row"><div><label>Revenue</label><input class="input" id="mRev" type="number" value="${b.revenue}"></div><div><label>Expenses</label><input class="input" id="mExp" type="number" value="${b.expenses}"></div></div>`, `<button class="btn btn-primary" id="saveFin">Save</button>`);
  $("#saveFin").onclick = () => { b.revenue = +$("#mRev").value || 0; b.expenses = +$("#mExp").value || 0; save(); closeModal(); render(); };
}
function agentModal() {
  modal("Create agent", `<div class="form-group"><label>Name</label><input class="input" id="mAgent"></div><div class="form-group"><label>Role</label><textarea class="input" id="mRole"></textarea></div>`, `<button class="btn btn-primary" id="saveAgent">Save</button>`);
  $("#saveAgent").onclick = () => { const id = uid(); state.agents.push({ id, emoji: "🤖", name: $("#mAgent").value, role: $("#mRole").value, messages: [{ from: "assistant", text: "I am ready. Assign me my first task." }] }); setState({ selectedAgent: id }); closeModal(); };
}
function manifestModal() {
  modal("Add manifestation", `<div class="form-group"><label>Type</label><select class="input" id="mType"><option>affirmation</option><option>goal</option><option>belief</option><option>script</option></select></div><div class="form-group"><label>Text</label><textarea class="input" id="mText"></textarea></div>`, `<button class="btn btn-primary" id="saveManifest">Save</button>`);
  $("#saveManifest").onclick = () => { state.manifests.push({ id: uid(), type: $("#mType").value, text: $("#mText").value }); save(); closeModal(); render(); };
}
function linkModal() {
  modal("Add app link", `<div class="form-group"><label>Name</label><input class="input" id="mName"></div><div class="form-group"><label>URL</label><input class="input" id="mUrl" placeholder="https://"></div>`, `<button class="btn btn-primary" id="saveLink">Save</button>`);
  $("#saveLink").onclick = () => { state.links.push({ name: $("#mName").value, url: $("#mUrl").value, icon: "🔗" }); save(); closeModal(); render(); };
}
function simplePrompt(title, val, cb) {
  modal(title, `<input class="input" id="simpleVal" value="${esc(val)}">`, `<button class="btn btn-primary" id="simpleSave">Save</button>`);
  $("#simpleSave").onclick = () => { const v = $("#simpleVal").value.trim(); if (v) cb(v); closeModal(); };
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `my-universe-backup-${iso(today)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Data exported — keep that file safe!");
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      Object.assign(state, { ...seed, ...imported });
      save();
      render();
      toast("Data restored successfully");
    } catch {
      toast("Import failed — file may be invalid");
    }
  };
  reader.readAsText(file);
}

function sendAgent() {
  const a = state.agents.find(x => x.id === state.selectedAgent), text = $("#agentMsg").value.trim();
  if (!text) return;
  a.messages.push({ from: "user", text });
  a.messages.push({ from: "assistant", text: `I turned that into a plan: clarify the outcome, choose the next tiny action, schedule it, and track it here. For real AI execution, this dashboard can be connected to an API later.` });
  save(); render();
}

render();
