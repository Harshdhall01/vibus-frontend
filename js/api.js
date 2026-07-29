const API_BASE = "http://localhost:5000";
function cleanCityName(c){ return c.replace(/\s*\(.*?\)\s*/g,"").trim(); }
function getCurrentHHMM(){
  const d = new Date();
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}
function getCurrentHHMM(){
  const d = new Date();
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}

function addMinutes(hhmm, mins){
  let [h,m] = hhmm.split(":").map(Number);
  let total = h*60+m+mins;
  total = ((total % 1440) + 1440) % 1440;
  let hh = Math.floor(total/60), mm = total%60;
  return String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0");
}
function diffMinutes(a,b){
  let [ah,am]=a.split(":").map(Number), [bh,bm]=b.split(":").map(Number);
  let d = (bh*60+bm)-(ah*60+am);
  if(d<0) d+=1440;
  return d;
}
function fmtDuration(mins){
  const h = Math.floor(mins/60), m = mins%60;
  return h+"h "+String(m).padStart(2,"0")+"m";
}

const BusAPI = {
  async searchCities(query) {
    const q = query.trim();
    if (!q) return [];
    const res = await fetch(`${API_BASE}/api/cities?q=${encodeURIComponent(q)}&limit=5`);
    return res.json();
  },

  async searchBuses(from, to, date) {
    const params = new URLSearchParams({ from, to });
    if (date) params.set("date", date);
    const res = await fetch(`${API_BASE}/api/buses?${params.toString()}`);
    return res.json();
  },

  async getBusDetails(id, fallbackBus) {
    const res = await fetch(`${API_BASE}/api/buses/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return res.json();
  }
};