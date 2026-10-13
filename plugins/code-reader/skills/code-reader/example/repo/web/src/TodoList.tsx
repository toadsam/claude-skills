import { useEffect, useState } from "react";
import { addTodo, listTodos, Todo } from "./api";

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTodos().then(setTodos).catch(() => setError("목록을 못 불러왔어요"));
  }, []);

  async function handleAdd() {
    const title = text.trim();
    if (!title) return;
    try {
      const created = await addTodo(title);
      setTodos((prev) => [created, ...prev]);
      setText("");
    } catch (e) {
      setError("추가하지 못했어요");
    }
  }

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="할 일" />
      <button onClick={handleAdd}>추가</button>
      {error && <p className="error">{error}</p>}
      <ul>
        {todos.map((t) => (
          <li key={t.id}>{t.done ? "✓ " : ""}{t.title}</li>
        ))}
      </ul>
    </div>
  );
}
