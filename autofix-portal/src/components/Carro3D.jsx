import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const PINTURAS = [
  {
    id: 'violeta',
    nombre: 'Violeta',
    color: '#663af3',
    muestra: 'linear-gradient(135deg, #bda9ff 0%, #663af3 55%, #2c1673 100%)',
  },
  {
    id: 'hielo',
    nombre: 'Hielo',
    color: '#7f9fc2',
    muestra: 'linear-gradient(135deg, #e6f3ff 0%, #8fb3d9 60%, #39506e 100%)',
  },
  {
    id: 'grafito',
    nombre: 'Grafito',
    color: '#3d4658',
    muestra: 'linear-gradient(135deg, #a3aec3 0%, #4a5468 60%, #151926 100%)',
  },
];

/** Perfil de la carrocería, de la punta delantera al final del maletero. */
const ESTACIONES = [
  { x: 2.12, arriba: 0.48, ancho: 0.42 },
  { x: 2.06, arriba: 0.55, ancho: 0.58 },
  { x: 1.98, arriba: 0.62, ancho: 0.7 },
  { x: 1.86, arriba: 0.69, ancho: 0.78 },
  { x: 1.66, arriba: 0.75, ancho: 0.84 },
  { x: 1.4, arriba: 0.79, ancho: 0.87 },
  { x: 1.1, arriba: 0.82, ancho: 0.89 },
  { x: 0.75, arriba: 0.85, ancho: 0.9 },
  { x: 0.4, arriba: 0.88, ancho: 0.91 },
  { x: 0.0, arriba: 0.9, ancho: 0.92 },
  { x: -0.4, arriba: 0.9, ancho: 0.92 },
  { x: -0.8, arriba: 0.885, ancho: 0.91 },
  { x: -1.2, arriba: 0.855, ancho: 0.9 },
  { x: -1.5, arriba: 0.81, ancho: 0.86 },
  { x: -1.72, arriba: 0.75, ancho: 0.8 },
  { x: -1.9, arriba: 0.67, ancho: 0.72 },
  { x: -2.02, arriba: 0.58, ancho: 0.5 },
  { x: -2.08, arriba: 0.5, ancho: 0.36 },
];

/** Estaciones de la cabina de cristal (parabrisas, techo y luneta). */
const ESTACIONES_CABINA = [
  { x: 0.62, base: 0.89, arriba: 0.93, ancho: 0.73 },
  { x: 0.45, base: 0.9, arriba: 1.03, ancho: 0.71 },
  { x: 0.2, base: 0.91, arriba: 1.17, ancho: 0.68 },
  { x: -0.1, base: 0.92, arriba: 1.23, ancho: 0.66 },
  { x: -0.4, base: 0.92, arriba: 1.24, ancho: 0.63 },
  { x: -0.7, base: 0.91, arriba: 1.2, ancho: 0.6 },
  { x: -1.0, base: 0.9, arriba: 1.1, ancho: 0.56 },
  { x: -1.2, base: 0.88, arriba: 0.92, ancho: 0.5 },
];

/**
 * Superficie alabeada: une anillos con sección de superelipse a lo largo del
 * eje X. Sirve para la carrocería y da curvas suaves sin modelos externos.
 */
