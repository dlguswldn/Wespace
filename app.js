const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const state = {
  current: 'home',
  history: [],
  scanTimer: null,
  selectedPost: 0,
  themeIndex: 0,
  furniture: [
    {id:1,name:'온유 소파',category:'소파',price:1290000,w:210,d:90,h:76,tags:'따뜻한, 미니멀, 거실',type:'sofa',color:'#CDBFAE'},
    {id:2,name:'물결 우드 테이블',category:'테이블',price:490000,w:110,d:70,h:38,tags:'내추럴, 거실, 원목',type:'table',color:'#AE7F57'},
    {id:3,name:'여백 선반장',category:'수납',price:890000,w:120,d:35,h:180,tags:'미니멀, 수납, 거실',type:'storage',color:'#9C8064'},
    {id:4,name:'선율 체어',category:'의자',price:320000,w:55,d:55,h:78,tags:'다이닝, 공부, 원목',type:'chair',color:'#B79573'},
    {id:5,name:'모아 모듈 수납장',category:'수납',price:640000,w:160,d:38,h:82,tags:'모듈, 수납, 거실',type:'storage',color:'#7D8C80'},
    {id:6,name:'쉼 라운지 체어',category:'의자',price:580000,w:72,d:82,h:76,tags:'휴식, 침실, 거실',type:'chair',color:'#BBA78D'}
  ],
  placed: [
    {id:'base-sofa',kind:'sofa',x:-1.45,z:3.65,w:2.2,d:.82,h:.72,color:'#CBBBA7'},
    {id:'base-table',kind:'table',x:.45,z:3.12,w:1.05,d:.68,h:.38,color:'#A97B52'},
    {id:'base-storage',kind:'storage',x:2.35,z:4.35,w:.5,d:.32,h:1.7,color:'#806D5D'}
  ],
  camera:{x:0,y:1.6,z:.6,yaw:0},
  roomColorIndex:0,
  lightIndex:0,
};

const screenMeta = {
  home:{nav:'home',back:false}, community:{nav:'community',back:false}, furniture:{nav:'furniture',back:false}, experts:{nav:'experts',back:false}, my:{nav:'my',back:false},
  register:{nav:'home',back:true}, scan:{nav:'home',back:true}, preferences:{nav:'home',back:true}, generating:{nav:null,back:false}, studio:{nav:'home',back:true}
};

