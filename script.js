// ==========================================
// 1. PAGE TRANSITION & DYNAMIC BOOKING ENGINE
// ==========================================
function initLuxuryInteractions() {
    const overlay = document.getElementById('samita-wipe-transition');
    
    // REVEAL LOGIC (On Page Load)
    if(overlay) {
        // Note: 'active' and 'wipe-out' are now in HTML by default to prevent flashing
        setTimeout(() => {
            overlay.classList.remove('active', 'wipe-out');
        }, 1500); 
    }

    const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto"]):not([href^="tel"]):not([target="_blank"])');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.href;
            if(overlay) {
                overlay.classList.add('active', 'wipe-in');
            }
            
            // Allow 800ms for sweepUpIn to lock
            setTimeout(() => { window.location.href = target; }, 800);
        });
    });

    // ==========================================
    // 2. DYNAMIC LINKED CALENDARS (REMOVED)
    // ==========================================
    // Booking engine removed for portfolio site.

    const staggerElements = document.querySelectorAll('.stagger-text');
    staggerElements.forEach(el => {
        if (el.classList.contains('stagger-initialized')) return;
        const text = el.innerText; el.innerText = ''; 
        text.split('').forEach((char, i) => {
            const wrap = document.createElement('span'); wrap.className = 'char-wrap';
            const charSpan = document.createElement('span'); charSpan.className = 'char';
            charSpan.innerText = char === ' ' ? '\u00A0' : char; 
            charSpan.setAttribute('data-char', char === ' ' ? '\u00A0' : char);
            charSpan.style.setProperty('--char-index', i);
            wrap.appendChild(charSpan); el.appendChild(wrap);
        });
        el.classList.add('stagger-initialized');
    });

    if (!document.getElementById('scroll-top-btn')) {
        const scrollTopBtn = document.createElement('button');
        scrollTopBtn.id = 'scroll-top-btn'; scrollTopBtn.innerHTML = '↑';
        document.body.appendChild(scrollTopBtn);

        scrollTopBtn.addEventListener('click', () => {
            const scrollStep = -window.scrollY / (1500 / 15);
            const scrollInterval = setInterval(() => {
                if (window.scrollY !== 0) {
                    window.scrollBy(0, scrollStep);
                } else {
                    clearInterval(scrollInterval);
                }
            }, 15);
        });
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { scrollTopBtn.classList.add('show'); } 
            else { scrollTopBtn.classList.remove('show'); }
        });
    }

    // ==========================================
    // 8. FOOTER ANIMATED NETWORK ENGINE
    // ==========================================
    const footerCanvas = document.getElementById('footer-network');
    if (footerCanvas) {
        const fctx = footerCanvas.getContext('2d');
        let fParticles = [];
        
        function resizeFooter() {
            footerCanvas.width = footerCanvas.parentElement.offsetWidth;
            footerCanvas.height = footerCanvas.parentElement.offsetHeight;
        }
        window.addEventListener('resize', resizeFooter);
        resizeFooter();

        class FooterNode {
            constructor() {
                this.x = Math.random() * footerCanvas.width; this.y = Math.random() * footerCanvas.height;
                this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 1.5 + 0.5;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if(this.x < 0 || this.x > footerCanvas.width) this.vx *= -1;
                if(this.y < 0 || this.y > footerCanvas.height) this.vy *= -1;
            }
            draw() {
                fctx.beginPath(); fctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                fctx.fillStyle = '#C6A87C'; fctx.fill();
            }
        }

// Creates 80 particles on desktop, but only 30 on mobile!
let particleCount = window.innerWidth < 900 ? 30 : 80;
for(let i=0; i<particleCount; i++) fParticles.push(new FooterNode());

        function animateFooter() {
            fctx.clearRect(0, 0, footerCanvas.width, footerCanvas.height);
            for(let i=0; i<fParticles.length; i++) {
                fParticles[i].update(); fParticles[i].draw();
                for(let j = i + 1; j < fParticles.length; j++) {
                    const dx = fParticles[i].x - fParticles[j].x;
                    const dy = fParticles[i].y - fParticles[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if(dist < 120) {
                        fctx.beginPath();
                        fctx.strokeStyle = `rgba(198, 168, 124, ${1 - dist/120})`;
                        fctx.lineWidth = 0.5;
                        fctx.moveTo(fParticles[i].x, fParticles[i].y);
                        fctx.lineTo(fParticles[j].x, fParticles[j].y);
                        fctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateFooter);
        }
        animateFooter();
    }
    
    // CUSTOM LUXURY CURSOR
    if (typeof initCustomCursor === 'function') initCustomCursor();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuxuryInteractions);
} else {
    initLuxuryInteractions();
}

const modalTriggers = document.querySelectorAll('.room-card, [data-modal]');
const closeButtons = document.querySelectorAll('.close-modal');
const modals = document.querySelectorAll('.modal-overlay');

modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
        if(e.target.classList.contains('btn-book-now') || (e.target.tagName.toLowerCase() === 'a' && !e.target.hasAttribute('data-modal'))) return; 
        
        const modalId = this.getAttribute('data-modal') || e.target.getAttribute('data-modal');
        if(!modalId) return;

        const targetModal = document.getElementById(modalId);
        if (targetModal) { targetModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    });
});

closeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal-overlay').classList.remove('active'); document.body.style.overflow = 'auto'; 
    });
});

modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) { this.classList.remove('active'); document.body.style.overflow = 'auto'; }
    });
});

// ==========================================
// 6. LANDO NORRIS LIQUID MASK ENGINE
// ==========================================
const hero = document.getElementById('home-hero');
const layer = document.getElementById('reveal-layer');

if (hero && layer) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let targetSize = 0;
    let currentSize = 0;
    let idleTimer;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;

        targetSize = 250; 
        
        clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            targetSize = 0;
        }, 1000);
    });

    hero.addEventListener('mouseenter', () => { targetSize = 250; });
    hero.addEventListener('mouseleave', () => { 
        targetSize = 0; 
        clearTimeout(idleTimer); 
    });

    function updateLiquid() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        
        const velX = targetX - currentX;
        const velY = targetY - currentY;
        const speed = Math.sqrt(velX * velX + velY * velY);
        
        let dynamicTargetSize = targetSize;
        if (targetSize > 0) {
            dynamicTargetSize = targetSize + (speed * 1.2);
            if (dynamicTargetSize > 400) dynamicTargetSize = 400; 
        }
        
        currentSize += (dynamicTargetSize - currentSize) * 0.15;

        layer.style.setProperty('--m-x', currentX + 'px');
        layer.style.setProperty('--m-y', currentY + 'px');
        layer.style.setProperty('--m-size', currentSize + 'px');
        
        requestAnimationFrame(updateLiquid);
    }
    updateLiquid();
}

// ==========================================
// 9. CUSTOM LUXURY CURSOR ENGINE
// ==========================================
function initCustomCursor() {
    if (window.innerWidth < 901) return;

    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'luxury-cursor-container';
    
    const triangle = document.createElement('div');
    triangle.className = 'cursor-triangle';
    
    const snowflake = document.createElement('div');
    snowflake.className = 'cursor-snowflake';
    snowflake.innerHTML = '<span class="snowflake-inner">❄</span>';
    
    cursorContainer.appendChild(triangle);
    cursorContainer.appendChild(snowflake);
    document.body.appendChild(cursorContainer);

    let mouseX = -100, mouseY = -100;
    let curX = -100, curY = -100;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateCursor() {
        // Instant position for the triangle
        triangle.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) rotate(-30deg)`;
        
        // Smooth lagging effect for the snowflake
        curX += (mouseX - curX) * 0.12;
        curY += (mouseY - curY) * 0.12;
        snowflake.style.transform = `translate(${curX}px, ${curY}px)`;

        requestAnimationFrame(updateCursor);
    }
    updateCursor();
}
// ==========================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// ==========================================
// This makes the page scroll down smoothly when clicking any anchor link
const smoothScrollLinks = document.querySelectorAll('a[href*="#"]');

smoothScrollLinks.forEach(link => {
    link.addEventListener('click', function(event) {
        // Check if the link points to an anchor on the same page
        const isSamePath = location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') || 
                           (location.pathname === '/' && this.pathname === '/index.html') ||
                           (location.pathname === '/index.html' && this.pathname === '/');
        
        if (isSamePath && location.hostname === this.hostname && this.hash) {
            let target = document.querySelector(this.hash);
            
            if (target) {
                event.preventDefault();
                // Determine offset for fixed header (approx 80px)
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ==========================================
// FAQ SECTION LOGIC
// ==========================================
const faqTabs = document.querySelectorAll('.faq-tab');
const faqContents = document.querySelectorAll('.faq-tab-content');

faqTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        faqTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all contents
        faqContents.forEach(content => content.classList.remove('active'));
        
        // Show target content
        const targetId = tab.getAttribute('data-target');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        // Close other accordions in the same tab
        const currentTab = question.closest('.faq-tab-content');
        if (currentTab) {
            const otherQuestions = currentTab.querySelectorAll('.faq-question');
            otherQuestions.forEach(q => {
                if (q !== question && q.classList.contains('active')) {
                    q.classList.remove('active');
                    q.nextElementSibling.classList.remove('expanded');
                }
            });
        }

        // Toggle current accordion
        question.classList.toggle('active');
        const answer = question.nextElementSibling;
        answer.classList.toggle('expanded');
    });
});
