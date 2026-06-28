// ==========================================
// 1. HOMEPAGE REDIRECTS
// ==========================================
// Select the buttons on the home page
const samitaGrandBtn = document.getElementById('btn-samita-grand');
const newSamitaGrandBtn = document.getElementById('btn-new-samita-grand');

// Add click events to redirect users to the respective hotel pages
if (samitaGrandBtn) {
    samitaGrandBtn.addEventListener('click', () => {
        const overlay = document.getElementById('samita-wipe-transition');
        if(overlay) overlay.classList.add('active', 'wipe-in');
        setTimeout(() => { window.location.href = 'samita-grand.html'; }, 800);
    });
}

if (newSamitaGrandBtn) {
    newSamitaGrandBtn.addEventListener('click', () => {
        const overlay = document.getElementById('samita-wipe-transition');
        if(overlay) overlay.classList.add('active', 'wipe-in');
        setTimeout(() => { window.location.href = 'new-samita-grand.html'; }, 800);
    });
}

// ==========================================
// 2. EXPANDABLE LOCAL ATTRACTIONS
// ==========================================
const expandAttractionsBtn = document.getElementById('expand-attractions-btn');
const attractionsDetails = document.getElementById('attractions-detailed-view');

if (expandAttractionsBtn && attractionsDetails) {
    expandAttractionsBtn.addEventListener('click', () => {
        // Toggle the 'show' class which will be handled in CSS (e.g., display: block;)
        attractionsDetails.classList.toggle('show');
        
        // Change the button text based on whether it's open or closed
        if (attractionsDetails.classList.contains('show')) {
            expandAttractionsBtn.innerText = "[- Click to hide details ]";
        } else {
            expandAttractionsBtn.innerText = "[+ Click to see more detailed info and pictures of each spot ]";
        }
    });
}

// ==========================================
// 3. ROOM CARD INTERACTIVITY (Grid to Expanded View)
// ==========================================
// Grab all room cards on the page
const roomCards = document.querySelectorAll('.room-card');

roomCards.forEach(card => {
    card.addEventListener('click', function() {
        // Remove the 'expanded' class from all OTHER cards so only one is open at a time
        roomCards.forEach(otherCard => {
            if (otherCard !== this) {
                otherCard.classList.remove('expanded');
            }
        });
        
        // Toggle the 'expanded' class on the clicked card
        this.classList.toggle('expanded');
    });
});

// ==========================================
// 4. PREVENT "BOOK NOW" FROM TRIGGERING CARD EXPANSION
// ==========================================
// When a user clicks the "Book Now" button inside a room card, 
// we don't want the whole card to expand/collapse. We just want to redirect them.
const bookNowButtons = document.querySelectorAll('.btn-book-now');

bookNowButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        // Stop the click from bubbling up to the room-card element
        event.stopPropagation(); 
        
        const overlay = document.getElementById('samita-wipe-transition');
        if(overlay) overlay.classList.add('active', 'wipe-in');
        
        // Redirect to booking page (replace with your actual booking link)
        setTimeout(() => { window.location.href = 'contact-booking.html'; }, 800);
    });
});

// ==========================================
// 5. SMOOTH SCROLLING FOR FOOTER LINKS
// ==========================================
// This makes the page scroll down smoothly when clicking any anchor link
const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');

smoothScrollLinks.forEach(link => {
    link.addEventListener('click', function(event) {
        // Only prevent default if it has a valid target ID (not just "#")
        if (this.getAttribute('href').length > 1) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Determine offset for fixed header (approx 80px)
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});