"use strict";

const STORAGE_KEY = "feedback_entries_v1";

const form = document.getElementById("feedbackForm");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const avgEl = document.getElementById("avg");
const totalEl = document.getElementById("total");
const filterEl = document.getElementById("filter");
const messageEl = document.getElementById("message");
const countEl = document.getElementById("count");
const toastEl = document.getElementById("toast");

// ---------- Storage (localStorage) ----------
const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

let entries = load();

// ---------- Helpers ----------
const escapeHTML = (str) =>
  str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const showToast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
};

const setError = (field, msg) => {
  document.getElementById(field + "Error").textContent = msg;
  const input = document.getElementById(field);
  if (input) input.classList.toggle("invalid", Boolean(msg));
};

// ---------- Validation ----------
function validate() {
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const category = form.category.value;
  const rating = form.rating.value;
  const message = form.message.value.trim();
  let ok = true;

  setError("name", name.length < 2 ? "Enter your full name." : "");
  setError("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address.");
  setError("category", category ? "" : "Choose a topic.");
  setError("message", message.length < 10 ? "Write at least 10 characters." : "");
  document.getElementById("ratingError").textContent = rating ? "" : "Pick a rating from 1 to 5.";

  ["nameError", "emailError", "categoryError", "messageError", "ratingError"].forEach((id) => {
    if (document.getElementById(id).textContent) ok = false;
  });
  return ok ? { name, email, category, rating: Number(rating), message } : null;
}

// ---------- Render ----------
function render() {
  const filter = filterEl.value;
  const visible = filter ? entries.filter((e) => e.category === filter) : entries;

  listEl.innerHTML = visible
    .map((e) => `
      <li class="item">
        <div class="item-head">
          <strong>${escapeHTML(e.name)}</strong>
          <span class="item-stars" aria-label="${e.rating} out of 5">${"★".repeat(e.rating)}${"☆".repeat(5 - e.rating)}</span>
        </div>
        <div class="item-meta">${escapeHTML(e.category)} • ${new Date(e.date).toLocaleDateString()}</div>
        <p>${escapeHTML(e.message)}</p>
        <button type="button" data-id="${e.id}">Delete</button>
      </li>`)
    .join("");

  emptyEl.style.display = visible.length ? "none" : "block";

  const total = entries.length;
  const avg = total ? entries.reduce((s, e) => s + e.rating, 0) / total : 0;
  totalEl.textContent = total;
  avgEl.textContent = avg.toFixed(1);
}

// ---------- Events ----------
form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const data = validate();
  if (!data) return;

  entries.unshift({ id: Date.now(), date: new Date().toISOString(), ...data });
  save(entries);
  form.reset();
  countEl.textContent = "0 / 300";
  render();
  showToast("Thanks! Your feedback was sent.");
});

messageEl.addEventListener("input", () => {
  countEl.textContent = `${messageEl.value.length} / 300`;
});

filterEl.addEventListener("change", render);

listEl.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-id]");
  if (!btn) return;
  entries = entries.filter((e) => e.id !== Number(btn.dataset.id));
  save(entries);
  render();
  showToast("Feedback deleted.");
});

document.getElementById("clearAll").addEventListener("click", () => {
  if (!entries.length) return;
  if (confirm("Delete all feedback? This cannot be undone.")) {
    entries = [];
    save(entries);
    render();
    showToast("All feedback deleted.");
  }
});

render();
