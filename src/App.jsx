import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-green-100 text-green-700 border-green-200", bar: "border-l-green-400" },
  medium: { label: "ปานกลาง", badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "border-l-amber-400" },
  high: { label: "สูง", badge: "bg-red-100 text-red-700 border-red-200", bar: "border-l-red-400" },
};
const ORDER = ["low", "medium", "high"];
const FILTERS = [
  ["all", "ทั้งหมด"],
  ["active", "ยังไม่เสร็จ"],
  ["completed", "เสร็จแล้ว"],
];
const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย",
  active: "ไม่มีงานที่ค้างอยู่",
  completed: "ยังไม่มีงานที่เสร็จ",
};

function TodoItem({ todo, onToggle, onDelete, onSave, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const cancelled = useRef(false);
  const p = PRIORITIES[todo.priority];

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
        todo.removing
          ? "max-h-0 opacity-0 -translate-x-6 mb-0"
          : "max-h-40 opacity-100 translate-x-0 mb-3"
      }`}
    >
      <div
        className={`flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${p.bar} px-3 py-3 sm:px-4`}
      >
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
          className="h-5 w-5 shrink-0 cursor-pointer rounded accent-indigo-600"
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
              className={`block cursor-text break-words select-none ${
                todo.done ? "text-gray-400 line-through" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>
          )}
        </div>

        <button
          onClick={() => onCyclePriority(todo.id)}
          title="คลิกเพื่อเปลี่ยนความสำคัญ"
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${p.badge}`}
        >
          {p.label}
        </button>

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

export default function TodoApp() {
  const nextId = useRef(4);
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานวิชาคอมพิวเตอร์", done: false, priority: "high", removing: false },
    { id: 2, text: "อ่านหนังสือเตรียมสอบ", done: false, priority: "medium", removing: false },
    { id: 3, text: "ซื้อของใช้เข้าหอ", done: true, priority: "low", removing: false },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [
      { id: nextId.current++, text: t, done: false, priority, removing: false },
      ...prev,
    ]);
    setText("");
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const save = (id, newText) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: newText } : t)));

  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] }
          : t
      )
    );

  const removeWithAnimation = (shouldRemove) => {
    setTodos((prev) => prev.map((t) => (shouldRemove(t) ? { ...t, removing: true } : t)));
    setTimeout(() => setTodos((prev) => prev.filter((t) => !t.removing)), 300);
  };

  const remove = (id) => removeWithAnimation((t) => t.id === id);
  const clearCompleted = () => removeWithAnimation((t) => t.done);

  const remaining = todos.filter((t) => !t.done && !t.removing).length;
  const hasCompleted = todos.some((t) => t.done && !t.removing);
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "completed" ? t.done : true
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 font-sans sm:py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-5 text-2xl font-bold text-gray-800 sm:text-3xl">
          รายการสิ่งที่ต้องทำ
        </h1>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-md">
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
        </div>

        <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-gray-200 p-1">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-2 py-2 text-sm font-medium ${
                filter === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl bg-white px-4 py-10 text-center text-gray-400 shadow-sm">
            {EMPTY_TEXT[filter]}
          </div>
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
            disabled={!hasCompleted}
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
  );
}
