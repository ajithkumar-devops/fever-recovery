const screens=[...document.querySelectorAll(".screen")];
const progress=document.getElementById("progressBar");
let current=0;

function show(index){
  current=Number(index);
  screens.forEach((s,i)=>s.classList.toggle("active",i===current));
  progress.style.width=((current+1)/screens.length*100)+"%";
  window.scrollTo({top:0,behavior:"smooth"});
  petals(4);
}
document.querySelectorAll("[data-next]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.next)));

function petals(n=5){
  const holder=document.querySelector(".petals");
  for(let i=0;i<n;i++){
    const p=document.createElement("span");
    p.className="petal"; p.textContent=Math.random()>.5?"🌸":"♥";
    p.style.left=Math.random()*100+"%";
    p.style.animationDelay=(Math.random()*.5)+"s";
    holder.appendChild(p);
    setTimeout(()=>p.remove(),8500);
  }
}
petals(10);

const rx=[
"Today you have full permission to ignore everyone. ♥",
"Prescription: one stupid joke immediately. 😂",
"Your cough has officially been reported to HR. 😭",
"Doctor's orders: water, rest and zero overthinking. 😌",
"Side effect of resting: you might accidentally feel better. 🌷"
];
let ri=0;
document.getElementById("dose").addEventListener("click",()=>{
  const t=document.getElementById("doseToast");
  t.textContent=rx[ri++%rx.length];
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);
  petals(5);
});

let score=0,time=20,timer=null,spawner=null;
let best=Number(localStorage.getItem("thejuRecoveryBest")||0);
document.getElementById("best").textContent=best;
const layer=document.getElementById("gameLayer");
const timeEl=document.getElementById("time"),scoreEl=document.getElementById("score");

function spawnHeart(){
  const b=document.createElement("button");
  b.className="game-heart";
  b.textContent=Math.random()>.2?"♥":"💗";
  b.style.left=(12+Math.random()*75)+"%";
  b.style.top=(24+Math.random()*45)+"%";
  b.addEventListener("click",()=>{
    score++;
    scoreEl.textContent=score;
    b.remove();
  });
  layer.appendChild(b);
  setTimeout(()=>b.remove(),950);
}
function finishGame(){
  clearInterval(timer);clearInterval(spawner);
  layer.querySelectorAll(".game-heart").forEach(x=>x.remove());
  if(score>best){best=score;localStorage.setItem("thejuRecoveryBest",best);document.getElementById("best").textContent=best}
  document.getElementById("play").disabled=false;
  document.getElementById("play").textContent="Play again ↻";
  const box=document.createElement("div");
  box.className="game-finished";
  box.innerHTML=`<div><strong>${score>=10?"Yay! 🎉":"Aww! ♥"}</strong>You caught ${score} hearts!<br><small>${score>=10?"That's amazing.":"That's enough smiling for today."}</small><br><button id="continueGame" class="game-start" style="position:static;margin-top:14px;height:44px">What's next? →</button></div>`;
  layer.appendChild(box);
  document.getElementById("continueGame").addEventListener("click",()=>{box.remove();show(5)});
}
document.getElementById("play").addEventListener("click",()=>{
  layer.querySelectorAll(".game-finished,.game-heart").forEach(x=>x.remove());
  score=0;time=20;scoreEl.textContent=0;timeEl.textContent=20;
  const btn=document.getElementById("play");btn.disabled=true;btn.textContent="Catch them! ♥";
  spawner=setInterval(spawnHeart,520);
  timer=setInterval(()=>{
    time--;timeEl.textContent=time;
    if(time<=0)finishGame();
  },1000);
});

let cardTaps=0;
document.querySelectorAll(".card-hotspots button").forEach(b=>b.addEventListener("click",()=>{
  const pop=document.getElementById("messagePop");
  pop.textContent=b.dataset.msg;pop.classList.add("show");
  cardTaps++;
  setTimeout(()=>pop.classList.remove("show"),1800);
  if(cardTaps>=2)document.getElementById("nightNext").classList.remove("hidden");
  petals(4);
}));

document.getElementById("restart").addEventListener("click",()=>{
  cardTaps=0;
  document.getElementById("nightNext").classList.add("hidden");
  show(0);
});
show(0);
