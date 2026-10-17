/**
 * Interacciones de interfaz: Cookies, Menú Móvil, Lightbox y Modales Legales
 * © 2026 Aritz Bahamonde Larxé. Todos los derechos reservados.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Consentimiento de Cookies
    const cookiesModal = document.getElementById('cookiesModal');
    const cookiesCard = document.getElementById('cookiesCard');
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');

    const showCookies = () => {
        if (!cookiesModal || !cookiesCard) return;
        cookiesModal.classList.remove('opacity-0', 'pointer-events-none');
        cookiesCard.classList.remove('scale-95');
        cookiesCard.classList.add('scale-100');
    };

    const hideCookies = () => {
        if (!cookiesModal || !cookiesCard) return;
        cookiesModal.classList.add('opacity-0', 'pointer-events-none');
        cookiesCard.classList.remove('scale-100');
        cookiesCard.classList.add('scale-95');
    };

    if (!localStorage.getItem('crm_cookies_consent_v1')) {
        setTimeout(showCookies, 1000);
    }

    acceptBtn?.addEventListener('click', () => {
        localStorage.setItem('crm_cookies_consent_v1', 'accepted');
        hideCookies();
    });

    declineBtn?.addEventListener('click', () => {
        localStorage.setItem('crm_cookies_consent_v1', 'declined');
        hideCookies();
    });

    // 2. Menú Móvil
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    const closeMobileMenu = () => {
        if (!mobileMenu || !menuIcon) return;
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        menuIcon.className = 'fas fa-bars text-lg';
    };

    menuToggle?.addEventListener('click', () => {
        const isOpen = mobileMenu?.classList.contains('opacity-100');
        if (isOpen) {
            closeMobileMenu();
        } else {
            mobileMenu?.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            mobileMenu?.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
            if (menuIcon) menuIcon.className = 'fas fa-times text-lg';
        }
    });

    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    // 3. Lightbox de Capturas
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxInner = document.getElementById('lightbox-inner');
    const lightboxClose = document.getElementById('lightbox-close');

    function openLightbox(src, caption) {
        if (!lightbox || !lightboxImg || !lightboxCaption || !lightboxInner) return;
        lightboxImg.src = src;
        lightboxImg.alt = caption;
        lightboxCaption.textContent = caption;
        lightbox.classList.remove('opacity-0', 'pointer-events-none');
        lightbox.classList.add('opacity-100', 'pointer-events-auto');
        lightboxInner.classList.remove('scale-95');
        lightboxInner.classList.add('scale-100');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox || !lightboxImg || !lightboxInner) return;
        lightbox.classList.remove('opacity-100', 'pointer-events-auto');
        lightbox.classList.add('opacity-0', 'pointer-events-none');
        lightboxInner.classList.remove('scale-100');
        lightboxInner.classList.add('scale-95');
        document.body.style.overflow = '';
        setTimeout(() => { lightboxImg.src = ''; }, 300);
    }

    document.querySelectorAll('.lightbox-trigger').forEach(el => {
        el.addEventListener('click', () => {
            openLightbox(el.dataset.src, el.dataset.caption || '');
        });
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            window.closeLegalModal();
        }
    });
});

// 4. Modales Legales Expuestos Globalmente
window.openLegalModal = function (type) {
    const legalModal = document.getElementById('legalModal');
    const legalCard = document.getElementById('legalCard');
    const contentNotice = document.getElementById('legalContentNotice');
    const contentPrivacy = document.getElementById('legalContentPrivacy');
    const contentCookies = document.getElementById('legalContentCookies');

    if (!legalModal || !legalCard || !contentNotice || !contentPrivacy || !contentCookies) return;

    contentNotice.classList.add('hidden');
    contentPrivacy.classList.add('hidden');
    contentCookies.classList.add('hidden');

    if (type === 'notice') contentNotice.classList.remove('hidden');
    else if (type === 'privacy') contentPrivacy.classList.remove('hidden');
    else if (type === 'cookies') contentCookies.classList.remove('hidden');

    legalModal.classList.remove('opacity-0', 'pointer-events-none');
    legalCard.classList.remove('scale-95');
    legalCard.classList.add('scale-100');
    document.body.style.overflow = 'hidden';
};

window.closeLegalModal = function () {
    const legalModal = document.getElementById('legalModal');
    const legalCard = document.getElementById('legalCard');
    if (!legalModal || !legalCard) return;

    legalModal.classList.add('opacity-0', 'pointer-events-none');
    legalCard.classList.remove('scale-100');
    legalCard.classList.add('scale-95');
    document.body.style.overflow = '';
};
