const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  page: localStorage.getItem("aether_page") || "home",
  theme: localStorage.getItem("aether_theme") || "dark",
  user: JSON.parse(localStorage.getItem("aether_user") || "null"),
  users: JSON.parse(localStorage.getItem("aether_users") || "[]"),
  projects: JSON.parse(localStorage.getItem("aether_projects") || "null"),
  notifications: JSON.parse(localStorage.getItem("aether_notifications") || "null"),
  chats: JSON.parse(localStorage.getItem("aether_chats") || "null"),
  usage: Number(localStorage.getItem("aether_usage") || 128)
};

if (!state.projects) {
  state.projects = [
    {id:1,name:"AetherAI Website",desc:"Xây dựng giao diện và trải nghiệm cho nền tảng AI.",status:"active",progress:72},
    {id:2,name:"AI Content Lab",desc:"Kho ý tưởng và nội dung thử nghiệm với AI.",status:"active",progress:44},
    {id:3,name:"Launch Plan",desc:"Kế hoạch ra mắt phiên bản đầu tiên.",status:"done",progress:100}
  ];
}
if (!state.notifications) {
  state.notifications = [
    {id:1,title:"Chào mừng đến AetherAI",text:"Workspace của bạn đã sẵn sàng.",time:"Vừa xong",read:false},
    {id:2,title:"Dự án được cập nhật",text:"AetherAI Website đạt 72% tiến độ.",time:"2 giờ trước",read:false},
    {id:3,title:"Mẹo AI mới",text:"Bạn có thể dùng AI Chat để lập kế hoạch nhanh hơn.",time:"Hôm qua",read:false}
  ];
}
if (!state.chats) {
  state.chats = [
    {id:1,title:"Cuộc trò chuyện mới",messages:[
      {role:"assistant",text:"Xin chào! Tôi là Aether Assistant. Bạn muốn làm gì hôm nay?"}
    ]}
  ];
}
let currentChat = state.chats[0];

function save() {
  localStorage.setItem("aether_user", JSON.stringify(state.user));
  localStorage.setItem("aether_users", JSON.stringify(state.users));
  localStorage.setItem("aether_projects", JSON.stringify(state.projects));
  localStorage.setItem("aether_notifications", JSON.stringify(state.notifications));
  localStorage.setItem("aether_chats", JSON.stringify(state.chats));
  localStorage.setItem("aether_usage", state.usage);
}

function toast(message, type="success") {
  const box = document.createElement("div");
  box.className = `toast ${type}`;
  box.textContent = message;
  $("#toast-container").appendChild(box);
  setTimeout(()=>box.remove(), 3000);
}

function initials(name="A") {
  return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "A";
}

const pageNames = {
  home:"Tổng quan", chat:"AI Chat", projects:"Dự án", analytics:"Phân tích",
  notifications:"Thông báo", settings:"Cài đặt", profile:"Hồ sơ"
};

function showPage(page) {
  if ((page==="dashboard")) page="home";
  $$(".page").forEach(p=>p.classList.remove("active"));
  const target = $(`#page-${page}`);
  if (!target) return;
  target.classList.add("active");
  $$(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.page===page));
  $("#breadcrumb").textContent = pageNames[page] || "AetherAI";
  state.page = page;
  localStorage.setItem("aether_page", page);
  $("#sidebar").classList.remove("open");
  if (page==="chat") renderChat();
  if (page==="projects") renderProjects();
  if (page==="notifications") renderNotifications();
  if (page==="settings") renderSettings();
  if (page==="profile") renderProfile();
  window.scrollTo({top:0,behavior:"smooth"});
}

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("light", theme==="light");
  localStorage.setItem("aether_theme", theme);
  $("#theme-btn").textContent = theme==="light" ? "☾" : "☀";
}

