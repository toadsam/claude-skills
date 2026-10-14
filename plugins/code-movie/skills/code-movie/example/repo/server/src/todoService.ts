import { db, Todo } from "./db";

export function getTodos(): Todo[] {
  return [...db.todos].sort((a, b) => b.id - a.id);
}

export function createTodo(title: string): Todo {
  const todo: Todo = { id: db.nextId++, title: title.slice(0, 200), done: false };
  db.todos.push(todo);
  return todo;
}
