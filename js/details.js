/* =========================================================================
   BUS DETAILS SCREEN
   ========================================================================= */

let updateTimerHandle = null, secondsSinceUpdate = 0;
let liveRefreshHandle = null;

async function openBusDetails(id){
  const fallback = state.results.find(b=>b.id===id);
  showScreen("details"); // switch first so the loader is visible while we fetch

  const loader = ViBusLoader.attach(document.getElementById("screen-details"));
  const bus = await loader.run(() => BusAPI.getBusDetails(id, fallback));
  if(bus === null) return; // user hit the error card and gave up

  state.currentBus = bus;

  document.getElementById("dCode").textContent = bus.id;
  document.getElementById("dFrom").textContent = bus.from;
  document.getElementById("dTo").textContent = bus.to;
  document.getElementById("dOperator").textContent = bus.operator;
  document.getElementById("dKm").textContent = bus.distanceKm + " km";
  document.getElementById("dAcChip").style.display = bus.ac ? "inline-flex" : "none";
  document.getElementById("dDepTime").textContent = bus.dep;
  document.getElementById("dDepCity").textContent = bus.from;
  document.getElementById("dArrTime").textContent = bus.arr;
  document.getElementById("dArrCity").textContent = bus.to;
  document.getElementById("dDuration").textContent = fmtDuration(bus.durationMin);

  updateFavIcon();
  refreshLiveState(bus);

  // Re-check the real clock every 60 seconds while this screen is open,
  // so the live position keeps moving on its own as time passes - not
  // just frozen at whatever moment you first opened the bus.
  clearInterval(liveRefreshHandle);
  liveRefreshHandle = setInterval(()=> refreshLiveState(bus), 60000);

  showScreen("details");
}

function refreshLiveState(bus){
  const nowHHMM = getCurrentHHMM();
  const hasDeparted = diffMinutes(bus.dep, nowHHMM) < bus.durationMin && diffMinutes(bus.dep, nowHHMM) >= 0;
  renderStatusBanner(hasDeparted, bus);
  renderStops(bus.stops, hasDeparted);
}

function renderStatusBanner(hasDeparted, bus){
  const banner = document.getElementById("statusBanner");
  const text = document.getElementById("statusText");
  secondsSinceUpdate = 0;
  document.getElementById("updatedText").textContent = "Updated just now";
  clearInterval(updateTimerHandle);
  if(hasDeparted){
    banner.style.background = "var(--ac-bg)";
    document.getElementById("pulseDot").style.display = "inline-block";
    text.textContent = "Bus is on the way";
    updateTimerHandle = setInterval(()=>{
      secondsSinceUpdate += 5;
      document.getElementById("updatedText").textContent = secondsSinceUpdate < 60
        ? `Updated ${secondsSinceUpdate}s ago`
        : `Updated ${Math.floor(secondsSinceUpdate/60)}m ago`;
    }, 5000);
  } else {
    banner.style.background = "var(--gray-100)";
    document.getElementById("pulseDot").style.display = "none";
    text.textContent = `Scheduled departure at ${bus.dep}`;
  }
}

document.getElementById("refreshBtn").onclick = (e)=>{
  secondsSinceUpdate = 0;
  document.getElementById("updatedText").textContent = "Updated just now";
  if(state.currentBus) refreshLiveState(state.currentBus);
  const btn = e.currentTarget;
  btn.classList.add("spin");
  setTimeout(()=>btn.classList.remove("spin"), 650);
};

function renderStops(stops, hasDeparted){
  const wrap = document.getElementById("stopsWrap");
  const nowHHMM = getCurrentHHMM();

  // find the "current" index: last stop whose time <= now, only if the bus has departed
  let currentIdx = 0;
  if(hasDeparted){
    stops.forEach((s,i)=>{ if(s.time <= nowHHMM) currentIdx = i; });
    if(currentIdx === stops.length-1) currentIdx = Math.max(0, stops.length-2); // don't show "arrived" as current
  }

  wrap.innerHTML = stops.map((s,i)=>{
    const isDone = hasDeparted && i < currentIdx;
    const isCurrent = hasDeparted && i === currentIdx;
    const isLast = i===stops.length-1;
    const timeLabel = s.altTime ? `${s.time}<br>${s.altTime}` : s.time;
    return `
    <div class="stop ${isDone?'done':''} ${isCurrent?'current':''}">
      <div class="stop-time">${timeLabel}</div>
      <div class="stop-marker">
        <div class="stop-dot">${isCurrent ? busIconSvg() : s.seq}</div>
        ${!isLast ? `<div class="stop-connector ${isDone?'done':''} ${isCurrent?'dashed':''}"></div>` : ""}
      </div>
      <div class="stop-body">
        <div class="stop-name">
          ${s.name}${s.tag ? ` (${s.tag})` : ""}
          ${isCurrent ? `<span class="live-pill"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>Live Location</span>` : ""}
        </div>
        <div class="stop-sub">${s.sub ? s.sub : (isCurrent ? `Estimated ${s.estimate||s.time}` : (i===0 ? "" : "Estimated"))}</div>
      </div>
    </div>`;
  }).join("");
}
function busIconSvg(){
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M4 16c0 .88.39 1.67 1 2.22v1.28c0 .83.67 1.5 1.5 1.5S8 20.33 8 19.5V19h8v.5c0 .82.67 1.5 1.5 1.5.82 0 1.5-.67 1.5-1.5v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>`;
}

document.getElementById("backToResults").onclick = ()=>{
  clearInterval(updateTimerHandle);
  clearInterval(liveRefreshHandle);
  showScreen("results");
};

document.getElementById("shareBtn").onclick = async ()=>{
  const bus = state.currentBus;
  const shareTitle = `ViBus – ${bus.from} to ${bus.to}`;
  const shareText = `${bus.id} • ${bus.from} to ${bus.to} • Departs ${bus.dep}, arrives ${bus.arr} (${bus.operator}${bus.ac ? ", AC" : ""})`;
  const shareUrl = window.location.href;
  try{
    if(navigator.share){
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
    } else if(navigator.clipboard){
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast("Trip details copied — paste it anywhere");
    } else {
      toast("Sharing isn't supported on this browser");
    }
  }catch(e){ /* user closed the share sheet — nothing to do */ }
};

document.getElementById("favBtn").onclick = ()=>{
  const bus = state.currentBus;
  if(state.favorites.has(bus.id)){ state.favorites.delete(bus.id); toast("Removed from favorites"); }
  else { state.favorites.add(bus.id); toast("Added to favorites"); }
  updateFavIcon();
};
function updateFavIcon(){
  const icon = document.getElementById("favIcon");
  const isFav = state.currentBus && state.favorites.has(state.currentBus.id);
  icon.setAttribute("fill", isFav ? "#e63946" : "none");
  icon.setAttribute("stroke", isFav ? "#e63946" : "currentColor");
}