function crearLoft(estaciones, { lados = 32 } = {}) {
  const posiciones = [];
  const indices = [];

  for (const estacion of estaciones) {
    const centroY = (0.16 + estacion.arriba) / 2;
    const altura = estacion.arriba - 0.16;
    for (let j = 0; j < lados; j += 1) {
      const angulo = (j / lados) * Math.PI * 2;
      const cos = Math.cos(angulo);
      const sin = Math.sin(angulo);
      const exponente = estacion.exponente ?? 4;
      const z =
        Math.sign(cos) * Math.pow(Math.abs(cos), 2 / exponente) * estacion.ancho;
      const y =
        centroY +
        Math.sign(sin) * Math.pow(Math.abs(sin), 2 / exponente) * (altura / 2);
      posiciones.push(estacion.x, y, z);
    }
  }

  for (let i = 0; i < estaciones.length - 1; i += 1) {
    for (let j = 0; j < lados; j += 1) {
      const a = i * lados + j;
      const b = i * lados + ((j + 1) % lados);
      const c = (i + 1) * lados + j;
      const d = (i + 1) * lados + ((j + 1) % lados);
      indices.push(a, c, d, a, d, b);
    }
  }

  // Tapas del morro y del maletero.
  const primerCentro = posiciones.length / 3;
  posiciones.push(
    estaciones[0].x - 0.05,
    (0.16 + estaciones[0].arriba) / 2,
    0,
  );
  for (let j = 0; j < lados; j += 1) {
    indices.push(primerCentro, ((j + 1) % lados), j);
  }

  const baseUltimo = (estaciones.length - 1) * lados;
  const centroFinal = posiciones.length / 3;
  posiciones.push(
    estaciones.at(-1).x + 0.05,
    (0.16 + estaciones.at(-1).arriba) / 2,
    0,
  );
  for (let j = 0; j < lados; j += 1) {
    indices.push(centroFinal, baseUltimo + j, baseUltimo + ((j + 1) % lados));
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  return geometria;
}

/** Bóveda de la cabina: arco elíptico entre la base izquierda y la derecha. */
function crearBoveda(
  estaciones,
  { arco = 30, desde = 0, hasta = Math.PI, cerrarBase = false, escala = 1 } = {},
) {
  const posiciones = [];
  const indices = [];

  for (const estacion of estaciones) {
    for (let j = 0; j < arco; j += 1) {
      const t = desde + (hasta - desde) * (j / (arco - 1));
      const z = Math.cos(t) * estacion.ancho * escala;
      const y =
        estacion.base +
        Math.sin(t) * (estacion.arriba - estacion.base) * escala;
      posiciones.push(estacion.x, y, z);
    }
  }

  for (let i = 0; i < estaciones.length - 1; i += 1) {
    for (let j = 0; j < arco - 1; j += 1) {
      const a = i * arco + j;
      const b = a + 1;
      const c = (i + 1) * arco + j;
      const d = c + 1;
      indices.push(a, c, d, a, d, b);
    }
  }

  if (cerrarBase) {
    for (let i = 0; i < estaciones.length - 1; i += 1) {
      const a = i * arco;
      const b = i * arco + (arco - 1);
      const c = (i + 1) * arco;
      const d = (i + 1) * arco + (arco - 1);
      indices.push(a, b, d, a, d, c);
    }
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setIndex(indices);
  geometria.computeVertexNormals();
  return geometria;
}

function crearTubo(puntos, radio, material) {
  const curva = new THREE.CatmullRomCurve3(
    puntos.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  const malla = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 24, radio, 8, false),
    material,
  );
  malla.castShadow = true;
  return malla;
}

/**
 * Entorno de estudio suave: un mapa equirectangular con softboxes amplios y
 * luces de marca. Da reflejos limpios sin los paneles blancos duros de una
 * habitación cúbica.
 */
function crearEntorno(renderizador) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 1024;
  lienzo.height = 512;
  const contexto = lienzo.getContext('2d');

  const fondo = contexto.createLinearGradient(0, 0, 0, 512);
  fondo.addColorStop(0, '#3c496e');
  fondo.addColorStop(0.34, '#141b30');
  fondo.addColorStop(0.5, '#0a0e1a');
  fondo.addColorStop(0.72, '#04050c');
  fondo.addColorStop(1, '#010208');
  contexto.fillStyle = fondo;
  contexto.fillRect(0, 0, 1024, 512);

  const halo = (x, y, rx, ry, color, alfa) => {
    contexto.save();
    contexto.globalAlpha = alfa;
    contexto.translate(x, y);
    contexto.scale(1, ry / rx);
    const degradado = contexto.createRadialGradient(0, 0, 0, 0, 0, rx);
    degradado.addColorStop(0, color);
    degradado.addColorStop(0.45, color);
    degradado.addColorStop(1, 'rgba(0, 0, 0, 0)');
    contexto.fillStyle = degradado;
    contexto.beginPath();
    contexto.arc(0, 0, rx, 0, Math.PI * 2);
    contexto.fill();
    contexto.restore();
  };

  // Softbox cenital, franja de estudio y luces laterales de marca.
  halo(512, 72, 330, 90, 'rgba(255, 255, 255, 0.9)', 0.55);
  halo(512, 200, 440, 52, 'rgba(214, 228, 255, 0.5)', 0.3);
  halo(150, 226, 200, 150, 'rgba(139, 107, 255, 0.95)', 0.58);
  halo(872, 240, 180, 140, 'rgba(110, 168, 255, 0.7)', 0.42);
  halo(512, 300, 620, 180, 'rgba(96, 116, 178, 0.35)', 0.22);
  halo(512, 424, 470, 62, 'rgba(74, 92, 148, 0.45)', 0.28);

  const textura = new THREE.CanvasTexture(lienzo);
  textura.mapping = THREE.EquirectangularReflectionMapping;
  textura.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderizador);
  const entorno = pmrem.fromEquirectangular(textura).texture;
  textura.dispose();
  pmrem.dispose();
  return entorno;
}

