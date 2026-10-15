// 「할 일 화면 — 실행 따라가기」의 화면 그림. 실행 순서는 todolist.json 의 events 에 있고,
// 여기서는 그 순간의 상태(S)로 화면이 어떻게 보이는지만 그린다(TodoList.tsx 의 같은 이름 상태 · 같은 조건).
LAB.register("todolist", {
  init: { todos: [], text: "", error: null },
  examples: { afterAdd: [{ id: 1, title: "빵 사기", done: false }] },
  derive() { return {}; },
  render(S, D, esc) {
    return `
<div class="lb-input" data-a="input" data-name="입력칸" data-dep="text">${S.text ? esc(S.text) : `<span class="lb-small">할 일</span>`}</div>
<button class="lb-btn lb-primary" data-a="addBtn" data-name="추가 버튼" data-dep="">추가</button>
${S.error ? `<p class="lb-err" data-a="error" data-name="빨간 오류 글자" data-dep="error">${esc(S.error)}</p>` : ""}
<div class="lb-card" data-a="list" data-name="할 일 목록" data-dep="todos">${S.todos.length ? S.todos.map((t) => `<div>${t.done ? "✓ " : ""}${esc(t.title)}</div>`).join("") : `<span class="lb-small">아직 할 일이 없어요</span>`}</div>`;
  },
});
