(() => {
    'use strict';
    function init() {
        const reduced=matchMedia('(prefers-reduced-motion: reduce)');
        const motionAllowed=()=>{try{const value=localStorage.getItem('samita-motion');if(value)return value==='on';}catch{/* Use system settings. */}return !reduced.matches;};
        document.documentElement.classList.toggle('motion-opt-in',motionAllowed());
        document.documentElement.classList.toggle('motion-disabled',!motionAllowed());
        const behavior=()=>motionAllowed()?'smooth':'instant';
        const overlay=document.getElementById('samita-wipe-transition');
        let navigating=false;
        function clearTransition(){navigating=false;overlay?.classList.remove('active','wipe-in','wipe-out');document.body.classList.remove('is-leaving');}
        if(overlay){if(!motionAllowed())clearTransition();else setTimeout(clearTransition,750);}
        window.addEventListener('pageshow',event=>{if(event.persisted)clearTransition();});
        document.addEventListener('click',event=>{
            const link=event.target.closest('a[href]');
            if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self')||link.hasAttribute('data-modal'))return;
            const href=link.getAttribute('href');
            if(!href||href==='#'||!/^https?:$/.test(link.protocol))return;
            const normalized=path=>path.replace(/(?:index\.html)?\/?$/,'/');
            const samePage=link.origin===location.origin&&normalized(link.pathname)===normalized(location.pathname);
            if(samePage&&link.hash){
                let target;try{target=document.getElementById(decodeURIComponent(link.hash.slice(1)));}catch{return;}
                if(target){event.preventDefault();target.scrollIntoView({behavior:behavior(),block:'start'});history.replaceState(null,'',link.hash);}
                return;
            }
            if(link.origin!==location.origin||!overlay||!motionAllowed())return;
            if(navigating){event.preventDefault();return;}
            event.preventDefault();navigating=true;
            overlay.style.setProperty('--transition-x',`${event.clientX||innerWidth/2}px`);
            overlay.style.setProperty('--transition-y',`${event.clientY||innerHeight/2}px`);
            overlay.classList.remove('wipe-out');overlay.classList.add('active','wipe-in');document.body.classList.add('is-leaving');
            const destination=link.href;setTimeout(()=>location.assign(destination),550);
        });
        document.querySelectorAll('.stagger-text').forEach(element=>{
            if(element.classList.contains('stagger-initialized'))return;
            const text=element.textContent.trim();element.setAttribute('aria-label',text);element.textContent='';
            [...text].forEach((character,index)=>{
                const wrap=document.createElement('span'),char=document.createElement('span');
                wrap.className='char-wrap';wrap.setAttribute('aria-hidden','true');char.className='char';
                char.textContent=character===' '?'\u00a0':character;char.dataset.char=char.textContent;char.style.setProperty('--char-index',index);
                wrap.append(char);element.append(wrap);
            });element.classList.add('stagger-initialized');
        });
        document.body.classList.add('samita-interactions');
        if(!document.getElementById('scroll-top-btn')){
            const button=document.createElement('button');button.id='scroll-top-btn';button.type='button';button.setAttribute('aria-label','Back to top');button.textContent='↑';document.body.append(button);
            button.addEventListener('click',()=>window.scrollTo({top:0,behavior:behavior()}));
            const update=()=>button.classList.toggle('show',scrollY>500);window.addEventListener('scroll',update,{passive:true});update();
        }
        const tabs=[...document.querySelectorAll('.faq-tab')],panels=[...document.querySelectorAll('.faq-tab-content')];
        tabs.forEach(tab=>{
            tab.type='button';tab.setAttribute('aria-controls',tab.dataset.target);tab.setAttribute('aria-pressed',String(tab.classList.contains('active')));
            tab.addEventListener('click',()=>{
                tabs.forEach(item=>{const active=item===tab;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
                panels.forEach(panel=>panel.classList.toggle('active',panel.id===tab.dataset.target));
            });
        });
        document.querySelectorAll('.faq-question').forEach((question,index)=>{
            const answer=question.nextElementSibling;if(!answer)return;
            question.type='button';answer.id||=`faq-answer-${index}`;question.setAttribute('aria-controls',answer.id);question.setAttribute('aria-expanded','false');answer.setAttribute('aria-hidden','true');
            question.addEventListener('click',()=>{
                const open=question.getAttribute('aria-expanded')!=='true';
                question.closest('.faq-tab-content')?.querySelectorAll('.faq-question').forEach(item=>{
                    const active=item===question&&open;item.classList.toggle('active',active);item.setAttribute('aria-expanded',String(active));item.nextElementSibling.classList.toggle('expanded',active);item.nextElementSibling.setAttribute('aria-hidden',String(!active));
                });
            });
        });
        let returnFocus=null;
        function closeModal(modal){modal?.classList.remove('active');modal?.setAttribute('aria-hidden','true');document.body.style.overflow='';returnFocus?.focus();}
        document.querySelectorAll('[data-modal]').forEach(trigger=>trigger.addEventListener('click',event=>{
            const modal=document.getElementById(trigger.dataset.modal);if(!modal)return;event.preventDefault();returnFocus=trigger;modal.classList.add('active');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';modal.querySelector('.close-modal')?.focus();
        }));
        document.querySelectorAll('.modal-overlay').forEach(modal=>{
            modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-hidden','true');
            const heading=modal.querySelector('h2');if(heading){heading.id||=`${modal.id}-title`;modal.setAttribute('aria-labelledby',heading.id);}
            const close=modal.querySelector('.close-modal');close?.setAttribute('aria-label','Close room details');close?.addEventListener('click',()=>closeModal(modal));
            modal.addEventListener('click',event=>{if(event.target===modal)closeModal(modal);});
            modal.addEventListener('keydown',event=>{
                if(event.key==='Escape')closeModal(modal);
                if(event.key==='Tab'){
                    const items=[...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')];if(!items.length)return;
                    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}
                    else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}
                }
            });
        });
        const banner=document.getElementById('cookie-banner'),accept=document.getElementById('accept-cookies'),decline=document.getElementById('decline-cookies');
        if(banner&&accept&&decline){
            let consent;try{consent=localStorage.getItem('cookieConsent');}catch{/* Private browsing can disable storage. */}
            if(!consent)setTimeout(()=>banner.classList.add('show'),1600);
            function choose(value){try{localStorage.setItem('cookieConsent',value);}catch{/* Dismiss even if storage is unavailable. */}banner.classList.remove('show');}
            accept.addEventListener('click',()=>choose('accepted'));decline.addEventListener('click',()=>choose('declined'));
        }
        const fab=document.getElementById('fab-main'),fabOptions=document.querySelector('.fab-options');
        if(fab&&fabOptions){
            fab.type='button';fab.setAttribute('aria-label','Contact the hotel');fab.setAttribute('aria-expanded','false');fabOptions.id||='contact-options';fab.setAttribute('aria-controls',fabOptions.id);
            const links=[...fabOptions.querySelectorAll('a')];links.forEach(link=>link.tabIndex=-1);
            function setContact(open){
                fabOptions.classList.toggle('open',open);fab.setAttribute('aria-expanded',String(open));links.forEach(link=>link.tabIndex=open?0:-1);
                const message=fab.querySelector('.fab-icon-message'),close=fab.querySelector('.fab-icon-close');if(message)message.style.display=open?'none':'block';if(close)close.style.display=open?'block':'none';
            }
            fab.addEventListener('click',()=>setContact(!fabOptions.classList.contains('open')));
            document.addEventListener('keydown',event=>{if(event.key==='Escape'&&fabOptions.classList.contains('open')){setContact(false);fab.focus();}});
        }
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
