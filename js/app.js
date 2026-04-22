// Breakaway App - Core
const APP = { user: null, credentials: [], view: 'landing', aiMode: null, pasteCount: 0, tabSwitchCount: 0, xp: 0, streak: 0, lastCompleted: null, stroopRound: 0, stroopCorrect: 0, stroopTotal: 0, speedparsePhase: 'flash', speedparseAnswers: [] };
// ── Behavioral Integrity System ──
// Silently tracks tab-switches (visibilitychange) and pastes during solo mode.
// Produces a transparent integrity label on each credential — not punitive, just honest.
function computeIntegrity(pasteCount, tabSwitchCount, aiMode) {
  if (aiMode !== 'solo') return { label: 'N/A', color: '#888', note: 'AI-assisted mode — integrity tracking not applicable' };
  const signals = (pasteCount || 0) + (tabSwitchCount || 0);
  if (signals === 0) return { label: 'VERIFIED', color: '#34d399', note: 'No external assistance signals detected' };
  if (signals <= 2) return { label: 'CLEAN', color: '#06b6d4', note: signals + ' minor signal(s) — likely normal workflow' };
  if (signals <= 5) return { label: 'OBSERVED', color: '#f59e0b', note: signals + ' behavioral signals detected — exercise discretion' };
  return { label: 'FLAGGED', color: '#ef4444', note: signals + ' signals — high external assistance probability' };
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && APP.activeChallenge && APP.aiMode === 'solo') { APP.tabSwitchCount++; }
});
const DOMAINS = ['Coding','Logic','Analysis','Writing','Debug','AI Fluency'];
const AI_MODES = {
  solo:      { label:'PURE HUMAN',      icon:'🧠',    color:'#34d399', desc:'No AI assistance. Your raw skill, verified.' },
  augmented: { label:'HUMAN + AI',      icon:'🤖+🧠', color:'#00ffd5', desc:'AI as your tool. You drive, AI assists. Both skills validated.' },
  native:    { label:'AI ORCHESTRATOR', icon:'🤖',    color:'#a78bfa', desc:'The skill IS working with AI. Prompt, validate, orchestrate.' }
};
const GRADES = {S:{min:95,label:'S',color:'#fbbf24',title:'Sovereign'},A:{min:85,label:'A',color:'#34d399',title:'Elite'},B:{min:70,label:'B',color:'#06b6d4',title:'Proficient'},C:{min:50,label:'C',color:'#f59e0b',title:'Developing'},D:{min:25,label:'D',color:'#f97316',title:'Novice'},F:{min:0,label:'F',color:'#ef4444',title:'Incomplete'}};
// ── Grade lookup — sorted descending, deterministic ──
const GRADE_ORDER = [GRADES.S,GRADES.A,GRADES.B,GRADES.C,GRADES.D,GRADES.F];
// ── Difficulty Tiers: Probe (easy) → Core (standard) → Edge (hard) ──
const DIFFICULTY_TIERS = {
  probe:  {label:'PROBE',  color:'#34d399',mult:0.8, timeBonus:1.0, desc:'Warm-up. Build confidence.'},
  core:   {label:'CORE',   color:'#06b6d4',mult:1.0, timeBonus:1.0, desc:'Standard challenge. Prove your skill.'},
  edge:   {label:'EDGE',   color:'#ef4444',mult:1.4, timeBonus:1.2, desc:'Elite difficulty. Only the sharp survive.'}
};
function getTier(c){return DIFFICULTY_TIERS[c.tier||'core']||DIFFICULTY_TIERS.core;}
function getTierXP(c){return Math.round((c.xp||100)*(getTier(c).mult));}

