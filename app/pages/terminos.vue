<script setup lang="ts">
definePageMeta({ layout: "landing" });

useSeoMeta({
  title: "Términos y condiciones",
  description:
    "Condiciones de uso de AlertaFuego, el sistema de detección temprana de incendios en Argentina.",
});

const responsible = legalResponsible();
</script>

<template>
  <LegalPage title="Términos y condiciones">
    <p>
      Estos términos regulan el uso de AlertaFuego (alertafuego.com.ar), un
      sistema que detecta posibles focos de incendio en la Argentina a partir de
      imágenes del satélite GOES-19 y un modelo de inteligencia artificial.
      AlertaFuego es desarrollado por {{ responsible }}. Al usar el sitio o
      crear una cuenta, aceptás estos términos.
    </p>

    <h2>1. Qué ofrece AlertaFuego</h2>
    <p>
      Un mapa de focos detectados, estadísticas, zonas de alerta con avisos por
      email y Telegram, reportes de los usuarios sobre cada detección y una API
      pública de lectura.
    </p>

    <h2>2. No reemplaza a los servicios de emergencia</h2>
    <p>
      <strong>
        AlertaFuego es una herramienta informativa y no es un servicio de
        emergencias.
      </strong>
      Las detecciones son estimaciones de un modelo automático: pueden incluir
      falsos positivos (focos que no son incendios), omitir incendios reales,
      tener errores de ubicación de algunos kilómetros o llegar con demora. Los
      avisos dependen además de servicios de terceros (satélites, email,
      Telegram) que pueden fallar.
    </p>
    <p>
      Ante un incendio, llamá a los Bomberos (100) o al número de emergencias
      (911) y seguí las indicaciones de las autoridades. No tomes decisiones de
      seguridad basándote solo en AlertaFuego.
    </p>

    <h2>3. Tu cuenta</h2>
    <p>
      Para usar el mapa, las estadísticas y las alertas tenés que iniciar sesión
      con Google o con un enlace enviado por email. Sos responsable de la
      actividad de tu cuenta y de que los datos que cargues (zonas, emails de
      aviso, reportes) sean correctos. Podés pedir que eliminemos tu cuenta en
      cualquier momento (ver la
      <NuxtLink to="/privacidad">Política de privacidad</NuxtLink>).
    </p>

    <h2>4. Uso aceptable</h2>
    <p>Al usar AlertaFuego te comprometés a no:</p>
    <ul>
      <li>enviar reportes falsos o malintencionados sobre las detecciones;</li>
      <li>
        sobrecargar el servicio o la API (por ejemplo, con pedidos masivos
        automatizados) ni intentar acceder a datos de otros usuarios;
      </li>
      <li>usar el servicio para fines ilegales.</li>
    </ul>
    <p>
      Podemos suspender cuentas o limitar el acceso a la API ante un uso que
      incumpla estos términos.
    </p>

    <h2>5. API pública</h2>
    <p>
      La API de lectura de detecciones y estadísticas puede usarse libremente
      para fines sin fines de lucro, citando a AlertaFuego como fuente. Para
      otros usos, escribinos.
    </p>

    <h2>6. Planes</h2>
    <p>
      Hoy AlertaFuego es gratuito. Los planes pagos descriptos en el sitio
      todavía no se pueden contratar; cuando estén disponibles, sus condiciones
      y precios se informarán antes de cualquier cobro.
    </p>

    <h2>7. Datos de terceros</h2>
    <p>
      AlertaFuego usa imágenes del satélite GOES-19 (NOAA), detecciones de
      incendios VIIRS (NASA), cartografía del Instituto Geográfico Nacional,
      imágenes satelitales de Esri y capas de clima de OpenWeatherMap. Esos
      datos pertenecen a sus respectivos proveedores y se rigen por sus
      licencias.
    </p>

    <h2>8. Responsabilidad</h2>
    <p>
      El servicio se ofrece "tal como está" y puede tener interrupciones o
      errores. En la medida permitida por la ley, no somos responsables por
      daños derivados del uso del servicio, de detecciones erróneas o de avisos
      que no lleguen o lleguen tarde.
    </p>

    <h2>9. Cambios</h2>
    <p>
      Podemos actualizar estos términos. La fecha de la última actualización
      figura arriba; si los cambios son importantes, los avisaremos en el sitio.
    </p>

    <h2>10. Ley aplicable</h2>
    <p>
      Estos términos se rigen por las leyes de la República Argentina. Ante
      cualquier controversia, serán competentes los tribunales ordinarios de la
      Ciudad Autónoma de Buenos Aires.
    </p>

    <h2>11. Contacto</h2>
    <p>
      Por consultas sobre estos términos, escribinos a
      <a :href="`mailto:${LEGAL.contactEmail}`">{{ LEGAL.contactEmail }}</a
      >.
    </p>
  </LegalPage>
</template>
