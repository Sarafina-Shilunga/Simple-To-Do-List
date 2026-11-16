const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const priorityInput = document.getElementById("todo-priority");
const todoList = document.getElementById("todo-list");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");

const STORAGE_KEY = "todo-app-modern";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";
let draggedTaskId = null;
let editingTaskId = null;

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(dateString) {
  if (!dateString) return "No date";
  return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getVisibleTasks() {
  const term = searchInput.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    const matchesSearch = task.text.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "todo-item" + (task.completed ? " task-item completed" : " task-item");

  li.draggable = true;
  li.dataset.id = String(task.id);

  li.addEventListener("dragstart", () => {
    draggedTaskId = task.id;
    li.classList.add("dragging");
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
    draggedTaskId = null;
  });

  li.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  li.addEventListener("drop", (event) => {
    event.preventDefault();

    if (!draggedTaskId || draggedTaskId === task.id) return;

    const draggedIndex = tasks.findIndex((item) => item.id === draggedTaskId);
    const targetIndex = tasks.findIndex((item) => item.id === task.id);

    if (draggedIndex < 0 || targetIndex < 0) return;

    const [movedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);
    saveTasks();
    renderList();
  });

  if (editingTaskId === task.id) {
    const formWrap = document.createElement("form");
    formWrap.className = "edit-form";

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = task.text;
    textInput.required = true;

    const dateEdit = document.createElement("input");
    dateEdit.type = "date";
    dateEdit.value = task.date || "";

    const priorityEdit = document.createElement("select");
    priorityEdit.innerHTML = `
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    `;
    priorityEdit.value = task.priority;

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.textContent = "Save";
    saveBtn.className = "action-btn save-btn";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "action-btn cancel-btn";

    formWrap.addEventListener("submit", (event) => {
      event.preventDefault();
      const newText = textInput.value.trim();

      if (!newText) return;

      task.text = newText;
      task.date = dateEdit.value;
      task.priority = priorityEdit.value;

      saveTasks();
      editingTaskId = null;
      renderList();
    });

    cancelBtn.addEventListener("click", () => {
      editingTaskId = null;
      renderList();
    });

    formWrap.append(textInput, dateEdit, priorityEdit, saveBtn, cancelBtn);
    li.appendChild(formWrap);
    return li;
  }

  const dragHandle = document.createElement("div");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⋮⋮";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.className = "task-check";
  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked;
    saveTasks();
    renderList();
  });

  const content = document.createElement("div");
  content.className = "task-content";

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const meta = document.createElement("div");
  meta.className = "meta";

  const dateBadge = document.createElement("span");
  dateBadge.className = "meta-badge date";
  dateBadge.textContent = formatDate(task.date);

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `meta-badge priority-${task.priority}`;
  priorityBadge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  meta.append(dateBadge, priorityBadge);

  content.append(text, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.className = "action-btn edit-btn";
  editBtn.addEventListener("click", () => {
    editingTaskId = task.id;
    renderList();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "action-btn delete-btn";
  deleteBtn.addEventListener("click", () => {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    renderList();
  });

  actions.append(editBtn, deleteBtn);

  li.append(dragHandle, checkbox, content, actions);
  return li;
}

function renderList() {
  const visibleTasks = getVisibleTasks();

  todoList.innerHTML = "";

  if (visibleTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No tasks found";
    todoList.appendChild(empty);
    return;
  }

  visibleTasks.forEach((task) => {
    todoList.appendChild(createTaskElement(task));
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  tasks.unshift({
    id: Date.now(),
    text,
    date: dateInput.value,
    priority: priorityInput.value,
    completed: false
  });

  saveTasks();
  form.reset();
  priorityInput.value = "medium";
  renderList();
  input.focus();
});

searchInput.addEventListener("input", renderList);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });
    renderList();
  });
});

renderList();