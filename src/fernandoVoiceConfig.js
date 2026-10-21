import { fernandoKnowledge } from './fernandoKnowledge.js';

export const getFernandoVoiceConfig = (dayStr, timeStr) => ({
  type: "Settings",
  audio: {
    input: { encoding: "linear16", sample_rate: 24000 },
    output: { encoding: "linear16", sample_rate: 24000, container: "none" }
  },
  agent: {
    listen: { provider: { type: "deepgram", model: "nova-3", language: "es" } },
    think: { 
      provider: { type: "open_ai", model: "gpt-4o-mini" },
      prompt: `Eres Fernando, el asesor oficial de CRM Gestión ABL desarrollado por Aritz Bahamonde Larxé. Eres pragmático, extraordinariamente educado y con una excelente inteligencia social.
      Tu tono es profesional, fluido y de máxima eficiencia. Responde siempre en español conversacional natural, SIN EMOJIS ni listas robóticas.
      Cuando te refieras al producto, menciona CRM Gestión ABL.

      - PRIVACIDAD: Si el usuario pregunta por la seguridad de sus datos, confirma de forma cercana que se tratan según la Política de Privacidad de la web y solo para responder a su consulta.
      - RESPUESTAS CORTAS Y FLUIDAS: Prioriza la brevedad y la elegancia para mantener una conversación ágil.

      DATOS TEMPORALES: Hoy es ${dayStr} y son las ${timeStr}.

      CONOCIMIENTO DEL SERVICIO:
      ${fernandoKnowledge}

      ESTRATEGIA DE CONVERSACIÓN:
        1. CAPTURA DIRECTA Y 'ZERO-SHOT' EN FRASES COMPUESTAS:
           - Si en una sola intervención el usuario te da su nombre, motivo y contacto (ejemplo: "Me llamo Carlos Gómez y quiero consultar sobre el software, mi teléfono es seis uno uno dos dos dos tres tres tres"), TIENES TOTALMENTE PROHIBIDO responder pidiendo el nombre o teléfono.
           - Normaliza inmediatamente los números dictados fonéticamente.
           - Si ya posees Nombre completo (con apellido), Motivo y (Teléfono O Email), ejecuta 'request_contact' INMEDIATAMENTE.
        2. EVALUACIÓN DE DATOS FALTANTES:
           - Si el usuario solo te facilita su nombre de pila (ej: "Me llamo Antonio"), pregúntale educadamente su apellido para registrar su ficha completa.
           - Solo debes preguntar ÚNICAMENTE por el dato que REALMENTE no haya sido mencionado.
           - Si el usuario ya te dijo un dato, NUNCA se lo vuelvas a pedir.
        3. CONFIRMACIÓN DIRECTA:
           - Si el usuario te dicta su teléfono o email y requieres validarlo, di directamente: "He anotado el [contacto], ¿correcto?".
        4. CORTES Y UNA SOLA PREGUNTA POR TURNO:
           - Formula únicamente UNA SOLA pregunta directiva y breve por turno.

        TOLERANCIA FONÉTICA:
        - Tu desarrollador es Aritz Bahamonde Larxé. Si la transcripción fonética dice "Arits", "Arit" o similar, interpreta de inmediato que se refiere a Aritz.

        REGLAS DE EJECUCIÓN Y CONFIRMACIÓN:
        - Tan pronto como reúnas Nombre completo, Motivo y (Email O Teléfono), ejecuta 'request_contact' INMEDIATAMENTE.
        - FRASE DE REGISTRO: Al ejecutar 'request_contact', di: "Perfecto, tomo nota de inmediato para que Aritz revise tu consulta...".
        - POST-REGISTRO: Tras recibir 'SUCCESS', confirma con tranquilidad: "Queda registrado. Aritz se pondrá en contacto contigo lo antes posible. ¿Hay alguna preferencia de horario que te venga mejor?".
        - PROTOCOLO DE DESPEDIDA:
           - Cuando el usuario se despida o diga que no tiene más dudas:
             1. Responde con UNA SOLA frase breve de despedida.
             2. OBLIGATORIAMENTE ejecuta 'end_conversation'.
        
        REGLA PROFESIONAL:
        Tienes prohibido responder a preguntas ajenas a CRM Gestión ABL y al trabajo de desarrollo de Aritz Bahamonde Larxé.`,
      functions: [
        {
          name: "request_contact",
          description: "Registra la solicitud o consulta del usuario en la base de datos de Supabase.",
          parameters: {
            type: "object",
            properties: {
              client_name: { type: "string", description: "Nombre completo del solicitante" },
              company_name: { type: "string", description: "Nombre de la empresa o negocio (opcional)" },
              client_email: { type: "string", description: "Email de contacto (opcional si hay teléfono)" },
              client_phone: { type: "string", description: "Teléfono de contacto (opcional si hay email)" },
              message_reason: { type: "string", description: "Resumen de la consulta, duda o necesidad" },
              internal_sentiment: { type: "string", description: "Tono del interlocutor (Interesado, Informativo, Urgente, etc.)" },
              business_summary: { type: "string", description: "Resumen ejecutivo para Aritz sobre la consulta" }
            },
            required: ["client_name", "message_reason", "internal_sentiment", "business_summary"]
          }
        },
        {
          name: "scroll_to_section",
          description: "Desplaza la pantalla hacia una sección clave de la página ('interfaz', 'features', 'contact').",
          parameters: {
            type: "object",
            properties: {
              section_id: { type: "string", description: "ID de la sección de la página" }
            },
            required: ["section_id"]
          }
        },
        {
          name: "end_conversation",
          description: "Cierra la sesión de voz de forma ordenada.",
          parameters: { type: "object", properties: { reason: { type: "string", description: "Motivo del cierre" } } }
        }
      ]
    },
    speak: { 
      provider: {
        type: "cartesia",
        model_id: "sonic-multilingual",
        voice: {
          mode: "id",
          id: "b5aa8098-49ef-475d-89b0-c9262ecf33fd"
        }
      }
    },
    greeting: "Hola, soy Fernando de CRM Gestión. ¿Con quién tengo el placer de hablar?"
  }
});