function getGrade(s){for(const g of GRADE_ORDER)if(s>=g.min)return g;return GRADES.F;}
function calcTimeBonus(elapsed,total){const r=elapsed/total;return r<0.3?50:r<0.5?30:r<0.7?15:0;}
// calcStreak: ONLY mutates state when called from completion, not renders
function calcStreak(){const n=Date.now();if(APP.lastCompleted&&(n-APP.lastCompleted)<3600000){APP.streak++;}else{APP.streak=1;}APP.lastCompleted=n;return APP.streak;}
function getStreakDisplay(){if(!APP.lastCompleted)return 0;const n=Date.now();return(n-APP.lastCompleted)<3600000?APP.streak:0;}
function saveState(){try{localStorage.setItem('breakaway',JSON.stringify({user:APP.user,credentials:APP.credentials,xp:APP.xp,streak:APP.streak,lastCompleted:APP.lastCompleted}));}catch(e){}}
function loadState(){try{const d=JSON.parse(localStorage.getItem('breakaway'));if(d){APP.user=d.user||null;APP.credentials=d.credentials||[];APP.xp=d.xp||0;APP.streak=d.streak||0;APP.lastCompleted=d.lastCompleted||null;}}catch(e){}}
const CHALLENGES = [
  {id:'c1',domain:'Coding',title:'Frequency Hunter',desc:'A dataset just came in hot. Find which element shows up the most. The edge cases will humble you.',flavor:'The answer is always in the data.',difficulty:'beginner',tier:'probe',type:'code',time:300,xp:100,
   modes:['solo','augmented'],
   prompt:'Write a function mostFrequent(arr) that returns the most frequent element.',
   tests:[{input:'[1,2,2,3]',expected:'2'},{input:'["a","b","a"]',expected:'a'}],
   starter:'function mostFrequent(arr) {\n  // your code\n}'},
  {id:'c2',domain:'Logic',title:'Sequence Breaker',desc:'Numbers hide patterns. Crack them before the clock runs out.',flavor:'Every sequence is a story. Read between the numbers.',difficulty:'beginner',tier:'probe',type:'quiz',time:90,xp:80,
   modes:['solo'],
   questions:[{q:'What comes next: 2, 4, 8, 16, __?',opts:['24','30','32','36'],answer:2},{q:'Complete: 1, 1, 2, 3, 5, __?',opts:['7','8','10','13'],answer:1},{q:'Missing: 3, 6, __, 12, 15?',opts:['7','8','9','10'],answer:2}]},
  {id:'c3',domain:'Coding',title:'Mirror Mirror',desc:'Can you see backwards? Build a function that knows whether a word reads the same in both directions.',flavor:'racecar, madam, level - the truth reads the same from either end.',difficulty:'intermediate',tier:'core',type:'code',time:240,xp:150,
   modes:['solo','augmented'],
   hint:'Strip non-alpha characters and normalize case first.',
   prompt:'Write isPalindrome(str) that returns true if the string reads the same forwards and backwards (ignore case, spaces, punctuation).',
   tests:[{input:'"racecar"',expected:'true'},{input:'"hello"',expected:'false'},{input:'"A man a plan a canal Panama"',expected:'true'},{input:'""',expected:'true'}],
   starter:'function isPalindrome(str) {\n  // Through the looking glass...\n}'},
  {id:'c4',domain:'AI Fluency',title:'Ghost in the Code',desc:'An AI wrote this merge sort. It looks clean. But 3 subtle bugs are hiding in plain sight.',flavor:'AI code is not wrong - it is confidently wrong. That is what makes it dangerous.',difficulty:'intermediate',tier:'core',type:'validate',time:420,xp:200,
   hint:'Trace through [3,1,2] by hand. Watch array slicing and merge loop.',
   modes:['solo','augmented'],
   buggyCode:'function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid + 1)); // Bug 1: should be mid, not mid+1\n  return merge(left, right);\n}\nfunction merge(a, b) {\n  let result = [], i = 0, j = 0;\n  while (i < a.length && j < b.length) { // Bug 2: should be || not &&\n    if (a[i] < b[j]) result.push(a[i++]);\n    else result.push(b[j++]);\n  }\n  return result; // Bug 3: missing concat of remaining elements\n}',
   bugs:['arr.slice(mid + 1) should be arr.slice(mid) — skips the middle element','while condition uses && but should continue while either array has elements left','Missing concatenation of remaining elements from a or b after the loop'],
   bugCount:3},
  {id:'c5',domain:'AI Fluency',title:'The Prompt Architect',desc:'Your weapon is not code - it is language. Write a prompt so precise any AI would nail it first try.',flavor:'The quality of AI output is a direct mirror of the quality of your input.',difficulty:'beginner',tier:'probe',type:'prompt',time:300,xp:180,
   modes:['native'],
   scenario:'You need an AI to generate a function that takes a nested object and flattens it into a single-level object with dot-notation keys. Example: {a:{b:1,c:{d:2}}} → {"a.b":1,"a.c.d":2}',
   rubric:['Specifies input/output format clearly (+25)','Includes edge cases (empty objects, arrays, nulls) (+25)','Defines the function signature (+20)','Provides example input/output (+20)','Sets constraints (no external libs, handle circular refs) (+10)']},
  {id:'c6',domain:'Debug',title:'Test Saboteur',desc:'An AI wrote test cases for a function. Some look right but are dead wrong. Find the tests that would pass bad code.',flavor:'A test that does not test anything is worse than no test at all.',difficulty:'intermediate',tier:'core',type:'validate',time:360,xp:175,
   hint:'Run the function mentally with each test input. Watch empty strings and type coercion.',
   modes:['solo','augmented'],
   buggyCode:'// Function under test:\nfunction capitalize(str) {\n  return str.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");\n}\n\n// AI-generated tests:\ntest("basic", () => expect(capitalize("hello world")).toBe("Hello World")); // ✓\ntest("single", () => expect(capitalize("hi")).toBe("Hi")); // ✓\ntest("empty", () => expect(capitalize("")).toBe("")); // Bug: crashes on empty string\ntest("numbers", () => expect(capitalize("123 abc")).toBe("123 Abc")); // Bug: 123 has no char to uppercase\ntest("already caps", () => expect(capitalize("Hello")).toBe("Hello")); // ✓',
   bugs:['Empty string test: capitalize("") will crash because w[0] is undefined when splitting empty string','Numbers test: "123" — w[0].toUpperCase() on "1" returns "1", so "123 Abc" is actually correct BUT the function would work — however the real bug is the empty string crash is not caught by the test expecting ""'],
   bugCount:2}
];
// ═══════════════════════════════════════
// PHASE 1: COGNITIVE BENCHMARK CHALLENGES
// ═══════════════════════════════════════
const COGNITIVE_CHALLENGES = [
  {id:'c7',domain:'Debug',title:'Signal & Noise',desc:'Variable names lie. Code doesn\'t. Your brain wants to read the names - fight it.',flavor:'The Stroop effect: when what you read fights what you see.',difficulty:'intermediate',tier:'core',type:'stroop',time:120,xp:160,
   modes:['solo'],
   rounds:[
     {code:'const yes = false;\nconst success = "ERROR";\nif (yes) return success;\nelse return success.length;',question:'What is returned?',options:['false','"ERROR"','5','undefined'],answer:2},
     {code:'const add = (a, b) => a * b;\nconst result = add(3, 4);',question:'What is result?',options:['7','12','34','NaN'],answer:1},
     {code:'const empty = [1, 2, 3];\nconst full = [];\nconsole.log(empty.length + full.length);',question:'What is logged?',options:['0','3','6','undefined'],answer:1},
     {code:'const multiply = (x) => x + x;\nconst divide = (x) => x * x;\nconst answer = multiply(divide(3));',question:'What is answer?',options:['6','9','18','27'],answer:2},
     {code:'const firstName = "World";\nconst lastName = "Hello";\nconst greeting = lastName + " " + firstName;',question:'What is greeting?',options:['"Hello World"','"World Hello"','"firstName lastName"','undefined'],answer:0},
     {code:'const ascending = [5,3,1,4,2].sort();\nconsole.log(ascending[0]);',question:'What is logged?',options:['1','5','"1"','[1,2,3,4,5]'],answer:0},
     {code:'const isEven = (n) => n % 2 !== 0;\nconst check = isEven(4);',question:'What is check?',options:['true','false','0','undefined'],answer:1},
     {code:'const remove = (arr, item) => arr.push(item);\nconst list = [1,2];\nconst result = remove(list, 3);',question:'What is result?',options:['[1,2,3]','3','undefined','[1,2]'],answer:1},
     {code:'const floor = Math.ceil(4.3);\nconst ceil = Math.floor(4.7);\nconsole.log(floor + ceil);',question:'What is logged?',options:['9','8','9.0','10'],answer:0},
     {code:'const fast = new Promise(r => setTimeout(()=>r("slow"),0));\nconst slow = "fast";\nconsole.log(slow);',question:'What is logged immediately?',options:['"slow"','"fast"','Promise','undefined'],answer:1}
   ]},
  {id:'c8',domain:'AI Fluency',title:'Snapshot',desc:'Code will flash for 3 seconds. Then it vanishes. Can you remember what you saw?',flavor:'Processing speed separates those who read code from those who absorb it.',difficulty:'beginner',tier:'probe',type:'speedparse',time:90,xp:140,
   modes:['solo'],
   flashDuration:3000,
   snippets:[
     {code:'const users = data\n  .filter(u => u.active && u.age > 21)\n  .map(u => ({ name: u.name, email: u.email }))\n  .sort((a, b) => a.name.localeCompare(b.name));',
      questions:[
        {q:'What property is checked first in filter?',opts:['age','active','name','email'],answer:1},
        {q:'What two fields are kept in map?',opts:['name & age','email & active','name & email','id & name'],answer:2},
        {q:'How are results sorted?',opts:['By email','By age descending','By name alphabetically','By active status'],answer:2}
      ]},
     {code:'async function fetchPosts(userId) {\n  const res = await fetch(`/api/users/${userId}/posts`);\n  if (!res.ok) throw new Error("Failed");\n  const posts = await res.json();\n  return posts.filter(p => !p.draft).slice(0, 10);\n}',
      questions:[
        {q:'What HTTP method is used?',opts:['POST','GET (fetch default)','PUT','PATCH'],answer:1},
        {q:'What happens if the response is not ok?',opts:['Returns null','Logs error','Throws an Error','Returns empty array'],answer:2},
        {q:'How many non-draft posts max are returned?',opts:['5','All of them','10','20'],answer:2}
      ]},
     {code:'class EventBus {\n  constructor() { this.handlers = new Map(); }\n  on(event, fn) {\n    if (!this.handlers.has(event)) this.handlers.set(event, []);\n    this.handlers.get(event).push(fn);\n  }\n  emit(event, ...args) {\n    (this.handlers.get(event) || []).forEach(fn => fn(...args));\n  }\n}',
      questions:[
        {q:'What data structure stores handlers?',opts:['Array','Object','Map','Set'],answer:2},
        {q:'What happens if you emit an event with no handlers?',opts:['Error thrown','Nothing (empty array fallback)','Returns false','Logs warning'],answer:1},
        {q:'Can an event have multiple handlers?',opts:['No, last one wins','Yes, push to array','Only 2 max','Depends on config'],answer:1}
      ]}
   ]},
  {id:'c9',domain:'AI Fluency',title:'Hallucination Hunter',desc:'An AI generated a complete module. It looks polished. 4 bugs are hiding. Find them all.',flavor:'AI confidence and AI correctness are two completely different things.',difficulty:'advanced',tier:'edge',type:'aivalidate',time:480,xp:250,
   modes:['solo','augmented'],
   hint:'Check edge cases, off-by-one errors, and assumptions about input types.',
   buggyCode:'// AI-generated: Debounce utility with cancel + flush\nfunction debounce(fn, delay = 300) {\n  let timer;\n  \n  function debounced(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => {\n      fn.apply(this, args);  // Bug 1: arrow fn loses this context\n    }, delay);\n  }\n  \n  debounced.cancel = () => clearTimeout(timer);\n  \n  debounced.flush = () => {\n    clearTimeout(timer);\n    fn();  // Bug 2: flush calls fn() with no arguments\n  };\n  \n  debounced.pending = () => timer !== null;\n  // Bug 3: timer is undefined initially, not null\n  \n  return debounced;\n}\n\n// Usage example:\nconst save = debounce(function(data) {\n  fetch(\"/api/save\", {\n    method: \"POST\",\n    body: JSON.stringify(data),\n    headers: { \"Content-Type\": \"application/json\" }\n  });\n  // Bug 4: no error handling, no await\n}, 500);',
   bugs:[
     'Arrow function in setTimeout loses this context - fn.apply(this, args) uses the enclosing scope this, not the caller this',
     'flush() calls fn() with no arguments - should use the last captured args',
     'pending() checks timer !== null but timer starts as undefined - returns true incorrectly before any call',
     'fetch call has no error handling (no try/catch, no .catch(), no await) - network failures silently swallowed'
   ],
   bugCount:4},
  // ═══════════════════════════════════════
  // PHASE 2: EDGE-TIER CHALLENGES
  // ═══════════════════════════════════════
  {id:'c10',domain:'Coding',title:'Refactor Reaper',desc:'This function works. But it is a disaster. Rewrite it to be clean, efficient, and production-ready.',flavor:'Working code and good code are not the same thing.',difficulty:'advanced',tier:'edge',type:'code',time:480,xp:280,
   modes:['solo','augmented'],
   prompt:'Refactor this function: it finds all duplicate elements in two arrays and returns them sorted, without using Set. Current code uses nested loops (O(n²)). Make it O(n log n) or better.\n\nOriginal:\nfunction findDupes(a, b) {\n  var result = [];\n  for (var i = 0; i < a.length; i++) {\n    for (var j = 0; j < b.length; j++) {\n      if (a[i] === b[j] && result.indexOf(a[i]) === -1) {\n        result.push(a[i]);\n      }\n    }\n  }\n  return result.sort();\n}',
   tests:[{input:'[1,2,3,4],[3,4,5,6]',expected:'3,4'},{input:'["a","b"],["b","c"]',expected:'b'},{input:'[1,1,2],[2,2,3]',expected:'2'},{input:'[],[1,2,3]',expected:''}],
   starter:'function findDupes(a, b) {\n  // Rewrite: O(n log n) or better, no Set\n}'},
  {id:'c11',domain:'Logic',title:'Temporal Debugger',desc:'Async code runs out of order. Predict the exact console output — every line, every tick.',flavor:'JavaScript does not wait. Neither should your understanding of it.',difficulty:'advanced',tier:'edge',type:'quiz',time:120,xp:220,
   modes:['solo'],
   questions:[
     {q:'console.log(1); setTimeout(()=>console.log(2),0); Promise.resolve().then(()=>console.log(3)); console.log(4); — Output order?',opts:['1,2,3,4','1,4,3,2','1,4,2,3','1,3,4,2'],answer:1},
     {q:'const a=[1,2,3]; const b=a; b.push(4); console.log(a.length); — Output?',opts:['3','4','undefined','Error'],answer:1},
     {q:'for(var i=0;i<3;i++){setTimeout(()=>console.log(i),0);} — Output?',opts:['0,1,2','3,3,3','undefined x3','0,0,0'],answer:1},
     {q:'console.log(typeof null); — Output?',opts:['"null"','"undefined"','"object"','"NaN"'],answer:2},
     {q:'console.log(0.1+0.2===0.3); — Output?',opts:['true','false','NaN','Error'],answer:1}
   ]},
  {id:'c12',domain:'AI Fluency',title:'Architecture Critic',desc:'An AI designed a complete caching module. The code runs — but the architecture has 5 critical design flaws that will explode at scale.',flavor:'Code that works today and code that survives tomorrow are built differently.',difficulty:'advanced',tier:'edge',type:'aivalidate',time:600,xp:320,
   modes:['solo','augmented'],
   hint:'Think about memory leaks, race conditions, cache invalidation, and error propagation.',
   buggyCode:'// AI-generated: In-memory cache with TTL\nclass Cache {\n  constructor() {\n    this.store = {};  // Bug 1: unbounded growth, no max size\n  }\n  set(key, value, ttlMs = 60000) {\n    this.store[key] = {\n      value: value,  // Bug 2: stores reference, not deep clone\n      expires: Date.now() + ttlMs\n    };\n  }\n  get(key) {\n    const entry = this.store[key];\n    if (!entry) return null;\n    if (Date.now() > entry.expires) {\n      delete this.store[key];\n      return null;  // Bug 3: lazy deletion only — stale entries pile up\n    }\n    return entry.value;\n  }\n  async getOrFetch(key, fetchFn, ttlMs) {\n    const cached = this.get(key);\n    if (cached) return cached;\n    const value = await fetchFn();  // Bug 4: no thundering herd protection\n    this.set(key, value, ttlMs);\n    return value;\n    // Bug 5: no error handling — if fetchFn throws, cache is poisoned with rejection\n  }\n}',
   bugs:[
     'No max cache size — unbounded memory growth will eventually crash the process',
     'Stores object references, not deep clones — mutations to returned values corrupt the cache',
     'Lazy deletion only — expired entries accumulate indefinitely until accessed, wasting memory',
     'No thundering herd / stampede protection — concurrent calls for the same key all trigger fetches',
     'No error handling in getOrFetch — if fetchFn throws, the error is unhandled and subsequent calls retry endlessly'
   ],
   bugCount:5}
];
CHALLENGES.push(...COGNITIVE_CHALLENGES);

