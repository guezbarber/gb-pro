export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-sm text-foreground">

      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground">Última actualización: junio 2026</p>
      </div>

      <p>
        En <strong>GB PRO</strong>, operado por <strong>Mitchel</strong> (Montevideo, Uruguay), nos tomamos tu privacidad en serio. Esta política explica qué datos recopilamos, cómo los usamos y cuáles son tus derechos. Aplica tanto a los barberos que usan la plataforma como a los clientes finales que reservan turnos.
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">1. Datos que recopilamos</h2>

        <p className="font-bold">De los barberos (usuarios registrados):</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Email y contraseña (para autenticación)</li>
          <li>Nombre de la barbería, número de WhatsApp, horarios</li>
          <li>Ubicación GPS (solo si activás el Mapa VIP voluntariamente)</li>
          <li>Datos de pago procesados por Lemon Squeezy (no los almacenamos directamente)</li>
          <li>Tokens de Google Calendar (si conectás tu calendario)</li>
        </ul>

        <p className="font-bold mt-4">De los clientes finales (quienes reservan turnos):</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Nombre, teléfono y email (ingresados al reservar)</li>
          <li>Fecha de nacimiento (opcional, para el programa de fidelidad)</li>
          <li>Historial de turnos y calificaciones</li>
        </ul>

        <p className="font-bold mt-4">Datos técnicos (automáticos):</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Dirección IP, tipo de navegador, sistema operativo</li>
          <li>Páginas visitadas y tiempo de uso (para mejorar el servicio)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">2. Cómo usamos los datos</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Prestar y mejorar el servicio de GB PRO</li>
          <li>Enviar emails transaccionales (confirmaciones de turno, recordatorios, puntos)</li>
          <li>Procesar pagos y gestionar suscripciones</li>
          <li>Sincronizar turnos con Google Calendar (si lo activaste)</li>
          <li>Mostrar tu barbería en el mapa público (solo si lo activaste)</li>
          <li>Cumplir obligaciones legales</li>
        </ul>
        <p>No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines publicitarios.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">3. Terceros que procesan datos</h2>
        <p>Para operar GB PRO usamos los siguientes servicios externos, cada uno con su propia política de privacidad:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Supabase</strong> — base de datos y autenticación (servidores en EE.UU.)</li>
          <li><strong className="text-foreground">Vercel</strong> — hosting y deploy (servidores globales)</li>
          <li><strong className="text-foreground">Resend</strong> — envío de emails transaccionales</li>
          <li><strong className="text-foreground">Lemon Squeezy</strong> — procesamiento de pagos</li>
          <li><strong className="text-foreground">Google Calendar API</strong> — sincronización de agenda (solo si lo activaste)</li>
        </ul>
        <p>Todos estos proveedores cumplen con estándares internacionales de seguridad (SOC 2, ISO 27001 o equivalentes).</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">4. Ubicación GPS</h2>
        <p>La ubicación de tu barbería solo se recopila si vos activás voluntariamente la función <strong>Mapa VIP</strong> en Configuración. Podés desactivarla en cualquier momento y tu ubicación dejará de mostrarse en el mapa público. No rastreamos tu ubicación en tiempo real.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">5. Cookies y tecnologías similares</h2>
        <p>GB PRO usa cookies técnicas estrictamente necesarias para el funcionamiento de la plataforma (sesión de usuario, preferencias). No usamos cookies de seguimiento publicitario ni compartimos datos con redes de anuncios.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">6. Seguridad de los datos</h2>
        <p>Aplicamos medidas de seguridad técnicas y organizativas para proteger tus datos:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Comunicaciones cifradas con TLS/HTTPS</li>
          <li>Contraseñas almacenadas con hash seguro (bcrypt)</li>
          <li>Row Level Security (RLS) en base de datos — cada barbero solo ve sus propios datos</li>
          <li>Tokens de acceso con expiración automática</li>
          <li>Acceso a producción restringido a personal autorizado</li>
        </ul>
        <p>En caso de una brecha de seguridad que afecte tus datos, te notificaremos en un plazo máximo de 72 horas.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">7. Retención de datos</h2>
        <p>Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta, tus datos personales serán eliminados permanentemente dentro de los 30 días siguientes. Los datos de facturación pueden conservarse por hasta 5 años por obligaciones contables y legales.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">8. Tus derechos</h2>
        <p>Tenés los siguientes derechos sobre tus datos personales:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Acceso:</strong> podés solicitar una copia de todos tus datos</li>
          <li><strong className="text-foreground">Rectificación:</strong> podés corregir datos incorrectos</li>
          <li><strong className="text-foreground">Eliminación:</strong> podés solicitar que borremos tus datos ("derecho al olvido")</li>
          <li><strong className="text-foreground">Portabilidad:</strong> podés solicitar tus datos en formato exportable</li>
          <li><strong className="text-foreground">Oposición:</strong> podés oponerte al procesamiento de tus datos en ciertos casos</li>
          <li><strong className="text-foreground">Revocación del consentimiento:</strong> podés retirar tu consentimiento en cualquier momento</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos escribí a: <strong>soporte@gbpro.app</strong>. Respondemos en un plazo máximo de 30 días.</p>
        <p className="text-muted-foreground">Estos derechos aplican según la normativa vigente en tu país de residencia, incluyendo el RGPD (Europa), la Ley 18.331 (Uruguay) y normativas equivalentes en otros países.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">9. Menores de edad</h2>
        <p>GB PRO no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos que un usuario menor se ha registrado, eliminaremos su cuenta y datos de forma inmediata.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">10. Cambios a esta política</h2>
        <p>Podemos actualizar esta política ocasionalmente. Te notificaremos por email con al menos 15 días de anticipación ante cambios significativos. El uso continuado de GB PRO después de esa fecha implica la aceptación de los cambios.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">11. Contacto</h2>
        <p>Para consultas sobre privacidad o para ejercer tus derechos:</p>
        <p><strong>Email:</strong> soporte@gbpro.app</p>
        <p><strong>Responsable:</strong> Mitchel, Montevideo, Uruguay</p>
      </section>

      <div className="border-t border-border/50 pt-6 text-xs text-muted-foreground">
        <p>GB PRO — Operado por Mitchel, Montevideo, Uruguay.</p>
      </div>
    </div>
  );
}