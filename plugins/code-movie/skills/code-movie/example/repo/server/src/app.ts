import express from "express";
import cors from "cors";
import { createTodo, getTodos } from "./todoService";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/todos", (req, res) => {
  res.json(getTodos());
});

app.post("/todos", (req, res) => {
  const title = req.body?.title;
  if (typeof title !== "string" || title.length === 0) {
    return res.status(400).json({ error: "title is required" });
  }
  res.status(201).json(createTodo(title));
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log("listening on " + port));
