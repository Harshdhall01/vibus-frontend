/* =========================================================================
   RESULTS SCREEN
   ========================================================================= */

function formatDateLabel(d){
  const today = new Date();
  const isToday = d.toDateString()===today.toDateString();
  const day = d.toLocaleDateString("en-US",{ day:"2-digit", month:"short" });
  return (isToday ? "Today, " : d.toLocaleDateString("en-US",{weekday:"short"})+", ") + day;
}
document.getElementById("dateLabel").textContent = formatDateLabel(state.date);

function getFilteredSortedResults(){
  let list = state.results.filter(b => (b.ac && state.acFilter) || (!b.ac && state.nonAcFilter));
  if(state.sort==="earliest") list.sort((a,b)=> a.dep.localeCompare(b.dep));
  else if(state.sort==="latest") list.sort((a,b)=> b.dep.localeCompare(a.dep));
  else if(state.sort==="duration") list.sort((a,b)=> a.durationMin-b.durationMin);
  else if(state.sort==="price") list.sort((a,b)=> a.distanceKm-b.distanceKm);
  return list;
}

function renderResults(){
  const list = getFilteredSortedResults();
  document.getElementById("resultsCount").textContent = `${list.length} Bus${list.length===1?'':'es'} Found`;
  const wrap = document.getElementById("busList");
  if(list.length===0){
    wrap.innerHTML = `<div class="empty-state">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="7" width="16" height="10" rx="2"/><path d="M4 12h16"/></svg>
      <h3>No buses match your filters</h3>
      <p>Try switching AC / Non-AC back on, or pick another date.</p>
    </div>`;
    return;
  }
  wrap.innerHTML = list.map(b=>`
    <div class="bus-card" data-id="${b.id}">
      <div class="bus-row">
        <div class="bus-time-block">
          <div class="bus-time">${b.dep}</div>
          <div class="bus-city">${b.from}</div>
        </div>
        <div class="bus-mid">
          <div class="bus-duration">${fmtDuration(b.durationMin)}</div>
          <div class="bus-line"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h13M13 6l6 6-6 6"/></svg></div>
        </div>
        <div class="bus-time-block right">
          <div class="bus-time">${b.arr}</div>
          <div class="bus-city">${b.to}</div>
        </div>
      </div>
      <div class="bus-meta">
        <span class="op-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22v1.28c0 .83.67 1.5 1.5 1.5S8 20.33 8 19.5V19h8v.5c0 .82.67 1.5 1.5 1.5.82 0 1.5-.67 1.5-1.5v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
          ${b.operator}
        </span>
        ${b.ac
          ? `<span class="badge ac"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1"/></svg>AC</span>`
          : `<span class="badge nonac">Non-AC</span>`}
        <span class="badge km">${b.distanceKm} km</span>
      </div>
    </div>`).join("");
  wrap.querySelectorAll(".bus-card").forEach(card=>{
    card.onclick = ()=> openBusDetails(card.dataset.id);
  });
}

document.getElementById("backToSearch").onclick = ()=> showScreen("search");

// sort popover
const sortBtn = document.getElementById("sortBtn"), sortPop = document.getElementById("sortPopover"), backdrop = document.getElementById("popBackdrop");
sortBtn.onclick = ()=>{ sortPop.style.display = sortPop.style.display==="block" ? "none":"block"; backdrop.classList.toggle("show"); };
backdrop.onclick = ()=>{ sortPop.style.display="none"; document.getElementById("filterSheet").classList.remove("show"); backdrop.classList.remove("show"); };
sortPop.querySelectorAll(".popover-item").forEach(item=>{
  item.onclick = ()=>{
    state.sort = item.dataset.sort;
    document.getElementById("sortLabel").textContent = "Sort: " + item.textContent.trim();
    sortPop.style.display="none"; backdrop.classList.remove("show");
    renderResults();
  };
});

// filter sheet
const filterSheet = document.getElementById("filterSheet");
document.getElementById("filterBtn").onclick = ()=>{ filterSheet.classList.add("show"); backdrop.classList.add("show"); };
filterSheet.querySelectorAll(".switch").forEach(sw=>{
  sw.onclick = ()=>{
    sw.classList.toggle("on");
    if(sw.dataset.filter==="ac") state.acFilter = sw.classList.contains("on");
    if(sw.dataset.filter==="nonac") state.nonAcFilter = sw.classList.contains("on");
  };
});
document.getElementById("applyFilterBtn").onclick = ()=>{
  filterSheet.classList.remove("show"); backdrop.classList.remove("show");
  renderResults();
};