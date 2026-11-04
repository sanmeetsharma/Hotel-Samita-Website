(() => {
    'use strict';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const motionAllowed=()=>{try{const value=localStorage.getItem('samita-motion');if(value)return value==='on';}catch{}return !reduced.matches;};
    const menu = document.getElementById('samita-menu');
    if (!menu) return;
    const toggle = document.getElementById('menu-toggle');
    const close = document.getElementById('menu-close');
    let menuOpen = false, menuAnimation = null, menuVersion = 0, oldOverflow = '';

    async function setMenu(open) {
        if (open === menuOpen) return false;
        const version = ++menuVersion;
        const wasHidden = menu.hidden;
        const from = wasHidden ? 'translate3d(0,-100%,0)' : getComputedStyle(menu).transform;
        menuAnimation?.cancel();
        if (open && wasHidden) oldOverflow = document.body.style.overflow;
        menuOpen = open;
        menu.hidden = false;
        menu.classList.toggle('is-open',open);
        menu.classList.toggle('is-closing',!open);
        toggle.setAttribute('aria-expanded',String(open));
        document.body.style.overflow = 'hidden';
        if (open) close.focus({preventScroll:true});
        if (motionAllowed()) {
            menuAnimation = menu.animate([
                {transform:from},
                {transform:open?'translate3d(0,0,0)':'translate3d(0,-100%,0)'}
            ],{duration:open?580:440,easing:'cubic-bezier(.22,.75,.2,1)',fill:'both'});
            try { await menuAnimation.finished; } catch { return false; }
        }
        if (version !== menuVersion) return false;
        menuAnimation?.cancel();
        menuAnimation = null;
        menu.classList.remove('is-closing');
        if (!open) {
            menu.hidden = true;
            document.body.style.overflow = oldOverflow;
            toggle.focus({preventScroll:true});
        }
        return true;
    }
    toggle.addEventListener('click',()=>setMenu(!menuOpen));
    close.addEventListener('click',()=>setMenu(false));
    menu.addEventListener('click',async event=>{
        const link = event.target.closest('a[href]');
        if (!link || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const destination = new URL(link.href);
        if (!await setMenu(false)) return;
        const target = destination.hash ? document.getElementById(decodeURIComponent(destination.hash.slice(1))) : null;
        if (destination.origin===location.origin && destination.pathname.replace(/(?:index\.html)?\/?$/,'/')===location.pathname.replace(/(?:index\.html)?\/?$/,'/') && target) {
            target.scrollIntoView({behavior:motionAllowed()?'smooth':'instant',block:'start'});
            history.replaceState(null,'',destination.hash);
        } else location.assign(destination.href);
    });
    menu.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();setMenu(false);}
        if(event.key!=='Tab')return;
        const items=[...menu.querySelectorAll('a,button')],first=items[0],last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
})();
