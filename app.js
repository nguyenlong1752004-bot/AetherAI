const PRODUCTS=[
 {id:"starter",icon:"✦",name:"AI Starter",price:99000,desc:"Gói cơ bản cho nhu cầu viết, ý tưởng và trợ lý AI.",tag:"Phổ biến"},
 {id:"pro",icon:"◆",name:"AI Pro",price:199000,desc:"Gói nâng cao với nhiều tính năng và hạn mức sử dụng hơn.",tag:"Pro"},
 {id:"business",icon:"◈",name:"AI Business",price:399000,desc:"Gói cho nhóm nhỏ, phù hợp workflow và công việc kinh doanh.",tag:"Business"}
];
const money=n=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(n);
const $=s=>document.querySelector(s);
let cart=JSON.parse(localStorage.getItem("aether_cart")||"[]");
let users=JSON.parse(localStorage.getItem("aether_users")||"[]");
let session=JSON.parse(localStorage.getItem("aether_session")||"null");

function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;$("#toast").appendChild(el);setTimeout(()=>el.remove(),2600)}
function save(){localStorage.setItem("aether_cart",JSON.stringify(cart))}
function renderProducts(list=PRODUCTS){
 $("#productGrid").innerHTML=list.map(p=>`<article class="product"><div class="product-icon">${p.icon}</div><h3>${p.name}</h3><p>${p.desc}</p><div class="product-bottom"><div class="price">${money(p.price)}<small> / gói</small></div><button class="primary-btn add" data-id="${p.id}">Thêm vào giỏ</button></div></article>`).join("")||"<p>Không tìm thấy sản phẩm.</p>";
 document.querySelectorAll(".add").forEach(b=>b.onclick=()=>add(b.dataset.id))
}
function add(id){const p=PRODUCTS.find(x=>x.id===id);const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({id,qty:1});save();renderCart();toast(`Đã thêm ${p.name}`)}
function remove(id){cart=cart.filter(x=>x.id!==id);save();renderCart()}
function renderCart(){
 const count=cart.reduce((a,x)=>a+x.qty,0);$("#cartCount").textContent=count;
 const items=cart.map(x=>{const p=PRODUCTS.find(y=>y.id===x.id);return `<div class="cart-item"><div><b>${p.name}</b><small>${x.qty} × ${money(p.price)}</small></div><button data-remove="${p.id}">Xóa</button></div>`}).join("");
 $("#cartItems").innerHTML=items||'<p style="color:var(--muted)">Giỏ hàng đang trống.</p>';
 $("#cartTotal").textContent=money(cart.reduce((a,x)=>a+PRODUCTS.find(p=>p.id===x.id).price*x.qty,0));
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>remove(b.dataset.remove))
}
function openAuth(mode="login"){$("#authModal").classList.add("open");setAuthMode(mode)}
function setAuthMode(mode){$("#authMode").value=mode;document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===mode));$("#nameField").classList.toggle("hidden",mode!=="register");$("#authSubmit").textContent=mode==="login"?"Đăng nhập":"Tạo tài khoản"}
function closeAuth(){$("#authModal").classList.remove("open")}
function updateAccount(){if(session){$("#accountBtn").textContent=session.name||session.email.split("@")[0]}else $("#accountBtn").textContent="Đăng nhập"}
$("#productGrid").addEventListener("click",()=>{});
renderProducts();renderCart();updateAccount();

$("#search").oninput=e=>{const q=e.target.value.toLowerCase();renderProducts(PRODUCTS.filter(p=>(p.name+p.desc).toLowerCase().includes(q)))}
$("#cartBtn").onclick=()=>$("#cartDrawer").classList.add("open");
document.querySelector("[data-cart-close]").onclick=()=>$("#cartDrawer").classList.remove("open");
$("#accountBtn").onclick=()=>session?location.href="./status.html":openAuth();
$("#heroLogin").onclick=()=>session?location.href="./status.html":openAuth();
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeAuth);
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setAuthMode(b.dataset.tab));

$("#authForm").onsubmit=e=>{
 e.preventDefault();const mode=$("#authMode").value,email=$("#authEmail").value.trim().toLowerCase(),password=$("#authPassword").value,name=$("#authName").value.trim();
 if(mode==="register"){
   if(users.some(u=>u.email===email))return toast("Email đã được đăng ký.");
   users.push({email,password,name:name||email.split("@")[0]});localStorage.setItem("aether_users",JSON.stringify(users));
   session={email,name:name||email.split("@")[0]};localStorage.setItem("aether_session",JSON.stringify(session));toast("Tạo tài khoản thành công.");closeAuth();
 }else{
   const u=users.find(x=>x.email===email&&x.password===password);
   if(!u)return toast("Email hoặc mật khẩu không đúng.");
   session={email:u.email,name:u.name};localStorage.setItem("aether_session",JSON.stringify(session));toast("Đăng nhập thành công.");closeAuth();
 }
 updateAccount();
};

$("#checkoutBtn").onclick=()=>{
 if(!cart.length)return toast("Giỏ hàng đang trống.");
 if(!session){$("#cartDrawer").classList.remove("open");openAuth("login");return}
 const items=encodeURIComponent(JSON.stringify(cart));location.href=`./payment.html?items=${items}&email=${encodeURIComponent(session.email)}`;
};

window.addEventListener("storage",updateAccount);
