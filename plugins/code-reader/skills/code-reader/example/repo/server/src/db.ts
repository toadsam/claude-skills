export type Todo = { id: number; title: string; done: boolean };

// 예시라서 진짜 DB 대신 메모리에 둔다. 서버를 끄면 사라진다.
export const db = {
  nextId: 1,
  todos: [] as Todo[],
};
