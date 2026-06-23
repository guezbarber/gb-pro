// Diccionario central de traducciones.
// Agregar una nueva clave acá hace que esté disponible en los 3 idiomas a la vez.
// Estructura: TRADUCCIONES[idioma][clave]

export const IDIOMAS_SOPORTADOS = ["es", "en", "pt"];
export const IDIOMA_DEFAULT = "es";

export const TRADUCCIONES = {
  es: {
    // Reserva pública — paso 1
    "reserva.elegirBarbero": "1. Elige tu barbero",
    "reserva.elegirServicio": "1. Elige tu servicio",
    "reserva.sinPreferencia": "Sin preferencia — cualquier barbero disponible",
    "reserva.barbero": "Barbero",
    "reserva.min": "min",
    "reserva.volver": "Volver",

    // Paso 3 — fecha y hora
    "reserva.cuandoVienes": "¿Cuándo vienes?",
    "reserva.seleccionaDia": "Selecciona un día",
    "reserva.horariosDisponibles": "Horarios disponibles",
    "reserva.buscandoHorarios": "Buscando horarios...",
    "reserva.agendaLlena": "Agenda llena para este día. Prueba con otro.",
    "reserva.continuar": "Continuar",

    // Paso 4 — datos
    "reserva.tusDatos": "Tus datos",
    "reserva.servicio": "Servicio",
    "reserva.total": "Total",
    "reserva.senaAPagar": "Seña a pagar ahora",
    "reserva.dia": "Día",
    "reserva.hora": "Hora",
    "reserva.tuNombre": "Tu Nombre",
    "reserva.telefono": "Teléfono / WhatsApp",
    "reserva.email": "Email",
    "reserva.emailRequerido": "(requerido para el pago)",
    "reserva.emailOpcional": "(opcional — para recibir confirmación)",
    "reserva.placeholderNombre": "Ej: Lucas",
    "reserva.placeholderTelefono": "Ej: 099123456",
    "reserva.placeholderEmail": "Ej: lucas@gmail.com",
    "reserva.pagarSenaY": "Pagar seña",
    "reserva.yConfirmar": "y confirmar",
    "reserva.confirmarTurno": "Confirmar turno",
    "reserva.confirmando": "Confirmando...",
    "reserva.redirigiendoPago": "Redirigiendo a MercadoPago...",
    "reserva.senaDescuenta": "La seña de",
    "reserva.seDescuentaDelTotal": "se descuenta del total el día del turno.",

    // Paso 5 — pago pendiente
    "reserva.pagoPendiente": "Pago pendiente",
    "reserva.pagoPendienteDesc": "Tu turno está reservado pero la seña no fue confirmada.",
    "reserva.reintentarPago": "Reintentar pago",

    // Paso 6 — confirmado
    "reserva.turnoConfirmado": "Turno confirmado",
    "reserva.teEsperamos": "Te esperamos el",
    "reserva.alasHoras": "a las",
    "reserva.confirmacionEnviada": "Confirmación enviada a",
    "reserva.avisarWhatsapp": "Avisar por WhatsApp",
    "reserva.verInstagram": "Ver trabajos en Instagram",
    "reserva.hacerOtraReserva": "Hacer otra reserva",
    "reserva.reservaTurnoOnline": "Reserva de turno online",
    "reserva.poweredBy": "Powered by",
    "reserva.barberiaNoEncontrada": "No se encontró esta barbería. Verificá el enlace.",
    "reserva.cargandoBarberia": "Cargando barbería...",
  },

  en: {
    "reserva.elegirBarbero": "1. Choose your barber",
    "reserva.elegirServicio": "1. Choose your service",
    "reserva.sinPreferencia": "No preference — any available barber",
    "reserva.barbero": "Barber",
    "reserva.min": "min",
    "reserva.volver": "Back",

    "reserva.cuandoVienes": "When are you coming?",
    "reserva.seleccionaDia": "Select a day",
    "reserva.horariosDisponibles": "Available times",
    "reserva.buscandoHorarios": "Finding available times...",
    "reserva.agendaLlena": "Fully booked this day. Try another one.",
    "reserva.continuar": "Continue",

    "reserva.tusDatos": "Your details",
    "reserva.servicio": "Service",
    "reserva.total": "Total",
    "reserva.senaAPagar": "Deposit to pay now",
    "reserva.dia": "Day",
    "reserva.hora": "Time",
    "reserva.tuNombre": "Your Name",
    "reserva.telefono": "Phone / WhatsApp",
    "reserva.email": "Email",
    "reserva.emailRequerido": "(required for payment)",
    "reserva.emailOpcional": "(optional — to receive confirmation)",
    "reserva.placeholderNombre": "e.g. John",
    "reserva.placeholderTelefono": "e.g. +1 555 123 4567",
    "reserva.placeholderEmail": "e.g. john@gmail.com",
    "reserva.pagarSenaY": "Pay deposit",
    "reserva.yConfirmar": "and confirm",
    "reserva.confirmarTurno": "Confirm appointment",
    "reserva.confirmando": "Confirming...",
    "reserva.redirigiendoPago": "Redirecting to payment...",
    "reserva.senaDescuenta": "The deposit of",
    "reserva.seDescuentaDelTotal": "will be deducted from the total on the day of the appointment.",

    "reserva.pagoPendiente": "Payment pending",
    "reserva.pagoPendienteDesc": "Your appointment is booked but the deposit hasn't been confirmed yet.",
    "reserva.reintentarPago": "Retry payment",

    "reserva.turnoConfirmado": "Appointment confirmed",
    "reserva.teEsperamos": "We'll see you on",
    "reserva.alasHoras": "at",
    "reserva.confirmacionEnviada": "Confirmation sent to",
    "reserva.avisarWhatsapp": "Notify via WhatsApp",
    "reserva.verInstagram": "See work on Instagram",
    "reserva.hacerOtraReserva": "Book another appointment",
    "reserva.reservaTurnoOnline": "Online booking",
    "reserva.poweredBy": "Powered by",
    "reserva.barberiaNoEncontrada": "This barbershop wasn't found. Check the link.",
    "reserva.cargandoBarberia": "Loading barbershop...",
  },

  pt: {
    "reserva.elegirBarbero": "1. Escolha seu barbeiro",
    "reserva.elegirServicio": "1. Escolha seu serviço",
    "reserva.sinPreferencia": "Sem preferência — qualquer barbeiro disponível",
    "reserva.barbero": "Barbeiro",
    "reserva.min": "min",
    "reserva.volver": "Voltar",

    "reserva.cuandoVienes": "Quando você vem?",
    "reserva.seleccionaDia": "Selecione um dia",
    "reserva.horariosDisponibles": "Horários disponíveis",
    "reserva.buscandoHorarios": "Buscando horários...",
    "reserva.agendaLlena": "Agenda cheia nesse dia. Tente outro.",
    "reserva.continuar": "Continuar",

    "reserva.tusDatos": "Seus dados",
    "reserva.servicio": "Serviço",
    "reserva.total": "Total",
    "reserva.senaAPagar": "Sinal a pagar agora",
    "reserva.dia": "Dia",
    "reserva.hora": "Horário",
    "reserva.tuNombre": "Seu Nome",
    "reserva.telefono": "Telefone / WhatsApp",
    "reserva.email": "Email",
    "reserva.emailRequerido": "(obrigatório para o pagamento)",
    "reserva.emailOpcional": "(opcional — para receber confirmação)",
    "reserva.placeholderNombre": "Ex: João",
    "reserva.placeholderTelefono": "Ex: (11) 91234-5678",
    "reserva.placeholderEmail": "Ex: joao@gmail.com",
    "reserva.pagarSenaY": "Pagar sinal",
    "reserva.yConfirmar": "e confirmar",
    "reserva.confirmarTurno": "Confirmar horário",
    "reserva.confirmando": "Confirmando...",
    "reserva.redirigiendoPago": "Redirecionando para pagamento...",
    "reserva.senaDescuenta": "O sinal de",
    "reserva.seDescuentaDelTotal": "será descontado do total no dia do atendimento.",

    "reserva.pagoPendiente": "Pagamento pendente",
    "reserva.pagoPendienteDesc": "Seu horário está reservado, mas o sinal ainda não foi confirmado.",
    "reserva.reintentarPago": "Tentar pagamento novamente",

    "reserva.turnoConfirmado": "Horário confirmado",
    "reserva.teEsperamos": "Te esperamos em",
    "reserva.alasHoras": "às",
    "reserva.confirmacionEnviada": "Confirmação enviada para",
    "reserva.avisarWhatsapp": "Avisar pelo WhatsApp",
    "reserva.verInstagram": "Ver trabalhos no Instagram",
    "reserva.hacerOtraReserva": "Fazer outra reserva",
    "reserva.reservaTurnoOnline": "Reserva online",
    "reserva.poweredBy": "Desenvolvido por",
    "reserva.barberiaNoEncontrada": "Esta barbearia não foi encontrada. Verifique o link.",
    "reserva.cargandoBarberia": "Carregando barbearia...",
  },
};

// Detecta el idioma preferido del navegador y lo mapea a uno soportado.
// Si no coincide con ninguno, cae en el default (español).
export function detectarIdiomaNavegador() {
  if (typeof window === "undefined") return IDIOMA_DEFAULT;

  const idiomasNavegador = navigator.languages || [navigator.language || "es"];

  for (const lang of idiomasNavegador) {
    const codigo = lang.toLowerCase().split("-")[0];
    if (IDIOMAS_SOPORTADOS.includes(codigo)) return codigo;
  }
  return IDIOMA_DEFAULT;
}

// Traduce una clave. Si no existe en el idioma pedido, cae en español;
// si tampoco existe ahí, devuelve la clave tal cual (para detectar faltantes).
export function traducir(idioma, clave) {
  return TRADUCCIONES[idioma]?.[clave] ?? TRADUCCIONES[IDIOMA_DEFAULT]?.[clave] ?? clave;
}