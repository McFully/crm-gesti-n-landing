/**
 * Sincroniza el contacto o solicitud recogida por Fernando directamente con Supabase
 * a través de la API central de contacto oficial
 */
export async function syncLeadToSupabase(contactData) {
  const payload = {
    name: contactData.name || 'Sin Nombre',
    email: contactData.email || '',
    phone: contactData.phone || '',
    message: contactData.message || 'Consulta vía Fernando AI',
    notes: '[FERNANDO AI]\nSentimiento: ' + (contactData.sentiment || 'Neutral') + '\nResumen: ' + (contactData.summary || 'N/A') + (contactData.company ? ('\nEmpresa: ' + contactData.company) : ''),
    source: 'CRM Gestión'
  };

  const response = await fetch('https://aritz-bahamonde.vercel.app/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error('Error al sincronizar con Supabase: ' + response.status + ' - ' + errorDetails);
  }

  return { success: true };
}
