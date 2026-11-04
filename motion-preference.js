(() => {
    'use strict';
    const root = document.documentElement;
    let enabled = true;
    try { enabled = localStorage.getItem('samita-motion') !== 'off'; } catch { /* Motion starts on when storage is unavailable. */ }
    function set(value, remember = false) {
        enabled = Boolean(value);
        root.classList.toggle('motion-opt-in', enabled);
        root.classList.toggle('motion-disabled', !enabled);
        if (remember) try { localStorage.setItem('samita-motion', enabled ? 'on' : 'off'); } catch { /* Keep the setting for this page. */ }
    }
    window.SamitaMotion = { enabled: () => enabled, set };
    set(enabled);

    if (root.dataset.intro === 'welcome' && enabled) {
        let played = false;
        try { played = sessionStorage.getItem('samita-intro-restored-v1') === 'true'; } catch { /* Play on this visit. */ }
        if (!played) {
            root.classList.add('show-intro');
            // The page remains usable if the deferred intro controller cannot load.
            window.samitaIntroFailSafe = setTimeout(() => root.classList.remove('show-intro'), 8000);
        }
    }
})();