function goTo(name, opts={}){
  if (!$('#screen-'+name)) return;
  if (!opts.replace && state.current !== name) state.history.push(state.current);
  state.current = name;
  $$('.screen').forEach(s=>s.classList.toggle('active', s.id === 'screen-'+name));
  const meta = screenMeta[name] || {};
  $$('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.nav === meta.nav));
  $('#backBtn').classList.toggle('hidden', !meta.back);
  const minimal = name === 'generating';
  $('#topbar').style.display = minimal ? 'none' : '';
  $('#bottomNav').style.display = minimal ? 'none' : '';
  $('#screens').scrollTop = 0;
  window.scrollTo(0,0);
  if(name==='studio') setTimeout(()=>{resizeCanvas(); drawRoom(); renderStudioFurniture();},50);
  if(name==='furniture') renderFurniture();
  if(name==='community') renderCommunity();
  if(name==='experts') renderExperts();
}

$$('[data-go]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();goTo(el.dataset.go)}));
$('#backBtn').addEventListener('click',()=>{
  const prev = state.history.pop() || 'home';
  goTo(prev,{replace:true});
});

setTimeout(()=>$('#splash').classList.add('hide'),1200);

// Photo upload
$('#roomPhoto').addEventListener('change', e=>{
  const file=e.target.files?.[0]; if(!file) return;
  const url=URL.createObjectURL(file);
  $('#photoPreview').src=url; $('#photoPreviewWrap').classList.remove('hidden');
});
$('#removePhoto').addEventListener('click',()=>{ $('#roomPhoto').value=''; $('#photoPreviewWrap').classList.add('hidden'); });
$('#focusDimensions').addEventListener('click',()=>$('#dimensionForm').scrollIntoView({behavior:'smooth',block:'center'}));
$('#unknownDimensions').addEventListener('change',e=>{
  $$('#dimensionForm input[type=number]').forEach(i=>{i.disabled=e.target.checked;if(e.target.checked)i.value='';});
});

// Scan simulation
$('#startScan').addEventListener('click',()=>{
  clearInterval(state.scanTimer);
  let p=0; $('#startScan').disabled=true; $('#startScan').textContent='스캔 중...'; $('#finishScan').classList.add('hidden');
  $('#scanStatus').textContent='공간 인식 중'; $('#scanPercent').textContent='0%';
  state.scanTimer=setInterval(()=>{
    p += Math.ceil(Math.random()*8);
    if(p>=100){p=100;clearInterval(state.scanTimer);$('#scanStatus').textContent='공간 인식 완료';$('#finishScan').classList.remove('hidden');$('#startScan').textContent='다시 스캔';$('#startScan').disabled=false;}
    $('#scanPercent').textContent=p+'%';
  },180);
});

// Selection UI
$$('[data-single]').forEach(group=>{
  group.addEventListener('click',e=>{
    const target=e.target.closest('button'); if(!target) return;
    $$('button',group).forEach(b=>b.classList.remove('active')); target.classList.add('active');
  });
});
$$('.color-row').forEach(group=>group.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',group).forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
$('#keepFurnitureBtn').addEventListener('click',()=>{const b=$('#keepFurnitureBtn');b.textContent=b.textContent.includes('선택하기')?'소파 · 식물 유지':'가구 선택하기'});
$('#removeFurnitureBtn').addEventListener('click',()=>{const b=$('#removeFurnitureBtn');b.textContent=b.textContent.includes('선택하기')?'큰 수납장 제거':'가구 선택하기'});

$('#generateDesign').addEventListener('click',()=>{
  goTo('generating'); let p=0; const bar=$('#generationProgress'), t=$('#generationText');
  const msgs=[[18,'공간 구조를 분석하는 중...'],[42,'선호 스타일과 동선을 조합하는 중...'],[68,'WeSpace 가구를 매칭하는 중...'],[88,'3D 공간을 렌더링하는 중...'],[100,'공간이 준비되었습니다.']];
  bar.style.width='0%'; let idx=0;
  const timer=setInterval(()=>{p+=4;bar.style.width=p+'%'; if(idx<msgs.length && p>=msgs[idx][0]){t.textContent=msgs[idx][1];idx++;}if(p>=100){clearInterval(timer);setTimeout(()=>goTo('studio'),450)}},140);
});

// 3D room canvas
const canvas=$('#roomCanvas'), ctx=canvas.getContext('2d');
function resizeCanvas(){
  const rect=canvas.getBoundingClientRect(); const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.max(600,Math.floor(rect.width*dpr)); canvas.height=Math.max(420,Math.floor(rect.height*dpr));
}
window.addEventListener('resize',()=>{if(state.current==='studio'){resizeCanvas();drawRoom();}});

function project(p){
  const c=state.camera, dx=p.x-c.x, dy=p.y-c.y, dz=p.z-c.z;
  const co=Math.cos(c.yaw), si=Math.sin(c.yaw);
  const lx=co*dx - si*dz, lz=si*dx + co*dz;
  if(lz<=.08)return null;
  const f=canvas.width*.83, cx=canvas.width/2, cy=canvas.height*.52;
  return {x:cx + lx*f/lz, y:cy - dy*f/lz, z:lz};
}
function poly(points, fill, stroke='rgba(55,61,57,.25)', lw=1){
  const ps=points.map(project); if(ps.some(p=>!p))return; ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);ps.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();
}
function line(a,b,stroke='#6e746e',lw=1){const pa=project(a),pb=project(b);if(!pa||!pb)return;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}
function shade(hex,amt){
  const c=hex.replace('#',''); const n=parseInt(c.length===3?c.split('').map(x=>x+x).join(''):c,16);
  const r=Math.max(0,Math.min(255,(n>>16)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));
  return `rgb(${r},${g},${b})`;
}
function drawBox(o){
  const x=o.x,z=o.z,w=o.w,d=o.d,h=o.h,y=0; const c=o.color||'#B9A58C';
  const p={
    a:{x:x-w/2,y,z:z-d/2},b:{x:x+w/2,y,z:z-d/2},c:{x:x+w/2,y,z:z+d/2},d:{x:x-w/2,y,z:z+d/2},
    A:{x:x-w/2,y:h,z:z-d/2},B:{x:x+w/2,y:h,z:z-d/2},C:{x:x+w/2,y:h,z:z+d/2},D:{x:x-w/2,y:h,z:z+d/2}
  };
  // crude back-to-front faces
  poly([p.a,p.b,p.B,p.A],shade(c,-18));
  poly([p.b,p.c,p.C,p.B],shade(c,-7));
  poly([p.d,p.a,p.A,p.D],shade(c,-4));
  poly([p.A,p.B,p.C,p.D],shade(c,14));
  if(o.kind==='sofa'){
    const back={x,z:z+d*.28,w,h:.62,d:.16,color:shade(c,8),kind:'detail'}; drawSimpleBox(back,.25);
    drawSimpleBox({x:x-w*.32,z:z-d*.1,w:w*.16,h:.25,d:d*.75,color:shade(c,5)},.2);
    drawSimpleBox({x:x+w*.32,z:z-d*.1,w:w*.16,h:.25,d:d*.75,color:shade(c,5)},.2);
  } else if(o.kind==='table'){
    drawSimpleBox({x,z,w:w*.92,d:d*.9,h:.12,color:c},h-.12);
  }
}
function drawSimpleBox(o,baseY=0){
  const x=o.x,z=o.z,w=o.w,d=o.d,h=o.h,y=baseY,c=o.color||'#B9A58C';
  const pts={a:{x:x-w/2,y,z:z-d/2},b:{x:x+w/2,y,z:z-d/2},c:{x:x+w/2,y,z:z+d/2},d:{x:x-w/2,y,z:z+d/2},A:{x:x-w/2,y:y+h,z:z-d/2},B:{x:x+w/2,y:y+h,z:z-d/2},C:{x:x+w/2,y:y+h,z:z+d/2},D:{x:x-w/2,y:y+h,z:z+d/2}};
  poly([pts.a,pts.b,pts.B,pts.A],shade(c,-14));poly([pts.b,pts.c,pts.C,pts.B],shade(c,-5));poly([pts.A,pts.B,pts.C,pts.D],shade(c,12));
}
const wallPalettes=[['#E8DFD4','#DED3C6','#C9B89F'],['#E8E6DE','#D9D8D2','#BBB9B0'],['#DCE3DB','#CDD7CD','#A9B8AA']];
function drawRoom(){
  if(!canvas.width)return; const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H);
  const [back,left,floor]=wallPalettes[state.roomColorIndex%wallPalettes.length];
  // background
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,shade(back,state.lightIndex*8)); g.addColorStop(1,shade(floor,state.lightIndex*5)); ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // room planes x +/-3, z .1..5.4, height 3
  poly([{x:-3,y:0,z:5.4},{x:3,y:0,z:5.4},{x:3,y:3,z:5.4},{x:-3,y:3,z:5.4}],shade(back,state.lightIndex*8));
  poly([{x:-3,y:0,z:.1},{x:-3,y:0,z:5.4},{x:-3,y:3,z:5.4},{x:-3,y:3,z:.1}],shade(left,-4+state.lightIndex*6));
  poly([{x:3,y:0,z:5.4},{x:3,y:0,z:.1},{x:3,y:3,z:.1},{x:3,y:3,z:5.4}],shade(back,-10+state.lightIndex*6));
  poly([{x:-3,y:0,z:.1},{x:3,y:0,z:.1},{x:3,y:0,z:5.4},{x:-3,y:0,z:5.4}],shade(floor,state.lightIndex*4));
  // window on back wall
  const wx=-.25,ww=1.6,wy=.9,wh=1.45,z=5.37;
  poly([{x:wx-ww/2,y:wy,z},{x:wx+ww/2,y:wy,z},{x:wx+ww/2,y:wy+wh,z},{x:wx-ww/2,y:wy+wh,z}], state.lightIndex? '#DDEAF1':'#C9DDE2','#F4F0E9',3);
  line({x:wx,y:wy,z:5.35},{x:wx,y:wy+wh,z:5.35},'#F5F0E8',3); line({x:wx-ww/2,y:wy+wh*.48,z:5.35},{x:wx+ww/2,y:wy+wh*.48,z:5.35},'#F5F0E8',3);
  // rug
  poly([{x:-1.9,y:.01,z:2.25},{x:1.25,y:.01,z:2.25},{x:1.25,y:.01,z:4.25},{x:-1.9,y:.01,z:4.25}], '#D8CEC0','rgba(0,0,0,.05)');
  const sorted=[...state.placed].sort((a,b)=>b.z-a.z); sorted.forEach(drawBox);
  // floor guide very subtle
  for(let z1=1;z1<5.4;z1+=.75) line({x:-3,y:.005,z:z1},{x:3,y:.005,z:z1},'rgba(92,79,62,.08)',1);
  // top instruction
  ctx.fillStyle='rgba(28,32,30,.55)';ctx.font=`${Math.max(13,Math.round(W/52))}px sans-serif`;ctx.fillText('W/S 이동 · A/D 회전',18,H-18);
}
function move(action){
  const c=state.camera, speed=.28;
  if(action==='left')c.yaw-=.14; if(action==='right')c.yaw+=.14;
  if(action==='forward'||action==='back'){
    const dir=action==='forward'?1:-1; c.x += Math.sin(c.yaw)*speed*dir; c.z += Math.cos(c.yaw)*speed*dir;
    c.x=Math.max(-2.4,Math.min(2.4,c.x)); c.z=Math.max(.35,Math.min(4.75,c.z));
  }
  drawRoom();
}
$$('[data-move]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.move)));
window.addEventListener('keydown',e=>{if(state.current!=='studio')return; const k=e.key.toLowerCase(); if(k==='w'||e.key==='ArrowUp')move('forward'); if(k==='s'||e.key==='ArrowDown')move('back'); if(k==='a'||e.key==='ArrowLeft')move('left'); if(k==='d'||e.key==='ArrowRight')move('right');});
$('#resetCamera').addEventListener('click',()=>{state.camera={x:0,y:1.6,z:.6,yaw:0};drawRoom();});
$('#wallTone').addEventListener('click',()=>{state.roomColorIndex=(state.roomColorIndex+1)%wallPalettes.length;drawRoom();});
$('#lighting').addEventListener('click',()=>{state.lightIndex=(state.lightIndex+1)%3;drawRoom();});
$('#beforeBtn').addEventListener('click',()=>{$('#beforeBtn').classList.add('active');$('#afterBtn').classList.remove('active');state.placed=state.placed.filter(x=>x.id?.startsWith('base'));state.roomColorIndex=1;drawRoom();});
$('#afterBtn').addEventListener('click',()=>{$('#afterBtn').classList.add('active');$('#beforeBtn').classList.remove('active');state.roomColorIndex=0;drawRoom();});
$('#canvasHelp').addEventListener('click',()=>$('#walkHelpModal').showModal());

function formatPrice(v){return '₩ '+Number(v).toLocaleString('ko-KR');}
function furnitureCard(item,studio=false){
  return `<article class="furniture-card" data-id="${item.id}"><span class="furniture-badge">WeSpace Original</span><div class="furniture-thumb ${item.type}"></div><div class="furniture-info"><strong>${item.name}</strong><span class="price">${formatPrice(item.price)}</span><small>${item.w}×${item.d}×${item.h}cm · ${item.category}</small><button class="place-furniture">${studio?'3D 공간에 배치':'3D로 배치해보기'}</button></div></article>`;
}
function renderStudioFurniture(){
  $('#studioFurniture').innerHTML=state.furniture.slice(0,6).map(x=>furnitureCard(x,true)).join('');
  $$('.place-furniture',$('#studioFurniture')).forEach(btn=>btn.addEventListener('click',()=>{
    const item=state.furniture.find(f=>String(f.id)===btn.closest('.furniture-card').dataset.id); placeFurniture(item); btn.textContent='배치 완료 ✓';
  }));
}
function placeFurniture(item){
  const slot=state.placed.length; const positions=[[-1.6,2.1],[1.55,2.2],[-1.8,4.6],[1.8,4.3],[.2,2.5]]; const [x,z]=positions[slot%positions.length];
  state.placed.push({id:'custom-'+Date.now(),kind:item.type,x,z,w:Math.min(2.3,item.w/100),d:Math.min(1.2,item.d/100),h:Math.min(1.9,item.h/100),color:item.color||'#B89F82'}); drawRoom();
}

function renderFurniture(filter=''){
  const q=$('#furnitureSearch').value.trim().toLowerCase(); let list=state.furniture;
  if(filter && filter!=='전체') list=list.filter(x=>x.category===filter);
  if(q) list=list.filter(x=>(x.name+x.category+x.tags).toLowerCase().includes(q));
  $('#furnitureGrid').innerHTML=list.map(x=>furnitureCard(x,false)).join('') || '<p class="muted">검색 결과가 없습니다.</p>';
  $$('.place-furniture',$('#furnitureGrid')).forEach(btn=>btn.addEventListener('click',()=>{const item=state.furniture.find(f=>String(f.id)===btn.closest('.furniture-card').dataset.id);placeFurniture(item);goTo('studio');}));
}
$('#furnitureSearch').addEventListener('input',()=>renderFurniture(currentFurnitureCategory));
let currentFurnitureCategory='전체';
$$('.category-row button').forEach(btn=>btn.addEventListener('click',()=>{$$('.category-row button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentFurnitureCategory=btn.textContent.trim();renderFurniture(currentFurnitureCategory);}));

$('#addFurnitureBtn').addEventListener('click',()=>$('#furnitureModal').showModal());
$('#furnitureForm').addEventListener('submit',e=>{
  e.preventDefault();
  const category=$('#newFurnitureCategory').value; const type=category==='소파'?'sofa':category==='테이블'?'table':category==='수납'?'storage':'chair';
  state.furniture.push({id:Date.now(),name:$('#newFurnitureName').value.trim(),category,price:+$('#newFurniturePrice').value,w:+$('#newFurnitureW').value,d:+$('#newFurnitureD').value,h:+$('#newFurnitureH').value,tags:$('#newFurnitureTags').value,type,color:['#B8A084','#A87D58','#879286','#C3A680'][Math.floor(Math.random()*4)]});
  $('#furnitureModal').close(); e.target.reset(); renderFurniture(currentFurnitureCategory); renderStudioFurniture();
});

// Community
const posts=[
  {id:1,user:'민서',initial:'M',title:'소파는 유지하고, 거실을 더 넓어 보이게 하고 싶어요',text:'TV장을 없애고 낮은 수납으로 바꿀지 고민 중이에요. 따뜻한 분위기는 그대로 유지하고 싶습니다.',class:'room-a',label:'공간 고민',likes:128,saves:46,suggestions:[{tag:'배치',text:'소파를 벽에서 조금 띄우고 원형 테이블을 쓰면 중앙 동선이 더 자연스러울 것 같아요.',user:'space_lvr'}]},
  {id:2,user:'지우',initial:'J',title:'학교 휴게공간 Before & After',text:'친구들이 짧게 쉬면서 대화할 수 있도록 이동식 가구와 낮은 파티션을 배치했어요.',class:'room-b',label:'Before & After',likes:286,saves:91,suggestions:[{tag:'조명',text:'창가 쪽에는 자연광을 살리고 안쪽에 간접조명을 추가하면 시간대별 분위기가 좋아질 것 같아요.',user:'moodmaker'}]}
];
function renderCommunity(){
  $('#communityFeed').innerHTML=posts.map((p,i)=>`<article class="post-card" data-post="${i}"><div class="post-head"><div class="post-avatar">${p.initial}</div><div><b>${p.user}</b><span>2시간 전 · 거실</span></div><button class="post-more">···</button></div><div class="post-image ${p.class}"><span class="before-after-label">${p.label}</span></div><div class="post-body"><h3>${p.title}</h3><p>${p.text}</p></div><div class="post-actions"><button class="like-btn">♡ 좋아요 ${p.likes}</button><button>⌑ 저장 ${p.saves}</button><button class="primary-feedback suggestion-btn">＋ 공간 제안</button></div><div class="suggestions">${p.suggestions.map(s=>`<div class="suggestion-box"><b>${s.tag} 제안</b>${s.text}<small>@${s.user} · 도움됐어요 ♡ 12</small></div>`).join('')}</div><div class="comment-row"><input placeholder="댓글로 가볍게 이야기해보세요"/><button class="comment-btn">등록</button></div></article>`).join('');
  $$('.suggestion-btn').forEach(btn=>btn.addEventListener('click',()=>{state.selectedPost=+btn.closest('.post-card').dataset.post;$('#suggestionModal').showModal();}));
  $$('.like-btn').forEach(btn=>btn.addEventListener('click',()=>{const i=+btn.closest('.post-card').dataset.post;posts[i].likes++;btn.textContent='♥ 좋아요 '+posts[i].likes;btn.style.color='#3E5C50';}));
  $$('.comment-btn').forEach(btn=>btn.addEventListener('click',()=>{const input=btn.previousElementSibling;if(!input.value.trim())return; const box=document.createElement('div');box.className='suggestion-box';box.innerHTML=`<b>댓글</b>${escapeHtml(input.value)}<small>@나 · 방금 전</small>`;btn.closest('.post-card').querySelector('.suggestions').appendChild(box);input.value='';}));
}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
$('#suggestionTags').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',$('#suggestionTags')).forEach(x=>x.classList.remove('active'));b.classList.add('active');});
$('#suggestionForm').addEventListener('submit',e=>{e.preventDefault();const text=$('#suggestionText').value.trim();if(!text)return;const tag=$('#suggestionTags .active').textContent;posts[state.selectedPost].suggestions.unshift({tag,text,user:'나'});$('#suggestionModal').close();$('#suggestionText').value='';renderCommunity();});
$('#newPostBtn').addEventListener('click',()=>alert('프로토타입: 실제 서비스에서는 사진/3D 시안 업로드 → 공간 고민 작성 → 공개 범위 설정 순으로 게시물을 작성합니다.'));

// Experts
const experts=[
  {name:'김하린',initial:'H',role:'인테리어 디자이너',desc:'주거 공간 · 소형 평수 · 따뜻한 미니멀',tags:['거실','침실','리모델링']},
  {name:'박도윤',initial:'D',role:'공간 디자이너',desc:'학교 · 커뮤니티 공간 · 사용자 동선 설계',tags:['공공공간','학교','동선']},
  {name:'서유진',initial:'Y',role:'정리수납 전문가',desc:'수납 개선 · 생활 동선 · 작은 공간 활용',tags:['수납','주방','작은집']},
  {name:'이선우',initial:'S',role:'조명 컨설턴트',desc:'주거 조명 · 간접조명 · 색온도 계획',tags:['조명','분위기','거실']}
];
function renderExperts(){
  $('#expertList').innerHTML=experts.map((x,i)=>`<article class="expert-card"><div class="expert-photo">${x.initial}</div><div class="expert-main"><span class="role">${x.role}</span><h3>${x.name} 전문가</h3><p>${x.desc}</p><div class="expert-tags">${x.tags.map(t=>`<span>${t}</span>`).join('')}</div></div><button data-expert="${i}">상담하기</button></article>`).join('');
  $$('[data-expert]').forEach(b=>b.addEventListener('click',()=>{$('#chatExpertName').textContent=experts[+b.dataset.expert].name+' 전문가';$('#chatModal').showModal();}));
}
$('#sendChat').addEventListener('click',()=>{const input=$('#chatInput');if(!input.value.trim())return;const d=document.createElement('div');d.className='bubble me';d.textContent=input.value;$('#chatLog').appendChild(d);input.value='';$('#chatLog').scrollTop=$('#chatLog').scrollHeight;setTimeout(()=>{const r=document.createElement('div');r.className='bubble expert';r.textContent='좋습니다. 현재 3D 시안을 기준으로 공간을 덜 답답하게 보이게 하는 대안을 정리해볼게요.';$('#chatLog').appendChild(r);$('#chatLog').scrollTop=$('#chatLog').scrollHeight;},500)});

// Filter rows visual only
$$('.feed-tabs button,.expert-types button,.filter-row button').forEach(b=>b.addEventListener('click',()=>{const p=b.parentElement;$$('button',p).forEach(x=>x.classList.remove('active'));b.classList.add('active');}));

// Service worker registration
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

// initial content
renderFurniture(); renderStudioFurniture(); renderCommunity(); renderExperts();
