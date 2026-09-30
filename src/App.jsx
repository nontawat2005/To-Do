import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, Search, CalendarDays } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-green-100 text-green-700 border-green-200", bar: "border-l-green-400" },
  medium: { label: "ปานกลาง", badge: "bg-orange-100 text-orange-700 border-orange-200", bar: "border-l-orange-400" },
  high: { label: "สูง", badge: "bg-rose-100 text-rose-700 border-rose-200", bar: "border-l-rose-500" },
};
const ORDER = ["low", "medium", "high"];
const CATEGORIES = {
  work: { label: "งาน", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  personal: { label: "ส่วนตัว", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  shopping: { label: "ช้อปปิ้ง", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  health: { label: "สุขภาพ", badge: "bg-teal-50 text-teal-700 border-teal-200" },
};
const CAT_KEYS = Object.keys(CATEGORIES);
const FILTERS = [
  ["all", "ทั้งหมด"],
  ["active", "ยังไม่เสร็จ"],
  ["completed", "เสร็จแล้ว"],
];

// ---------- date helpers (local time) ----------
const toStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => toStr(new Date());
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toStr(d);
};
const fmtDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
const isOverdue = (t) => !t.done && t.due && t.due < todayStr();

function dueBadge(t) {
  if (!t.due) return null;
  const today = todayStr();
  if (!t.done && t.due < today)
    return { cls: "bg-red-100 text-red-700 border-red-200", text: `เลยกำหนด ${fmtDate(t.due)}` };
  if (!t.done && t.due === today)
    return { cls: "bg-yellow-100 text-yellow-800 border-yellow-300", text: "ครบกำหนดวันนี้" };
  return { cls: "bg-gray-100 text-gray-600 border-gray-200", text: fmtDate(t.due) };
}

// ---------- donut chart ----------
function Donut({ segments, centerText }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" role="img" aria-label="สัดส่วนสถานะงาน">
        <circle cx="18" cy="18" r="14" fill="none" strokeWidth="5" className="stroke-gray-200" />
        {total > 0 &&
          segments.map((s) => {
            if (!s.value) return null;
            const len = (s.value / total) * 100;
            const el = (
              <circle
                key={s.key}
                cx="18"
                cy="18"
                r="14"
                fill="none"
                strokeWidth="5"
                pathLength="100"
                strokeDasharray={`${len} ${100 - len}`}
                strokeDashoffset={-acc}
                className={s.stroke}
              />
            );
            acc += len;
            return el;
          })}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">
        {centerText}
      </span>
    </div>
  );
}

// ---------- todo item ----------
function TodoItem({ todo, onToggle, onDelete, onSave, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const cancelled = useRef(false);
  const p = PRIORITIES[todo.priority];
  const c = CATEGORIES[todo.category];
  const due = dueBadge(todo);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(todo.text);
    cancelled.current = false;
    setEditing(true);
  };
  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const text = draft.trim();
    if (text) onSave(todo.id, text);
    setEditing(false);
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      cancelled.current = true;
      setEditing(false);
    }
  };

  return (
    <li
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        todo.removing ? "max-h-0 opacity-0 -translate-x-6 mb-0" : "max-h-48 opacity-100 translate-x-0 mb-3"
      }`}
    >
      <div
        className={`flex items-start gap-3 rounded-xl border border-l-4 border-gray-100 ${p.bar} bg-white px-3 py-3 shadow-sm sm:px-4`}
      >
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-indigo-600"
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              className="w-full rounded-md border border-indigo-300 px-2 py-1 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <span
              onDoubleClick={startEdit}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block cursor-text select-none break-words ${
                todo.done ? "text-gray-400 line-through" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onCyclePriority(todo.id)}
              title="คลิกเพื่อเปลี่ยนความสำคัญ"
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${p.badge}`}
            >
              {p.label}
            </button>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${c.badge}`}>{c.label}</span>
            {due && (
              <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${due.cls}`}>
                <CalendarDays size={12} />
                {due.text}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={startEdit}
          aria-label="แก้ไข"
          className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          aria-label="ลบ"
          className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

