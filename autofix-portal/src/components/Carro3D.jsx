import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Silueta del auto (vista lateral, mirando a la derecha). Se reutiliza para
 * apilar varias copias en el eje Z y darle grosor real a la carrocería.
 */
const SILUETA =
  'M 92 208 C 92 188 104 172 124 166 L 214 152 L 264 116 ' +
  'C 276 105 292 100 310 100 L 408 100 C 426 100 442 106 456 118 ' +
  'L 512 158 L 590 166 C 616 170 632 184 638 204 L 642 220 ' +
  'C 644 229 638 236 629 236 L 569 236 ' +
  'C 569 198 542 172 505 172 C 468 172 441 198 441 236 ' +
  'L 282 236 C 282 198 254 172 216 172 C 178 172 152 198 152 236 ' +
  'L 110 236 C 100 236 92 230 92 220 Z';

const PINTURAS = [
  {
    id: 'violeta',
    nombre: 'Violeta',
    alto: '#bda9ff',
    medio: '#663af3',
    bajo: '#241156',
    muestra: 'linear-gradient(135deg, #bda9ff 0%, #663af3 55%, #2c1673 100%)',
  },
  {
    id: 'hielo',
    nombre: 'Hielo',
    alto: '#cfe4f5',
    medio: '#6f8fb4',
    bajo: '#1f3045',
    muestra: 'linear-gradient(135deg, #e6f3ff 0%, #8fb3d9 60%, #39506e 100%)',
  },
  {
    id: 'grafito',
    nombre: 'Grafito',
    alto: '#a3aec3',
    medio: '#4a5468',
    bajo: '#151926',
    muestra: 'linear-gradient(135deg, #a3aec3 0%, #4a5468 60%, #151926 100%)',
  },
];

/** Rueda con llanta metálica y giro continuo (se acelera al escribir). */
function Rueda({ cx, cy }) {
  const radios = Array.from({ length: 5 }, (_, indice) => {
    const angulo = (indice * 2 * Math.PI) / 5 - Math.PI / 2;
    return {
      x1: cx + Math.cos(angulo) * 13,
      y1: cy + Math.sin(angulo) * 13,
      x2: cx + Math.cos(angulo) * 42,
      y2: cy + Math.sin(angulo) * 42,
    };
  });

  return (
    <g>
      <circle cx={cx} cy={cy} r="62" fill="#080910" stroke="rgba(199,211,234,0.22)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="53" fill="#121623" />
      <circle cx={cx} cy={cy} r="47" fill="url(#carroDisco)" />
      <circle cx={cx} cy={cy} r="47" fill="none" stroke="rgba(216,236,248,0.28)" strokeWidth="1" />

      {/* Pinza de freno fija: no gira con la llanta */}
      <rect
        x={cx + 26}
        y={cy + 4}
        width="13"
        height="28"
        rx="6"
        fill="#8b6bff"
        opacity="0.9"
        transform={`rotate(28 ${cx + 32} ${cy + 18})`}
      />

      <g
        className="rueda"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <circle cx={cx} cy={cy} r="44" fill="none" stroke="rgba(216,236,248,0.35)" strokeWidth="2" />
        {radios.map((radio, indice) => (
          <line
            key={indice}
            {...radio}
            stroke="#c7d3ea"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.82"
          />
        ))}
        <circle cx={cx + 12} cy={cy - 14} r="3.4" fill="#8b6bff" />
      </g>

      <circle cx={cx} cy={cy} r="11" fill="#0b0d17" stroke="rgba(199,211,234,0.5)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="3" fill="#8fb3d9" />
    </g>
  );
}

