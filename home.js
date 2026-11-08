(() => {
    'use strict';
    const hero = document.querySelector('.mountain-hero');
    if (!hero) return;
    let motionEnabled=window.SamitaMotion?.enabled() ?? true;
    const motionButton=document.getElementById('motion-toggle');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const night = document.querySelector('.hero-night');
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
    let directPointer = null, touchReleaseTimer = 0;
    let frame = 0, previous = 0, scrollDirty = true;
    let pageHeight = document.documentElement.scrollHeight-innerHeight;
    const photos = new Set();

    let direction = 0;
    const renderer = window.createSamitaHeroRenderer?.({ host: hero, onReady: requestFrame, onFallback: requestFrame }) || {ready:false,resize(){}};
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
            if (speed > 12) {
                const desired = Math.atan2(dy,dx);
                direction += Math.atan2(Math.sin(desired-direction),Math.cos(desired-direction)) * (1-Math.exp(-7*dt));
            }
            if (renderer.ready) {
                renderer.render({x,y,radius,time:time/1000,stretch:showNight?1:1+Math.min(speed/700,.14),angle:direction});
                hero.classList.add('gpu-active');
            } else {
                hero.classList.remove('gpu-active');
                night.style.clipPath = 'circle('+radius.toFixed(2)+'px at '+x.toFixed(2)+'px '+y.toFixed(2)+'px)';
            }
            again=(hovering&&!showNight)||Math.abs(size-radius)>.1||speed>.1;
        }
        if (fine.matches) {
            const cursorFollow=motionEnabled?1-Math.exp(-32*dt):1;
            cx+=(px-cx)*cursorFollow; cy+=(py-cy)*cursorFollow;
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
        clearTouchReveal();
        showNight=value;
        dayButton.setAttribute('aria-pressed',String(!value));
        nightButton.setAttribute('aria-pressed',String(value));
        hint.textContent=!motionEnabled ? 'A stay, from day to night' : value ? 'A different kind of mountain evening' : fine.matches ? 'Move to meet the night' : 'Touch to reveal the night';
        if (!motionEnabled) hero.classList.remove('gpu-active');
        night.style.clipPath=!motionEnabled && value ? 'inset(0)' : 'circle(0 at 50% 50%)';
        requestFrame();
    }
    const isDirectPointer=event=>event.pointerType==='touch'||event.pointerType==='pen';
    function clearTouchReveal() {
        if (directPointer===null && !touchReleaseTimer) return;
        clearTimeout(touchReleaseTimer); touchReleaseTimer=0; directPointer=null;
        hovering=false; requestFrame();
    }
    function moveReveal(event,first=false) {
        rect=hero.getBoundingClientRect();
        targetX=Math.max(0,Math.min(rect.width,event.clientX-rect.left));
        targetY=Math.max(0,Math.min(rect.height,event.clientY-rect.top));
        if(first){x=targetX;y=targetY;}
        hovering=true; requestFrame();
    }
    hero.addEventListener('pointerdown',event=>{
        if(!isDirectPointer(event)||event.isPrimary===false||!motionEnabled||event.target.closest('a,button,input,select,textarea'))return;
        clearTouchReveal(); directPointer=event.pointerId;
        moveReveal(event,true);
    },{passive:true});
    hero.addEventListener('pointerenter',event=>{
        if (isDirectPointer(event)||!fine.matches||!motionEnabled) return;
        moveReveal(event,true);
    });
    hero.addEventListener('pointermove',event=>{
        if(!motionEnabled)return;
        if(isDirectPointer(event)){if(event.pointerId!==directPointer)return;}
        else if(!fine.matches)return;
        moveReveal(event);
    },{passive:true});
    hero.addEventListener('pointerleave',event=>{if(!isDirectPointer(event)){hovering=false;requestFrame();}});
    window.addEventListener('pointerup',event=>{
        if(event.pointerId!==directPointer)return;
        directPointer=null;
        touchReleaseTimer=setTimeout(()=>{touchReleaseTimer=0;hovering=false;requestFrame();},1000);
    },{passive:true});
    window.addEventListener('pointercancel',event=>{if(event.pointerId===directPointer)clearTouchReveal();},{passive:true});
    dayButton.addEventListener('click',()=>setScene(false));
    nightButton.addEventListener('click',()=>setScene(true));
    document.addEventListener('pointermove',event=>{
        if (event.pointerType==='touch'||!fine.matches) return;
        px=event.clientX;py=event.clientY;
        if (!document.body.classList.contains('has-motion-cursor')) {cx=px;cy=py;document.body.classList.add('has-motion-cursor');}
        const label=event.target.closest('a,button')?.dataset.cursor;
        cursor.classList.toggle('is-link',Boolean(label)); cursorLabel.textContent=label||'';requestFrame();
    },{passive:true});
    document.addEventListener('pointerleave',()=>document.body.classList.remove('has-motion-cursor'));
    window.addEventListener('blur',()=>{document.body.classList.remove('has-motion-cursor');clearTouchReveal();});

    const reveals=[...document.querySelectorAll('[data-reveal]')];
    if ('IntersectionObserver' in window) {
        const observer=new IntersectionObserver(entries=>{
            for (const entry of entries) if (entry.isIntersecting) {entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
        },{rootMargin:'160px 0px',threshold:.08});
        reveals.forEach(element=>observer.observe(element));document.documentElement.classList.add('motion-ready');
    }
    if ('IntersectionObserver' in window) {
        const valley = document.getElementById('the-valley');
        if (valley) new IntersectionObserver(entries => {
            valley.classList.toggle('is-in-view',entries[0].isIntersecting);
        },{rootMargin:'100px'}).observe(valley);
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
    window.addEventListener('scroll',()=>{clearTouchReveal();rect=hero.getBoundingClientRect();scrollDirty=true;requestFrame();},{passive:true});
    function resize(){rect=hero.getBoundingClientRect();renderer.resize(rect.width,rect.height);pageHeight=document.documentElement.scrollHeight-innerHeight;scrollDirty=true;requestFrame();}
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(document.body);
    window.addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',()=>{
        if(document.hidden){clearTouchReveal();cancelAnimationFrame(frame);frame=0;previous=0;}else requestFrame();
    });
    function applyMotion(value,remember=false){
        motionEnabled=value;
        window.SamitaMotion?.set(value,remember);
        document.documentElement.classList.toggle('motion-disabled',!value);
        document.documentElement.classList.toggle('motion-opt-in',value);
        motionButton.setAttribute('aria-pressed',String(value));
        motionButton.textContent=value?'Motion on':'Enable motion';
        motionButton.setAttribute('aria-label',value?'Turn off animations':'Turn on animations');
        document.body.classList.remove('has-motion-cursor');
        setScene(showNight);
        document.dispatchEvent(new Event('samita-motion-change'));
    }
    motionButton.addEventListener('click',()=>applyMotion(!motionEnabled,true));
    fine.addEventListener('change',()=>{hovering=false;document.body.classList.remove('has-motion-cursor');setScene(showNight);});
    applyMotion(motionEnabled);

})();
