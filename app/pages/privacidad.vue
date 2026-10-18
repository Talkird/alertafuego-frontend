<script setup lang="ts">
definePageMeta({ layout: "landing" });

useSeoMeta({
  title: "Política de privacidad",
  description:
    "Qué datos personales trata AlertaFuego, para qué, con quién se comparten y cómo ejercer tus derechos.",
});

const responsible = legalResponsible();
</script>

<template>
  <LegalPage title="Política de privacidad">
    <p>
      Esta política explica qué datos personales trata AlertaFuego
      (alertafuego.com.ar), para qué y cómo podés ejercer tus derechos, de
      acuerdo con la Ley 25.326 de Protección de los Datos Personales.
    </p>

    <h2>1. Responsable</h2>
    <p>
      El responsable de los datos es {{ responsible }}. Contacto:
      <a :href="`mailto:${LEGAL.contactEmail}`">{{ LEGAL.contactEmail }}</a
      >.
    </p>

    <h2>2. Qué datos tratamos</h2>
    <ul>
      <li>
        <strong>Cuenta:</strong> tu email y, si ingresás con Google, tu nombre y
        foto de perfil.
      </li>
      <li>
        <strong>Zonas de alerta:</strong> las ubicaciones que definís (un punto
        y un radio, un polígono, o una provincia o departamento), su nombre y la
        probabilidad mínima elegida.
      </li>
      <li>
        <strong>Reportes:</strong> tu opinión sobre una detección (si es fuego o
        no, la categoría y el comentario opcional).
      </li>
      <li>
        <strong>Canales de aviso:</strong> un email alternativo si lo configurás
        y, si conectás Telegram, el identificador del chat y tu nombre de
        usuario de Telegram.
      </li>
      <li>
        <strong>Datos técnicos:</strong> los registros de los servidores
        (dirección IP, navegador, fecha y hora de cada pedido) y una cookie de
        sesión para mantenerte conectado. No usamos herramientas de analítica ni
        publicidad.
      </li>
    </ul>

    <h2>3. Para qué los usamos</h2>
    <ul>
      <li>
        Prestar el servicio: mostrarte el mapa y las estadísticas, guardar tus
        zonas y avisarte cuando se detecta un foco en ellas.
      </li>
      <li>
        Mejorar las detecciones: los reportes ayudan a medir y corregir los
        errores del modelo.
      </li>
      <li>
        Estadísticas agregadas, como la cantidad de reportes por categoría, que
        no identifican a nadie.
      </li>
      <li>Mantener la seguridad del servicio y atender tus consultas.</li>
    </ul>
    <p>No vendemos tus datos ni los usamos para publicidad.</p>

    <h2>4. Con quién los compartimos</h2>
    <p>
      Para funcionar, AlertaFuego usa proveedores que tratan datos por nuestra
      cuenta:
    </p>
    <ul>
      <li>
        <strong>Supabase:</strong> inicio de sesión y base de datos (servidores
        en Brasil).
      </li>
      <li>
        <strong>Amazon Web Services:</strong> el servidor de la API, el sitio y
        el envío de emails (servidores en Estados Unidos).
      </li>
      <li>
        <strong>Google:</strong> el inicio de sesión con Google, si lo elegís.
      </li>
      <li>
        <strong>Telegram:</strong> el envío de avisos, si conectás tu cuenta.
      </li>
      <li>
        <strong>Proveedores de mapas</strong> (Instituto Geográfico Nacional,
        Esri y, para las capas de clima, OpenWeatherMap): tu navegador les pide
        las imágenes del mapa directamente, por lo que reciben tu dirección IP.
      </li>
    </ul>
    <p>
      Algunos de estos proveedores están fuera de la Argentina, por lo que tus
      datos pueden transferirse a otros países. Solo compartimos lo necesario
      para cada función.
    </p>

    <h2>5. Cuánto tiempo los conservamos</h2>
    <p>
      Conservamos tus datos mientras tengas una cuenta. Si pedís que la
      eliminemos, borramos tu cuenta, tus zonas, tus canales de aviso y tus
      reportes. Los registros técnicos de los servidores se eliminan
      automáticamente con el tiempo.
    </p>

    <h2>6. Tus derechos</h2>
    <p>
      Podés pedir acceso a tus datos, su corrección, actualización o supresión
      escribiendo a
      <a :href="`mailto:${LEGAL.contactEmail}`">{{ LEGAL.contactEmail }}</a>
      desde el email de tu cuenta. Respondemos los pedidos de acceso dentro de
      los 10 días corridos y los de corrección o supresión dentro de los 5 días
      hábiles, como establece la ley. Además, desde
      <strong>Mi cuenta</strong> podés cambiar tus canales de aviso y desde
      <strong>Alertas</strong> editar o borrar tus zonas.
    </p>
    <p>
      El titular de los datos personales tiene la facultad de ejercer el derecho
      de acceso a los mismos en forma gratuita a intervalos no inferiores a seis
      meses, salvo que se acredite un interés legítimo al efecto conforme lo
      establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La Agencia de
      Acceso a la Información Pública, en su carácter de Órgano de Control de la
      Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que
      interpongan quienes resulten afectados en sus derechos por incumplimiento
      de las normas vigentes en materia de protección de datos personales.
    </p>

    <h2>7. Seguridad</h2>
    <p>
      Las conexiones con el sitio y la API están cifradas (HTTPS) y el acceso a
      tus datos requiere iniciar sesión. Ningún sistema es infalible, pero
      tomamos medidas razonables para proteger tu información.
    </p>

    <h2>8. Menores de edad</h2>
    <p>
      AlertaFuego no está dirigido a menores de 18 años. Si sos menor, usalo con
      la autorización de tus padres o tutores.
    </p>

    <h2>9. Cambios</h2>
    <p>
      Podemos actualizar esta política. La fecha de la última actualización
      figura arriba; si los cambios son importantes, los avisaremos en el sitio.
    </p>
  </LegalPage>
</template>
