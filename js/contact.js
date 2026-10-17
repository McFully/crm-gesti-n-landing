/**
 * Controlador único de envío de leads hacia la pasarela centralizada ABL
 * © 2026 Aritz Bahamonde Larxé. Todos los derechos reservados.
 */
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    let isSubmitting = false;

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (isSubmitting) return;

        const submitBtn = document.getElementById('submitButton');
        const submitText = document.getElementById('submitText');
        const submitIcon = document.getElementById('submitIcon');

        const name = document.getElementById('formName')?.value.trim() || '';
        const email = document.getElementById('formEmail')?.value.trim() || '';
        const phone = document.getElementById('formPhone')?.value.trim() || '';
        const message = document.getElementById('formMessage')?.value.trim() || '';

        if (!name || !email || !message) return;

        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-80', 'cursor-wait');
        submitText.innerText = 'Sincronizando...';
        submitIcon.className = 'fas fa-spinner animate-spin text-xs';

        const payload = {
            name,
            email,
            phone,
            message,
            notes: 'Enviado desde el formulario de contacto de CRM Gestión.',
            source: 'CRM Gestión'
        };

        try {
            const res = await fetch('https://aritz-bahamonde.vercel.app/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                submitIcon.className = 'fas fa-check-circle text-xs';
                submitText.innerText = '¡Enviado con Éxito!';
                submitBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
                submitBtn.classList.add('bg-emerald-600');
                contactForm.reset();

                setTimeout(() => {
                    submitIcon.className = 'fas fa-paper-plane text-xs';
                    submitText.innerText = 'Enviar Mensaje';
                    submitBtn.classList.remove('bg-emerald-600', 'opacity-80', 'cursor-wait');
                    submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
                    submitBtn.disabled = false;
                    isSubmitting = false;
                }, 5000);
            } else {
                throw new Error('Error al enviar');
            }
        } catch (err) {
            console.error('[Contact Form Error]', err);
            submitIcon.className = 'fas fa-exclamation-triangle text-xs';
            submitText.innerText = 'Error al enviar';
            submitBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
            submitBtn.classList.add('bg-rose-600');

            setTimeout(() => {
                submitIcon.className = 'fas fa-paper-plane text-xs';
                submitText.innerText = 'Enviar Mensaje';
                submitBtn.classList.remove('bg-rose-600', 'opacity-80', 'cursor-wait');
                submitBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
                submitBtn.disabled = false;
                isSubmitting = false;
            }, 5000);
        }
    });
});
