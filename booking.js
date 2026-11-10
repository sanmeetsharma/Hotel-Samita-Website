'use strict';

const form = document.getElementById('booking-form');
const hotelSelect = document.getElementById('booking-hotel');
const fields = form.elements;
const checkIn = fields.checkIn;
const checkOut = fields.checkOut;
const draft = document.getElementById('booking-draft');
const draftLink = document.getElementById('booking-draft-link');
const draftText = document.getElementById('booking-draft-text');

const hotels = new Map([
    ['any', { name: 'Please help me choose a property', email: 'reservations@thesamita.com' }],
    ['grand', { name: 'The Samita Grand', email: 'hotelsamitagrand@gmail.com' }],
    ['new-grand', { name: 'The New Samita Grand', email: 'newsamitagrand@gmail.com' }]
]);

const requestedHotel = new URLSearchParams(window.location.search).get('hotel');
const innBookingPage = '/booking-inn.html';
if (hotelSelect && hotels.has(requestedHotel)) hotelSelect.value = requestedHotel;
hotelSelect?.addEventListener('change', () => {
    if (hotelSelect.value === 'inn') window.location.assign(innBookingPage);
});

function todayForBooking() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

function syncDates() {
    const today = todayForBooking();
    checkIn.min = today;
    const firstNight = Math.max(Date.parse(today), checkIn.valueAsNumber || 0);
    const nextDay = new Date(firstNight);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    checkOut.min = Number.isFinite(nextDay.getTime()) ? nextDay.toISOString().split('T')[0].replace(/^\+/, '') : '';
    const invalidOrder = checkOut.valueAsNumber <= checkIn.valueAsNumber;
    checkOut.setCustomValidity(invalidOrder ? 'Choose a check-out date after your check-in date.' : '');
}

function clearDraft() {
    draft.hidden = true;
    draftLink.removeAttribute('href');
    draftText.value = '';
}

form.addEventListener('input', () => {
    fields.guestName.setCustomValidity('');
    fields.contactNumber.setCustomValidity('');
    syncDates();
    clearDraft();
});
form.addEventListener('change', () => {
    syncDates();
    clearDraft();
});

form.addEventListener('submit', event => {
    event.preventDefault();
    const hotel = hotels.get(hotelSelect?.value || form.dataset.hotel);
    if (!hotel) return;
    syncDates();
    const guestName = fields.guestName.value.trim().replace(/\s+/g, ' ');
    const contactNumber = fields.contactNumber.value.trim();
    const phoneDigits = contactNumber.replace(/\D/g, '');
    fields.guestName.setCustomValidity(guestName ? '' : 'Enter your name.');
    const validPhone = /^\+?[\d\s().-]+$/.test(contactNumber) && phoneDigits.length >= 7 && phoneDigits.length <= 15;
    fields.contactNumber.setCustomValidity(validPhone ? '' : 'Enter a contact number with 7 to 15 digits.');
    if (!form.reportValidity()) return;

    const subject = `Booking Request - ${guestName}`;
    const body = [
        'Hello,',
        '',
        'I would like to request a booking with the following details.',
        '',
        `Property: ${hotel.name}`,
        `Check-in: ${checkIn.value}`,
        `Check-out: ${checkOut.value}`,
        `Rooms: ${fields.rooms.valueAsNumber}`,
        `Adults: ${fields.adults.valueAsNumber}`,
        `Children (12 and under): ${fields.children.valueAsNumber}`,
        `Name: ${guestName}`,
        `Contact number: ${contactNumber}`,
        '',
        'Please let me know about availability and rates.',
        'Thank you.'
    ].join('\r\n');

    const mailto = `mailto:${hotel.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    draftLink.href = mailto;
    draftText.value = `To: ${hotel.email}\nSubject: ${subject}\n\n${body}`;
    draft.hidden = false;
    window.location.href = mailto;
});

if (hotelSelect && requestedHotel === 'inn') {
    window.location.replace(innBookingPage);
} else {
    syncDates();
    window.addEventListener('pageshow', () => {
        if (hotelSelect?.value === 'inn') hotelSelect.value = 'any';
        syncDates();
    });
    document.getElementById('booking-fields').disabled = false;
}