function crearTexturaSombra() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 256;
  lienzo.height = 256;
  const contexto = lienzo.getContext('2d');
  const degradado = contexto.createRadialGradient(128, 128, 12, 128, 128, 128);
  degradado.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  degradado.addColorStop(0.55, 'rgba(255, 255, 255, 0.55)');
  degradado.addColorStop(1, 'rgba(255, 255, 255, 0)');
  contexto.fillStyle = degradado;
  contexto.fillRect(0, 0, 256, 256);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

function crearTexturaBrillo() {
  const lienzo = document.createElement('canvas');
  lienzo.width = 128;
  lienzo.height = 128;
  const contexto = lienzo.getContext('2d');
  const degradado = contexto.createRadialGradient(64, 64, 0, 64, 64, 64);
  degradado.addColorStop(0, 'rgba(255, 255, 255, 1)');
  degradado.addColorStop(0.28, 'rgba(200, 231, 255, 0.75)');
  degradado.addColorStop(1, 'rgba(200, 231, 255, 0)');
  contexto.fillStyle = degradado;
  contexto.fillRect(0, 0, 128, 128);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

/** Rueda completa: goma, llanta oscura de cinco radios y pinza violeta. */
function crearRueda(materiales, lado) {
  const grupo = new THREE.Group();
  const ancho = 0.25;
  const radio = 0.325;

  const goma = new THREE.Mesh(
    new THREE.CylinderGeometry(radio, radio, ancho, 48),
    materiales.goma,
  );
  goma.rotation.x = Math.PI / 2;
  goma.castShadow = true;
  grupo.add(goma);

  // Hombro redondeado de la goma.
  const hombro = new THREE.Mesh(
    new THREE.TorusGeometry(0.292, 0.023, 10, 40),
    materiales.goma,
  );
  hombro.position.z = ancho / 2 - 0.008;
  grupo.add(hombro);

  // Borde cromado de la llanta.
  const aro = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.235, ancho + 0.006, 40),
    materiales.cromo,
  );
  aro.rotation.x = Math.PI / 2;
  aro.castShadow = true;
  grupo.add(aro);

  // Fondo oscuro de la llanta.
  const fondo = new THREE.Mesh(
    new THREE.CircleGeometry(0.222, 40),
    materiales.llanta,
  );
  fondo.position.z = ancho / 2 + 0.004;
  grupo.add(fondo);

  // Cinco radios dobles en plata.
  for (let i = 0; i < 5; i += 1) {
    const angulo = (i / 5) * Math.PI * 2;
    const radio5 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.17, 0.024),
      materiales.titanio,
    );
    radio5.position.set(
      Math.cos(angulo) * 0.115,
      Math.sin(angulo) * 0.115,
      ancho / 2 + 0.016,
    );
    radio5.rotation.z = angulo - Math.PI / 2;
    grupo.add(radio5);
  }

  const buje = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.056, 0.03, 24),
    materiales.cromo,
  );
  buje.rotation.x = Math.PI / 2;
  buje.position.z = ancho / 2 + 0.022;
  grupo.add(buje);

  // Pinza de freno visible entre los radios.
  const pinza = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.11, 0.025),
    materiales.caliper,
  );
  pinza.position.set(
    Math.cos(1.05) * 0.145,
    Math.sin(1.05) * 0.145,
    ancho / 2 + 0.028,
  );
  pinza.rotation.z = 1.05 - Math.PI / 2;
  grupo.add(pinza);

  // La rueda del lado izquierdo se refleja para que la llanta mire afuera.
  if (lado < 0) grupo.rotation.y = Math.PI;

  return grupo;
}

