// UltraLearn — main script (localStorage-based SPA)
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const routes = ["home","profile","codes","tasks","notepad","cheats","play","settings"];

function setActive(route){
  routes.forEach(r=>{
    const page = document.querySelector(`[data-page="${r}"]`);
    if(!page) return;
    page.classList.toggle("hidden", r!==route);
  });
  $$(".tab").forEach(t=>t.classList.toggle("active", t.dataset.route===route));
  location.hash = route;
}

function initTabs(){
  $("#tabList").addEventListener("click", (e)=>{
    const a = e.target.closest("[data-route]");
    if(!a) return;
    setActive(a.dataset.route);
  });
  const initial = location.hash.replace("#","");
  setActive(routes.includes(initial)?initial:"home");
}

function initSearch(){
  const open = () => {
    const q = ($("#globalSearch")?.value || $("#globalSearchMobile")?.value || "").toLowerCase().trim();
    if(!q) return;
    if(q.includes("kod")) setActive("codes");
    else if(q.includes("profil")) setActive("profile");
    else if(q.includes("note")) setActive("notepad");
    else if(q.includes("vazifa") || q.includes("task")) setActive("tasks");
    else if(q.includes("cheat")) setActive("cheats");
    else if(q.includes("play")) setActive("play");
    else if(q.includes("soz") || q.includes("settings")) setActive("settings");
    else setActive("home");
  };
  $("#searchBtn")?.addEventListener("click", open);
  $("#searchBtnMobile")?.addEventListener("click", open);
  $("#globalSearch")?.addEventListener("keydown", e=> e.key==="Enter" && open());
  $("#globalSearchMobile")?.addEventListener("keydown", e=> e.key==="Enter" && open());
}

// Profile
function loadProfile(){
  const p = JSON.parse(localStorage.getItem("ul_profile")||"{}");
  $("#name").value = p.name || "";
  $("#tg").value = p.tg || "";
  $("#goal").value = p.goal || "";
}
function saveProfile(){
  const p = { name: $("#name").value.trim(), tg: $("#tg").value.trim(), goal: $("#goal").value.trim() };
  localStorage.setItem("ul_profile", JSON.stringify(p));
  $("#profileSaved").textContent = "✅ Saqlandi!";
  setTimeout(()=> $("#profileSaved").textContent="", 1600);
}