// ---------- app ----------
export default function TodoApp() {
  const nextId = useRef(6);
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานวิชาคอมพิวเตอร์", done: false, priority: "high", category: "work", due: addDays(-1), removing: false },
    { id: 2, text: "ประชุมกลุ่มโปรเจกต์", done: false, priority: "medium", category: "work", due: addDays(0), removing: false },
    { id: 3, text: "ซื้อของใช้เข้าหอ", done: true, priority: "low", category: "shopping", due: "", removing: false },
    { id: 4, text: "วิ่งสวนสาธารณะ", done: false, priority: "low", category: "health", due: addDays(3), removing: false },
    { id: 5, text: "โทรหาที่บ้าน", done: false, priority: "medium", category: "personal", due: "", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("work");
  const [due, setDue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [
      { id: nextId.current++, text: t, done: false, priority, category, due, removing: false },
      ...prev,
    ]);
    setText("");
    setDue("");
  };
  const toggle = (id) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const save = (id, newText) => setTodos((p) => p.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  const cyclePriority = (id) =>
    setTodos((p) =>
      p.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] } : t
      )
    );
  const removeWithAnimation = (pred) => {
    setTodos((p) => p.map((t) => (pred(t) ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((p) => p.filter((t) => !t.removing)), 300);
  };
  const remove = (id) => removeWithAnimation((t) => t.id === id);
  const clearCompleted = () => removeWithAnimation((t) => t.done);

  // derived data
  const live = todos.filter((t) => !t.removing);
  const total = live.length;
  const doneCount = live.filter((t) => t.done).length;
  const overdueCount = live.filter(isOverdue).length;
  const activeCount = live.filter((t) => !t.done).length - overdueCount;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const remaining = live.filter((t) => !t.done).length;
  const catCount = (k) => live.filter((t) => t.category === k).length;

  const q = query.trim().toLowerCase();
  const visible = todos.filter(
    (t) =>
      (catFilter === "all" || t.category === catFilter) &&
      (statusFilter === "all" || (statusFilter === "active" ? !t.done : t.done)) &&
      (!q || t.text.toLowerCase().includes(q))
  );
  const emptyText = q
    ? "ไม่พบงานที่ค้นหา"
    : total === 0
    ? "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย"
    : "ไม่มีงานในตัวกรองนี้";

  const segments = [
    { key: "done", value: doneCount, stroke: "stroke-green-500", dot: "bg-green-500", label: "เสร็จแล้ว" },
    { key: "active", value: activeCount, stroke: "stroke-indigo-500", dot: "bg-indigo-500", label: "กำลังทำ" },
    { key: "overdue", value: overdueCount, stroke: "stroke-red-500", dot: "bg-red-500", label: "เลยกำหนด" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 font-sans sm:py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-5 text-2xl font-bold text-gray-800 sm:text-3xl">รายการสิ่งที่ต้องทำ</h1>

        {/* Statistics */}
        <div className="mb-5 flex items-center gap-5 rounded-2xl bg-white p-4 shadow-md">
          <Donut segments={segments} centerText={`${pct}%`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500">งานทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800">
              {total} <span className="text-sm font-normal text-gray-500">งาน · เสร็จแล้ว {pct}%</span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {segments.map((s) => (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label} {s.value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          {/* Category sidebar */}
          <aside className="md:w-52 md:shrink-0">
            <div className="rounded-2xl bg-white p-3 shadow-md">
              <p className="mb-2 px-2 text-sm font-semibold text-gray-500">หมวดหมู่</p>
              <div className="flex gap-1 overflow-x-auto md:flex-col">
                {[["all", "ทั้งหมด", total], ...CAT_KEYS.map((k) => [k, CATEGORIES[k].label, catCount(k)])].map(
                  ([key, label, count]) => (
                    <button
                      key={key}
                      onClick={() => setCatFilter(key)}
                      className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                        catFilter === key
                          ? "bg-indigo-50 font-semibold text-indigo-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{label}</span>
                      <span className="rounded-full bg-gray-100 px-2 text-xs text-gray-600">{count}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Add */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) add();
                  }}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={add}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">ความสำคัญ:</span>
                {ORDER.map((key) => (
                  <button
                    key={key}
                    onClick={() => setPriority(key)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      priority === key
                        ? `${PRIORITIES[key].badge} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {PRIORITIES[key].label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">หมวดหมู่:</span>
                {CAT_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      category === key
                        ? `${CATEGORIES[key].badge} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {CATEGORIES[key].label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label htmlFor="due" className="text-sm text-gray-500">
                  วันครบกำหนด:
                </label>
                <input
                  id="due"
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400"
                />
                {due && (
                  <button onClick={() => setDue("")} className="text-sm text-gray-400 hover:text-gray-600">
                    ล้างวันที่
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-gray-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Status tabs */}
            <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-gray-200 p-1">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-lg px-2 py-2 text-sm font-medium ${
                    statusFilter === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* List */}
            {visible.length === 0 ? (
              <div className="rounded-xl bg-white px-4 py-10 text-center text-gray-400 shadow-sm">{emptyText}</div>
            ) : (
              <ul>
                {visible.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={toggle}
                    onDelete={remove}
                    onSave={save}
                    onCyclePriority={cyclePriority}
                  />
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
              <span className="text-sm text-gray-600">เหลือ {remaining} งาน</span>
              <button
                onClick={clearCompleted}
                disabled={doneCount === 0}
                className="text-sm font-medium text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                ล้างงานที่เสร็จแล้ว
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · กด Enter เพื่อบันทึก · กด Esc เพื่อยกเลิก
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
