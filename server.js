// Backend starter for production deployment.
// GitHub Pages does NOT run this file.
// Before accepting real payments, connect a real payment provider/webhook,
// validate signatures server-side, store orders in a database, and never
// expose secrets or bank credentials in frontend code.
const express=require("express");
const path=require("path");
const app=express();
app.use(express.json());
app.use(express.static(__dirname));
app.get("/api/health",(req,res)=>res.json({ok:true,service:"AetherAI"}));
app.get("/api/products",(req,res)=>res.json([
 {id:"starter",name:"AI Starter",price:99000},
 {id:"pro",name:"AI Pro",price:199000},
 {id:"business",name:"AI Business",price:399000}
]));
app.post("/api/orders",(req,res)=>res.status(501).json({error:"Payment backend not configured. Add a verified payment provider/webhook before enabling automatic delivery."}));
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`AetherAI server listening on ${PORT}`));
