(() => {
    'use strict';
    const hero = document.querySelector('.hotel-hero');
    if (!hero) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let motion = window.SamitaMotion?.enabled() ?? true;
    const navigation = document.querySelector('.samita-nav');
    const progress = document.querySelector('.scroll-progress');
    const cursor = document.querySelector('.motion-cursor');
    const cursorLabel = cursor.querySelector('span');
    const motionButton = document.getElementById('motion-toggle');
    const heroVideo = hero.querySelector('video');
    const videoButton = document.getElementById('hotel-video-toggle');
    let heroVisible = true;
    let videoPaused = false;
    function syncVideo() {
        if (!heroVideo) return;
        if (!videoPaused && heroVisible && !document.hidden) heroVideo.play().catch(()=>{});
        else heroVideo.pause();
    }
    videoButton?.addEventListener('click',()=>{
        videoPaused=!videoPaused;
        videoButton.textContent=videoPaused?'Play video':'Pause video';
        videoButton.setAttribute('aria-label',videoPaused?'Play background video':'Pause background video');
        syncVideo();
    });
    let frame = 0, previous = 0, dirty = true;
    let pointerX = -100, pointerY = -100, cursorX = -100, cursorY = -100;
    let pageHeight = 1, heroHeight = hero.offsetHeight;
    function requestFrame() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
    function tick(time) {
        frame = 0;
        const dt = Math.min((time - (previous || time - 16.67)) / 1000, .05);
        previous = time;
        if (dirty) {
            navigation.classList.toggle('is-scrolled', scrollY > 120);
            document.body.classList.toggle('past-hero', scrollY > heroHeight - 120);
            progress.style.transform = `scaleX(${Math.min(scrollY / pageHeight, 1)})`;
            hero.style.setProperty('--hero-shift', motion ? `${Math.min(scrollY * .12, 85).toFixed(2)}px` : '0px');
            dirty = false;
        }
        if (fine.matches) {
            const follow = motion ? 1 - Math.exp(-32 * dt) : 1;
            cursorX += (pointerX - cursorX) * follow;
            cursorY += (pointerY - cursorY) * follow;
            cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0)`;
            if (Math.abs(pointerX-cursorX)+Math.abs(pointerY-cursorY) > .2) requestFrame();
        }
        if (!frame) previous = 0;
    }
    function measure() { pageHeight = Math.max(document.documentElement.scrollHeight-innerHeight,1); heroHeight = hero.offsetHeight; dirty = true; requestFrame(); }
    window.addEventListener('scroll', () => { dirty = true; requestFrame(); }, {passive:true});
    window.addEventListener('resize', measure, {passive:true});
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
    document.addEventListener('pointermove', event => {
        if (document.body.classList.contains('is-viewing-photos')) { hideCursor(); return; }
        if (!fine.matches || event.pointerType === 'touch') return;
        pointerX = event.clientX; pointerY = event.clientY;
        if (!document.body.classList.contains('has-motion-cursor')) { cursorX=pointerX; cursorY=pointerY; document.body.classList.add('has-motion-cursor'); }
        const label = event.target.closest('a,button')?.dataset.cursor;
        cursor.classList.toggle('is-link',Boolean(label)); cursorLabel.textContent=label||'';
        requestFrame();
    }, {passive:true});
    const hideCursor = () => document.body.classList.remove('has-motion-cursor');
    document.addEventListener('pointerleave',hideCursor); window.addEventListener('blur',hideCursor);
    function applyMotion(value,remember=false) {
        motion=value; hideCursor();
        window.SamitaMotion?.set(value,remember);
        document.documentElement.classList.toggle('motion-disabled',!value);
        document.documentElement.classList.toggle('motion-opt-in',value);
        motionButton.textContent=value?'Motion on':'Enable motion';
        motionButton.setAttribute('aria-pressed',String(value));
        motionButton.setAttribute('aria-label',value?'Turn off animations':'Turn on animations');
        syncVideo(); dirty=true; requestFrame(); document.dispatchEvent(new Event('samita-motion-change'));
    }
    motionButton.addEventListener('click',()=>applyMotion(!motion,true));
    fine.addEventListener('change',hideCursor);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncVideo();}).observe(hero);
        const observer=new IntersectionObserver(entries=>{
            for(const entry of entries) if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
        },{rootMargin:'160px 0px',threshold:.07});
        document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
        document.documentElement.classList.add('motion-ready');
    }
    document.addEventListener('visibilitychange',()=>{
        syncVideo();
        if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;} else {dirty=true;requestFrame();}
    });
    applyMotion(motion); measure();

    const lightbox=document.getElementById('hotel-lightbox');
    const image=lightbox.querySelector('img'), video=lightbox.querySelector('video');
    const caption=lightbox.querySelector('[data-lightbox-caption]');
    const counter=lightbox.querySelector('[data-lightbox-counter]');
    const controls=lightbox.querySelector('.hotel-lightbox-navigation');
    const items=[...document.querySelectorAll('[data-gallery-photo]')];
    let active=0, version=0, savedOverflow='', openingTrigger=null;
    function showPhoto(index) {
        const current=++version;
        active=(index+items.length)%items.length;
        const item=items[active], thumbnail=item.querySelector('img');
        video.pause(); video.hidden=true; image.hidden=false; controls.hidden=false;
        image.src=item.dataset.galleryPhoto; image.alt=thumbnail.alt;
        caption.textContent=item.dataset.caption||thumbnail.alt;
        counter.textContent=`${String(active+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
        image.decode().then(()=>{if(current===version&&motion)image.animate([{opacity:.25},{opacity:1}],{duration:250,easing:'ease-out'});}).catch(()=>{});
    }
    function openLightbox(trigger) {
        openingTrigger=trigger; savedOverflow=document.body.style.overflow;
        document.body.classList.add('is-viewing-photos');
        document.body.style.overflow='hidden'; hideCursor(); lightbox.showModal();
        lightbox.querySelector('.hotel-lightbox-close').focus();
    }
    items.forEach((item,index)=>item.addEventListener('click',()=>{showPhoto(index);openLightbox(item);}));
    document.querySelectorAll('[data-hotel-film]').forEach(trigger=>{
        trigger.addEventListener('click',()=>{
            ++version; image.hidden=true; video.hidden=false; controls.hidden=true;
            caption.textContent=trigger.dataset.filmCaption||'A look around the hotel';
            if(video.getAttribute('src')!==trigger.dataset.hotelFilm)video.src=trigger.dataset.hotelFilm;
            video.currentTime=0;
            openLightbox(trigger);
            video.play().catch(()=>{});
        });
    });
    lightbox.querySelector('.hotel-lightbox-close').addEventListener('click',()=>lightbox.close());
    lightbox.querySelector('[data-photo-prev]').addEventListener('click',()=>showPhoto(active-1));
    lightbox.querySelector('[data-photo-next]').addEventListener('click',()=>showPhoto(active+1));
    lightbox.addEventListener('keydown',event=>{
        if(video.hidden&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();showPhoto(active+(event.key==='ArrowLeft'?-1:1));}
    });
    lightbox.addEventListener('close',()=>{++version;video.pause();document.body.classList.remove('is-viewing-photos');document.body.style.overflow=savedOverflow;openingTrigger?.focus({preventScroll:true});});
})();
