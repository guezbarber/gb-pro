export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-sm text-foreground">

      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Términos y Condiciones</h1>
        <p className="text-muted-foreground">Última actualización: junio 2026</p>
      </div>

      <p>
        Estos Términos y Condiciones regulan el uso de <strong>GB PRO</strong> ("la Plataforma"), operada por <strong>Mitchel</strong>, con domicilio en Montevideo, Uruguay. Al registrarte o usar GB PRO, aceptás estos términos en su totalidad. Si no estás de acuerdo, no uses la Plataforma.
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">1. Descripción del servicio</h2>
        <p>GB PRO es un software de gestión para barberías (SaaS) que permite a profesionales del sector administrar turnos, clientes, finanzas y marketing. También ofrece a los clientes finales una interfaz para reservar turnos online.</p>
        <p>El servicio se presta bajo dos modalidades:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong className="text-foreground">Plan Básico (gratuito):</strong> hasta 50 turnos por mes con funciones esenciales.</li>
          <li><strong className="text-foreground">Plan PRO ($12.99/mes o $8.99/mes en plan anual):</strong> turnos ilimitados y acceso a todas las funciones premium.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">2. Registro y cuenta</h2>
        <p>Para usar GB PRO como barbero debés crear una cuenta con un email válido. Sos responsable de mantener la confidencialidad de tu contraseña y de todas las acciones realizadas desde tu cuenta. Notificá inmediatamente a <strong>soporte@gbpro.app</strong> si detectás un acceso no autorizado.</p>
        <p>Debés ser mayor de 18 años para registrarte. Al crear una cuenta declarás que la información proporcionada es verídica y actualizada.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">3. Pagos y suscripciones</h2>
        <p>Los pagos del plan PRO se procesan a través de <strong>MercadoPago</strong>, un procesador de pagos externo. GB PRO no almacena datos de tarjetas de crédito.</p>
        <p>Las suscripciones se renuevan automáticamente al final de cada período (mensual o anual) hasta que sean canceladas. Podés cancelar en cualquier momento desde tu panel de cuenta. La cancelación entra en vigor al final del período pagado, sin reembolso proporcional por el tiempo restante.</p>
        <p>Los precios pueden modificarse con un aviso previo de 30 días por email.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">4. Uso aceptable</h2>
        <p>Te comprometés a usar GB PRO únicamente para fines legales y legítimos relacionados con la gestión de tu negocio. Está prohibido:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Usar la plataforma para actividades ilegales, fraudulentas o dañinas.</li>
          <li>Intentar acceder a cuentas de otros usuarios sin autorización.</li>
          <li>Realizar ingeniería inversa, copiar o redistribuir el software.</li>
          <li>Enviar spam o mensajes no solicitados a través de las herramientas de marketing.</li>
          <li>Sobrecargar los servidores con tráfico automatizado o ataques.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">5. Propiedad intelectual</h2>
        <p>Todo el contenido de GB PRO — incluyendo el código, diseño, marca, logotipos y textos — es propiedad de Mitchel y está protegido por las leyes de propiedad intelectual aplicables. No se concede ninguna licencia para copiar, modificar o distribuir dichos contenidos sin autorización expresa.</p>
        <p>Los datos que vos ingresás (clientes, turnos, etc.) son de tu propiedad. GB PRO los usa únicamente para prestarte el servicio.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">6. Disponibilidad y cambios</h2>
        <p>GB PRO se esfuerza por mantener la plataforma disponible de forma continua, pero no garantiza un uptime del 100%. Puede haber interrupciones por mantenimiento, actualizaciones o causas fuera de nuestro control.</p>
        <p>Nos reservamos el derecho de modificar, suspender o discontinuar cualquier funcionalidad con aviso previo razonable, excepto en casos de emergencia de seguridad.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">7. Limitación de responsabilidad</h2>
        <p>GB PRO no se responsabiliza por pérdidas de negocio, datos o ingresos derivados del uso o la imposibilidad de uso de la plataforma. La responsabilidad máxima de GB PRO, en cualquier caso, se limita al monto pagado por el usuario en los últimos 3 meses.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">8. Terminación</h2>
        <p>Podés eliminar tu cuenta en cualquier momento desde Configuración. GB PRO puede suspender o eliminar cuentas que violen estos términos, con o sin aviso previo según la gravedad de la infracción.</p>
        <p>Al eliminar tu cuenta, tus datos serán eliminados de forma permanente dentro de los 30 días siguientes, salvo obligación legal de retención.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">9. Ley aplicable</h2>
        <p>Estos términos se rigen por las leyes de la República Oriental del Uruguay. Cualquier disputa se someterá a la jurisdicción de los tribunales competentes de Montevideo, Uruguay, sin perjuicio de los derechos que correspondan a consumidores en sus países de residencia conforme a la normativa local aplicable.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black uppercase tracking-wider">10. Contacto</h2>
        <p>Para cualquier consulta sobre estos términos escribí a: <strong>soporte@gbpro.app</strong></p>
      </section>

      <div className="border-t border-border/50 pt-6 text-xs text-muted-foreground">
        <p>GB PRO — Operado por Mitchel, Montevideo, Uruguay — <a href="https://gbpro.app" className="underline">gbpro.app</a></p>
      </div>
    </div>
  );
}