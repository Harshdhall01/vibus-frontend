/* =========================================================================
   VIBUS LOADING SCREEN — CONTROLLER
   ---------------------------------------------------------------------
   Usage (inside search.js / details.js):

     const loader = ViBusLoader.attach(containerEl);
     const result = await loader.run(() => BusAPI.searchBuses(from, to, date));
     // loader.run() automatically:
     //   - waits 600ms before showing anything (avoids flashing on fast responses)
     //   - rotates friendly search messages while waiting
     //   - swaps to a "waking up the server" message on slow cold starts
     //   - on success: plays the checkmark transition, then resolves
     //   - on failure: shows a retry button and resolves once the user retries
     //
     // result is either the resolved value from your async function, or
     // (if the call failed and the user gave up) `null`.
   ========================================================================= */

const ViBusLoader = (function(){

  const SHOW_DELAY_MS = 600;
  const COLD_START_MS = 6000;
  const MESSAGE_ROTATE_MS = 2400;

  const SEARCH_MESSAGES = [
    "Finding the best buses...",
    "Checking schedules...",
    "Searching available routes...",
    "Calculating your journey...",
    "Preparing your trip...",
    "Almost there..."
  ];

  const COLD_START_MESSAGE = "Waking up the server, this can take up to a minute on first load...";

  const BUS_SVG = `
    <svg viewBox="0 0 160 90" width="100%" height="auto" aria-hidden="true">
      <rect x="10" y="26" width="140" height="40" rx="12" fill="#1976D2"/>
      <rect x="10" y="26" width="140" height="9" rx="4" fill="#125aa0"/>
      <rect x="22" y="38" width="20" height="15" rx="3" fill="#E3F2FD"/>
      <rect x="50" y="38" width="20" height="15" rx="3" fill="#E3F2FD"/>
      <rect x="78" y="38" width="20" height="15" rx="3" fill="#E3F2FD"/>
      <rect x="106" y="38" width="26" height="15" rx="3" fill="#0d3f73"/>
      <circle class="vl-headlight" cx="146" cy="58" r="4" fill="#FFD54F"/>
      <g class="vl-wheel" style="transform-box:fill-box; transform-origin:center;">
        <circle cx="40" cy="68" r="10" fill="#212121"/>
        <circle cx="40" cy="68" r="4" fill="#E3F2FD"/>
        <rect x="39" y="60" width="2" height="16" fill="#424242"/>
        <rect x="32" y="67" width="16" height="2" fill="#424242"/>
      </g>
      <g class="vl-wheel" style="transform-box:fill-box; transform-origin:center;">
        <circle cx="118" cy="68" r="10" fill="#212121"/>
        <circle cx="118" cy="68" r="4" fill="#E3F2FD"/>
        <rect x="117" y="60" width="2" height="16" fill="#424242"/>
        <rect x="110" y="67" width="16" height="2" fill="#424242"/>
      </g>
    </svg>`;

  const LOGO_SVG = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1976D2" aria-hidden="true">
      <path d="M4 16c0 .88.39 1.67 1 2.22v1.28c0 .83.67 1.5 1.5 1.5S8 20.33 8 19.5V19h8v.5c0 .82.67 1.5 1.5 1.5.82 0 1.5-.67 1.5-1.5v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>`;

  function buildOverlayMarkup(){
    return `
      <div class="vl-logo">${LOGO_SVG}<span>ViBus</span></div>
      <div class="vl-scene">
        <div style="position:relative; width:100%;">
          <div class="vl-cloud vl-cloud-1"></div>
          <div class="vl-cloud vl-cloud-2"></div>
          <div class="vl-bus-wrap">${BUS_SVG}</div>
          <div class="vl-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>
        </div>
        <div class="vl-route"></div>
        <div class="vl-dots">
          <div class="vl-dot"></div>
          <div class="vl-dot"></div>
          <div class="vl-dot"></div>
          <div class="vl-dot vl-dest"></div>
        </div>
      </div>
      <div class="vl-message" aria-live="polite"></div>
    `;
  }

  function buildErrorMarkup(message){
    return `
      <div class="vl-error">
        <div class="vl-error-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
        </div>
        <div class="vl-error-text">${message}</div>
        <button class="vl-retry-btn" type="button">Retry</button>
      </div>
    `;
  }

  function attach(container){
    if(!container) throw new Error("ViBusLoader.attach() needs a container element");
    if(getComputedStyle(container).position === "static"){
      container.style.position = "relative";
    }

    const overlay = document.createElement("div");
    overlay.className = "vl-overlay";
    container.appendChild(overlay);

    let messageTimer = null;
    let coldStartTimer = null;
    let showDelayTimer = null;
    let msgIndex = 0;
    let usingColdStartMessage = false;

    const messageEl = ()=> overlay.querySelector(".vl-message");

    function setMessage(text, extraClass){
      const el = messageEl();
      if(!el) return;
      el.classList.remove("vl-msg-visible");
      window.requestAnimationFrame(()=>{
        el.textContent = text;
        el.className = "vl-message " + (extraClass || "");
        window.requestAnimationFrame(()=> el.classList.add("vl-msg-visible"));
      });
    }

    function startMessageRotation(){
      msgIndex = 0;
      usingColdStartMessage = false;
      setMessage(SEARCH_MESSAGES[0]);
      messageTimer = setInterval(()=>{
        if(usingColdStartMessage) return;
        msgIndex = (msgIndex + 1) % SEARCH_MESSAGES.length;
        setMessage(SEARCH_MESSAGES[msgIndex]);
      }, MESSAGE_ROTATE_MS);

      coldStartTimer = setTimeout(()=>{
        usingColdStartMessage = true;
        setMessage(COLD_START_MESSAGE, "vl-waking");
      }, COLD_START_MS);
    }

    function stopTimers(){
      clearInterval(messageTimer);
      clearTimeout(coldStartTimer);
      clearTimeout(showDelayTimer);
    }

    function reset(){
      stopTimers();
      overlay.classList.remove("vl-show", "vl-success");
      overlay.innerHTML = buildOverlayMarkup();
    }

    reset();

    function run(asyncFn, opts){
      opts = opts || {};
      const errorMessage = opts.errorMessage ||
        "Couldn't reach the server. Check your connection and try again.";

      return new Promise((resolve)=>{
        function attempt(){
          reset();

          showDelayTimer = setTimeout(()=>{
            overlay.classList.add("vl-show");
            startMessageRotation();
          }, SHOW_DELAY_MS);

          asyncFn().then((value)=>{
            stopTimers();
            if(!overlay.classList.contains("vl-show")){
              overlay.innerHTML = "";
              resolve(value);
              return;
            }
            overlay.classList.add("vl-success");
            setMessage("Buses Found", "vl-done");
            setTimeout(()=>{
              overlay.classList.remove("vl-show");
              setTimeout(()=>{ overlay.innerHTML = ""; }, 400);
              resolve(value);
            }, 450);
          }).catch(()=>{
            stopTimers();
            overlay.classList.add("vl-show");
            overlay.innerHTML = buildErrorMarkup(errorMessage);
            overlay.querySelector(".vl-retry-btn").onclick = attempt;
          });
        }
        attempt();
      });
    }

    function destroy(){
      stopTimers();
      overlay.remove();
    }

    return { run, destroy };
  }

  return { attach };
})();