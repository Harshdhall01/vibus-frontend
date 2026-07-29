/* =========================================================================
   FAVORITES / HISTORY (light-weight supporting screens)
   ========================================================================= */

function renderFavorites(){
  const wrap = document.getElementById("favList");
  const favBuses = [...state.favorites].map(id => state.results.find(b=>b.id===id) || MOCK_BUSES_DB.find(b=>b.id===id)).filter(Boolean);
  if(favBuses.length===0){
    wrap.innerHTML = `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
      <h3>No favorites yet</h3><p>Tap the heart on a bus you like to save it here.</p>
    </div>`;
    return;
  }
  wrap.innerHTML = favBuses.map(b=>`
    <div class="simple-card" data-id="${b.id}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1652c7"><path d="M4 16c0 .88.39 1.67 1 2.22v1.28c0 .83.67 1.5 1.5 1.5S8 20.33 8 19.5V19h8v.5c0 .82.67 1.5 1.5 1.5.82 0 1.5-.67 1.5-1.5v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
      <div>
        <div style="font-weight:700;">${b.from} &rarr; ${b.to}</div>
        <div style="font-size:12.5px; color:var(--gray-600);">${b.dep} - ${b.arr} &bull; ${b.id}</div>
      </div>
    </div>`).join("");
  wrap.querySelectorAll(".simple-card").forEach(c=> c.onclick = ()=> openBusDetails(c.dataset.id));
}

function renderHistory(){
  const wrap = document.getElementById("historyList");
  if(state.history.length===0){
    wrap.innerHTML = `<div class="empty-state">
      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
      <h3>No searches yet</h3><p>Your recent route searches will show up here.</p>
    </div>`;
    return;
  }
  wrap.innerHTML = state.history.slice(0,15).map(h=>`
    <div class="simple-card" data-from="${h.from}" data-to="${h.to}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5b6472" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
      <div>
        <div style="font-weight:700;">${h.from} &rarr; ${h.to}</div>
        <div style="font-size:12.5px; color:var(--gray-600);">Searched recently</div>
      </div>
    </div>`).join("");
  wrap.querySelectorAll(".simple-card").forEach(c=>{
    c.onclick = ()=>{
      state.from = c.dataset.from; state.to = c.dataset.to;
      document.getElementById("fromInput").value = state.from;
      document.getElementById("toInput").value = state.to;
      runSearch();
    };
  });
}