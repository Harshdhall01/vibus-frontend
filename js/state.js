/* =========================================================================
   APP STATE + NAVIGATION
   ========================================================================= */

const state = {
  from:"", to:"", date:new Date(),
  results:[], sort:"earliest", acFilter:true, nonAcFilter:true,
  currentBus:null, favorites:new Set(), history:[]
};

const screens = ["search","results","details","favorites","history"];
function showScreen(name){
  screens.forEach(s=>{
    document.getElementById("screen-"+s).classList.toggle("active", s===name);
  });
  renderBottomNavs(name);
  window.scrollTo(0,0);
}

function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove("show"), 1800);
}

/* ---------- bottom nav (shared across screens) ---------- */
const NAV_ITEMS = [
  { key:"search",    label:"Search",    screen:"search",
    icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>' },
  { key:"favorites", label:"Favorites", screen:"favorites",
    icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>' },
  { key:"history",   label:"History",   screen:"history",
    icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>' }
];
function renderBottomNavs(activeScreen){
  document.querySelectorAll(".bottom-nav").forEach(nav=>{
    const forScreen = nav.dataset.navFor;
    nav.innerHTML = NAV_ITEMS.map(item=>`
      <button class="nav-item ${activeScreen===item.screen ? 'active':''}" data-goto="${item.screen}">
        ${item.icon}
        <span>${item.label}</span>
      </button>`).join("");
  });
  document.querySelectorAll(".nav-item").forEach(btn=>{
    btn.onclick = ()=>{
      const target = btn.dataset.goto;
      if(target==="favorites") renderFavorites();
      if(target==="history") renderHistory();
      showScreen(target);
    };
  });
}
renderBottomNavs("search");