// Codes
function renderCodes(){
  const list = JSON.parse(localStorage.getItem("ul_codes")||"[]");
  const box = $("#codeList"); box.innerHTML="";
  if(list.length===0){ box.innerHTML = `<div class="text-slate-500 text-sm">Hozircha kod yo‘q.</div>`; return; }
  list.forEach((c,idx)=>{
    const wrap = document.createElement("div");
    wrap.className="p-3 rounded-xl border border-slate-200";
    wrap.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="font-medium">${c.title} <span class="text-xs text-slate-500">(${c.tech})</span></div>
        <div class="flex gap-2">
          <button class="btn-secondary text-xs" data-act="copy" data-idx="${idx}">Copy</button>
          <button class="btn-danger text-xs" data-act="del" data-idx="${idx}">O‘chirish</button>
        </div>
      </div>
      <pre class="code mt-2">${escapeHtml(c.content)}</pre>
      <div class="text-xs text-slate-500 mt-1">${new Date(c.date).toLocaleString()}</div>
    `;
    box.appendChild(wrap);
  });
  box.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-act]");
    if(!btn) return;
    const act = btn.dataset.act, i = +btn.dataset.idx;
    const data = JSON.parse(localStorage.getItem("ul_codes")||"[]");
    if(act==="del"){ data.splice(i,1); localStorage.setItem("ul_codes", JSON.stringify(data)); renderCodes(); }
    if(act==="copy"){ navigator.clipboard.writeText(data[i].content); btn.textContent="Copied!"; setTimeout(()=>btn.textContent="Copy", 1200); }
  }, { once:true });
}
function addCode(){
  const title = $("#codeTitle").value.trim();
  const tech = $("#codeTech").value.trim();
  const content = $("#codeContent").value;
  if(!title || !content){ alert("Nom va kodni kiriting."); return; }
  const list = JSON.parse(localStorage.getItem("ul_codes")||"[]");
  list.unshift({title, tech, content, date: Date.now()});
  localStorage.setItem("ul_codes", JSON.stringify(list));
  $("#codeTitle").value = $("#codeTech").value = $("#codeContent").value = "";
  renderCodes();
}
function clearCodes(){
  if(confirm("Haqiqatan ham barcha kodlarni o‘chirmoqchimisiz?")){ localStorage.removeItem("ul_codes"); renderCodes(); }
}

// Tasks
function renderTasks(){
  const tasks = JSON.parse(localStorage.getItem("ul_tasks")||"[]");
  const ul = $("#taskList"); ul.innerHTML="";
  tasks.forEach((t,i)=>{
    const li = document.createElement("li");
    li.className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2";
    li.innerHTML = `
      <div class="flex items-center gap-2">
        <input type="checkbox" ${t.done?"checked":""} data-i="${i}" />
        <span class="${t.done?'line-through text-slate-400':''}">${t.text}</span>
      </div>
      <button class="btn-danger text-xs" data-del="${i}">O‘chirish</button>
    `;
    ul.appendChild(li);
  });
  ul.addEventListener("change", (e)=>{
    const i = e.target.getAttribute("data-i");
    if(i===null) return;
    const tasks = JSON.parse(localStorage.getItem("ul_tasks")||"[]");
    tasks[i].done = e.target.checked;
    localStorage.setItem("ul_tasks", JSON.stringify(tasks));
    renderTasks();
  }, { once:true });
  ul.addEventListener("click", (e)=>{
    const i = e.target.getAttribute("data-del");
    if(i===null) return;
    const tasks = JSON.parse(localStorage.getItem("ul_tasks")||"[]");
    tasks.splice(+i,1);
    localStorage.setItem("ul_tasks", JSON.stringify(tasks));
    renderTasks();
  }, { once:true });
}
function addTask(){
  const t = $("#taskInput").value.trim();
  if(!t) return;
  const tasks = JSON.parse(localStorage.getItem("ul_tasks")||"[]");
  tasks.unshift({text:t, done:false});
  localStorage.setItem("ul_tasks", JSON.stringify(tasks));
  $("#taskInput").value="";
  renderTasks();
}

// Notepad
let noteTimer;
function initNotepad(){
  const key="ul_note";
  const area = $("#notepadArea");
  area.value = localStorage.getItem(key) || "";
  area.addEventListener("input", ()=>{
    clearTimeout(noteTimer);
    noteTimer = setTimeout(()=>{
      localStorage.setItem(key, area.value);
      $("#noteSaved").textContent = "✔️ Saqlandi " + new Date().toLocaleTimeString();
      setTimeout(()=> $("#noteSaved").textContent="", 1500);
    }, 300);
  });
}

// Playground
function initPlayground(){
  const input = $("#playInput");
  const iframe = $("#playPreview");
  const saved = localStorage.getItem("ul_play") || "<h1>Salom!</h1>";
  input.value = saved;
  const run = () => { iframe.srcdoc = input.value; };
  $("#runPlay").addEventListener("click", run);
  $("#savePlay").addEventListener("click", ()=>{
    localStorage.setItem("ul_play", input.value);
    alert("Saqlandi!");
  });
  run();
}

// Settings
function initSettings(){
  const root = document.documentElement;
  const darkKey="ul_dark", compactKey="ul_compact";

  const applyDark = (v)=>{
    if(v) root.classList.add("dark"); else root.classList.remove("dark");
  };
  const applyCompact = (v)=>{
    document.body.classList.toggle("compact", !!v);
  };

  $("#darkMode").checked = localStorage.getItem(darkKey)==="1";
  $("#compactMode").checked = localStorage.getItem(compactKey)==="1";

  applyDark($("#darkMode").checked);
  applyCompact($("#compactMode").checked);

  $("#darkMode").addEventListener("change", e=>{
    localStorage.setItem(darkKey, e.target.checked? "1":"0");
    applyDark(e.target.checked);
  });
  $("#compactMode").addEventListener("change", e=>{
    localStorage.setItem(compactKey, e.target.checked? "1":"0");
    applyCompact(e.target.checked);
  });

  $("#resetAll").addEventListener("click", ()=>{
    if(confirm("Barcha ma’lumotlar (profil, kodlar, vazifalar, notepad) o‘chadi. Davom etaymi?")){
      localStorage.clear(); location.reload();
    }
  });
}

// Utils
function escapeHtml(str){
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function init(){
  // year
  $("#year").textContent = new Date().getFullYear();
  // tabs
  initTabs();
  // search
  initSearch();
  // profile
  loadProfile();
  $("#saveProfile").addEventListener("click", saveProfile);
  // codes
  $("#addCode").addEventListener("click", addCode);
  $("#clearCodes").addEventListener("click", clearCodes);
  renderCodes();
  // tasks
  $("#addTask").addEventListener("click", addTask);
  renderTasks();
  // notepad
  initNotepad();
  // playground
  initPlayground();
  // settings
  initSettings();
}
document.addEventListener("DOMContentLoaded", init);
