/* =========================================================================
   SEARCH SCREEN
   ========================================================================= */

function wireAutocomplete(inputId, suggId, clearId){
  const input = document.getElementById(inputId);
  const suggBox = document.getElementById(suggId);
  const clearBtn = document.getElementById(clearId);

  function renderSuggestions(list, query){
    if(list.length===0){ suggBox.style.display="none"; return; }
    suggBox.innerHTML = list.map(c=>`
      <div class="sugg-item" data-city="${c}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-7.2 7-12a7 7 0 10-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.2"/></svg>
        <span>${c}</span>
      </div>`).join("") + (query ? `<div class="sugg-viewall" data-viewall="${query}">View all results for &ldquo;${query}&rdquo;</div>` : "");
    suggBox.style.display="block";
    suggBox.querySelectorAll(".sugg-item").forEach(el=>{
      el.onclick = ()=>{
        input.value = el.dataset.city;
        suggBox.style.display="none";
        clearBtn.style.display = "flex";
        if(inputId==="fromInput") state.from = el.dataset.city; else state.to = el.dataset.city;
      };
    });
    const viewAll = suggBox.querySelector(".sugg-viewall");
    if(viewAll) viewAll.onclick = ()=>{ suggBox.style.display="none"; };
  }

  input.addEventListener("input", async ()=>{
    clearBtn.style.display = input.value ? "flex" : "none";
    if(inputId==="fromInput") state.from = input.value; else state.to = input.value;
    const list = await BusAPI.searchCities(input.value);
    renderSuggestions(list, input.value.trim());
  });
  input.addEventListener("focus", async ()=>{
    if(input.value){
      const list = await BusAPI.searchCities(input.value);
      renderSuggestions(list, input.value.trim());
    }
  });
  clearBtn.addEventListener("click", ()=>{
    input.value=""; clearBtn.style.display="none"; suggBox.style.display="none"; input.focus();
    if(inputId==="fromInput") state.from=""; else state.to="";
  });
  document.addEventListener("click",(e)=>{
    if(!input.parentElement.parentElement.contains(e.target)) suggBox.style.display="none";
  });
}
wireAutocomplete("fromInput","fromSuggestions","fromClear");
wireAutocomplete("toInput","toSuggestions","toClear");

document.getElementById("fromInput").value = "Kuru";
state.from = "Kuru";
document.getElementById("fromClear").style.display="flex";

document.getElementById("swapBtn").onclick = ()=>{
  const fromEl = document.getElementById("fromInput"), toEl = document.getElementById("toInput");
  const tmp = fromEl.value; fromEl.value = toEl.value; toEl.value = tmp;
  const tmpState = state.from; state.from = state.to; state.to = tmpState;
  document.getElementById("fromClear").style.display = fromEl.value ? "flex":"none";
  document.getElementById("toClear").style.display = toEl.value ? "flex":"none";
};

const POPULAR_ROUTES = [
  ["Delhi","Kurukshetra"],["Rohtak","Hisar"],["Sonipat","Panipat"],["Karnal","Chandigarh"]
];
document.getElementById("popularGrid").innerHTML = POPULAR_ROUTES.map(([a,b])=>`
  <button class="route-chip" data-from="${a}" data-to="${b}">
    <span class="city">${a}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 7h13l-4-4M17 17H4l4 4"/></svg>
    <span class="city">${b}</span>
  </button>`).join("");
document.querySelectorAll(".route-chip").forEach(chip=>{
  chip.onclick = ()=>{
    state.from = chip.dataset.from; state.to = chip.dataset.to;
    document.getElementById("fromInput").value = state.from;
    document.getElementById("toInput").value = state.to;
    runSearch();
  };
});

document.getElementById("searchBtn").onclick = ()=>{
  if(!state.from.trim() || !state.to.trim()){
    toast("Please enter both origin and destination");
    return;
  }
  runSearch();
};

async function runSearch(){
  showScreen("results"); // switch first so the loader is visible while we fetch

  const loader = ViBusLoader.attach(document.getElementById("screen-results"));
  const results = await loader.run(() => BusAPI.searchBuses(state.from, state.to, state.date));
  if(results === null) return; // user hit the error card and gave up

  state.results = results;
  state.history.unshift({ from: cleanCityName(state.from), to: cleanCityName(state.to), when:new Date() });
  document.getElementById("resultsRouteLabel").innerHTML = `${cleanCityName(state.from)} &rarr; ${cleanCityName(state.to)}`;
  renderResults();
}