function updateUserUI() {
  const logged = !!state.user;
  $("#top-user").textContent = logged ? state.user.name : "Đăng nhập";
  $("#sidebar-name").textContent = logged ? state.user.name : "Khách";
  $("#sidebar-email").textContent = logged ? state.user.email : "Chưa đăng nhập";
  $("#sidebar-avatar").textContent = initials(logged ? state.user.name : "A");
  $("#profile-avatar").textContent = initials(logged ? state.user.name : "A");
  $("#profile-name").textContent = logged ? state.user.name : "Khách";
  $("#profile-email").textContent = logged ? state.user.email : "Chưa đăng nhập";
  $("#settings-name").value = logged ? state.user.name : "";
  $("#settings-email").value = logged ? state.user.email : "";
}

function openModal(id){ $(id).classList.add("open"); }
function closeModals(){ $$(".modal").forEach(m=>m.classList.remove("open")); }

function switchAuth(type) {
  $$(".auth-tab").forEach(b=>b.classList.toggle("active", b.dataset.auth===type));
  $("#login-form").classList.toggle("hidden", type!=="login");
  $("#register-form").classList.toggle("hidden", type!=="register");
}

function requireLogin() {
  if (!state.user) {
    openModal("#auth-modal");
    switchAuth("login");
    toast("Hãy đăng nhập để sử dụng chức năng này.","error");
    return false;
  }
  return true;
}

function renderActivity() {
  const items = [
    ["✦","AI Chat","Bạn vừa sử dụng Aether Assistant","Vừa xong"],
    ["▣","AetherAI Website","Cập nhật tiến độ dự án lên 72%","2 giờ trước"],
    ["✓","Launch Plan","Dự án đã hoàn thành","Hôm qua"]
  ];
  $("#activity-list").innerHTML = items.map(x=>`<div class="activity-item"><div class="activity-icon">${x[0]}</div><div><strong>${x[1]}</strong><span>${x[2]} • ${x[3]}</span></div></div>`).join("");
  $("#usage-number").textContent = state.usage;
  $("#usage-left").textContent = Math.max(0,500-state.usage);
  $("#usage-progress").style.width = `${Math.min(100,state.usage/5)}%`;
}

function renderChatHistory() {
  $("#chat-history-list").innerHTML = state.chats.map((c,i)=>`
    <div class="history-item ${currentChat.id===c.id?"active":""}" data-chat="${c.id}">${escapeHtml(c.title)}</div>
  `).join("");
  $$(".history-item").forEach(el=>el.onclick=()=>{
    currentChat=state.chats.find(c=>c.id==el.dataset.chat);
    renderChat();
  });
}