/** Capa frontal del auto con todos los detalles (pintura, cristales, luces). */
function Carroceria() {
  return (
    <svg viewBox="0 0 720 330" className="carro-capa carro-frente" aria-hidden="true">
      <defs>
        <linearGradient id="carroPintura" x1="0" y1="0" x2="0.18" y2="1">
          <stop offset="0%" stopColor="var(--carro-alto)" />
          <stop offset="42%" stopColor="var(--carro-medio)" />
          <stop offset="100%" stopColor="var(--carro-bajo)" />
        </linearGradient>
        <linearGradient id="carroCristal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8ecf8" stopOpacity="0.52" />
          <stop offset="48%" stopColor="#8fb3d9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#663af3" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id="carroBrillo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d8ecf8" stopOpacity="0" />
          <stop offset="45%" stopColor="#d8ecf8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#d8ecf8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="carroDisco" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0%" stopColor="#aab7cc" />
          <stop offset="52%" stopColor="#6d7a92" />
          <stop offset="100%" stopColor="#2e3547" />
        </radialGradient>
        <linearGradient id="carroHaz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d8ecf8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#d8ecf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="carroBarrido" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="carroDifusa" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <clipPath id="carroClip">
          <path d={SILUETA} />
        </clipPath>
      </defs>

      {/* Sombra y resplandor de la plataforma */}
      <ellipse cx="360" cy="306" rx="248" ry="18" fill="#02030a" opacity="0.85" filter="url(#carroDifusa)" />
      <ellipse cx="360" cy="305" rx="172" ry="10" fill="#663af3" opacity="0.32" filter="url(#carroDifusa)" />

      {/* Huecos oscuros de las ruedas, detrás de la carrocería */}
      <path d="M 153 236 A 63 63 0 0 1 279 236 Z" fill="#07050f" />
      <path d="M 442 236 A 63 63 0 0 1 568 236 Z" fill="#07050f" />

      {/* Carrocería */}
      <path
        d={SILUETA}
        fill="url(#carroPintura)"
        stroke="rgba(216,236,248,0.3)"
        strokeWidth="1.4"
      />

      {/* Reflejo suave sobre el capó y el techo (recortado a la silueta) */}
      <g clipPath="url(#carroClip)">
        <ellipse
          cx="300"
          cy="118"
          rx="170"
          ry="54"
          fill="#ffffff"
          opacity="0.12"
          transform="rotate(-8 300 118)"
          filter="url(#carroDifusa)"
        />
        <ellipse
          cx="566"
          cy="184"
          rx="112"
          ry="34"
          fill="#ffffff"
          opacity="0.07"
          transform="rotate(-9 566 184)"
          filter="url(#carroDifusa)"
        />
        <g transform="skewX(-16)">
          <rect
            className="carro-barrido"
            x="-180"
            y="70"
            width="90"
            height="200"
            fill="url(#carroBarrido)"
          />
        </g>
      </g>

      {/* Faldón y splitter */}
      <path
        d="M 292 240 C 330 247 400 247 438 240 L 432 254 C 392 260 330 260 296 254 Z"
        fill="#0a0618"
        opacity="0.55"
      />
      <path
        d="M 566 236 C 592 236 620 234 636 228 L 640 236 C 632 240 606 242 570 242 Z"
        fill="#0a0618"
        opacity="0.5"
      />

      {/* Cristales */}
      <path
        d="M 292 148 L 322 115 C 330 108 340 105 352 105 L 402 105 C 414 105 424 108 434 116 L 482 152 Z"
        fill="url(#carroCristal)"
        stroke="rgba(216,236,248,0.35)"
        strokeWidth="1.2"
      />
      <line x1="360" y1="106" x2="362" y2="150" stroke="rgba(5,6,15,0.65)" strokeWidth="2.5" />
      <path
        d="M 300 144 L 328 116 C 336 110 344 108 352 108"
        stroke="#d8ecf8"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 314 101 L 404 101"
        stroke="#d8ecf8"
        strokeOpacity="0.22"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Línea de cintura y reflejos */}
      <path
        d="M 128 168 C 210 154 262 147 308 146 L 452 148 C 520 152 584 160 622 172"
        stroke="url(#carroBrillo)"
        strokeWidth="2.2"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M 160 226 C 220 234 300 236 360 235"
        stroke="#b6d9fc"
        strokeOpacity="0.18"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 600 200 C 500 214 300 214 120 196"
        stroke="rgba(216,236,248,0.15)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Puerta y manija */}
      <path d="M 356 150 C 353 180 353 210 358 238" stroke="rgba(5,6,15,0.55)" strokeWidth="1.6" fill="none" />
      <rect x="380" y="178" width="30" height="5" rx="2.5" fill="#0d0a1c" opacity="0.9" />
      <rect x="382" y="178.5" width="26" height="1.5" rx="1" fill="#b6d9fc" opacity="0.35" />

      {/* Espejo lateral */}
      <path
        d="M 444 150 l 24 -9 c 4 -1.5 8 0.5 9 4.5 l 1 4 c 0.5 3 -2 5.5 -5 5 l -22 -2 z"
        fill="var(--carro-medio)"
        stroke="rgba(216,236,248,0.3)"
        strokeWidth="1"
      />
      <path d="M 446 152 l -5 7" stroke="rgba(216,236,248,0.3)" strokeWidth="2" />

      {/* Faro delantero + haz de luz */}
      <g className="carro-faro">
        <path d="M 596 181 C 610 177 626 182 636 194 L 622 201 C 612 193 604 190 594 190 Z" fill="#d8ecf8" />
        <path
          d="M 596 181 C 610 177 626 182 636 194"
          stroke="#ffffff"
          strokeWidth="1.6"
          fill="none"
          opacity="0.85"
        />
      </g>
      <ellipse cx="618" cy="190" rx="24" ry="11" fill="#b6d9fc" opacity="0.22" filter="url(#carroDifusa)" />
      <path className="carro-haz" d="M 634 186 L 718 166 L 718 218 L 634 199 Z" fill="url(#carroHaz)" />

      {/* Piloto trasero */}
      <path d="M 94 182 L 110 178 L 114 191 L 96 195 Z" fill="#ff5d73" opacity="0.92" />
      <ellipse cx="104" cy="187" rx="16" ry="9" fill="#ff5d73" opacity="0.25" filter="url(#carroDifusa)" />

      {/* Alerón trasero */}
      <path
        d="M 108 160 L 158 151 L 164 159 L 112 169 Z"
        fill="var(--carro-bajo)"
        stroke="rgba(216,236,248,0.22)"
        strokeWidth="1"
      />
      <path d="M 128 166 l 2 12 M 146 163 l 2 12" stroke="rgba(216,236,248,0.18)" strokeWidth="2" />

      {/* Entrada de aire lateral */}
      <path
        d="M 246 196 C 260 192 272 194 282 200 L 276 208 C 266 202 256 200 246 203 Z"
        fill="#0a0618"
        opacity="0.45"
      />

      <Rueda cx={216} cy={242} />
      <Rueda cx={505} cy={242} />
    </svg>
  );
}

