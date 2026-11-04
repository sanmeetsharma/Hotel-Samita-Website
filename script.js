(() => {
    'use strict';
    function init() {
        const motionAllowed=()=>window.SamitaMotion?.enabled() ?? true;
        document.documentElement.classList.toggle('motion-opt-in',motionAllowed());
        document.documentElement.classList.toggle('motion-disabled',!motionAllowed());
        const behavior=()=>motionAllowed()?'smooth':'instant';
        const overlay=document.getElementById('samita-wipe-transition');
        let navigating=false;
        function clearTransition(){navigating=false;overlay?.classList.remove('active','wipe-in','wipe-out');document.body.classList.remove('is-leaving');}
        if(overlay){
            if(!motionAllowed())clearTransition();
            else {
                overlay.addEventListener('animationend',event=>{if(event.target===overlay&&overlay.classList.contains('wipe-out'))clearTransition();});
                setTimeout(()=>{if(!navigating)clearTransition();},1600);
            }
        }
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
            const destination=link.href;setTimeout(()=>location.assign(destination),800);
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
        const tabs = [...document.querySelectorAll('.faq-tab')];
        const panels = [...document.querySelectorAll('.faq-tab-content')];
        const answerAnimations = new WeakMap();
        function setAnswer(question, open) {
            const answer = question.nextElementSibling;
            const inner = answer?.querySelector('.faq-answer-inner');
            if (!answer || !inner) return;
            const oldAnimation = answerAnimations.get(answer);
            if (!oldAnimation && question.getAttribute('aria-expanded')===String(open)) return;
            const currentHeight = answer.getBoundingClientRect().height;
            oldAnimation?.cancel();
            answer.style.height = currentHeight+'px';
            question.classList.toggle('active',open);
            question.setAttribute('aria-expanded',String(open));
            answer.classList.toggle('expanded',open);
            answer.setAttribute('aria-hidden',String(!open));
            answer.inert = !open;
            const targetHeight = open ? inner.getBoundingClientRect().height : 0;
            if (!motionAllowed() || Math.abs(targetHeight-currentHeight)<1) {
                answer.style.height = open ? 'auto' : '0px';
                answer.classList.remove('is-animating');
                answerAnimations.delete(answer);
                return;
            }
            answer.classList.add('is-animating');
            const animation = answer.animate([
                {height:currentHeight+'px'}, {height:targetHeight+'px'}
            ],{duration:open?420:360,easing:'cubic-bezier(.25,.75,.25,1)',fill:'both'});
            answerAnimations.set(answer,animation);
            animation.onfinish = () => {
                if (answerAnimations.get(answer)!==animation) return;
                answer.style.height = open ? 'auto' : '0px';
                answer.classList.remove('is-animating');
                answerAnimations.delete(answer);
                animation.cancel();
            };
        }
        tabs.forEach(tab => {
            tab.type = 'button';
            tab.setAttribute('aria-controls',tab.dataset.target);
            tab.setAttribute('aria-pressed',String(tab.classList.contains('active')));
            tab.addEventListener('click',() => {
                tabs.forEach(item => {
                    const active = item===tab;
                    item.classList.toggle('active',active);
                    item.setAttribute('aria-pressed',String(active));
                });
                panels.forEach(panel => panel.classList.toggle('active',panel.id===tab.dataset.target));
            });
        });
        document.querySelectorAll('.faq-question').forEach((question,index) => {
            const answer = question.nextElementSibling;
            if (!answer) return;
            question.type = 'button';
            answer.id ||= 'faq-answer-'+index;
            question.setAttribute('aria-controls',answer.id);
            question.setAttribute('aria-expanded','false');
            answer.setAttribute('aria-hidden','true');
            answer.inert = true;
            answer.style.height = '0px';
            question.addEventListener('click',() => {
                const open = question.getAttribute('aria-expanded')!=='true';
                question.closest('.faq-tab-content')?.querySelectorAll('.faq-question').forEach(item => setAnswer(item,item===question&&open));
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
        initFooterNetwork(motionAllowed);
    }
    function initFooterNetwork(motionAllowed) {
        const canvas = document.getElementById('footer-network');
        const context = canvas?.getContext('2d');
        if (!context) return;
        const points = Array.from({length:innerWidth<720?22:40},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.00002,vy:(Math.random()-.5)*.00002}));
        let width=1,height=1,visible=false,frame=0,last=0;
        function paint(time=0) {
            frame=0;
            const moving=visible&&motionAllowed()&&!document.hidden;
            const elapsed=time?Math.max(0,Math.min(time-last,50)):0;
            if (time===0 || time-last>=32) {
                context.clearRect(0,0,width,height);
                points.forEach(point=>{
                    if(moving){point.x=(point.x+point.vx*elapsed+1)%1;point.y=(point.y+point.vy*elapsed+1)%1;}
                    context.fillStyle='rgba(231,174,67,.65)';
                    context.beginPath();context.arc(point.x*width,point.y*height,1.3,0,Math.PI*2);context.fill();
                });
                for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
                    const a=points[i],b=points[j],distance=Math.hypot((a.x-b.x)*width,(a.y-b.y)*height);
                    if(distance>140)continue;
                    context.strokeStyle='rgba(231,174,67,'+((1-distance/140)*.22)+')';
                    context.beginPath();context.moveTo(a.x*width,a.y*height);context.lineTo(b.x*width,b.y*height);context.stroke();
                }
                last=time;
            }
            if(moving)frame=requestAnimationFrame(paint);
        }
        function start(){if(!frame&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(paint);}}
        function resize(){
            const box=canvas.parentElement.getBoundingClientRect();width=box.width;height=box.height;
            const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0);
            cancelAnimationFrame(frame);paint();
        }
        if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas.parentElement);else window.addEventListener('resize',resize);
        if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}}).observe(canvas);
        document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
        document.addEventListener('samita-motion-change',()=>{cancelAnimationFrame(frame);frame=0;paint();start();});
        resize();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
