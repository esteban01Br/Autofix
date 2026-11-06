import { useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Mail } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { NEGOCIO } from '../config/negocio';

/**
 * Páginas legales públicas del portal: términos y política de datos.
 *
 * IMPORTANTE: el texto es una base de trabajo. Debe revisarlo y completarlo
 * el responsable del negocio (idealmente con un abogado) antes de vender.
 * Los datos concretos del responsable viven en src/config/negocio.js.
 */
const CONTENIDO = {
  terminos: {
    titulo: 'Términos y condiciones',
    icono: FileText,
    intro:
      'Estos términos regulan el uso de AutoFix, plataforma de gestión para talleres mecánicos. Al registrar una empresa aceptas estas condiciones.',
    secciones: [
      {
        titulo: '1. Servicio',
        texto:
          'AutoFix ofrece un sistema en línea para gestionar clientes, vehículos, citas, órdenes de trabajo, repuestos, facturación y reportes de un taller. El servicio se presta por suscripción y puede evolucionar con nuevas funciones.',
      },
      {
        titulo: '2. Cuenta y responsabilidad',
        texto:
          'La empresa es responsable de la veracidad de los datos que registra, del uso que dan sus usuarios y de mantener sus credenciales seguras. Cada empresa solo accede a su propia información.',
      },
      {
        titulo: '3. Planes y pagos',
        texto:
          'Los planes, precios y periodos de vigencia se muestran en el portal al momento de la compra. La suscripción se renueva según el plan contratado. Los precios pueden cambiar y se informarán antes de aplicar un cambio.',
      },
      {
        titulo: '4. Uso aceptable',
        texto:
          'No se permite usar la plataforma para actividades ilícitas, intentar acceder a datos de otras empresas, ni afectar la seguridad o disponibilidad del servicio.',
      },
      {
        titulo: '5. Datos del cliente',
        texto:
          'La empresa puede exportar sus datos desde la aplicación. Al terminar la relación, se aplicará la política de conservación y eliminación descrita en la política de tratamiento de datos.',
      },
      {
        titulo: '6. Contacto',
        texto:
          'Para dudas sobre estos términos, escribe al correo de contacto publicado en el portal.',
      },
    ],
  },
  privacidad: {
    titulo: 'Política de tratamiento de datos personales',
    icono: ShieldCheck,
    intro:
      'AutoFix trata datos personales de clientes y empleados de cada taller. Esta política describe, de forma general, cómo se recolectan, usan y protegen esos datos, en línea con la Ley 1581 de 2012 de Colombia.',
    secciones: [
      {
        titulo: '1. Responsable y encargado',
        texto:
          'Cada taller (empresa) es responsable de los datos de sus clientes. AutoFix actúa como encargado del tratamiento: los almacena y procesa únicamente para prestar el servicio contratado.',
      },
      {
        titulo: '2. Datos que se tratan',
        texto:
          'Se tratan datos de identificación y contacto (nombres, teléfonos, correos), datos de vehículos (placa, marca, modelo, kilometraje), historial de servicios, citas, órdenes, facturas y pagos.',
      },
      {
        titulo: '3. Finalidad',
        texto:
          'Los datos se usan para gestionar el taller, agendar citas, generar órdenes y facturas, llevar el historial de los vehículos y producir reportes internos. No se venden ni se comparten con terceros ajenos al servicio.',
      },
      {
        titulo: '4. Seguridad',
        texto:
          'La información se aísla por empresa y se protege con autenticación, roles y conexiones cifradas. Las contraseñas se guardan con hash y nunca se muestran en las exportaciones.',
      },
      {
        titulo: '5. Derechos del titular',
        texto:
          'El titular puede conocer, actualizar, rectificar y solicitar la supresión de sus datos, así como revocar la autorización, dirigiéndose al taller responsable. La aplicación permite exportar los datos para atender estas solicitudes.',
      },
      {
        titulo: '6. Conservación',
        texto:
          'Los datos se conservan mientras exista la relación con el taller y durante los plazos legales aplicables (por ejemplo, obligaciones contables y tributarias de las facturas).',
      },
    ],
  },
};

const pendiente = '[PENDIENTE: completar en src/config/negocio.js]';

export default function Legal() {
  const { pathname } = useLocation();
  const esPrivacidad = pathname.includes('privacidad');
  const contenido = esPrivacidad ? CONTENIDO.privacidad : CONTENIDO.terminos;
  const Icono = contenido.icono;

  return (
    <div className="min-h-screen flex flex-col bg-workshop">
      <Nav compacto />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-2 text-accent">
            <Icono size={22} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
              AutoFix · Legal
            </span>
          </div>
          <h1 className="titulo-seccion">{contenido.titulo}</h1>
          <p className="mt-4 text-text-secondary leading-relaxed">{contenido.intro}</p>

          <div className="mt-8 space-y-5">
            {contenido.secciones.map((seccion) => (
              <section key={seccion.titulo} className="card p-6">
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  {seccion.titulo}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {seccion.texto}
                </p>
              </section>
            ))}
          </div>

          <section className="card mt-5 p-6">
            <div className="flex items-center gap-2 text-accent">
              <Mail size={17} />
              <h2 className="font-display text-lg font-semibold text-text-primary">
                Datos del responsable
              </h2>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-text-secondary">
              <p>
                <span className="text-muted">Nombre:</span>{' '}
                {NEGOCIO.nombre || pendiente}
              </p>
              <p>
                <span className="text-muted">Correo de contacto:</span>{' '}
                {NEGOCIO.correoContacto || pendiente}
              </p>
              <p>
                <span className="text-muted">Ciudad:</span>{' '}
                {NEGOCIO.ciudad || pendiente}
              </p>
            </div>
            <p className="mt-3 text-xs text-muted">
              [PENDIENTE: revisar con abogado]
            </p>
          </section>

          <p className="mt-8 text-xs text-muted">
            [PENDIENTE: revisar con abogado] Documento base sujeto a revisión legal.
            Última actualización: noviembre de 2026.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