/**
 * Escena interactiva del auto para el login: paralaje con el cursor,
 * luces al hacer clic, pintura seleccionable y ruedas que se aceleran
 * cuando alguien escribe en el formulario.
 */
export default function Carro3D() {
  const escenaRef = useRef(null);
  const temporizador = useRef(null);
  const temporizadorFaros = useRef(null);
  const [pintura, setPintura] = useState(PINTURAS[0]);
  const [acelerando, setAcelerando] = useState(false);
  const [faros, setFaros] = useState(false);

  const acelerar = useCallback(() => {
    setAcelerando(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAcelerando(false), 900);
  }, []);

  // El auto reacciona a la escritura y al foco en los campos del login.
  useEffect(() => {
    const reaccionar = (evento) => {
      const objetivo = evento.target;
      if (
        objetivo &&
        (objetivo.tagName === 'INPUT' || objetivo.tagName === 'TEXTAREA')
      ) {
        acelerar();
      }
    };
    document.addEventListener('input', reaccionar);
    document.addEventListener('focusin', reaccionar);
    return () => {
      document.removeEventListener('input', reaccionar);
      document.removeEventListener('focusin', reaccionar);
      clearTimeout(temporizador.current);
      clearTimeout(temporizadorFaros.current);
    };
  }, [acelerar]);

  const mover = (evento) => {
    const escena = escenaRef.current;
    if (!escena) return;
    const caja = escena.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    escena.style.setProperty('--ry', `${(x * 18).toFixed(2)}deg`);
    escena.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    escena.style.setProperty('--luz-x', `${(50 + x * 34).toFixed(1)}%`);
    escena.style.setProperty('--luz-y', `${(40 + y * 30).toFixed(1)}%`);
  };

  const salir = () => {
    const escena = escenaRef.current;
    if (!escena) return;
    escena.style.setProperty('--ry', '0deg');
    escena.style.setProperty('--rx', '0deg');
    escena.style.setProperty('--luz-x', '50%');
    escena.style.setProperty('--luz-y', '40%');
  };

  const encenderFaros = () => {
    setFaros(true);
    acelerar();
    clearTimeout(temporizadorFaros.current);
    temporizadorFaros.current = setTimeout(() => setFaros(false), 1400);
  };

  return (
    <div
      ref={escenaRef}
      className={`carro-escena ${acelerando ? 'acelerando' : ''} ${faros ? 'faros' : ''}`}
      style={{
        '--carro-alto': pintura.alto,
        '--carro-medio': pintura.medio,
        '--carro-bajo': pintura.bajo,
      }}
      onPointerMove={mover}
      onPointerLeave={salir}
      onClick={encenderFaros}
    >
      <div className="carro-halo" aria-hidden="true" />
      <div className="carro-plataforma" aria-hidden="true" />
      <span className="carro-particula carro-particula-1" aria-hidden="true" />
      <span className="carro-particula carro-particula-2" aria-hidden="true" />
      <span className="carro-particula carro-particula-3" aria-hidden="true" />
      <span className="carro-particula carro-particula-4" aria-hidden="true" />

      <div className="carro-3d">
        <div className="carro-flota">
          <div className="carro-cuerpo">
            {/* Copias en Z: dan grosor real a la carrocería al inclinarse */}
            {Array.from({ length: 12 }, (_, indice) => (indice + 1) * 4).map(
              (profundidad, indice) => (
                <svg
                  key={profundidad}
                  viewBox="0 0 720 330"
                  className="carro-capa"
                  style={{ transform: `translateZ(-${profundidad}px)` }}
                  aria-hidden="true"
                >
                  <path
                    d={SILUETA}
                    fill={indice > 8 ? '#241156' : indice > 4 ? '#1a0d44' : '#120a30'}
                  />
                  <circle cx="216" cy="242" r="60" fill="#0a0b12" />
                  <circle cx="505" cy="242" r="60" fill="#0a0b12" />
                </svg>
              ),
            )}
            <Carroceria />
          </div>
        </div>
      </div>

      <div className="carro-chip carro-chip-a" aria-hidden="true">
        <span className="punto" /> Diagnóstico listo
      </div>
      <div className="carro-chip carro-chip-b" aria-hidden="true">
        <span className="punto violeta" /> Orden #1042 · En proceso
      </div>

      <div className="carro-hud" onClick={(evento) => evento.stopPropagation()}>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
          <span className="text-muted">RPM</span>
          <span className={acelerando ? 'text-accent-hover' : 'text-muted'}>
            {acelerando ? 'Acelerando' : 'Ralentí'}
          </span>
        </div>

        <div className="carro-medidor mt-1.5" role="presentation">
          <span style={{ width: acelerando ? '88%' : '16%' }} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Color del auto">
            {PINTURAS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className="carro-swatch"
                style={{ background: opcion.muestra }}
                aria-label={`Pintura ${opcion.nombre}`}
                aria-pressed={pintura.id === opcion.id}
                title={opcion.nombre}
                onClick={() => setPintura(opcion)}
              />
            ))}
            <span className="ml-1 hidden text-[10px] text-muted sm:inline">Pintura</span>
          </div>

          <p className="text-right text-[10px] leading-tight text-muted">
            <span className="hidden sm:inline">Mueve el cursor · clic para encender</span>
            <span className="sm:hidden">Toca el auto</span>
          </p>
        </div>
      </div>
    </div>
  );
}
