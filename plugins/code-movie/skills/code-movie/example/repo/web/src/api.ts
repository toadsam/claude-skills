export type Todo = { id: number; title: string; done: boolean };

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE_URL}/todos`);
  if (!res.ok) throw new Error("list failed: " + res.status);
  return res.json();
}

export async function addTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("add failed: " + res.status);
  return res.json();
}
