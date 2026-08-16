let products=[], cart=[];
const fmt=n=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND"}).format(n);
async function load(){
  products=await fetch("/api/products").then(r=>r.json());
  document.getElementById("productsGrid").innerHTML=products.map(p=>`
  <article class="card">
    <span class="tag">${p.category} · ${p.stock>0?"CÒN HÀNG":"HẾT HÀNG"}</span>
    <h3>${p.name}</h3><p>${p.description}</p>
    <ul class="features">${p.features.map(x=>`<li>${x}</li>`).join("")}</ul>
    <div class="price">${fmt(p.price)}</div>
    <button class="primary" ${p.stock<1?"disabled":""} onclick="addCart('${p.id}')">${p.stock>0?"Thêm vào giỏ":"Hết hàng"}</button>
  </article>`).join("");
}
function addCart(id){cart=[id];updateCart();openCart()}
function updateCart(){
  document.getElementById("cartCount").textContent=cart.length;
  const p=products.find(x=>x.id===cart[0]);
  document.getElementById("cartItems").innerHTML=p?`<div class="cart-row"><span>${p.name}</span><strong>${fmt(p.price)}</strong></div>`:`<div class="empty">Giỏ hàng đang trống.</div>`;
  document.getElementById("cartTotal").textContent=p?fmt(p.price):fmt(0);
}
function openCart(){document.getElementById("cartModal").classList.remove("hidden");updateCart()}
function closeCart(){document.getElementById("cartModal").classList.add("hidden")}
function checkout(){if(!cart.length)return alert("Hãy chọn sản phẩm trước.");closeCart();document.getElementById("checkoutModal").classList.remove("hidden")}
function closeCheckout(){document.getElementById("checkoutModal").classList.add("hidden")}
document.getElementById("checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const p=products.find(x=>x.id===cart[0]);
 const body={productId:p.id,customerName:customerName.value,customerEmail:customerEmail.value};
 const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await r.json();
 if(!r.ok)return alert(data.error||"Không tạo được đơn.");
 location.href="/payment.html?order="+encodeURIComponent(data.orderId);
});
load();
