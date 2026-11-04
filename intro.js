(() => {
    'use strict';
    const root = document.documentElement;
    const splash = document.getElementById('intro-splash');
    if (!splash) return;
    clearTimeout(window.samitaIntroFailSafe);
    if (!root.classList.contains('show-intro')) { splash.hidden = true; return; }
    try { sessionStorage.setItem('samita-intro-restored-v1', 'true'); } catch { /* The intro can still play without storage. */ }
    document.getElementById('samita-wipe-transition')?.classList.remove('active', 'wipe-out');
    const surfaces = [...document.body.children].filter(element => element !== splash && !element.matches('script, svg, .motion-cursor, .scroll-progress'));
    const originalInert = surfaces.map(element => element.inert);
    const originalOverflow = document.body.style.overflow;
    const skip = splash.querySelector('button');
    let done = false, leaving = false;
    let revealTimer, cleanupTimer, failSafe;
    function finish() {
        if (done) return;
        done = true;
        clearTimeout(revealTimer); clearTimeout(cleanupTimer); clearTimeout(failSafe);
        root.classList.remove('show-intro');
        splash.hidden = true;
        surfaces.forEach((element, index) => { element.inert = originalInert[index]; });
        document.body.style.overflow = originalOverflow;
        if (document.activeElement === skip) document.getElementById('main')?.focus({preventScroll:true});
    }
    function reveal() {
        if (done || leaving) return;
        leaving = true;
        clearTimeout(revealTimer);
        splash.classList.add('slide-up');
        cleanupTimer = setTimeout(finish, 900);
    }
    failSafe = setTimeout(finish, 6000);
    surfaces.forEach(element => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    skip.addEventListener('click', reveal);
    splash.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); reveal(); }
        if (event.key === 'Tab') { event.preventDefault(); skip.focus({preventScroll:true}); }
    });
    splash.addEventListener('transitionend', event => {
        if (event.target === splash && event.propertyName === 'transform') finish();
    });
    window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
    skip.focus({preventScroll:true});
    revealTimer = setTimeout(reveal, 4500);
})();