function renderChat() {
  renderChatHistory();
  $("#messages").innerHTML = currentChat.messages.map(m=>`
    <div class="message ${m.role}">
      <div class="message-avatar">${m.role==="user" ? initials(state.user?.name||"B") : "✦"}</div>
      <div class="message-bubble">${escapeHtml(m.text)}</div>
    </div>
  `).join("");
  const box=$("#messages"); box.scrollTop=box.scrollHeight;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function aiReply(text) {
  const t=text.toLowerCase();
  if (t.includes("startup")) return "Một hướng đi tốt là xây dựng sản phẩm AI giải quyết một vấn đề rất cụ thể. Hãy xác định khách hàng, vấn đề, giải pháp, lợi thế cạnh tranh và mô hình doanh thu trước khi phát triển.";
  if (t.includes("kế hoạch") || t.includes("plan")) return "Bạn có thể chia dự án thành 5 bước: 1) xác định mục tiêu, 2) nghiên cứu người dùng, 3) thiết kế giải pháp, 4) xây dựng MVP, 5) đo lường và cải tiến.";
  if (t.includes("ai")) return "AI là nhóm công nghệ giúp máy tính thực hiện những tác vụ thường cần khả năng suy luận, nhận diện mẫu, tạo nội dung hoặc ra quyết định dựa trên dữ liệu.";
  return "Tôi đã nhận được yêu cầu của bạn. Trong bản demo này, AI đang chạy bằng bộ phản hồi mẫu phía trình duyệt. Khi kết nối API AI thật, phần này có thể trở thành trợ lý hội thoại đầy đủ.";
}

function sendChat(text) {
  text=text.trim();
  if(!text) return;
  if(!requireLogin()) return;
  currentChat.messages.push({role:"user",text});
  currentChat.messages.push({role:"assistant",text:aiReply(text)});
  state.usage=Math.min(500,state.usage+1);
  save(); renderChat(); renderActivity();
}

function renderProjects() {
  const query=$("#project-search").value.toLowerCase();
  const filter=$("#project-filter").value;
  const data=state.projects.filter(p=>
    (filter==="all"||p.status===filter) &&
    (p.name.toLowerCase().includes(query)||p.desc.toLowerCase().includes(query))
  );
  $("#project-grid").innerHTML=data.length ? data.map(p=>`
    <article class="project-card">
      <div class="project-top"><span class="feature-icon purple">▣</span><span class="project-status ${p.status==="done"?"done":""}">${p.status==="done"?"Hoàn thành":"Đang làm"}</span></div>
      <h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.desc)}</p>
      <div class="project-progress"><span>Tiến độ ${p.progress}%</span><div class="progress"><i style="width:${p.progress}%"></i></div></div>
      <div class="project-actions"><button class="delete-project" data-delete-project="${p.id}">Xóa dự án</button></div>
    </article>`).join("") : `<div class="panel" style="grid-column:1/-1;text-align:center;color:var(--muted)">Không tìm thấy dự án.</div>`;
  $$(".delete-project").forEach(b=>b.onclick=()=>{
    state.projects=state.projects.filter(p=>p.id!=b.dataset.deleteProject); save(); renderProjects(); renderActivity(); toast("Đã xóa dự án.");
  });
  $("#analytics-projects").textContent=state.projects.length;
}

function renderNotifications() {
  $("#notification-list").innerHTML=state.notifications.map(n=>`
    <div class="notification-item ${n.read?"read":"unread"}">
      <div class="notification-dot"></div><div><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.text)}</p><time>${n.time}</time></div>
    </div>`).join("");
  const unread=state.notifications.filter(n=>!n.read).length;
  $("#notification-badge").textContent=unread;
  $("#notification-badge").style.display=unread?"inline-block":"none";
  $(".notification-trigger i").style.display=unread?"block":"none";
}

function renderAnalytics() {
  const values=[42,67,54,89,73,110,128];
  $("#bar-chart").innerHTML=values.map((v,i)=>`<div class="bar" style="height:${Math.max(12,v/128*90)}%"><span>${["T2","T3","T4","T5","T6","T7","CN"][i]}</span></div>`).join("");
}

function renderSettings() { updateUserUI(); }
function renderProfile(){ updateUserUI(); }

function register(e) {
  e.preventDefault();
  const name=$("#register-name").value.trim(),email=$("#register-email").value.trim().toLowerCase(),password=$("#register-password").value;
  if(state.users.some(u=>u.email===email)){toast("Email này đã tồn tại.","error");return}
  const user={id:Date.now(),name,email,password};
  state.users.push(user); state.user={id:user.id,name,email}; save(); closeModals(); updateUserUI(); showPage("home"); toast("Tạo tài khoản thành công!");
  e.target.reset();
}

function login(e) {
  e.preventDefault();
  const email=$("#login-email").value.trim().toLowerCase(),password=$("#login-password").value;
  const user=state.users.find(u=>u.email===email&&u.password===password);
  if(!user){toast("Email hoặc mật khẩu không đúng.","error");return}
  state.user={id:user.id,name:user.name,email:user.email}; save(); closeModals(); updateUserUI(); toast(`Chào mừng ${user.name}!`); showPage("home");
  e.target.reset();
}

function logout() {
  state.user=null; save(); updateUserUI(); showPage("home"); toast("Đã đăng xuất.");
}

function createProject(e) {
  e.preventDefault();
  if(!requireLogin()) return;
  const p={id:Date.now(),name:$("#project-name").value.trim(),desc:$("#project-desc").value.trim(),status:$("#project-status").value,progress:$("#project-status").value==="done"?100:10};
  state.projects.unshift(p); save(); closeModals(); renderProjects(); renderActivity(); toast("Đã tạo dự án mới!"); e.target.reset();
}

function initEvents() {
  $$("[data-page]").forEach(el=>el.addEventListener("click",()=>{
    const page=el.dataset.page;
    if(["chat","projects","analytics"].includes(page) && !state.user) {
      if(page==="chat"||page==="projects") requireLogin();
      else showPage(page);
      return;
    }
    showPage(page);
  }));
  $$(".nav-item").forEach(el=>el.addEventListener("click",()=>showPage(el.dataset.page)));
  $("#top-user").onclick=()=>state.user?showPage("profile"):(openModal("#auth-modal"),switchAuth("login"));
  $("#profile-btn").onclick=()=>state.user?showPage("profile"):(openModal("#auth-modal"),switchAuth("login"));
  $("#profile-logout").onclick=logout; $("#logout-settings").onclick=logout;
  $("#theme-btn").onclick=()=>setTheme(state.theme==="light"?"dark":"light");
  $("#mobile-menu").onclick=()=>$("#sidebar").classList.toggle("open");
  $("#upgrade-btn").onclick=$("#home-upgrade").onclick=()=>toast("Gói Pro sẽ sớm được kết nối với hệ thống thanh toán.");
  $("#automation-btn").onclick=()=>toast("Tính năng tự động hóa đang được phát triển.");
  $("#export-btn").onclick=()=>toast("Báo cáo demo đã sẵn sàng.");
  $("#chat-info").onclick=()=>toast("Aether Assistant đang chạy ở chế độ demo.");
  $("#new-chat").onclick=()=>{
    const c={id:Date.now(),title:"Cuộc trò chuyện mới",messages:[{role:"assistant",text:"Cuộc trò chuyện mới đã sẵn sàng. Tôi có thể giúp gì cho bạn?"}]};
    state.chats.unshift(c);currentChat=c;save();renderChat();
  };
  $("#clear-chat").onclick=()=>{currentChat.messages=[];save();renderChat();};
  $("#chat-form").onsubmit=e=>{e.preventDefault();sendChat($("#chat-input").value);$("#chat-input").value=""};
  $$(".suggestions button").forEach(b=>b.onclick=()=>{sendChat(b.textContent);});
  $("#new-project").onclick=()=>{if(requireLogin())openModal("#project-modal")};
  $("#project-form").onsubmit=createProject;
  $("#project-search").oninput=renderProjects;$("#project-filter").onchange=renderProjects;
  $("#mark-read").onclick=()=>{state.notifications.forEach(n=>n.read=true);save();renderNotifications();toast("Đã đánh dấu tất cả là đã đọc.")};
  $$(".settings-tab").forEach(b=>b.onclick=()=>{
    $$(".settings-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");
    $$(".settings-pane").forEach(x=>x.classList.remove("active"));$(`#tab-${b.dataset.tab}`).classList.add("active");
  });
  $$("[data-theme-choice]").forEach(b=>b.onclick=()=>setTheme(b.dataset.themeChoice));
  $("#save-profile").onclick=()=>{
    if(!requireLogin())return;
    const name=$("#settings-name").value.trim();if(!name){toast("Tên không được để trống.","error");return}
    state.user.name=name; const idx=state.users.findIndex(u=>u.id===state.user.id);if(idx>=0)state.users[idx].name=name;save();updateUserUI();toast("Đã lưu thông tin.");
  };
  $("#auth-modal [data-close]").onclick=closeModals;$("#project-modal [data-close]").onclick=closeModals;
  $$(".auth-tab").forEach(b=>b.onclick=()=>switchAuth(b.dataset.auth));
  $("#login-form").onsubmit=login;$("#register-form").onsubmit=register;
  $("#demo-login").onclick=()=>{
    const email="demo@aether.ai";let u=state.users.find(x=>x.email===email);
    if(!u){u={id:1,name:"Aether Demo",email,password:"demo123"};state.users.push(u);}
    state.user={id:u.id,name:u.name,email:u.email};save();closeModals();updateUserUI();toast("Đã đăng nhập tài khoản demo.");showPage("home");
  };
  $$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals()}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModals()});
}

setTheme(state.theme);
initEvents();
renderActivity();
renderChat();
renderProjects();
renderAnalytics();
renderNotifications();
updateUserUI();
showPage(state.page);
