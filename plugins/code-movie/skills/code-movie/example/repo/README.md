# 할 일 앱 (code-reader 예시)

code-reader 스킬을 시험해 보려고 만든 아주 작은 가짜 프로젝트예요.

- `web/` — React 화면. 할 일을 입력하고 목록을 봐요.
- `server/` — Express API. `GET /todos`, `POST /todos`.

## 실행

```bash
cd server && npm install && npm start
cd web && npm install && npm run dev
```

웹의 API 주소는 `.env` 의 `VITE_API_URL` 로 바꿀 수 있어요(없으면 `http://localhost:3000`).
