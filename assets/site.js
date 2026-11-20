// Live wiring switches on only on the real domain. Previews (localhost, file) stay in demo mode and send nothing.
const LIVE=/(^|\.)renaissancestudio\.io$/.test(location.hostname);
const CONFIG = {
  PAYMENT_URL: LIVE ? 'https://buy.stripe.com/bJe00j5rj5IA9D1cH99MY00' : 'checkout.html',
  LEAD_ENDPOINT: LIVE ? 'https://renaissance-studio-leads.renaissance-84e.workers.dev/lead' : '',   // AIM-websites: concept requests, contact, checkout_started
  INTAKE_ENDPOINT: LIVE ? 'https://studio-orders.157.245.91.169.sslip.io/intake' : '',              // studio-orders (Brian): multipart "json" + "files"
  CONTACT_EMAIL: 'james@renaissancestudio.io',
};
/*
 Load with defer. [data-menu] controls nav by aria-controls. [data-email] = mail link.
 form[data-generator]: business, industry, city; nearest .app contains .device, [data-url], [data-log].
 [data-viewer]: [data-sample=slug], [data-width=desktop|phone], [data-open], [data-title],
 [data-brief], [data-url], .device>.viewport>iframe. All frames use .viewport.
 form[data-concept|data-intake]: [data-step] in order; [data-back], [data-next] (button),
 [data-submit] (submit), progress, [data-count], [data-error]. Steps have focusable headings
 or fields. Concept field names match payload below. select[name=industry|state] auto-filled.
 Sibling [data-designing], [data-reveal] (device, [data-url], [data-business], [data-contact],
 [data-cycle], [data-buy]); dialog[data-host-dialog] with hosting radios, [data-builder],
 [data-checkout], [data-close], [data-error]. [data-demo-pay] on checkout.
 Intake: named fields, image file inputs logo/photos, [data-files=logo|photos], hosting
 radios (hostinger|other|wordpress|files), [data-instruction=value], [data-review],
 required confirmation checkbox. Sibling [data-done]. Contact form[data-contact-form]
 with firstName/business/contact/message/website, [data-error], sibling [data-success].
 [data-business] and [data-contact] are text output only. FAQ uses native details.
*/
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const samples={
    tidewater:['Tidewater Exterior Wash','Fort Myers, FL','Pressure washing and soft washing','Coastal, crisp and confident','Barlow Condensed 700 / Source Sans 3','#0E4F5C #FFFFFF #E7D3A8','pressure washing|cleaning|landscaping & lawn|pool service|pest control|moving|auto detailing'],
    marisol:['Marisol Bakehouse','San Antonio, TX','Mexican bakery and cafe','Warm, joyful, editorial food brand','Fraunces 600 / Outfit','#C2552F #F2B8A2 #2B1A14 #FBF4EC','restaurant|bakery & cafe|food truck & catering|retail & boutique|event venue'],
    halden:['Halden Roofing Co.','Charlotte, NC','Residential roofing','Trustworthy, solid, premium trade brand','Archivo 800 / Public Sans','#1F2326 #B5652B #E9E6E1','roofing|construction & remodeling|painting|handyman|plumbing|electrical|tree service|real estate'],
    northline:['Northline Heating & Air','Denver, CO','HVAC installation and repair','Modern, clean, technical but friendly','Manrope 800 / Manrope','#13294B #FF6B2C #EEF3F8','HVAC|solar|IT & tech services|insurance|accounting & tax|consulting|law|other professional'],
    juniper:['Juniper Family Dental','Portland, OR','Family and cosmetic dentistry','Calm, light, reassuring healthcare brand','Newsreader 500 / Albert Sans','#2F5D50 #DDE8E1 + blush','dental|medical & clinic|wellness & therapy|fitness & yoga|childcare|home care|pet care|tutoring'],
    fadeline:['Fadeline Barber Studio','Hartford, CT','Barbershop','Bold, nocturnal, stylish','Bebas Neue / DM Sans','#0F0F10 #EDE6DA #C9A24A','barbershop|hair & beauty salon|nails|tattoo|photography|creative & marketing|other']
  };
  const keys=Object.keys(samples), mapping=Object.fromEntries(keys.flatMap(k=>samples[k][6].split('|').map(i=>[i,k])));
  const qs=new URLSearchParams(location.search), get=(k,def=null,session=false)=>{
    try{return JSON.parse((session?sessionStorage:localStorage).getItem('rs:'+k))??def}catch{return def}
  }, put=(k,v,session=false)=>{try{(session?sessionStorage:localStorage).setItem('rs:'+k,JSON.stringify(v));return true}catch{return false}};
  const text=(s,v,r=document)=>{$$(s,r).forEach(n=>n.textContent=v)};
  const show=(n,yes)=>{if(n)n.hidden=!yes};
  const focusBlock=n=>{if(!n)return;const el=$('h1,h2,h3,legend',n)||n;el.tabIndex=-1;el.focus()};
  const err=(r,m)=>text('[data-error]',m,r);
  const currentPage=location.pathname.split('/').pop()||'index.html';
  const utms=['utm_source','utm_medium','utm_campaign'];
  if(utms.some(k=>qs.has(k)))put('campaign',Object.fromEntries(utms.map(k=>[k,qs.get(k)||''])),true);
  const last=get('lead',{}), order=get('order',last);
  $$('[data-email]').forEach(a=>{a.textContent=CONFIG.CONTACT_EMAIL;a.href='mailto:'+CONFIG.CONTACT_EMAIL});
  $$('header nav a,footer nav a').forEach(a=>{if(!(a.getAttribute('href')||'').startsWith('#')&&new URL(a.href).pathname.split('/').pop()===currentPage)a.setAttribute('aria-current','page')});
  $$('[data-menu]').forEach(b=>{
    const n=document.getElementById(b.getAttribute('aria-controls'));
    const close=()=>{n.classList.remove('open');b.setAttribute('aria-expanded','false')};
    b.onclick=()=>b.setAttribute('aria-expanded',String(n.classList.toggle('open')));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&n.classList.contains('open')){close();b.focus()}});
    document.addEventListener('click',e=>{if(!n.contains(e.target)&&!b.contains(e.target))close()});
  });
  $$('select[name=industry]').forEach(s=>{
    const initial=s.value||s.dataset.default;
    s.replaceChildren(new Option('Choose one',''));
    Object.keys(mapping).sort((a,b)=>(a==='other')-(b==='other')||a.localeCompare(b)).forEach(i=>s.add(new Option(i[0].toUpperCase()+i.slice(1),i)));
    if(initial in mapping)s.value=initial;
  });
  $$('select[name=state]').forEach(s=>{
    s.replaceChildren(new Option('State',''));
    'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AS GU MP PR VI'.split(' ').forEach(v=>s.add(new Option(v,v)));
  });
  function fields(f){
    const o={};for(const [k,v] of new FormData(f))if(typeof v==='string')o[k]=v.trim();return o
  }
  function fill(f,obj){
    for(const el of f.elements){
      if(!el.name||obj[el.name]==null||el.type==='file')continue;
      if(el.type==='radio'||el.type==='checkbox')el.checked=obj[el.name]===el.value;
      else el.value=obj[el.name];
    }
  }
  function valid(root){
    for(const el of $$('input,textarea,select',root)){
      if(el.name==='phone'){
        const d=el.value.replace(/[\s().+-]/g,'');el.setCustomValidity(!d||/^1?[2-9]\d{2}[2-9]\d{6}$/.test(d)?'':'Enter a US cell number with area code, or leave it blank.');
      }else if(el.name==='contact'&&el.type==='email'){
        el.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())?'':'Enter your email so we can send your free design.');
      }else if(el.name==='contact'){
        const v=el.value.trim();
        const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)||/^(?:\+?1)?[2-9]\d{2}[2-9]\d{6}$/.test(v.replace(/[\s().-]/g,''));
        el.setCustomValidity(ok?'':'Enter an email address or a US mobile number, including area code.');
      }else if(el.required&&['text','textarea'].includes(el.type))el.setCustomValidity(el.value.trim()?'':'Please fill in this field.');
      if(!el.reportValidity())return false;
    }return true
  }
  const payloadFields='type business industry detail city state firstName contact message hosting page utm_source utm_medium utm_campaign website'.split(' ');
  async function send(type,values){
    if(values.phone&&type!=='contact')values={...values,message:[values.message,'Cell phone: '+values.phone].filter(Boolean).join('\n')};
    const data=Object.fromEntries(payloadFields.map(k=>[k,values[k]||'']));
    Object.assign(data,{type,page:location.pathname},get('campaign',{},true));
    if(CONFIG.LEAD_ENDPOINT){
      let res;
      try{res=await fetch(CONFIG.LEAD_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(9000)})}
      catch{if(type==='contact')throw Error('Message not sent. Please try again or email James.')}
      if(res){
        const body=await res.json().catch(()=>({}));
        if(res.status===422||body.ok===false)throw Error(body.message||'Check your details and try again.');
        if(!res.ok&&type==='contact')throw Error('Message not sent. Please try again.');
      }
    }
    put('submissions',[...get('submissions',[]).slice(-29),data]);
    if(type==='concept_request')put('lead',data);
    return data;
  }
  function size(v){
    const f=$('iframe',v);if(!f||!v.clientWidth)return;
    const w=v.clientWidth, phone=!!v.closest('.phone'), auto=v.dataset.mobile!=='off'&&innerWidth<=680;
    const layout=phone||auto?w:Math.max(1280,w);
    f.style.width=layout+'px';f.style.height=Math.ceil(v.clientHeight*layout/w)+'px';
    f.style.transform=`scale(${w/layout})`;
  }
  $$('.viewport').forEach(v=>{if('ResizeObserver'in window)new ResizeObserver(()=>size(v)).observe(v);else addEventListener('resize',()=>size(v));size(v)});
  function mount(root,k,name='',city=''){
    const p=new URLSearchParams();if(name)p.set('name',name);if(city)p.set('city',city);
    const url=`examples/${k}/index.html`+(p.size?'?'+p:'');
    const frame=$('iframe',root),img=$('img.reel-img',root);
    if(img){
      const phone=!!$('.device.phone',root);const src=`examples/${k}/full-${phone?'mobile':'desktop'}.webp`;
      if(img.getAttribute('src')!==src){img.src=src;img.alt=samples[k][0]+' sample website, auto-scrolling preview'}
      window.RSReel&&RSReel.image(img);
    }else if(frame){
      if(frame.getAttribute('src')!==url){const go=()=>{frame.src=url};document.readyState==='complete'?go():addEventListener('load',()=>setTimeout(go,150),{once:true})}
      frame.title=(name||samples[k][0])+' sample website preview';
      window.RSReel&&RSReel.frame(frame,k);
    }
    text('[data-url]',`examples / ${k}`+(name?' / '+name:''),root);
    const link=$('[data-open]',root);if(link)link.href=url;
    const vp=$('.viewport',root);if(vp&&frame)size(vp);
  }
  $$('[data-generator]').forEach(f=>{
    const root=f.closest('.app'),log=$('[data-log]',root);let debounce,timer;
    const paint=()=>{
      const {business,city,industry}=fields(f),k=mapping[industry]||keys[0],s=samples[k];
      mount(root,k,business,city);clearInterval(timer);
      const lines=['> reading brief','> layout: '+k,'> type: '+s[4],'> palette: '+s[5],'> assets: 3 sample photos','> preview: ready'];
      let i=0;log.textContent='';
      function line(){log.textContent+=(i?'\n':'')+lines[i++];log.scrollTop=log.scrollHeight;if(i===lines.length)clearInterval(timer)}
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)log.textContent=lines.join('\n');
      else{line();timer=setInterval(line,185)}
    };
    f.oninput=()=>{clearTimeout(debounce);debounce=setTimeout(paint,320)};paint();
  });
  {const go=v=>{const img=$('img',v);if(img.src)return;img.src=`examples/${v.dataset.reel}/full-${v.dataset.kind||'desktop'}.webp`;window.RSReel&&RSReel.image(img)};
   const reels=$$('[data-reel]');
   if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);go(e.target)}}),{rootMargin:'300px 0px'});reels.forEach(v=>io.observe(v))}else reels.forEach(go)}
  $$('[data-viewer]').forEach(root=>{
    let cur=null;
    function choose(k){
      if(!samples[k])return;cur=k;mount(root,k);
      text('[data-title]',samples[k][0],root);text('[data-brief]',`${samples[k][2]} in ${samples[k][1]}. Focus: ${samples[k][3].toLowerCase()}.`,root);
      $$('[data-sample]',root).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sample===k)));
    }
    $$('[data-sample]',root).forEach(b=>b.onclick=()=>choose(b.dataset.sample));
    function width(mode){
      $('.device',root).classList.toggle('phone',mode==='phone');$('.viewport',root).dataset.mobile='off';
      $$('[data-width]',root).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.width===mode)));
      if(cur)mount(root,cur);
    }
    $$('[data-width]',root).forEach(b=>b.onclick=()=>width(b.dataset.width));
    if($('[data-width]',root)||innerWidth<=680)width(innerWidth<=680?'phone':'desktop');choose(samples[qs.get('sample')]?qs.get('sample'):root.dataset.viewer||keys[0]);
  });
  function wizard(f,initial,finish,changed=()=>{}){
    const steps=$$('[data-step]',f);let i=0,busy=false;
    f.noValidate=true;
    function go(n,focus=true){
      i=Math.min(steps.length-1,Math.max(0,n));steps.forEach((s,j)=>show(s,i===j));
      const p=$('progress',f);if(p){p.max=steps.length;p.value=i+1}
      text('[data-count]',`Step ${i+1} / ${steps.length}`,f);
      $$('[data-back]',f).forEach(b=>show(b,i>0));$$('[data-next]',f).forEach(b=>show(b,i<steps.length-1));
      $$('[data-submit]',f).forEach(b=>show(b,i===steps.length-1));
      err(f,'');changed(i);if(focus)focusBlock(steps[i]);
    }
    function next(){if(valid(steps[i]))go(i+1)}
    $$('[data-next]',f).forEach(b=>b.onclick=next);
    $$('[data-back]',f).forEach(b=>b.onclick=()=>go(i-1));
    f.onsubmit=async e=>{
      e.preventDefault();if(busy)return;if(i<steps.length-1)return next();if(!valid(steps[i]))return;
      for(let j=0;j<i;j++)if($$('input,select,textarea',steps[j]).some(el=>!el.checkValidity())){go(j);valid(steps[j]);return}
      busy=true;$$('button',f).forEach(b=>b.disabled=true);err(f,'');
      try{await finish()}catch(e){err(f,e.message||'Could not save. Please try again.')}
      finally{busy=false;$$('button',f).forEach(b=>b.disabled=false)}
    };
    go(initial,false);return ()=>i
  }
  const concept=$('[data-concept]');
  if(concept){
    fill(concept,Object.fromEntries(['business','industry','city'].filter(k=>qs.has(k)).map(k=>[k,qs.get(k)])));
    const reveal=$('[data-reveal]'),design=$('[data-designing]'),dlg=$('[data-host-dialog]');let lead,k;
    function update(){mount(reveal,k,lead.business,[lead.city,lead.state].filter(Boolean).join(', '))}
    {const c=concept.elements.city,st=concept.elements.state,m=c&&/^(.*?),\s*([A-Za-z]{2})$/.exec(c.value.trim());if(m&&st&&!st.value){c.value=m[1];st.value=m[2].toUpperCase()}}
    const firstOpen=()=>{const st=$$('[data-step]',concept);const i=st.findIndex(x=>$$('input[required],select[required],textarea[required]',x).some(el=>!el.value.trim()));return i<0?st.length-1:i};
    const start=firstOpen();
    const pre=$('[data-prefill]');
    if(pre&&start>0){const v=fields(concept);text('[data-prefill-text]',[v.business,v.industry&&v.industry.replace(/^./,c=>c.toUpperCase()),[v.city,v.state].filter(Boolean).join(', ')].filter(Boolean).join('  ·  '),pre);show(pre,true)}
    if(start>0)requestAnimationFrame(()=>{concept.scrollIntoView({block:'start',behavior:'auto'});const el=$$('input[required],textarea[required]',$$('[data-step]',concept)[start]).find(x=>!x.value.trim());if(el)el.focus({preventScroll:true})});
    wizard(concept,start,async()=>{
      lead=await send('concept_request',fields(concept));if(concept.dataset.after){location.assign(concept.dataset.after);return}k=mapping[lead.industry]||keys[0];
      show(concept.closest('[data-concept-card]')||concept,false);show(design,true);focusBlock(design);await new Promise(r=>setTimeout(r,3200));
      show(design,false);show(reveal,true);text('[data-business]',lead.business,reveal);text('[data-contact]',lead.contact,reveal);
      update();focusBlock(reveal);
    });
    if(reveal){
    $('[data-cycle]',reveal).onclick=()=>{k=keys[(keys.indexOf(k)+1)%keys.length];update()};
    const cont=$('[data-checkout]',dlg),choice=()=>$('input[name=hosting]:checked',dlg)?.value;
    function host(){const v=choice();show($('[data-builder]',dlg),v==='builder');show(cont,v!=='builder');cont.disabled=!v||v==='builder';err(dlg,'')}
    dlg.onchange=host;
    $('[data-buy]',reveal).onclick=()=>{host();dlg.showModal()};
    $('[data-close]',dlg).onclick=()=>dlg.close();
    cont.onclick=async e=>{
      e.preventDefault();const hosting=choice();if(!['hostinger','wordpress','files'].includes(hosting))return;
      cont.disabled=true;err(dlg,'');
      try{
        await send('checkout_started',{...lead,hosting});
        const slug=lead.business.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'new-business';
        put('order',{...lead,hosting,sample:k,slug});
        const url=new URL(CONFIG.PAYMENT_URL,location.href);url.searchParams.set('client_reference_id',slug);
        if(lead.contact.includes('@'))url.searchParams.set('prefilled_email',lead.contact);
        location.assign(url.href)
      }catch(e){err(dlg,e.message);cont.disabled=false}
    };
    if(qs.has('ready')&&last.business){lead=last;k=mapping[lead.industry]||keys[0];show(concept.closest('[data-concept-card]')||concept,false);show(design,true);setTimeout(()=>{show(design,false);show(reveal,true);text('[data-business]',lead.business,reveal);text('[data-contact]',lead.contact,reveal);update();focusBlock(reveal)},1400)}
    }
  }
  const pay=$('[data-demo-pay]');
  if(pay){
    text('[data-business]',order.business||qs.get('client_reference_id')||'Your business');
    pay.onclick=e=>{e.preventDefault();location.assign('start.html?session=demo_'+Array.from(crypto.getRandomValues(new Uint32Array(2)),v=>v.toString(36)).join(''))};
  }
  const intake=$('[data-intake]');
  if(intake){
    const f=intake,key='intake:'+(qs.get('session')||order.slug||'preview'),saved=get(key,{}),done=$('[data-done]');
    const files=saved.files||{}, lists=$$('input[type=file]',f);let index=Number(saved.step)||0,pending=0,fileProblem=false;
    fill(f,{business:order.business,industry:order.industry,hosting:order.hosting,email:order.contact?.includes('@')?order.contact:'',...saved.fields});
    function persist(completed=false){
      return put(key,{fields:fields(f),files,step:index,completed});
    }
    function instructions(){const h=fields(f).hosting;$$('[data-instruction]',f).forEach(n=>show(n,n.dataset.instruction===h))}
    function review(){
      const values=fields(f);
      const lines=Object.entries(values).filter(([k])=>!['confirm','website'].includes(k)).map(([k,v])=>{
        const el=f.elements.namedItem(k),label=el?.dataset?.label||k.replace(/([A-Z])/g,' $1');
        return `${label[0].toUpperCase()+label.slice(1)}: ${v||'Not provided'}`;
      });
      for(const el of lists)lines.push(`${el.name}: ${(files[el.name]||[]).map(v=>v.name).join(', ')||'None supplied'}`);
      text('[data-review]',lines.join('\n'),f);
    }
    function render(el){
      const box=$(`[data-files="${el.name}"]`,f);if(!box)return;box.replaceChildren();
      (files[el.name]||[]).forEach((v,i)=>{
        const fig=document.createElement('figure'),img=new Image(),cap=document.createElement('figcaption'),b=document.createElement('button');
        img.src=v.data;img.alt=v.name;cap.textContent=v.name;b.type='button';b.className='chip';b.textContent='Remove';b.setAttribute('aria-label','Remove '+v.name);
        b.onclick=()=>{files[el.name].splice(i,1);render(el);fileProblem=!persist();err(f,fileProblem?'Browser storage is full. Remove a file.':'');review()};
        fig.append(img,cap,b);box.append(fig);
      });
    }
    const read=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,data:r.result});r.onerror=()=>reject(Error('Could not read that file.'));r.readAsDataURL(file)});
    lists.forEach(el=>{
      render(el);
      el.onchange=async()=>{
        const chosen=Array.from(el.files);if(!chosen.length)return;pending++;el.disabled=true;
        try{
          if(chosen.some(v=>!v.type.startsWith('image/')))throw Error('Choose image files only.');
          const batch=await Promise.all(chosen.map(read));files[el.name]=el.multiple?[...(files[el.name]||[]),...batch]:batch;
          render(el);fileProblem=!persist();err(f,fileProblem?'These files exceed browser draft storage. Use smaller images to save progress.':'');review();
        }catch(e){err(f,e.message)}finally{pending--;el.disabled=false;el.value=''}
      };
    });
    f.addEventListener('input',e=>{if(e.target.type!=='file'){instructions();review();fileProblem=!persist();if(fileProblem)err(f,'Draft storage is full. Remove a photo or use smaller images.')}});
    function complete(){show(f,false);show(done,true);focusBlock(done)}
    if(saved.completed)complete();
    else wizard(f,index,async()=>{
      if(pending)throw Error('Images are still being read. Try again in a moment.');
      if(CONFIG.INTAKE_ENDPOINT){
        const session=qs.get('session')||'';
        if(!session)throw Error('This page is missing your order number. Please use the link we sent you, or email '+CONFIG.CONTACT_EMAIL+'.');
        const v=fields(f),where={hostinger:'wp_new',other:'wp_new',wordpress:'wp_existing',files:'files'}[v.hosting]||'';
        // studio-orders contract (same keys as the original /start/ form)
        const json={session,biz:v.business,industry:v.industry,phone:v.phone,email:v.email,area:v.serviceArea,hours:v.hours,
          describe:v.story,unique:v.difference,else:[v.notes,v.hosting==='other'?'Host: another WordPress-compatible host':''].filter(Boolean).join('\n'),
          links:v.socialLinks,changes:v.changes,where,wpurl:v.wpurl||'',agree:v.confirm==='yes',sample:order.sample||'',hosting:v.hosting};
        const body=new FormData();body.append('json',JSON.stringify(json));
        for(const el of lists)for(const file of files[el.name]||[])body.append('files',await(await fetch(file.data)).blob(),(el.name==='logo'?'logo-':'')+file.name);
        let res;try{res=await fetch(CONFIG.INTAKE_ENDPOINT,{method:'POST',body})}catch{throw Error('Could not reach the studio. Please try again, or email '+CONFIG.CONTACT_EMAIL+'.')}
        if(res.status===413)throw Error('Your files are too big to send in one go. Remove a photo or two, or email them to '+CONFIG.CONTACT_EMAIL+'.');
        if(!res.ok)throw Error((await res.json().catch(()=>({}))).message||'Something went wrong. Please email '+CONFIG.CONTACT_EMAIL+' and we will sort it out.');
        put(key,{completed:true});
      }else if(!persist(true))throw Error('The local intake is too large to save. Go back and remove a photo or choose smaller files.');
      complete()
    },i=>{index=i;instructions();review();fileProblem=!persist();if(fileProblem)err(f,'Draft not saved. Use smaller images or enable browser storage.')});
  }
  const contact=$('[data-contact-form]');
  if(contact){
    contact.noValidate=true;contact.onsubmit=async e=>{
      e.preventDefault();if(!valid(contact))return;const b=$('[type=submit]',contact);b.disabled=true;err(contact,'');
      try{await send('contact',fields(contact));show(contact,false);const success=$('[data-success]');show(success,true);focusBlock(success)}
      catch(e){err(contact,e.message)}finally{b.disabled=false}
    };
  }
  $$('[data-preview-only]').forEach(n=>show(n,!CONFIG.LEAD_ENDPOINT));
})();