/** Monta la escena completa y devuelve una API para controlarla desde React. */
function crearEscena(contenedor) {
  const escena = new THREE.Scene();

  const camara = new THREE.PerspectiveCamera(29, 1, 0.1, 60);
  camara.position.set(4.8, 2.75, 5.7);
  camara.lookAt(0, 0.28, 0);

  const renderizador = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderizador.setClearColor(0x000000, 0);
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFShadowMap;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.02;
  renderizador.outputColorSpace = THREE.SRGBColorSpace;
  renderizador.domElement.className = 'carro-lienzo';
  contenedor.appendChild(renderizador.domElement);

  const entorno = crearEntorno(renderizador);
  escena.environment = entorno;

  // Luces: clave blanca, relleno frío y contraluz violeta.
  const ambiente = new THREE.HemisphereLight(0x9fc7ff, 0x05060f, 0.48);
  escena.add(ambiente);

  const luzClave = new THREE.DirectionalLight(0xffffff, 2.2);
  luzClave.position.set(4.5, 7, 4.5);
  luzClave.castShadow = true;
  luzClave.shadow.mapSize.set(1024, 1024);
  luzClave.shadow.camera.left = -4;
  luzClave.shadow.camera.right = 4;
  luzClave.shadow.camera.top = 4;
  luzClave.shadow.camera.bottom = -4;
  luzClave.shadow.camera.near = 0.5;
  luzClave.shadow.camera.far = 20;
  luzClave.shadow.bias = -0.0004;
  escena.add(luzClave);

  const luzRim = new THREE.DirectionalLight(0x8b6bff, 2.4);
  luzRim.position.set(-5, 2.4, -4.5);
  escena.add(luzRim);

  const luzRelleno = new THREE.DirectionalLight(0x6ea8ff, 0.9);
  luzRelleno.position.set(3, 1.2, -5);
  escena.add(luzRelleno);

  const luzSuelo = new THREE.PointLight(0x663af3, 3.2, 10, 1.8);
  luzSuelo.position.set(-2.2, 0.35, 2.4);
  escena.add(luzSuelo);

  // Piso de estudio: disco oscuro que recibe la sombra del auto.
  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 72),
    new THREE.MeshStandardMaterial({
      color: 0x080b15,
      metalness: 0.45,
      roughness: 0.6,
      envMapIntensity: 0.5,
    }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = 0;
  piso.receiveShadow = true;
  escena.add(piso);

  const aroSuelo = new THREE.Mesh(
    new THREE.RingGeometry(2.42, 2.48, 96),
    new THREE.MeshBasicMaterial({
      color: 0x8b6bff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  aroSuelo.rotation.x = -Math.PI / 2;
  aroSuelo.position.y = 0.004;
  escena.add(aroSuelo);

  // Sombra suave de contacto bajo el auto.
  const texturaSombra = crearTexturaSombra();
  const sombraSuave = new THREE.Mesh(
    new THREE.PlaneGeometry(4.1, 2),
    new THREE.MeshBasicMaterial({
      map: texturaSombra,
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  sombraSuave.rotation.x = -Math.PI / 2;
  sombraSuave.position.y = 0.002;
  escena.add(sombraSuave);

  // Materiales
  const materialPintura = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(PINTURAS[0].color),
    metalness: 0.3,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
  });
  const materialCristal = new THREE.MeshPhysicalMaterial({
    color: 0x141028,
    metalness: 0.5,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.9,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
  });
  const materialTecho = materialPintura.clone();
  materialTecho.emissive = new THREE.Color(0x1a0a44);
  materialTecho.emissiveIntensity = 0.4;
  materialTecho.side = THREE.DoubleSide;
  const materiales = {
    pintura: materialPintura,
    cristal: materialCristal,
    negro: new THREE.MeshStandardMaterial({
      color: 0x06070c,
      metalness: 0.2,
      roughness: 0.72,
    }),
    cromo: new THREE.MeshStandardMaterial({
      color: 0xb8c6da,
      metalness: 1,
      roughness: 0.28,
      envMapIntensity: 1,
    }),
    titanio: new THREE.MeshStandardMaterial({
      color: 0xaebbd0,
      metalness: 0.95,
      roughness: 0.3,
      envMapIntensity: 0.9,
    }),
    goma: new THREE.MeshStandardMaterial({
      color: 0x08090d,
      metalness: 0.05,
      roughness: 0.92,
    }),
    llanta: new THREE.MeshStandardMaterial({
      color: 0x121722,
      metalness: 0.75,
      roughness: 0.4,
    }),
    caliper: new THREE.MeshStandardMaterial({
      color: 0x8b6bff,
      metalness: 0.55,
      roughness: 0.32,
    }),
    faro: new THREE.MeshStandardMaterial({
      color: 0xe8f4ff,
      emissive: 0xcfe9ff,
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.18,
    }),
    piloto: new THREE.MeshStandardMaterial({
      color: 0xff5d73,
      emissive: 0xff2545,
      emissiveIntensity: 1,
      metalness: 0.25,
      roughness: 0.28,
    }),
  };

  const carro = new THREE.Group();

  // Carrocería
  const cuerpo = new THREE.Mesh(crearLoft(ESTACIONES), materialPintura);
  cuerpo.castShadow = true;
  cuerpo.receiveShadow = true;
  carro.add(cuerpo);

  // Cabina de cristal y techo pintado
  const cabina = new THREE.Mesh(
    crearBoveda(ESTACIONES_CABINA, { arco: 30 }),
    materialCristal,
  );
  cabina.castShadow = true;
  carro.add(cabina);

  const estacionesTecho = ESTACIONES_CABINA.filter(
    (estacion) => estacion.x <= 0.22 && estacion.x >= -0.82,
  );
  const techo = new THREE.Mesh(
    crearBoveda(estacionesTecho, {
      arco: 18,
      desde: 0.38,
      hasta: Math.PI - 0.38,
      escala: 1.03,
    }),
    materialTecho,
  );
  techo.castShadow = true;
  carro.add(techo);

  // Marco cromado de la ventanilla y espejos
  [-1, 1].forEach((lado) => {
    // Marco cromado de la ventanilla
    carro.add(
      crearTubo(
        [
          [0.6, 0.9, lado * 0.735],
          [0.0, 0.92, lado * 0.68],
          [-0.7, 0.91, lado * 0.62],
          [-1.16, 0.885, lado * 0.51],
        ],
        0.008,
        materiales.cromo,
      ),
    );
    // Espejos retrovisores
    const espejo = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 16, 12),
      materialPintura,
    );
    espejo.scale.set(0.85, 0.55, 1.15);
    espejo.position.set(0.5, 0.87, lado * 0.91);
    espejo.castShadow = true;
    carro.add(espejo);
    const brazo = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.022, 0.1),
      materiales.negro,
    );
    brazo.position.set(0.5, 0.84, lado * 0.84);
    carro.add(brazo);
    // Manija de la puerta
    const manija = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.025, 0.02),
      materiales.cromo,
    );
    manija.position.set(-0.12, 0.68, lado * 0.868);
    carro.add(manija);
    // Línea de la puerta
    carro.add(
      crearTubo(
        [
          [0.7, 0.86, lado * 0.72],
          [0.62, 0.6, lado * 0.9],
          [0.58, 0.28, lado * 0.86],
        ],
        0.004,
        materiales.negro,
      ),
    );
    // Estribo y moldura inferior
    const estribo = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.055, 0.045),
      materiales.negro,
    );
    estribo.position.set(0, 0.19, lado * 0.9);
    carro.add(estribo);
  });

  // Parrilla enmarcada en cromo y toma de aire inferior
  const parrilla = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.17, 0.56),
    materiales.negro,
  );
  parrilla.position.set(2.025, 0.4, 0);
  carro.add(parrilla);

  const marcoSuperior = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.01, 0.58),
    materiales.cromo,
  );
  marcoSuperior.position.set(2.036, 0.487, 0);
  carro.add(marcoSuperior);

  const marcoInferior = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.01, 0.58),
    materiales.cromo,
  );
  marcoInferior.position.set(2.036, 0.313, 0);
  carro.add(marcoInferior);

  [-1, 1].forEach((lado) => {
    const marcoLateral = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.19, 0.01),
      materiales.cromo,
    );
    marcoLateral.position.set(2.036, 0.4, lado * 0.295);
    carro.add(marcoLateral);
  });

  const tomaInferior = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.075, 0.62),
    materiales.negro,
  );
  tomaInferior.position.set(2.0, 0.255, 0);
  carro.add(tomaInferior);

  const labio = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.04, 0.95),
    materiales.negro,
  );
  labio.position.set(1.92, 0.13, 0);
  carro.add(labio);

  // Faros delgados sobre las aletas delanteras
  [-1, 1].forEach((lado) => {
    const carcasa = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.075, 0.34),
      materiales.negro,
    );
    carcasa.position.set(1.975, 0.54, lado * 0.33);
    carcasa.rotation.y = lado * -0.22;
    carro.add(carcasa);

    const faro = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.045, 0.3),
      materiales.faro,
    );
    faro.position.set(2.005, 0.555, lado * 0.33);
    faro.rotation.y = lado * -0.22;
    carro.add(faro);
  });

  // Pilotos traseros redondos estilo deportivo japonés
  [-1, 1].forEach((lado) => {
    const anillo = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.014, 8, 24),
      materiales.cromo,
    );
    anillo.rotation.y = Math.PI / 2;
    anillo.position.set(-2.085, 0.52, lado * 0.27);
    carro.add(anillo);

    const piloto = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.02, 24),
      materiales.piloto,
    );
    piloto.rotation.z = Math.PI / 2;
    piloto.position.set(-2.095, 0.52, lado * 0.27);
    carro.add(piloto);
  });

  const terceraLuz = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.014, 0.2),
    materiales.piloto,
  );
  terceraLuz.position.set(-1.93, 0.685, 0);
  carro.add(terceraLuz);

  // Difusor, alerón y escapes
  const difusor = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.12, 1.08),
    materiales.negro,
  );
  difusor.position.set(-1.96, 0.16, 0);
  carro.add(difusor);

  const aleron = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.03, 0.95),
    materialPintura,
  );
  aleron.position.set(-1.88, 0.7, 0);
  aleron.rotation.z = -0.08;
  aleron.castShadow = true;
  carro.add(aleron);

  [-1, 1].forEach((lado) => {
    const escape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.14, 20),
      materiales.cromo,
    );
    escape.rotation.z = Math.PI / 2;
    escape.position.set(-2.04, 0.22, lado * 0.31);
    carro.add(escape);

    const interior = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 18),
      materiales.negro,
    );
    interior.rotation.y = -Math.PI / 2;
    interior.position.set(-2.111, 0.22, lado * 0.31);
    carro.add(interior);
  });

  // Ruedas y pasos de rueda
  const ruedas = [];
  [
    [1.22, 1],
    [1.22, -1],
    [-1.2, 1],
    [-1.2, -1],
  ].forEach(([x, lado]) => {
    const rueda = crearRueda(materiales, lado);
    rueda.position.set(x, 0.325, lado * 0.86);
    carro.add(rueda);
    ruedas.push(rueda);

    // Pase de rueda: junta oscura entre la goma y la carrocería.
    const junta = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.035, 8, 40, Math.PI),
      materiales.negro,
    );
    junta.position.set(x, 0.325, lado * 0.915);
    carro.add(junta);
  });

  // Insignia del morro
  const insignia = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.009, 8, 24),
    materiales.cromo,
  );
  insignia.rotation.y = Math.PI / 2;
  insignia.position.set(2.062, 0.455, 0);
  carro.add(insignia);

  carro.rotation.y = -0.35;
  escena.add(carro);

  // Brillos de los faros
  const texturaBrillo = crearTexturaBrillo();
  const brillos = [];
  [-1, 1].forEach((lado) => {
    const brillo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texturaBrillo,
        color: 0xcfe9ff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    brillo.position.set(2.03, 0.56, lado * 0.33);
    brillo.scale.set(0.55, 0.3, 1);
    carro.add(brillo);
    brillos.push(brillo);
  });

  // Interacción: arrastrar para girar el auto, clic para encender los faros.
  const lienzo = renderizador.domElement;
  let yaw = carro.rotation.y;
  let velocidad = 0;
  let arrastrando = false;
  let ultimoX = 0;
  let movimiento = 0;
  let ultimaInteraccion = performance.now();
  let temporizadorFaros = null;
  let acelerando = false;
  const reducirMovimiento = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  const punteroAbajo = (evento) => {
    arrastrando = true;
    ultimoX = evento.clientX;
    movimiento = 0;
    lienzo.setPointerCapture?.(evento.pointerId);
    lienzo.style.cursor = 'grabbing';
  };

  const punteroMueve = (evento) => {
    const caja = contenedor.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width - 0.5;
    const y = (evento.clientY - caja.top) / caja.height - 0.5;
    contenedor.style.setProperty('--luz-x', `${50 + x * 34}%`);
    contenedor.style.setProperty('--luz-y', `${40 + y * 30}%`);

    if (!arrastrando) return;
    const delta = evento.clientX - ultimoX;
    ultimoX = evento.clientX;
    movimiento += Math.abs(delta);
    yaw += delta * 0.006;
    velocidad = delta * 0.0018;
    ultimaInteraccion = performance.now();
  };

  const punteroArriba = (evento) => {
    if (!arrastrando) return;
    arrastrando = false;
    lienzo.style.cursor = 'grab';
    lienzo.releasePointerCapture?.(evento.pointerId);
    ultimaInteraccion = performance.now();
    if (movimiento < 6) encenderFaros();
  };

  const encenderFaros = () => {
    materiales.faro.emissiveIntensity = 4;
    brillos.forEach((brillo) => {
      brillo.material.opacity = 0.9;
    });
    clearTimeout(temporizadorFaros);
    temporizadorFaros = setTimeout(() => {
      materiales.faro.emissiveIntensity = 0.35;
      brillos.forEach((brillo) => {
        brillo.material.opacity = 0.12;
      });
    }, 1500);
  };

  lienzo.addEventListener('pointerdown', punteroAbajo);
  lienzo.addEventListener('pointermove', punteroMueve);
  lienzo.addEventListener('pointerup', punteroArriba);
  lienzo.addEventListener('pointercancel', punteroArriba);
  lienzo.addEventListener('pointerleave', () => {
    if (!arrastrando) {
      contenedor.style.setProperty('--luz-x', '50%');
      contenedor.style.setProperty('--luz-y', '40%');
    }
  });

  const ajustarTamano = () => {
    const ancho = contenedor.clientWidth || 600;
    const alto = contenedor.clientHeight || 420;
    renderizador.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.fov = camara.aspect < 1.2 ? 37 : 29;
    const escala = camara.aspect < 1.2 ? 1.2 : 1;
    camara.position.set(4.8 * escala, 2.75 * escala, 5.7 * escala);
    camara.lookAt(0, 0.28, 0);
    camara.updateProjectionMatrix();
  };
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);
  ajustarTamano();

  let ultimoTiempo = performance.now();
  let montado = true;

  const animar = () => {
    const ahora = performance.now();
    const delta = Math.min((ahora - ultimoTiempo) / 1000, 0.05);
    ultimoTiempo = ahora;

    if (!arrastrando) {
      if (ahora - ultimaInteraccion > 2400 && !reducirMovimiento) {
        yaw += delta * 0.13;
      } else {
        yaw += velocidad;
        velocidad *= 0.93;
      }
    }
    carro.rotation.y = yaw;

    // Vibración mínima del motor mientras se escribe.
    carro.position.y = acelerando ? Math.sin(ahora * 0.05) * 0.0028 : 0;

    renderizador.render(escena, camara);
  };
  renderizador.setAnimationLoop(() => {
    if (montado) animar();
  });

  const alCambiarVisibilidad = () => {
    if (document.hidden) {
      renderizador.setAnimationLoop(null);
    } else {
      renderizador.setAnimationLoop(() => {
        if (montado) animar();
      });
    }
  };
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  return {
    api: {
      pintar(color) {
        materialPintura.color.set(color);
        materialTecho.color.set(color);
      },
      acelerar(activo) {
        acelerando = activo;
      },
      faros(activo) {
        if (activo) encenderFaros();
        else {
          materiales.faro.emissiveIntensity = 0.35;
          brillos.forEach((brillo) => {
            brillo.material.opacity = 0.12;
          });
        }
      },
    },
    dispose() {
      montado = false;
      clearTimeout(temporizadorFaros);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      observador.disconnect();
      lienzo.removeEventListener('pointerdown', punteroAbajo);
      lienzo.removeEventListener('pointermove', punteroMueve);
      lienzo.removeEventListener('pointerup', punteroArriba);
      lienzo.removeEventListener('pointercancel', punteroArriba);
      renderizador.setAnimationLoop(null);
      escena.traverse((objeto) => {
        if (objeto.geometry) objeto.geometry.dispose();
        if (objeto.material) {
          const lista = Array.isArray(objeto.material)
            ? objeto.material
            : [objeto.material];
          lista.forEach((material) => {
            Object.values(material).forEach((valor) => {
              if (valor && valor.isTexture) valor.dispose();
            });
            material.dispose();
          });
        }
      });
      texturaBrillo.dispose();
      entorno.dispose();
      renderizador.dispose();
      if (lienzo.parentElement === contenedor) contenedor.removeChild(lienzo);
    },
  };
}