// ── Toast Notification System ──
const TOAST_QUEUE=[];let TOAST_ACTIVE=false;
function showToast(msg,type,duration){
  type=type||'info';duration=duration||3000;
  TOAST_QUEUE.push({msg:msg,type:type,duration:duration});
  if(!TOAST_ACTIVE)drainToast();
}
function drainToast(){
  if(!TOAST_QUEUE.length){TOAST_ACTIVE=false;return;}
  TOAST_ACTIVE=true;
  var item=TOAST_QUEUE.shift();
  var container=document.getElementById('toast-container');
  if(!container){container=document.createElement('div');container.id='toast-container';container.style.cssText='position:fixed;top:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:8px;pointer-events:none;';document.body.appendChild(container);}
  var el=document.createElement('div');
  var colors={info:'linear-gradient(135deg,rgba(6,182,212,0.95),rgba(6,182,212,0.7))',success:'linear-gradient(135deg,rgba(52,211,153,0.95),rgba(52,211,153,0.7))',xp:'linear-gradient(135deg,rgba(201,168,76,0.95),rgba(201,168,76,0.7))',rank:'linear-gradient(135deg,rgba(167,139,250,0.95),rgba(167,139,250,0.7))',streak:'linear-gradient(135deg,rgba(249,115,22,0.95),rgba(249,115,22,0.7))'};
  var bg=colors[item.type]||colors.info;
  el.style.cssText='background:'+bg+';color:#fff;padding:14px 22px;border-radius:12px;font:600 14px Inter,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:translateX(120%);transition:transform 0.4s cubic-bezier(0.22,1,0.36,1),opacity 0.3s;opacity:0;pointer-events:auto;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);';
  el.textContent=item.msg;container.appendChild(el);
  requestAnimationFrame(function(){el.style.transform='translateX(0)';el.style.opacity='1';});
  setTimeout(function(){el.style.transform='translateX(120%)';el.style.opacity='0';setTimeout(function(){el.remove();drainToast();},400);},item.duration);
}
async function sha256(msg){const d=new TextEncoder().encode(msg);const h=await crypto.subtle.digest('SHA-256',d);return[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function navigate(hash){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const nav=document.getElementById('main-nav');
  if(!hash||hash==='#/'||hash===''){
    document.getElementById('view-landing').classList.add('active');
    nav.classList.add('hidden');return;
  }
  nav.classList.remove('hidden');
  const route=hash.replace('#/','');
  const el=document.getElementById('view-'+route);
  if(el){el.classList.add('active');document.querySelector('[data-view="'+route+'"]')?.classList.add('active');}
  if(route==='challenges'){populateFilterBar();renderChallenges();}
  if(route==='dashboard')renderDashboard();
  if(route==='profile')renderProfile();
  if(route==='credentials')renderCredentials();
}
// ── CHALLENGE FILTERING ──
APP.activeFilter='all';
function populateFilterBar(){
  const bar=document.getElementById('filter-bar');if(!bar)return;
  // Collect unique types
  const types=[...new Set(CHALLENGES.map(c=>c.type))];
  const typeColors={code:'#34d399',quiz:'#06b6d4',validate:'#f59e0b',prompt:'#a78bfa',stroop:'#ff6b6b',speedparse:'#00ffd5',aivalidate:'#ef4444'};
  let html='<button class="filter-chip active" data-filter="all" onclick="filterChallenges(\'all\')">All</button>';
  html+='<span class="filter-divider">|</span>';
  // Domain filters
  DOMAINS.forEach(d=>{
    html+='<button class="filter-chip" data-filter="domain:'+d+'" onclick="filterChallenges(\'domain:'+d+'\')">' +d+'</button>';
  });
  html+='<span class="filter-divider">|</span>';
  // Type filters
  types.forEach(t=>{
    html+='<button class="filter-chip filter-type" data-filter="type:'+t+'" onclick="filterChallenges(\'type:'+t+'\')" style="--type-color:'+(typeColors[t]||'#C9A84C')+'">'+t.toUpperCase()+'</button>';
  });
  html+='<span class="filter-divider">|</span>';
  // Tier filters
  Object.keys(DIFFICULTY_TIERS).forEach(tk=>{
    const tier=DIFFICULTY_TIERS[tk];
    html+='<button class="filter-chip filter-tier" data-filter="tier:'+tk+'" onclick="filterChallenges(\'tier:'+tk+'\')" style="--type-color:'+tier.color+'">'+tier.label+'</button>';
  });
  bar.innerHTML=html;
}
function filterChallenges(filter){
  APP.activeFilter=filter;
  // Update chip active state
  document.querySelectorAll('#filter-bar .filter-chip').forEach(c=>{
    c.classList.toggle('active',c.dataset.filter===filter);
  });
  renderChallenges();
}
function renderChallenges(){
  const grid=document.getElementById('challenge-grid');
  let filtered=CHALLENGES;
  if(APP.activeFilter&&APP.activeFilter!=='all'){
    if(APP.activeFilter.startsWith('domain:')){
      const d=APP.activeFilter.replace('domain:','');
      filtered=CHALLENGES.filter(c=>c.domain===d);
    }else if(APP.activeFilter.startsWith('type:')){
      const t=APP.activeFilter.replace('type:','');
      filtered=CHALLENGES.filter(c=>c.type===t);
    }else if(APP.activeFilter.startsWith('tier:')){
      const tk=APP.activeFilter.replace('tier:','');
      filtered=CHALLENGES.filter(c=>(c.tier||'core')===tk);
    }
  }
  grid.innerHTML=filtered.map(c=>{
    const modeBadges=(c.modes||['solo']).map(m=>'<span class="mode-badge mode-'+m+'" style="--mode-color:'+AI_MODES[m].color+'">'+AI_MODES[m].icon+' '+AI_MODES[m].label+'</span>').join('');
    return '<div class="challenge-card" onclick="startChallenge(\''+c.id+'\')">'+
      '<div class="challenge-card-top"><div class="challenge-card-domain">'+c.domain+'</div><span class="challenge-type-badge type-'+c.type+'">'+c.type.toUpperCase()+'</span></div>'+
      '<h3>'+c.title+'</h3><p>'+c.desc+'</p>'+
      (c.flavor?'<div class="challenge-flavor">"'+c.flavor+'"</div>':'')+
      '<div class="challenge-modes">'+modeBadges+'</div>'+
      '<div class="challenge-meta"><span class="challenge-tier" style="color:'+(getTier(c).color)+'">'+getTier(c).label+'</span><span class="challenge-diff diff-'+c.difficulty+'">'+c.difficulty.toUpperCase()+'</span>'+(c.xp?'<span class="challenge-xp-badge">✦ '+c.xp+' XP</span>':'')+'<span class="challenge-time">⏱ '+Math.floor(c.time/60)+'m</span></div></div>';
  }).join('');
  if(!filtered.length)grid.innerHTML='<div class="empty-state"><p>No challenges match this filter.</p></div>';
}
function startChallenge(id){
  const c=CHALLENGES.find(x=>x.id===id);if(!c)return;
  APP.activeChallenge=c;APP.pasteCount=0;APP.tabSwitchCount=0;
  const modes=c.modes||['solo'];
  if(modes.length===1){APP.aiMode=modes[0];launchChallenge(c);return;}
  navigate('#/challenge-active');
  const header=document.getElementById('challenge-header');
  header.innerHTML='<h2>'+c.title+'</h2><p>Choose how you want to prove this skill.</p>';
  const ws=document.getElementById('challenge-workspace');
  ws.innerHTML='<div class="ai-mode-selector"><div class="mode-selector-title">How are you taking this challenge?</div><div class="mode-selector-subtitle">Be honest. AI is a tool, not a cheat code. Your credential records this transparently.</div><div class="mode-options">'+modes.map(m=>'<div class="mode-option" data-mode="'+m+'" onclick="selectMode(\''+m+'\',\''+c.id+'\')"><div class="mode-option-icon" style="color:'+AI_MODES[m].color+'">'+AI_MODES[m].icon+'</div><div class="mode-option-label" style="color:'+AI_MODES[m].color+'">'+AI_MODES[m].label+'</div><div class="mode-option-desc">'+AI_MODES[m].desc+'</div></div>').join('')+'</div></div>';
}
function selectMode(mode,challengeId){
  APP.aiMode=mode;
  const c=CHALLENGES.find(x=>x.id===challengeId);
  launchChallenge(c);
}
function launchChallenge(c){
  APP.startTime=Date.now();
  navigate('#/challenge-active');
  const modeInfo=AI_MODES[APP.aiMode];
  const header=document.getElementById('challenge-header');
  header.innerHTML='<h2>'+c.title+'</h2><div class="challenge-header-row"><span class="active-mode-badge" style="--mode-color:'+modeInfo.color+'">'+modeInfo.icon+' '+modeInfo.label+'</span><div class="challenge-timer" id="timer">'+formatTime(c.time)+'</div></div>';
  const ws=document.getElementById('challenge-workspace');
  if(c.type==='code'){
    ws.innerHTML='<div class="challenge-prompt"><h3>Instructions</h3><p>'+c.prompt+'</p></div><div class="challenge-editor"><div class="editor-toolbar"><span class="editor-lang">JavaScript</span></div><textarea class="code-input" id="code-input">'+c.starter+'</textarea><div class="challenge-actions"><button class="btn btn-primary" id="btn-submit" onclick="this.disabled=true;submitCode()">Submit Solution</button><button class="btn btn-ghost" onclick="runTests()">Run Tests</button></div><div class="test-results" id="test-results"></div></div>';
    if(APP.aiMode==='solo'){const ci=document.getElementById('code-input');ci.addEventListener('paste',()=>{APP.pasteCount++;});}
  }else if(c.type==='quiz'){
    APP.quizIndex=0;APP.quizAnswers=[];APP.quizAnswer=undefined;
    renderQuizQuestion(c,0);
    // renderQuizQuestion handles ws.innerHTML
  }else if(c.type==='validate'){
    ws.innerHTML='<div class="challenge-prompt" style="grid-column:1/-1"><h3>Review This Code</h3><p>Find <strong>'+c.bugCount+' bug'+(c.bugCount>1?'s':'')+'</strong> in the AI-generated code below.</p><pre class="buggy-code">'+c.buggyCode.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre><div class="bug-inputs" id="bug-inputs">'+Array.from({length:c.bugCount},(_,i)=>'<div class="bug-input-group"><label>Bug '+(i+1)+'</label><textarea class="bug-input" id="bug-'+i+'" placeholder="Describe the bug and how to fix it..."></textarea></div>').join('')+'</div><div class="challenge-actions" style="margin-top:24px"><button class="btn btn-primary" onclick="submitValidate()">Submit Review</button></div></div>';
    if(APP.aiMode==='solo'){document.querySelectorAll('.bug-input').forEach(el=>el.addEventListener('paste',()=>{APP.pasteCount++;}));}
  }else if(c.type==='prompt'){
    ws.innerHTML='<div class="challenge-prompt" style="grid-column:1/-1"><h3>Write the Prompt</h3><p>'+c.scenario+'</p><div class="rubric-display"><h4>Scoring Rubric</h4><ul>'+c.rubric.map(r=>'<li>'+r+'</li>').join('')+'</ul></div><textarea class="code-input prompt-input" id="prompt-input" placeholder="Write your prompt here..."></textarea><div class="challenge-actions" style="margin-top:24px"><button class="btn btn-primary" onclick="submitPrompt()">Submit Prompt</button></div></div>';
  }else if(c.type==='stroop'){
    // ─── STROOP CHALLENGE (Selective Attention) ───
    APP.stroopRound=0;APP.stroopCorrect=0;APP.stroopTotal=c.rounds.length;
    APP.stroopTimes=[];
    renderStroopRound(c);
  }else if(c.type==='speedparse'){
    // ─── SPEED PARSE (Processing Speed) ───
    const snippet=c.snippets[Math.floor(Math.random()*c.snippets.length)];
    APP.activeSnippet=snippet;APP.speedparseAnswers=[];
    ws.innerHTML='<div class="speedparse-container" style="grid-column:1/-1"><div class="speedparse-flash-zone"><div class="speedparse-instructions"><h3>🧠 MEMORIZE THIS CODE</h3><p>You have <strong>'+Math.round(c.flashDuration/1000)+' seconds</strong>. Study every detail.</p></div><pre class="speedparse-code" id="speedparse-code">'+snippet.code.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre><div class="speedparse-timer-bar"><div class="speedparse-timer-fill" id="sp-timer-fill"></div></div></div></div>';
    // Start flash timer
    const fill=document.getElementById('sp-timer-fill');
    fill.style.transition='width '+(c.flashDuration/1000)+'s linear';
    requestAnimationFrame(()=>fill.style.width='0%');
    APP.speedparseTimer=setTimeout(()=>showSpeedParseQuestions(snippet),c.flashDuration);
  }else if(c.type==='aivalidate'){
    // ─── AI VALIDATE (Hallucination Detection - Advanced) ───
    ws.innerHTML='<div class="challenge-prompt" style="grid-column:1/-1"><div class="aivalidate-header"><h3>🤖 AI Code Review</h3><p>This code was generated by an AI assistant. It looks clean and professional. But <strong>'+c.bugCount+' bugs</strong> are hiding in it — some subtle, some dangerous.</p><p class="aivalidate-subtitle">Your job: find them all. Describe each bug and explain why it matters.</p></div><pre class="buggy-code aivalidate-code">'+c.buggyCode.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>'+(c.hint?'<div class="challenge-hint" onclick="this.classList.toggle(\'open\')">'+c.hint+'</div>':'')+'<div class="bug-inputs" id="bug-inputs">'+Array.from({length:c.bugCount},(_,i)=>'<div class="bug-input-group"><label><span class="bug-number">Bug '+(i+1)+'</span></label><textarea class="bug-input" id="bug-'+i+'" placeholder="Describe the bug: what\'s wrong, where it is, and why it matters..."></textarea></div>').join('')+'</div><div class="challenge-actions" style="margin-top:24px"><button class="btn btn-primary" onclick="submitAIValidate()">Submit Review</button></div></div>';
    if(APP.aiMode==='solo'){document.querySelectorAll('.bug-input').forEach(el=>el.addEventListener('paste',()=>{APP.pasteCount++;}));}
  }
  startTimer(c.time);
}
let timerInterval;
function startTimer(secs){
  let left=secs;clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    left--;const el=document.getElementById('timer');if(el)el.textContent=formatTime(left);
    if(left<=0){clearInterval(timerInterval);handleTimeExpiry();}
  },1000);
}
function handleTimeExpiry(){
  const c=APP.activeChallenge;if(!c)return;
  switch(c.type){
    case 'code':submitCode();break;
    case 'quiz':submitQuiz();break;
    case 'validate':submitValidate();break;
    case 'prompt':submitPrompt();break;
    case 'stroop':finishStroop();break;
    case 'speedparse':submitSpeedParse();break;
    case 'aivalidate':submitAIValidate();break;
    default:navigate('#/challenges');
  }
}
function formatTime(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function selectQuiz(el,idx){document.querySelectorAll('.quiz-option').forEach(o=>o.classList.remove('selected'));el.classList.add('selected');APP.quizAnswer=idx;}
function renderQuizQuestion(c,qIdx){
  const q=c.questions[qIdx];
  const ws=document.getElementById('challenge-workspace');
  const progress=c.questions.length>1?'<div class="stroop-progress"><div class="stroop-progress-fill" style="width:'+Math.round((qIdx/c.questions.length)*100)+'%"></div></div><div class="stroop-round-label">Question '+(qIdx+1)+' / '+c.questions.length+'</div>':'';
  ws.innerHTML='<div class="challenge-prompt" style="grid-column:1/-1">'+progress+'<h3>'+q.q+'</h3><div class="quiz-options">'+q.opts.map((o,i)=>'<div class="quiz-option" data-idx="'+i+'" onclick="selectQuiz(this,'+i+')">'+o+'</div>').join('')+'</div><div class="challenge-actions" style="margin-top:24px"><button class="btn btn-primary" id="btn-submit" onclick="this.disabled=true;advanceQuiz()">'+((qIdx<c.questions.length-1)?'Next Question':'Submit All')+'</button></div></div>';
  APP.quizAnswer=undefined;
}
function advanceQuiz(){
  const c=APP.activeChallenge;
  if(APP.quizAnswer===undefined){const btn=document.getElementById('btn-submit');if(btn)btn.disabled=false;return;}
  APP.quizAnswers[APP.quizIndex]=APP.quizAnswer;
  APP.quizIndex++;
  if(APP.quizIndex<c.questions.length){renderQuizQuestion(c,APP.quizIndex);}
  else{submitQuiz();}
}
async function submitQuiz(){
  clearInterval(timerInterval);const c=APP.activeChallenge;
  let correctCount=0;
  c.questions.forEach((q,i)=>{if(APP.quizAnswers[i]===q.answer)correctCount++;});
  const score=Math.round((correctCount/c.questions.length)*100);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,answers:APP.quizAnswers,score,time:elapsed,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(APP.pasteCount,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString()};
  APP.credentials.push(cred);saveState();showResults(cred,correctCount+'/'+c.questions.length+' correct');
}
function runTests(){
  const c=APP.activeChallenge;const code=document.getElementById('code-input').value;
  const results=document.getElementById('test-results');
  let html='';
  c.tests.forEach((t,i)=>{try{const fn=new Function('return ('+code+')('+t.input+')')();const actual=String(fn);const pass=actual===t.expected;html+='<div class="test-case '+(pass?'test-pass':'test-fail')+'">'+(pass?'✓':'✗')+' Test '+(i+1)+': f('+t.input+') = '+actual+(pass?'':' (expected '+t.expected+')')+'</div>';}catch(e){html+='<div class="test-case test-fail">✗ Test '+(i+1)+': Error - '+e.message+'</div>';}});
  results.innerHTML=html;
}
async function submitCode(){
  clearInterval(timerInterval);
  const c=APP.activeChallenge;if(!c||c.type!=='code')return;
  const codeEl=document.getElementById('code-input');if(!codeEl)return;
  const code=codeEl.value;
  let passed=0;
  c.tests.forEach(t=>{try{const fn=new Function('return ('+code+')('+t.input+')')();if(String(fn)===t.expected)passed++;}catch(e){}});
  const score=Math.round((passed/c.tests.length)*100);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,code,score,time:elapsed,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(APP.pasteCount,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString()};
  APP.credentials.push(cred);saveState();showResults(cred,passed+'/'+c.tests.length+' tests passed');
}
async function submitValidate(){
  clearInterval(timerInterval);const c=APP.activeChallenge;if(!c)return;
  const answers=Array.from({length:c.bugCount},(_,i)=>{
    const el=document.getElementById('bug-'+i);return el?el.value.trim():'';
  });
  // Match each bug to the BEST single user answer — no double counting
  const bugMatched=new Array(c.bugCount).fill(false);
  const answerUsed=new Array(c.bugCount).fill(false);
  c.bugs.forEach((bug,bi)=>{
    const keywords=bug.toLowerCase().split(/\s+/).filter(w=>w.length>3);
    let bestAi=-1,bestScore=0;
    answers.forEach((a,ai)=>{
      if(!a||answerUsed[ai])return;
      const matchCount=keywords.filter(k=>a.toLowerCase().includes(k)).length;
      const ratio=keywords.length?matchCount/keywords.length:0;
      if(ratio>bestScore){bestScore=ratio;bestAi=ai;}
    });
    if(bestScore>=0.25&&bestAi>=0){bugMatched[bi]=true;answerUsed[bestAi]=true;}
  });
  const found=bugMatched.filter(Boolean).length;
  const score=Math.round((found/c.bugCount)*100);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,answers,score,time:elapsed,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(APP.pasteCount,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString()};
  APP.credentials.push(cred);saveState();showResults(cred,found+'/'+c.bugCount+' bugs found');
}
async function submitPrompt(){
  clearInterval(timerInterval);const c=APP.activeChallenge;
  const prompt=document.getElementById('prompt-input').value.trim();
  let score=0;
  const pLower=prompt.toLowerCase();
  if(pLower.includes('input')&&pLower.includes('output')||pLower.includes('return'))score+=25;
  if(pLower.includes('edge')||pLower.includes('empty')||pLower.includes('null')||pLower.includes('array'))score+=25;
  if(pLower.includes('function')||pLower.includes('def ')||pLower.includes('signature'))score+=20;
  if(pLower.includes('example')||pLower.includes('{')&&pLower.includes('}'))score+=20;
  if(pLower.includes('constraint')||pLower.includes('no external')||pLower.includes('circular'))score+=10;
  score=Math.min(score,100);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,prompt,score,time:elapsed,aiMode:APP.aiMode,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(0,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:'native',pasteCount:0,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString()};
  APP.credentials.push(cred);saveState();showResults(cred,'Prompt scored '+score+'/100');
}
// ═══════════════════════════════════════
// STROOP CHALLENGE ENGINE
// ═══════════════════════════════════════
function renderStroopRound(c){
  const round=c.rounds[APP.stroopRound];
  const ws=document.getElementById('challenge-workspace');
  const progress=Math.round(((APP.stroopRound)/APP.stroopTotal)*100);
  ws.innerHTML='<div class="stroop-container" style="grid-column:1/-1">'+
    '<div class="stroop-progress"><div class="stroop-progress-fill" style="width:'+progress+'%"></div></div>'+
    '<div class="stroop-round-label">Round '+(APP.stroopRound+1)+' / '+APP.stroopTotal+'</div>'+
    '<div class="stroop-code-display"><pre>'+round.code.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre></div>'+
    '<div class="stroop-question">'+round.question+'</div>'+
    '<div class="stroop-options">'+round.options.map((o,i)=>
      '<button class="stroop-option" data-idx="'+i+'" onclick="pickStroop('+i+')">'+o.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</button>'
    ).join('')+'</div>'+
    '<div class="stroop-score-row"><span class="stroop-hits">✓ '+APP.stroopCorrect+'</span><span class="stroop-misses">✗ '+(APP.stroopRound-APP.stroopCorrect)+'</span></div>'+
  '</div>';
  APP.stroopRoundStart=Date.now();
}
function pickStroop(idx){
  const c=APP.activeChallenge;
  const round=c.rounds[APP.stroopRound];
  const elapsed=Date.now()-APP.stroopRoundStart;
  APP.stroopTimes.push(elapsed);
  // Flash feedback
  const btns=document.querySelectorAll('.stroop-option');
  btns.forEach(b=>b.disabled=true);
  if(idx===round.answer){
    APP.stroopCorrect++;
    btns[idx].classList.add('stroop-correct');
  }else{
    btns[idx].classList.add('stroop-wrong');
    btns[round.answer].classList.add('stroop-correct');
  }
  APP.stroopRound++;
  setTimeout(()=>{
    if(APP.stroopRound<APP.stroopTotal){
      renderStroopRound(c);
    }else{
      finishStroop();
    }
  },600);
}
async function finishStroop(){
  clearInterval(timerInterval);
  const c=APP.activeChallenge;
  const accuracy=Math.round((APP.stroopCorrect/APP.stroopTotal)*100);
  const avgTime=Math.round(APP.stroopTimes.reduce((a,b)=>a+b,0)/APP.stroopTimes.length);
  const speedBonus=avgTime<2000?20:avgTime<4000?10:0;
  const score=Math.min(100,accuracy+speedBonus);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,correct:APP.stroopCorrect,total:APP.stroopTotal,avgTime,score,aiMode:APP.aiMode,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(0,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:APP.aiMode,pasteCount:0,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString(),
    meta:{accuracy,avgReactionMs:avgTime,speedBonus,correct:APP.stroopCorrect,total:APP.stroopTotal}};
  APP.credentials.push(cred);saveState();
  showResults(cred,APP.stroopCorrect+'/'+APP.stroopTotal+' correct — avg '+avgTime+'ms');
}
// ═══════════════════════════════════════
// SPEED PARSE CHALLENGE ENGINE
// ═══════════════════════════════════════
function showSpeedParseQuestions(snippet){
  const ws=document.getElementById('challenge-workspace');
  APP.speedparseAnswers=[];
  let html='<div class="speedparse-container" style="grid-column:1/-1"><div class="speedparse-recall-header"><h3>⏱ Code Hidden — Answer From Memory</h3><p>The code is gone. Answer these questions about what you just saw.</p></div>';
  snippet.questions.forEach((q,qi)=>{
    html+='<div class="speedparse-question" data-qi="'+qi+'"><div class="speedparse-q-text">'+(qi+1)+'. '+q.q+'</div><div class="speedparse-q-options">'+
      q.opts.map((o,oi)=>'<button class="speedparse-opt" data-qi="'+qi+'" data-oi="'+oi+'" onclick="pickSpeedParse('+qi+','+oi+',this)">'+o+'</button>').join('')+
    '</div></div>';
  });
  html+='<div class="challenge-actions" style="margin-top:24px"><button class="btn btn-primary" id="sp-submit" onclick="submitSpeedParse()" disabled>Answer All Questions First</button></div></div>';
  ws.innerHTML=html;
}
function pickSpeedParse(qi,oi,el){
  // Deselect siblings
  el.parentElement.querySelectorAll('.speedparse-opt').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  APP.speedparseAnswers[qi]=oi;
  // Enable submit if all answered
  const snippet=APP.activeSnippet;
  if(APP.speedparseAnswers.filter(a=>a!==undefined).length===snippet.questions.length){
    const btn=document.getElementById('sp-submit');
    btn.disabled=false;btn.textContent='Submit Answers';
  }
}
async function submitSpeedParse(){
  clearInterval(timerInterval);
  const c=APP.activeChallenge;
  const snippet=APP.activeSnippet;
  let correct=0;
  snippet.questions.forEach((q,i)=>{if(APP.speedparseAnswers[i]===q.answer)correct++;});
  const score=Math.round((correct/snippet.questions.length)*100);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,answers:APP.speedparseAnswers,score,time:elapsed,aiMode:APP.aiMode,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(0,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:APP.aiMode,pasteCount:0,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString(),
    meta:{correct,total:snippet.questions.length,recallRate:score}};
  APP.credentials.push(cred);saveState();
  showResults(cred,correct+'/'+snippet.questions.length+' recalled correctly');
}
// ═══════════════════════════════════════
// AI VALIDATE (ADVANCED) ENGINE
// ═══════════════════════════════════════
async function submitAIValidate(){
  clearInterval(timerInterval);const c=APP.activeChallenge;if(!c)return;
  const answers=Array.from({length:c.bugCount},(_,i)=>{
    const el=document.getElementById('bug-'+i);return el?el.value.trim():'';
  });
  // Bipartite best-match: each bug matched to ONE best answer, no reuse
  const bugMatched=new Array(c.bugCount).fill(false);
  const answerUsed=new Array(c.bugCount).fill(false);
  const matchDetails=[];
  c.bugs.forEach((bug,bi)=>{
    const keywords=bug.toLowerCase().split(/\s+/).filter(w=>w.length>3);
    let bestAi=-1,bestScore=0;
    answers.forEach((a,ai)=>{
      if(!a||answerUsed[ai])return;
      const matchCount=keywords.filter(k=>a.toLowerCase().includes(k)).length;
      const ratio=keywords.length?matchCount/keywords.length:0;
      if(ratio>bestScore){bestScore=ratio;bestAi=ai;}
    });
    if(bestScore>=0.25&&bestAi>=0){
      bugMatched[bi]=true;answerUsed[bestAi]=true;
      matchDetails.push({bug:bi,answer:bestAi,confidence:bestScore});
    }
  });
  const found=bugMatched.filter(Boolean).length;
  // Quality bonus: reward detailed explanations
  const filledAnswers=answers.filter(a=>a);
  const avgLength=filledAnswers.length?filledAnswers.reduce((s,a)=>s+a.length,0)/filledAnswers.length:0;
  const detailBonus=avgLength>80?10:avgLength>40?5:0;
  const score=Math.min(100,Math.round((found/c.bugCount)*100)+detailBonus);
  const elapsed=Math.floor((Date.now()-APP.startTime)/1000);
  const hash=await sha256(JSON.stringify({id:c.id,answers,score,found,time:elapsed,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,ts:Date.now()}));
  const integrity=computeIntegrity(APP.pasteCount,APP.tabSwitchCount,APP.aiMode);
  const cred={id:hash.slice(0,16),challengeId:c.id,domain:c.domain,title:c.title,score,time:elapsed,hash,aiMode:APP.aiMode,pasteCount:APP.pasteCount,tabSwitches:APP.tabSwitchCount,integrity:integrity.label,timestamp:new Date().toISOString(),
    meta:{bugsFound:found,bugCount:c.bugCount,detailBonus,matchDetails}};
  APP.credentials.push(cred);saveState();
  showResults(cred,found+'/'+c.bugCount+' bugs found'+(detailBonus?' (+'+detailBonus+' detail bonus)':''));
}
function showResults(cred,detail){
  navigate('#/results');
  const modeInfo=AI_MODES[cred.aiMode||'solo'];
  const grade=getGrade(cred.score);
  const ch=CHALLENGES.find(c=>c.id===cred.challengeId);
  const baseXP=ch?getTierXP(ch):100;
  const timeBonus=calcTimeBonus(cred.time,ch?.time||300);
  const streak=calcStreak();
  const streakMult=Math.min(streak,5);
  const earnedXP=Math.round((baseXP*(cred.score/100)+timeBonus)*( 1 + streakMult*0.1));
  APP.xp+=earnedXP;saveState();
  showToast('\u2726 +'+earnedXP+' XP earned!','xp',2500);
  if(streak>1)showToast('\ud83d\udd25 '+streak+'x Streak!','streak',2000);
  var prevGrade=getGrade(APP.credentials.length>1?Math.round(APP.credentials.slice(0,-1).reduce(function(a,c){return a+c.score;},0)/(APP.credentials.length-1)):0);
  if(grade.min>prevGrade.min)showToast('\u2b06 RANK UP: '+grade.title+'!','rank',4000);
  const integrityInfo=computeIntegrity(cred.pasteCount||0,cred.tabSwitches||0,cred.aiMode);
  const integrityHtml=cred.aiMode==='solo'?'<div class="integrity-badge" style="border-color:'+integrityInfo.color+';color:'+integrityInfo.color+'"><span class="integrity-dot" style="background:'+integrityInfo.color+'"></span> INTEGRITY: '+integrityInfo.label+'</div>'+(((cred.pasteCount||0)+(cred.tabSwitches||0))>0?'<div class="integrity-details">'+((cred.pasteCount||0)>0?'📋 '+cred.pasteCount+' paste'+(cred.pasteCount>1?'s ':' '):'')+(cred.tabSwitches>0?'👁 '+cred.tabSwitches+' tab-switch'+(cred.tabSwitches>1?'es':''):'')+'</div>':''):'';
  // Tier badge for results
  const tierInfo=ch?getTier(ch):DIFFICULTY_TIERS.core;
  const tierBadge='<div class="results-tier-badge" style="color:'+tierInfo.color+';border-color:'+tierInfo.color+'">'+tierInfo.label+'</div>';
  const card=document.getElementById('results-card');
  card.innerHTML='<canvas id="results-particles" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0"></canvas><div style="position:relative;z-index:1"><div class="results-grade" style="--grade-color:'+grade.color+'">'+grade.label+'</div><div class="results-grade-title" style="color:'+grade.color+'">'+grade.title+'</div>'+tierBadge+'<div class="results-score">'+cred.score+'<span>%</span></div><div class="results-mode-badge" style="--mode-color:'+modeInfo.color+'">'+modeInfo.icon+' '+modeInfo.label+'</div><div class="results-label">'+detail+'</div><div class="results-xp-row"><div class="xp-earned" id="xp-counter">+0 XP</div>'+(timeBonus>0?'<div class="xp-bonus">⚡ Speed Bonus +'+timeBonus+'</div>':'')+(streak>1?'<div class="xp-streak">🔥 '+streak+'x Streak</div>':'')+' </div>'+integrityHtml+'<p style="color:var(--text-2);margin-bottom:16px">Completed in '+cred.time+'s</p><div class="results-hash"><span>SHA-256:</span> '+cred.hash+'</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center"><button class="btn btn-primary" onclick="navigate(\'#/challenges\')">More Challenges</button><button class="btn btn-ghost" onclick="navigate(\'#/dashboard\')">Dashboard</button></div></div>';
  // Animate XP counter
  let current=0;const target=earnedXP;const el=document.getElementById('xp-counter');
  const step=Math.max(1,Math.ceil(target/30));
  const anim=setInterval(()=>{current=Math.min(current+step,target);el.textContent='+'+current+' XP';if(current>=target){clearInterval(anim);el.classList.add('xp-pop');}},30);
  // Particle burst for S/A grades
  if(cred.score>=85)launchResultsParticles(grade.color);
}
// ── RESULTS PARTICLE BURST ──
function launchResultsParticles(color){
  const canvas=document.getElementById('results-particles');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  canvas.width=canvas.offsetWidth*dpr;canvas.height=canvas.offsetHeight*dpr;
  ctx.scale(dpr,dpr);
  const W=canvas.offsetWidth,H=canvas.offsetHeight;
  const particles=[];
  const colors=[color,'#C9A84C','#00ffd5','#fff'];
  for(let i=0;i<80;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=2+Math.random()*6;
    particles.push({x:W/2,y:H/2,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-2,
      size:2+Math.random()*4,color:colors[Math.floor(Math.random()*colors.length)],
      life:1,decay:0.008+Math.random()*0.012,
      shape:Math.random()>0.5?'circle':'diamond'});
  }
  let frame=0;
  function drawParticles(){
    ctx.clearRect(0,0,W,H);
    let alive=false;
    particles.forEach(p=>{
      if(p.life<=0)return;
      alive=true;
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life-=p.decay;
      ctx.globalAlpha=Math.max(0,p.life);
      ctx.fillStyle=p.color;
      if(p.shape==='circle'){
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
      }else{
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(frame*0.05+p.size);
        ctx.beginPath();ctx.moveTo(0,-p.size);ctx.lineTo(p.size,0);ctx.lineTo(0,p.size);ctx.lineTo(-p.size,0);ctx.closePath();ctx.fill();ctx.restore();
      }
    });
    ctx.globalAlpha=1;
    frame++;
    if(alive&&frame<180)requestAnimationFrame(drawParticles);
  }
  requestAnimationFrame(drawParticles);
}

function renderDashboard(){
  document.getElementById('dash-greeting').textContent='Welcome, '+(APP.user?.name||'Challenger');
  document.getElementById('dash-credentials').textContent=APP.credentials.length;
  document.getElementById('dash-completed').textContent=APP.credentials.length;
  const avg=APP.credentials.length?Math.round(APP.credentials.reduce((a,c)=>a+c.score,0)/APP.credentials.length):0;
  document.getElementById('dash-score').textContent=avg+'%';
  const domains=new Set(APP.credentials.map(c=>c.domain));
  document.getElementById('dash-domains').textContent=domains.size;
  document.getElementById('dash-xp').textContent=APP.xp||0;
  document.getElementById('dash-streak').textContent=getStreakDisplay();
  drawTrajectory();
  drawRadarChart();
  renderTierProgress();
  const list=document.getElementById('recent-credentials');
  if(APP.credentials.length){list.innerHTML=APP.credentials.slice(-5).reverse().map(c=>{const mi=AI_MODES[c.aiMode||'solo'];const g=getGrade(c.score);return '<div class="credential-card"><div class="credential-card-top"><div class="credential-domain">'+c.domain+'</div><span class="cred-mode-badge" style="--mode-color:'+mi.color+'">'+mi.icon+'</span></div><div class="credential-title">'+c.title+'</div><div class="credential-score"><span style="color:'+g.color+';font-weight:800;margin-right:6px">'+g.label+'</span>Score: '+c.score+'%</div><div class="credential-date">'+new Date(c.timestamp).toLocaleDateString()+'</div></div>';}).join('');}
}
// ── TIER PROGRESS WIDGET ──
function renderTierProgress(){
  const container=document.getElementById('tier-progress');if(!container)return;
  const tiers={probe:{total:0,done:0},core:{total:0,done:0},edge:{total:0,done:0}};
  const completedIds=new Set(APP.credentials.map(c=>c.challengeId));
  CHALLENGES.forEach(c=>{
    const tk=c.tier||'core';
    if(tiers[tk])tiers[tk].total++;
    if(completedIds.has(c.id)&&tiers[tk])tiers[tk].done++;
  });
  let html='';
  Object.keys(DIFFICULTY_TIERS).forEach(tk=>{
    const tier=DIFFICULTY_TIERS[tk];
    const t=tiers[tk];
    const pct=t.total?Math.round((t.done/t.total)*100):0;
    html+='<div class="tier-progress-row">'+
      '<div class="tier-progress-label" style="color:'+tier.color+'">'+tier.label+'</div>'+
      '<div class="tier-progress-bar"><div class="tier-progress-fill" style="width:'+pct+'%;background:'+tier.color+'"></div></div>'+
      '<div class="tier-progress-count">'+t.done+'/'+t.total+'</div>'+
    '</div>';
  });
  container.innerHTML=html;
}
function drawTrajectory(){
  const canvas=document.getElementById('trajectory-chart');if(!canvas)return;
  const ctx=canvas.getContext('2d');const w=canvas.width=canvas.parentElement.clientWidth-48;const h=canvas.height=280;
  ctx.clearRect(0,0,w,h);
  if(!APP.credentials.length){ctx.fillStyle='#65657a';ctx.font='14px Inter';ctx.textAlign='center';ctx.fillText('Complete challenges to see your trajectory',w/2,h/2);return;}
  const scores=APP.credentials.map(c=>c.score);const pad=40;const gw=w-pad*2;const gh=h-pad*2;
  ctx.strokeStyle='rgba(201,168,76,0.15)';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad+gh*(i/4);ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();}
  ctx.strokeStyle='#C9A84C';ctx.lineWidth=2;ctx.beginPath();
  scores.forEach((s,i)=>{const x=pad+(i/(Math.max(scores.length-1,1)))*gw;const y=pad+gh*(1-s/100);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  ctx.stroke();
  const grad=ctx.createLinearGradient(0,pad,0,h-pad);grad.addColorStop(0,'rgba(201,168,76,0.2)');grad.addColorStop(1,'rgba(201,168,76,0)');
  ctx.lineTo(pad+gw,pad+gh);ctx.lineTo(pad,pad+gh);ctx.fillStyle=grad;ctx.fill();
}
// ── COGNITIVE RADAR CHART (5-Axis Canvas) ──
const RADAR_AXES = [
  {key:'logic',label:'Logic',icon:'🧮',types:['code','quiz'],color:'#34d399'},
  {key:'attention',label:'Attention',icon:'👁',types:['stroop'],color:'#f59e0b'},
  {key:'speed',label:'Speed',icon:'⚡',types:['speedparse'],color:'#06b6d4'},
  {key:'validation',label:'Validation',icon:'🔍',types:['validate','aivalidate'],color:'#ef4444'},
  {key:'prompting',label:'Prompting',icon:'✏️',types:['prompt'],color:'#a78bfa'}
];
// ── Radar Cache: invalidate only on credential changes ──
APP._radarCache=null;APP._radarCacheLen=-1;
function computeRadarData(){
  if(APP._radarCache&&APP._radarCacheLen===APP.credentials.length)return APP._radarCache;
  const data={};
  RADAR_AXES.forEach(a=>{data[a.key]={total:0,count:0};});
  APP.credentials.forEach(cred=>{
    const ch=CHALLENGES.find(c=>c.id===cred.challengeId);
    if(!ch)return;
    RADAR_AXES.forEach(a=>{
      if(a.types.includes(ch.type)){data[a.key].total+=cred.score;data[a.key].count++;}
    });
  });
  APP._radarCache=RADAR_AXES.map(a=>({...a,value:data[a.key].count?Math.round(data[a.key].total/data[a.key].count):0}));
  APP._radarCacheLen=APP.credentials.length;
  return APP._radarCache;
}
function drawRadarChart(){
  const canvas=document.getElementById('radar-chart');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const rect=canvas.parentElement;
  const size=Math.min(rect.clientWidth-32,400);
  canvas.width=size*dpr;canvas.height=size*dpr;
  canvas.style.width=size+'px';canvas.style.height=size+'px';
  ctx.scale(dpr,dpr);
  const cx=size/2,cy=size/2,R=size*0.38;
  const data=computeRadarData();
  const n=data.length;
  const angleStep=(Math.PI*2)/n;
  const startAngle=-Math.PI/2; // top
  ctx.clearRect(0,0,size,size);
  // Draw concentric rings
  for(let ring=1;ring<=4;ring++){
    const r=R*(ring/4);
    ctx.beginPath();
    for(let i=0;i<=n;i++){
      const a=startAngle+i*angleStep;
      const x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba(201,168,76,'+(ring===4?0.25:0.1)+')';
    ctx.lineWidth=1;ctx.stroke();
    // Ring percentage label
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='10px Inter';ctx.textAlign='right';
    ctx.fillText((ring*25)+'%',cx-4,cy-r+12);
  }
  // Draw spokes
  for(let i=0;i<n;i++){
    const a=startAngle+i*angleStep;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
    ctx.strokeStyle='rgba(201,168,76,0.15)';ctx.lineWidth=1;ctx.stroke();
  }
  // Draw data polygon
  ctx.beginPath();
  data.forEach((d,i)=>{
    const v=Math.max(0.05,d.value/100);
    const a=startAngle+i*angleStep;
    const x=cx+R*v*Math.cos(a),y=cy+R*v*Math.sin(a);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.closePath();
  const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  grad.addColorStop(0,'rgba(201,168,76,0.35)');grad.addColorStop(1,'rgba(201,168,76,0.08)');
  ctx.fillStyle=grad;ctx.fill();
  ctx.strokeStyle='#C9A84C';ctx.lineWidth=2;ctx.stroke();
  // Draw data points + axis labels
  data.forEach((d,i)=>{
    const v=Math.max(0.05,d.value/100);
    const a=startAngle+i*angleStep;
    const px=cx+R*v*Math.cos(a),py=cy+R*v*Math.sin(a);
    // Glow dot
    ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);
    ctx.fillStyle=d.color;ctx.fill();
    ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);
    ctx.globalAlpha=0.3;ctx.fillStyle=d.color;ctx.fill();ctx.globalAlpha=1.0;
    // Label
    const lx=cx+(R+28)*Math.cos(a),ly=cy+(R+28)*Math.sin(a);
    ctx.fillStyle='#fff';ctx.font='600 12px Inter';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(d.icon+' '+d.label,lx,ly);
    // Value under label
    ctx.fillStyle=d.value>0?d.color:'#65657a';ctx.font='700 11px Inter';
    ctx.fillText(d.value>0?d.value+'%':'—',lx,ly+16);
  });
  // Populate legend
  const legend=document.getElementById('radar-legend');
  if(legend){
    legend.innerHTML=data.map(d=>'<div class="radar-legend-item"><span class="radar-dot" style="background:'+d.color+'"></span><span>'+d.label+'</span><span class="radar-val">'+(d.value>0?d.value+'%':'Not tested')+'</span></div>').join('');
  }
}
function renderProfile(){
  const pw=document.getElementById('profile-wrapper');
  if(!APP.user){
    pw.innerHTML='<div class="profile-empty"><div class="profile-empty-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg></div><h2>Create Your Profile</h2><p>Set up your identity to start earning verified credentials.</p><button class="btn btn-primary" onclick="navigate(\'#/onboard\')">⚡ Get Started</button></div>';
    return;
  }
  const domains={};APP.credentials.forEach(c=>{if(!domains[c.domain])domains[c.domain]={count:0,total:0};domains[c.domain].count++;domains[c.domain].total+=c.score;});
  const grade=getGrade(APP.credentials.length?Math.round(APP.credentials.reduce((a,c)=>a+c.score,0)/APP.credentials.length):0);
  let skills='';if(!Object.keys(domains).length){skills='<div class="profile-empty-skills"><p>Complete challenges to build your skill map.</p></div>';}
  Object.entries(domains).forEach(([d,v])=>{const avg=Math.round(v.total/v.count);const g=getGrade(avg);skills+='<div class="skill-bar-wrapper"><div class="skill-bar-header"><span>'+d+'</span><span class="skill-pct" style="color:'+g.color+'">'+avg+'%</span></div><div class="skill-bar"><div class="skill-bar-fill" style="width:'+avg+'%;background:'+g.color+'"></div></div></div>';});
  const modeBreakdown={solo:0,augmented:0,native:0};APP.credentials.forEach(c=>{const m=c.aiMode||'solo';if(modeBreakdown[m]!==undefined)modeBreakdown[m]++;});
  let modeBadges='';Object.entries(modeBreakdown).forEach(([k,v])=>{if(v>0){const mi=AI_MODES[k];modeBadges+='<span class="profile-mode-tag" style="--mode-color:'+mi.color+'">'+mi.icon+' '+v+'</span>';}});
  pw.innerHTML='<div class="profile-card"><div class="profile-card-top"><div class="profile-avatar">'+APP.user.name[0].toUpperCase()+'</div><div class="profile-identity"><div class="profile-name">'+APP.user.name+'</div><div class="profile-title">'+(APP.user.title||'Challenger')+'</div></div><div class="profile-grade-badge" style="background:'+grade.color+'">'+grade.label+'</div></div>'+(APP.user.bio?'<div class="profile-bio">'+APP.user.bio+'</div>':'')+'<div class="profile-xp-bar"><div class="profile-xp-label"><span>⭐ '+APP.xp+' XP</span><span>🔥 '+APP.streak+' day streak</span></div><div class="profile-xp-track"><div class="profile-xp-fill" style="width:'+Math.min(100,(APP.xp/1000)*100)+'%"></div></div><div class="profile-xp-milestone">Next milestone: '+(Math.ceil(APP.xp/1000)*1000)+' XP</div></div><div class="profile-stats"><div class="stat"><span class="stat-num">'+APP.credentials.length+'</span><span class="stat-label">Credentials</span></div><div class="stat"><span class="stat-num">'+Object.keys(domains).length+'</span><span class="stat-label">Domains</span></div><div class="stat"><span class="stat-num">'+grade.title+'</span><span class="stat-label">Rank</span></div></div>'+(modeBadges?'<div class="profile-modes"><span class="profile-modes-label">Modes Used</span>'+modeBadges+'</div>':'')+'</div><div class="card"><div class="card-header"><h3>Skill Map</h3></div><div class="profile-skills">'+skills+'</div></div>';
}
function renderCredentials(){
  const grid=document.getElementById('credentials-grid');
  if(!APP.credentials.length){grid.innerHTML='<div class="empty-state"><p>No credentials yet.</p></div>';return;}
  grid.innerHTML=APP.credentials.map(c=>{
    const modeInfo=AI_MODES[c.aiMode||'solo'];
    return '<div class="credential-card"><div class="credential-card-top"><div class="credential-domain">'+c.domain+'</div><span class="cred-mode-badge" style="--mode-color:'+modeInfo.color+'">'+modeInfo.icon+' '+modeInfo.label+'</span></div><div class="credential-title">'+c.title+'</div><div class="credential-score">Score: '+c.score+'%</div><div class="credential-date">'+new Date(c.timestamp).toLocaleDateString()+'</div><div class="credential-hash">'+c.hash+'</div></div>';
  }).join('');
}
// NOTE: saveState/loadState are defined at line 18-19. These duplicate definitions are REMOVED.
// The canonical versions persist: user, credentials, xp, streak, lastCompleted.
// Particles
function initParticles(){
  const c=document.getElementById('particle-canvas');if(!c)return;
  const ctx=c.getContext('2d');let pts=[];
  function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  for(let i=0;i<120;i++)pts.push({
    x:Math.random()*c.width,y:Math.random()*c.height,
    vy:-(0.1+Math.random()*0.4),vx:(Math.random()-0.5)*0.4,
    r:0.5+Math.random()*2.5,a:Math.random(),
    color: Math.random() > 0.8 ? '0,255,213' : '201,168,76'
  });
  function draw(){
    ctx.clearRect(0,0,c.width,c.height);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      p.x += Math.sin(p.y * 0.01) * 0.2; // Gentle horizontal drift
      if(p.y<-10){p.y=c.height+10;p.x=Math.random()*c.width;}
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},${p.a*0.6})`;
      if (p.r > 2) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${p.color},0.8)`;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}
// Breaking Away Matrix Grid — characters warp upward & outward from epicenter
function initGrid(){
  const c=document.getElementById('grid-canvas');if(!c)return;
  const ctx=c.getContext('2d');
  function resize(){c.width=window.innerWidth;c.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);

  const FONT_SIZE=14;
  const chars='01Xﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ1234567890ABCDEF';
  const t0=performance.now();

  let hoverCTA = false;
  let shatterTime = 0;
  let mouseX = window.innerWidth * 0.35;
  let mouseY = window.innerHeight * 0.42;

  const btn = document.getElementById('btn-get-started');
  if(btn) {
    let holdStart = 0;
    const HOLD_DURATION = 1500; // 1.5 seconds to hold
    let holding = false;
    let localHoldProgress = 0;
    const progressBar = document.getElementById('hold-progress-bar');

    btn.addEventListener('mouseenter', () => hoverCTA = true);
    btn.addEventListener('mouseleave', () => {
      hoverCTA = false;
      cancelHold();
    });

    function startHold(e) {
      if (shatterTime) return; // already shattered
      holding = true;
      btn.classList.add('holding');
      holdStart = performance.now();
      requestAnimationFrame(updateHold);
    }

    function cancelHold() {
      holding = false;
      btn.classList.remove('holding');
      localHoldProgress = 0;
      window.holdProgress = 0;
      if (progressBar) progressBar.style.width = '0%';
    }

    function updateHold(time) {
      if (!holding || shatterTime) return;
      const elapsed = time - holdStart;
      localHoldProgress = Math.min(elapsed / HOLD_DURATION, 1);
      
      if (progressBar) progressBar.style.width = (localHoldProgress * 100) + '%';
      
      // Expose to window for drawing loop
      window.holdProgress = localHoldProgress; 

      if (localHoldProgress >= 1) {
        shatterTime = performance.now();
        holding = false;
        btn.classList.remove('holding');
        setTimeout(() => {
          if(APP && APP.user) navigate('#/dashboard'); else navigate('#/onboard');
        }, 1500);
      } else {
        requestAnimationFrame(updateHold);
      }
    }

    btn.addEventListener('mousedown', startHold);
    btn.addEventListener('touchstart', startHold, {passive: true});
    
    window.addEventListener('mouseup', cancelHold);
    window.addEventListener('touchend', cancelHold);
  }

  window.addEventListener('mousemove', (e) => {
    // Only track if not shattering
    if(!shatterTime) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  });

  function draw(time){
    const t=(time-t0)/1000;
    const W=c.width, H=c.height;
    ctx.clearRect(0,0,W,H);

    // Epicenter — where the "break" radiates from (title area or mouse)
    let ex = W*0.35, ey = H*0.42;
    
    // If shattering, expand rapidly
    let shatterDist = 0;
    let isShattering = false;
    if (shatterTime > 0) {
       const st = (time - shatterTime) / 1000;
       isShattering = true;
       ex = mouseX;
       ey = mouseY;
       shatterDist = st * Math.max(W,H) * 2; // Expands very fast
    } else if (hoverCTA) {
       // Pull epicenter towards mouse smoothly
       ex += (mouseX - ex) * 0.1;
       ey += (mouseY - ey) * 0.1;
    }

    const R=Math.min(W,H)*0.8;
    // Pressure from hover and hold
    let holdIntensity = window.holdProgress || 0;
    const pressure = hoverCTA && !isShattering ? 2.5 + (holdIntensity * 5.0) + Math.sin(t*(10 + holdIntensity*20))*0.5 : 1.0; 
    const breath = (1.2+Math.sin(t*0.5)*0.3) * pressure;

    ctx.font=FONT_SIZE+'px monospace';
    ctx.textAlign='center';

    const cols=Math.ceil(W/FONT_SIZE);
    const rows=Math.ceil((H+800)/FONT_SIZE);

    for(let col=0;col<cols;col++){
      const gx=col*FONT_SIZE;
      
      const speed=8+(Math.sin(col*12.3)*3);
      const offset=Math.sin(col*88.1)*1000;
      const dropRow=((t*speed)+offset)%rows;
      
      // Every 3rd column is Gold, else Cyber Obsidian
      const isGold=(col%3===0);
      const r=isGold?201:0, g=isGold?168:255, b=isGold?76:213;

      for(let row=-50;row<rows;row++){
        const gy=row*FONT_SIZE;
        
        let distToHead=dropRow-row;
        if(distToHead<0) distToHead+=rows;
        if(distToHead>25) continue;

        const dx=gx-ex, dy=gy-ey;
        const dist=Math.sqrt(dx*dx+dy*dy);
        
        // Shatter clearing
        if (isShattering && dist < shatterDist) continue; // Clear canvas from epicenter
        
        // Grid density adjustment: Lighter at center, denser at edges
        const densityFactor = dist / (W/2);
        // Skip some characters near center to make it lighter
        if (!isShattering && densityFactor < 0.5) {
           const skipProb = (0.5 - densityFactor) * 1.5;
           const hash = Math.sin(gx*12.9898+gy*78.233)*43758.5453;
           if ((hash-Math.floor(hash)) < skipProb) continue;
        }

        const f=Math.max(0,1-dist/R);
        const f3=f*f*f;

        const dirX=dx/(dist+1);
        const pullX=dirX*f3*120*breath; 
        const pullY=-f3*150*breath;    
        
        const driftX=Math.sin(t*1.5+gy*0.02)*f3*40;
        
        // Glitch effect on hover
        let glitchX = 0;
        let glitchY = 0;
        if (hoverCTA && f > 0.3 && !isShattering) {
           let glitchInt = 15 + (holdIntensity * 40);
           glitchX = (Math.random()-0.5) * glitchInt * f;
           glitchY = (Math.random()-0.5) * glitchInt * f;
        }

        const px=gx+pullX+driftX+glitchX;
        const py=gy+pullY+glitchY;

        // Breakaway tearing
        if(f>0.4){
           const hash=Math.sin(gx*78.233+gy*12.9898)*43758.5453;
           const baseTear = (f - 0.4) * 1.6;
           // If hovering/holding, increase tearing significantly
           const tearProb = hoverCTA ? baseTear * (1.5 + holdIntensity * 3.0) : baseTear;
           if((hash-Math.floor(hash)) < tearProb) continue;
        }

        const tailAlpha=1-(distToHead/25);
        const alpha=tailAlpha*(1-Math.max(0,f-0.8)*3)*0.8;
        if(alpha<=0.01) continue;

        const charHash=Math.floor(t*10+row*13.1+col*7.7)%chars.length;
        const char=chars[Math.abs(charHash)];

        if(distToHead<1.5){
          ctx.fillStyle=`rgba(255,255,255,${alpha})`;
          ctx.shadowBlur=8;
          ctx.shadowColor=`rgba(${r},${g},${b},0.9)`;
        }else{
          ctx.fillStyle=`rgba(${r},${g},${b},${alpha*0.7})`;
          ctx.shadowBlur=0;
        }
        ctx.fillText(char,px,py);
      }
    }

    // ── SHED DEBRIS — tiny fragments that have "broken off" and drift upward ──
    for(let i=0;i<80;i++){
      const hx=Math.sin(i*127.1+3.7)*43758.5453;
      const hy=Math.sin(i*269.5+7.3)*43758.5453;
      const bx=(hx-Math.floor(hx))*W;
      const by=(hy-Math.floor(hy))*H;
      const dd=Math.sqrt((bx-ex)**2+(by-ey)**2);
      if(dd>R*0.7)continue;
      
      const speed=6+((i*7)%11)*2;
      let x=bx+Math.sin(t*0.2+i*1.7)*15;
      let y=(by-t*speed)%(H+40);
      if(y<-20)y+=H+40;
      
      const a=(0.12+Math.sin(t*0.6+i)*0.06)*Math.max(0.2,1-dd/(R*0.7));
      ctx.fillStyle=i%3===0?`rgba(0,255,213,${a})`:`rgba(201,168,76,${a})`;
      ctx.font='12px monospace';
      ctx.shadowBlur=0;
      ctx.fillText(chars[Math.floor(t*5+i)%chars.length],x,y);
    }

    // ── Subtle glow at the break epicenter ──
    const grd=ctx.createRadialGradient(ex,ey-40,0,ex,ey,R*0.45);
    // Pulse the glow if hoverCTA
    const pulseGlow = hoverCTA && !isShattering ? 0.15 + Math.sin(t*10)*0.05 : 0.08;
    grd.addColorStop(0,`rgba(201,168,76,${pulseGlow})`);
    grd.addColorStop(0.5,`rgba(0,255,213,${pulseGlow/2})`);
    grd.addColorStop(1,'transparent');
    ctx.fillStyle=grd;
    ctx.fillRect(0,0,W,H);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
// Init
document.addEventListener('DOMContentLoaded',()=>{
  loadState();initParticles();initGrid();
  document.getElementById('stat-challenges').textContent=CHALLENGES.length;
  document.getElementById('stat-domains').textContent=DOMAINS.length;
  document.getElementById('stat-verified').textContent=APP.credentials.length;
  document.getElementById('btn-get-started').addEventListener('click',()=>{
    if(APP.user)navigate('#/dashboard');else navigate('#/onboard');
  });
  document.getElementById('btn-learn-more').addEventListener('click',()=>{document.getElementById('how-it-works').scrollIntoView({behavior:'smooth'});});
  // Domain chips
  const chips=document.getElementById('domain-chips');
  DOMAINS.forEach(d=>{const el=document.createElement('div');el.className='domain-chip';el.textContent=d;el.onclick=()=>el.classList.toggle('selected');chips.appendChild(el);});
  document.getElementById('onboard-form').addEventListener('submit',e=>{
    e.preventDefault();APP.user={name:document.getElementById('onboard-name').value,title:document.getElementById('onboard-title').value,bio:document.getElementById('onboard-bio').value};saveState();navigate('#/dashboard');
  });
  if(APP.user&&APP.user.name&&APP.user.name.length>0){document.getElementById('nav-avatar').textContent=APP.user.name[0].toUpperCase();}
  // ── Keyboard Shortcuts ──
  document.addEventListener('keydown',function(e){
    // Ctrl+Enter: submit code or prompt
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
      var codeBtn=document.querySelector('.challenge-active [onclick*="submitCode"]');
      var promptBtn=document.querySelector('.challenge-active [onclick*="submitPrompt"]');
      if(codeBtn){codeBtn.click();e.preventDefault();}
      else if(promptBtn){promptBtn.click();e.preventDefault();}
    }
    // Escape: return to challenges
    if(e.key==='Escape'&&APP.view==='challenge'){
      navigate('#/challenges');e.preventDefault();
    }
    // Number keys 1-4 for quiz/stroop answer selection
    if(APP.view==='challenge'&&e.key>='1'&&e.key<='4'){
      var opts=document.querySelectorAll('.quiz-option,.stroop-option');
      var idx=parseInt(e.key)-1;
      if(opts.length>idx&&opts[idx]){opts[idx].click();}
    }
  });
  window.addEventListener('hashchange',()=>navigate(location.hash));
  navigate(location.hash||'#/');
});
