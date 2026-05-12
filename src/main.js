const STORAGE_KEY = "todo-app-tasks";

let tasks = load();
let filter = "all";
let editingId = null;

const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const emptyMessage = document.getElementById("empty-message");
const bottomBar = document.getElementById("bottom-bar");
const remainingCount = document.getElementById("remaining-count");
const clearBtn = document.getElementById("clear-btn");
const statsEl = document.getElementById("stats");
const filterBtns = document.querySelectorAll(".filter-btn");

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.classList.add("shake");
    setTimeout(() => taskInput.classList.remove("shake"), 400);
    return;
  }
  tasks.unshift({
    id: generateId(),
    text,
    completed: false,
    createdAt: Date.now(),
  });
  save();
  taskInput.value = "";
  taskInput.focus();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    save();
    render();
  }
}

function deleteTask(id) {
  const li = document.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.style.animation = "slideOut 0.18s ease forwards";
    setTimeout(() => {
      tasks = tasks.filter((t) => t.id !== id);
      save();
      render();
    }, 170);
  }
}

function startEdit(id) {
  editingId = id;
  render();
  const input = document.querySelector(".task-edit-input");
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function commitEdit(id, newText) {
  const trimmed = newText.trim();
  if (trimmed) {
    const task = tasks.find((t) => t.id === id);
    if (task) task.text = trimmed;
    save();
  }
  editingId = null;
  render();
}

function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  save();
  render();
}

function filteredTasks() {
  if (filter === "active") return tasks.filter((t) => !t.completed);
  if (filter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function render() {
  const visible = filteredTasks();
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const active = total - done;

  statsEl.textContent = `${total} task${total !== 1 ? "s" : ""}`;
  taskList.innerHTML = "";

  emptyState.hidden = visible.length > 0;
  if (!emptyState.hidden) {
    emptyMessage.textContent =
      filter === "active"
        ? "No active tasks!"
        : filter === "completed"
          ? "No completed tasks yet."
          : "No tasks yet. Add one above!";
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("button");
    checkbox.className = "task-checkbox";
    checkbox.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    checkbox.addEventListener("click", () => toggleTask(task.id));

    let content;
    if (editingId === task.id) {
      content = document.createElement("input");
      content.type = "text";
      content.className = "task-edit-input";
      content.value = task.text;
      content.addEventListener("blur", () =>
        commitEdit(task.id, content.value),
      );
      content.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commitEdit(task.id, content.value);
        if (e.key === "Escape") {
          editingId = null;
          render();
        }
      });
    } else {
      content = document.createElement("span");
      content.className = "task-text";
      content.textContent = task.text;
      content.title = "Double-click to edit";
      content.addEventListener("dblclick", () => {
        if (!task.completed) startEdit(task.id);
      });
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`;
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, content, deleteBtn);
    taskList.appendChild(li);
  });

  remainingCount.textContent = `${active} item${active !== 1 ? "s" : ""} left`;
  bottomBar.hidden = total === 0;
  clearBtn.style.visibility = done > 0 ? "visible" : "hidden";
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});
filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  }),
);
clearBtn.addEventListener("click", clearCompleted);

// Inject animation keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes slideOut {
    to { opacity: 0; transform: translateX(12px); max-height: 0; margin: 0; padding: 0; }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-6px); }
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-4px); }
    80%     { transform: translateX(4px); }
  }
  .shake { animation: shake 0.4s ease !important; }
`;
document.head.appendChild(style);

render();