/**
 * Escena 3D real del auto (Three.js). La carrocería se genera por secciones
 * para lograr un deportivo tipo Mazda, con pintura física, reflejos de
 * estudio, sombras y giro automático/interno. El HUD sigue siendo HTML.
 */
export default function Carro3D() {
  const contenedorRef = useRef(null);
  const apiRef = useRef(null);
  const temporizador = useRef(null);
  const [pintura, setPintura] = useState(PINTURAS[0]);
  const [acelerando, setAcelerando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let montaje;
    try {
      montaje = crearEscena(contenedorRef.current);
      apiRef.current = montaje.api;
    } catch (fallo) {
      console.error('No se pudo iniciar la escena 3D', fallo);
      setError(true);
      return undefined;
    }
    return () => {
      apiRef.current = null;
      montaje.dispose();
    };
  }, []);

  useEffect(() => {
    apiRef.current?.pintar(pintura.color);
  }, [pintura]);

  useEffect(() => {
    apiRef.current?.acelerar(acelerando);
  }, [acelerando]);

  const acelerar = useCallback(() => {
    setAcelerando(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAcelerando(false), 900);
  }, []);

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
    };
  }, [acelerar]);

  return (
    <div
      ref={contenedorRef}
      className={`carro-escena ${acelerando ? 'acelerando' : ''}`}
      aria-label="Auto deportivo 3D interactivo"
    >
      <div className="carro-halo" aria-hidden="true" />
      <div className="carro-plataforma" aria-hidden="true" />
      <span className="carro-particula carro-particula-1" aria-hidden="true" />
      <span className="carro-particula carro-particula-2" aria-hidden="true" />
      <span className="carro-particula carro-particula-3" aria-hidden="true" />
      <span className="carro-particula carro-particula-4" aria-hidden="true" />

      {error && (
        <p className="relative z-10 max-w-xs text-center text-xs text-muted">
          Tu navegador no pudo iniciar el modelo 3D, pero puedes iniciar sesión
          con normalidad.
        </p>
      )}

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
            <span className="hidden sm:inline">Arrastra para girar · clic para encender</span>
            <span className="sm:hidden">Arrastra · toca el auto</span>
          </p>
        </div>
      </div>
    </div>
  );
}
