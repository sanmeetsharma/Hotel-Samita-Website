(() => {
    'use strict';
    const hero = document.querySelector('.mountain-hero');
    if (!hero) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let preference;
    try { preference=localStorage.getItem('samita-motion'); } catch { /* Use the system preference. */ }
    let motionEnabled=preference ? preference==='on' : !reduced.matches;
    const motionButton=document.getElementById('motion-toggle');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const night = document.querySelector('.hero-night');
    const aperture = document.getElementById('night-aperture');
    const cursor = document.querySelector('.motion-cursor');
    const cursorLabel = cursor.querySelector('span');
    const progress = document.querySelector('.scroll-progress');
    const navigation = document.querySelector('.samita-nav');
    const dayButton = document.getElementById('scene-day');
    const nightButton = document.getElementById('scene-night');
    const hint = document.getElementById('scene-hint');
    let rect = hero.getBoundingClientRect();
    let x = rect.width/2, y = rect.height/2, targetX = x, targetY = y, radius = 0;
    let px = -100, py = -100, cx = -100, cy = -100;
    let hovering = false, showNight = false, heroVisible = true;
    let frame = 0, previous = 0, scrollDirty = true;
    let pageHeight = document.documentElement.scrollHeight-innerHeight;
    const photos = new Set();

    // A closed Catmull–Rom spline gives the reveal a real, gently moving edge.
    function shape(r,time,stretch,direction) {
        if (r < .1) return 'M0 0';
        const points = [], count = 14;
        for (let i=0;i<count;i++) {
            const a = i/count*Math.PI*2;
            const wave = 1+Math.sin(a*3+time*.65)*.065+Math.cos(a*5-time*.4)*.025;
            const u = Math.cos(a)*r*wave*stretch, v = Math.sin(a)*r*wave/Math.sqrt(stretch);
            points.push([x+u*Math.cos(direction)-v*Math.sin(direction),y+u*Math.sin(direction)+v*Math.cos(direction)]);
        }
        let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
        for (let i=0;i<count;i++) {
            const a=points[(i+count-1)%count],b=points[i],c=points[(i+1)%count],e=points[(i+2)%count];
            d += ` C${(b[0]+(c[0]-a[0])/6).toFixed(2)},${(b[1]+(c[1]-a[1])/6).toFixed(2)} ${(c[0]-(e[0]-b[0])/6).toFixed(2)},${(c[1]-(e[1]-b[1])/6).toFixed(2)} ${c[0].toFixed(2)},${c[1].toFixed(2)}`;
        }
        return d+' Z';
    }
    function requestFrame() { if (!frame && !document.hidden) frame=requestAnimationFrame(tick); }
    function tick(time) {
        frame=0;
        const dt=Math.min((time-(previous||time-16.67))/1000,.05);
        previous=time;
        let again=false;
        if (motionEnabled && heroVisible) {
            const dx=targetX-x,dy=targetY-y,speed=Math.hypot(dx,dy),follow=1-Math.exp(-18*dt);
            x+=dx*follow; y+=dy*follow;
            const size=showNight ? Math.hypot(rect.width,rect.height)*1.25 : hovering ? Math.min(rect.width*.24,210)+Math.min(speed*.22,65) : 0;
            radius+=(size-radius)*(1-Math.exp(-9*dt));
            aperture.setAttribute('d',shape(radius,time/1000,showNight?1:1+Math.min(speed/500,.24),Math.atan2(dy,dx)));
            again=(hovering&&!showNight)||Math.abs(size-radius)>.1||speed>.1;
        }
        if (fine.matches && motionEnabled) {
            cx+=(px-cx)*(1-Math.exp(-32*dt)); cy+=(py-cy)*(1-Math.exp(-32*dt));
            cursor.style.transform=`translate3d(${cx}px,${cy}px,0)`;
            again ||= Math.abs(px-cx)+Math.abs(py-cy)>.2;
        }
        if (scrollDirty) {
            navigation.classList.toggle('is-scrolled',scrollY>120);
            document.body.classList.toggle('past-hero',scrollY>rect.height-120);
            progress.style.transform=`scaleX(${Math.min(scrollY/Math.max(pageHeight,1),1)})`;
            if (motionEnabled) for (const photo of photos) {
                const box=photo.getBoundingClientRect();
                photo.style.setProperty('--image-shift',`${Math.max(-35,Math.min(35,(box.top+box.height/2-innerHeight/2)*-.045))}px`);
            }
            scrollDirty=false;
        }
        if (again) requestFrame(); else previous=0;
    }
    function setScene(value) {
        showNight=value;
        dayButton.setAttribute('aria-pressed',String(!value));
        nightButton.setAttribute('aria-pressed',String(value));
        hint.textContent=!motionEnabled ? 'A stay, from day to night' : value ? 'A different kind of mountain evening' : fine.matches ? 'Move to meet the night' : 'A stay, from day to night';
        night.style.clipPath=!motionEnabled ? value?'inset(0)':'circle(0 at 50% 50%)' : 'url(#mountain-night-clip)';
        requestFrame();
    }
    hero.addEventListener('pointerenter',event=>{
        if (event.pointerType==='touch'||!fine.matches||!motionEnabled) return;
        rect=hero.getBoundingClientRect(); targetX=x=event.clientX-rect.left; targetY=y=event.clientY-rect.top;
        hovering=true; requestFrame();
    });
    hero.addEventListener('pointermove',event=>{
        if (event.pointerType==='touch'||!fine.matches||!motionEnabled) return;
        targetX=event.clientX-rect.left; targetY=event.clientY-rect.top; hovering=true; requestFrame();
    },{passive:true});
    hero.addEventListener('pointerleave',()=>{hovering=false;requestFrame();});
    dayButton.addEventListener('click',()=>setScene(false));
    nightButton.addEventListener('click',()=>setScene(true));
    document.addEventListener('pointermove',event=>{
        if (event.pointerType==='touch'||!fine.matches||!motionEnabled) return;
        px=event.clientX;py=event.clientY;
        if (!document.body.classList.contains('has-motion-cursor')) {cx=px;cy=py;document.body.classList.add('has-motion-cursor');}
        const label=event.target.closest('a,button')?.dataset.cursor;
        cursor.classList.toggle('is-link',Boolean(label)); cursorLabel.textContent=label||'';requestFrame();
    },{passive:true});
    document.addEventListener('pointerleave',()=>document.body.classList.remove('has-motion-cursor'));
    window.addEventListener('blur',()=>document.body.classList.remove('has-motion-cursor'));

    const reveals=[...document.querySelectorAll('[data-reveal]')];
    if ('IntersectionObserver' in window) {
        const observer=new IntersectionObserver(entries=>{
            for (const entry of entries) if (entry.isIntersecting) {entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
        },{threshold:.08});
        reveals.forEach(element=>observer.observe(element));document.documentElement.classList.add('motion-ready');
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)requestFrame();}).observe(hero);
        const photoObserver=new IntersectionObserver(entries=>{
            entries.forEach(entry=>entry.isIntersecting?photos.add(entry.target):photos.delete(entry.target));scrollDirty=true;requestFrame();
        },{rootMargin:'100px'});
        document.querySelectorAll('.stay-photo').forEach(photo=>photoObserver.observe(photo));
    }
    document.querySelectorAll('.stay-photo').forEach(photo=>{
        photo.addEventListener('pointermove',event=>{
            if (!fine.matches||!motionEnabled) return;
            const box=photo.getBoundingClientRect();
            photo.style.setProperty('--tilt-x',`${((event.clientY-box.top)/box.height-.5)*-3}deg`);
            photo.style.setProperty('--tilt-y',`${((event.clientX-box.left)/box.width-.5)*3}deg`);
        },{passive:true});
        photo.addEventListener('pointerleave',()=>{photo.style.setProperty('--tilt-x','0deg');photo.style.setProperty('--tilt-y','0deg');});
    });
    window.addEventListener('scroll',()=>{rect=hero.getBoundingClientRect();scrollDirty=true;requestFrame();},{passive:true});
    function resize(){rect=hero.getBoundingClientRect();pageHeight=document.documentElement.scrollHeight-innerHeight;scrollDirty=true;requestFrame();}
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(document.body);
    window.addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;}else requestFrame();
    });
    function applyMotion(value,remember=false){
        motionEnabled=value;
        document.documentElement.classList.toggle('motion-disabled',!value);
        document.documentElement.classList.toggle('motion-opt-in',value);
        motionButton.setAttribute('aria-pressed',String(value));
        motionButton.textContent=value?'Motion on':'Enable motion';
        motionButton.setAttribute('aria-label',value?'Turn off animations':'Turn on animations');
        document.body.classList.remove('has-motion-cursor');
        if(remember){preference=value?'on':'off';try{localStorage.setItem('samita-motion',preference);}catch{/* The choice still applies for this visit. */}}
        setScene(showNight);
    }
    reduced.addEventListener('change',()=>{if(!preference)applyMotion(!reduced.matches);});
    motionButton.addEventListener('click',()=>applyMotion(!motionEnabled,true));
    fine.addEventListener('change',()=>{hovering=false;document.body.classList.remove('has-motion-cursor');setScene(showNight);});
    applyMotion(motionEnabled);

    const menu=document.getElementById('samita-menu'),toggle=document.getElementById('menu-toggle'),close=document.getElementById('menu-close');
    let oldOverflow='';
    function setMenu(open){
        if(open)oldOverflow=document.body.style.overflow;
        menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':oldOverflow;
        (open?close:toggle).focus();
    }
    toggle.addEventListener('click',()=>setMenu(menu.hidden));close.addEventListener('click',()=>setMenu(false));
    menu.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
    menu.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();setMenu(false);}
        if(event.key!=='Tab')return;
        const items=[...menu.querySelectorAll('a,button')],first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
})();
