/**
 * holo_card.js
 *
 * Battle Spirits Eternal — React Bits <HoloCard /> WebGL2 Runtime &
 * Exact Artwork-Boundary Isolated Hover Integration.
 *
 * Key invariants:
 * - Zero idle animation (idle = false).
 * - Explicit hover-active state (uActive) zeroes foil, edge sparkle, glare, and tilt when inactive.
 * - Independent per-artwork HoloCardInstance (no grid-level hover handler or parent :hover).
 * - Lazy WebGL2 context creation on artwork pointerenter; full disposal on settle/exit.
 * - Graceful fallback to original card artwork when WebGL2 is unavailable or CORS blocks texImage2D.
 */
(function (globalScope) {
  'use strict';

  const PRESETS = ['bursts', 'stars', 'shards', 'cosmos', 'rainbow', 'swirl', 'glitter', 'gold'];
  const PERSPECTIVE = 1100;
  const CARD_RATIO = 63 / 88;

  const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D uArt;
uniform vec2 uSize;
uniform float uAspect;
uniform vec2 uTilt;
uniform vec2 uLight;
uniform float uDistance;
uniform int uPreset;
uniform float uIntensity;
uniform float uScale;
uniform float uEdge;
uniform float uFrame;
uniform float uRadius;
uniform float uGlare;
uniform vec3 uFoil;
uniform float uReady;
uniform float uActive;
uniform float uOverlayOnly;

out vec4 outColor;

const float TAU = 6.28318530718;

struct Foil {
  float mask;
  float angle;
  float jitter;
  vec2 facet;
};

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

vec2 hash2(vec2 p) {
  return vec2(hash(p), hash(p + 17.31));
}

vec3 hue(float t) {
  t = abs(fract(t * 0.5) * 2.0 - 1.0);
  vec3 c = mix(vec3(0.1, 0.25, 1.0), vec3(0.0, 0.85, 1.0), smoothstep(0.0, 0.25, t));
  c = mix(c, vec3(0.25, 1.0, 0.2), smoothstep(0.25, 0.45, t));
  c = mix(c, vec3(1.0, 0.92, 0.05), smoothstep(0.45, 0.65, t));
  c = mix(c, vec3(1.0, 0.45, 0.05), smoothstep(0.65, 0.85, t));
  return mix(c, vec3(0.95, 0.12, 0.3), smoothstep(0.85, 1.0, t));
}

Foil bursts(vec2 p) {
  vec2 q = mat2(0.7071068, 0.7071068, -0.7071068, 0.7071068) * (p - vec2(0.5, 0.5 * uAspect)) / (0.283 / uScale);
  vec2 d = fract(q) - 0.5;
  float u = length(d) / 0.49;
  float angle = atan(d.y, d.x);
  if (u < 0.12) {
    float ring = min(floor(u / 0.045 + 0.5), 2.0);
    float count = max(1.0, ring * 6.0);
    float spot = (floor(angle / TAU * count) + 0.5) / count * TAU;
    vec2 dot = vec2(cos(spot), sin(spot)) * ring * 0.045;
    float m = smoothstep(0.024, 0.012, length(d / 0.49 - dot));
    return Foil(m, angle, 0.5, vec2(0.0));
  }
  bool inner = u < 0.66;
  float slot = angle / TAU * (inner ? 56.0 : 72.0);
  bool shifted = mod(floor(slot), 2.0) > 0.5;
  vec2 band = inner ? (shifted ? vec2(0.45, 0.61) : vec2(0.33, 0.49)) : (shifted ? vec2(0.84, 0.99) : vec2(0.7, 0.85));
  float across = abs(u - (band.x + band.y) * 0.5) / ((band.y - band.x) * 0.5);
  float along = abs(fract(slot) - 0.5) * 2.0;
  float width = inner ? 0.72 : 0.6;
  float m = smoothstep(1.0, 0.78, across) * smoothstep(width, width - 0.2, along);
  return Foil(m, angle, 0.5, vec2(0.0));
}

Foil stars(vec2 p) {
  Foil best = Foil(0.0, 0.0, 0.0, vec2(0.0));
  vec2 g = p / (0.08 / uScale);
  vec2 base = floor(g);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = base + vec2(float(i), float(j));
      float pick = hash(id + 1.3);
      vec2 d = g - (id + 0.5 + (hash2(id) - 0.5) * 0.55);
      float m = smoothstep(0.07, 0.035, length(d));
      if (pick < 0.62) {
        float size = mix(0.16, 0.5, pow(hash(id + 9.0), 1.8));
        float sector = TAU / (pick < 0.3 ? 4.0 : 5.0);
        float k = abs(fract((atan(d.y, d.x) + hash(id + 4.0) * TAU) / sector) - 0.5) * 2.0;
        float edge = size * mix(1.0, 0.36, pow(k, 0.6));
        m = smoothstep(edge, edge * 0.8, length(d));
      }
      if (m > best.mask) best = Foil(m, hash(id + 6.0) * TAU, hash(id + 8.0), (hash2(id + 2.0) - 0.5) * 0.6);
    }
  }
  return best;
}

Foil shards(vec2 p) {
  vec2 g = p * 19.0 * uScale;
  vec2 base = floor(g);
  float best = 9.0;
  float second = 9.0;
  vec2 id = base;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      float d = length(cell + 0.08 + hash2(cell) * 0.84 - g);
      if (d < best) {
        second = best;
        best = d;
        id = cell;
      } else if (d < second) {
        second = d;
      }
    }
  }
  float crack = smoothstep(0.015, 0.07, second - best);
  float shine = 0.25 + 0.75 * pow(hash(id + 7.7), 2.0);
  return Foil((0.2 + 0.8 * crack) * shine, hash(id + 3.17) * TAU, hash(id + 11.73), (hash2(id + 5.0) - 0.5) * 0.5);
}

Foil cosmos(vec2 p) {
  Foil best = Foil(0.0, 0.0, 0.0, vec2(0.0));
  vec2 g = p / (0.16 / uScale);
  vec2 base = floor(g);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = base + vec2(float(i), float(j));
      vec2 d = g - (id + 0.5 + (hash2(id) - 0.5) * 0.7);
      float size = mix(0.16, 0.52, hash(id + 2.0));
      float r = length(d);
      float m = max(smoothstep(0.05, 0.0, abs(r - size)), smoothstep(size, size - 0.04, r) * 0.22);
      if (m > best.mask) best = Foil(m, hash(id + 6.0) * TAU + atan(d.y, d.x) * 0.5, hash(id + 1.0), (hash2(id + 4.0) - 0.5) * 0.5);
    }
  }
  vec2 fine = p / (0.035 / uScale);
  vec2 cell = floor(fine);
  float dots = smoothstep(0.2, 0.1, length(fine - cell - 0.5 - (hash2(cell + 9.0) - 0.5) * 0.6)) * step(0.55, hash(cell + 2.0));
  if (dots > best.mask) best = Foil(dots, hash(cell) * TAU, hash(cell + 3.0), (hash2(cell + 7.0) - 0.5) * 0.6);
  return best;
}

Foil rainbow(vec2 p) {
  return Foil(0.86 + 0.14 * hash(floor(p * 700.0 * uScale)), 0.2, 0.5, vec2(0.0));
}

Foil swirl(vec2 p) {
  vec2 d = p - vec2(0.5, 0.42 * uAspect);
  float angle = atan(d.y, d.x);
  float rays = 0.55 + 0.45 * smoothstep(0.3, 0.7, abs(fract(angle / TAU * 60.0 * uScale) - 0.5) * 2.0);
  return Foil(rays, angle, length(d), vec2(0.0));
}

Foil glitter(vec2 p) {
  vec2 g = p * 72.0 * uScale;
  vec2 cell = floor(g);
  float size = mix(0.18, 0.4, hash(cell + 3.0));
  float m = smoothstep(size, size * 0.55, length(fract(g) - 0.5 - (hash2(cell) - 0.5) * 0.5)) * step(0.25, hash(cell + 5.0));
  return Foil(m, hash(cell + 7.0) * TAU, hash(cell + 9.0), (hash2(cell + 11.0) - 0.5) * 0.9);
}

Foil gold(vec2 p) {
  Foil flake = glitter(p * 0.8);
  if (flake.mask > 0.5) return flake;
  float etch = 0.55 + 0.45 * smoothstep(0.2, 0.8, abs(fract((p.x * 0.6 + p.y) * 140.0 * uScale) - 0.5) * 2.0);
  return Foil(etch, 0.9, 0.4, vec2(0.0));
}

vec3 sparkles(vec2 p, vec3 halfway, vec2 sweep, float awake) {
  vec2 g = p * 62.0;
  vec2 cell = floor(g);
  vec2 d = fract(g) - 0.5 - (hash2(cell) - 0.5) * 0.36;
  float spin = hash(cell + 3.0) * TAU;
  d = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * d;
  vec2 a = abs(d);
  float hexagon = max(a.x * 0.866 + a.y * 0.5, a.y);
  float size = mix(0.22, 0.38, hash(cell + 2.0));
  float piece = smoothstep(size, size - 0.07, hexagon) * step(0.42, hash(cell + 4.0));
  vec3 facet = normalize(vec3((hash2(cell + 6.0) - 0.5) * 0.9, 1.0));
  float flash = pow(max(dot(facet, halfway), 0.0), 6.0);
  vec3 tint = hue(dot(sweep, vec2(cos(spin), sin(spin))) * 1.2 + dot(sweep, vec2(0.8, 0.6)) * 0.8 + hash(cell + 8.0) * 0.5);
  vec3 color = piece * tint * (0.3 + 1.6 * flash) * awake;
  vec2 fine = p * 210.0;
  vec2 speckCell = floor(fine);
  float speck = smoothstep(0.24, 0.0, length(fract(fine) - 0.5 - (hash2(speckCell) - 0.5) * 0.5)) * step(0.72, hash(speckCell + 1.0));
  float speckFlash = pow(max(dot(normalize(vec3((hash2(speckCell + 2.0) - 0.5) * 0.9, 1.0)), halfway), 0.0), 10.0);
  return color + vec3(1.2) * speck * speckFlash * (1.0 - piece);
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / uSize.x, 1.0 - gl_FragCoord.y / uSize.y);
  vec2 p = vec2(uv.x, uv.y * uAspect);
  vec2 center = vec2(0.5, 0.5 * uAspect);
  vec2 q = abs(p - center) - center + uRadius;
  float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float pixel = 1.0 / uSize.x;
  float alpha = clamp(0.5 - outside / pixel, 0.0, 1.0);
  vec4 sampled = texture(uArt, uv);
  if (uReady > 0.5) alpha *= sampled.a;
  if (alpha <= 0.0) {
    outColor = vec4(0.0);
    return;
  }
  vec3 art = uReady > 0.5 ? pow(sampled.rgb, vec3(2.2)) : vec3(0.0);

  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(uTilt.x), sin(uTilt.x), 0.0, -sin(uTilt.x), cos(uTilt.x));
  mat3 ry = mat3(cos(uTilt.y), 0.0, -sin(uTilt.y), 0.0, 1.0, 0.0, sin(uTilt.y), 0.0, cos(uTilt.y));
  mat3 turn = rx * ry;
  vec3 world = turn * vec3(p - center, 0.0);
  vec3 view = normalize(transpose(turn) * (vec3(0.0, 0.0, uDistance) - world));
  vec3 lamp = vec3((uLight - 0.5) * vec2(1.1, 1.1 * uAspect), 0.9);
  vec3 light = normalize(transpose(turn) * (lamp - world));
  vec3 halfway = normalize(light + view);
  vec2 sweep = light.xy + view.xy;
  float sheen = pow(max(halfway.z, 0.0), 10.0);
  float shine = pow(max(halfway.z, 0.0), 80.0);
  float frame = 1.0 - smoothstep(uFrame - pixel, uFrame + pixel, -outside);

  Foil f;
  if (uPreset == 0) f = bursts(p);
  else if (uPreset == 1) f = stars(p);
  else if (uPreset == 2) f = shards(p);
  else if (uPreset == 3) f = cosmos(p);
  else if (uPreset == 4) f = rainbow(p);
  else if (uPreset == 5) f = swirl(p);
  else if (uPreset == 6) f = glitter(p);
  else f = gold(p);

  vec3 metal = uPreset == 7 ? vec3(1.0, 0.74, 0.38) * dot(uFoil, vec3(0.3333)) * 1.15 : uFoil;
  vec4 look = uPreset == 0 ? vec4(0.25, 1.9, 0.12, 1.0)
    : uPreset == 1 ? vec4(0.6, 1.4, 0.3, 1.0)
    : uPreset == 2 ? vec4(0.9, 0.9, 0.6, 0.5)
    : uPreset == 3 ? vec4(0.7, 1.2, 0.35, 0.85)
    : uPreset == 4 ? vec4(0.0, 2.2, 0.0, 0.45)
    : uPreset == 5 ? vec4(1.6, 0.3, 0.0, 0.4)
    : uPreset == 6 ? vec4(0.9, 1.0, 0.6, 1.0)
    : vec4(0.3, 1.0, 0.2, 0.95);
  vec2 dir = vec2(cos(f.angle), sin(f.angle));
  float phase = dot(sweep, dir) * look.x + dot(sweep, vec2(0.8, 0.6)) * look.y + f.jitter * look.z;
  float spoke = 1.0;
  if (uPreset == 5) {
    float facing = dot(normalize(sweep + 0.0001), dir);
    phase = f.jitter * 2.4 + facing * 0.6 + length(sweep) * 0.8;
    spoke = 0.3 + 0.7 * smoothstep(0.25, 0.95, abs(facing));
  }
  vec3 tint = hue(phase);
  float tintLum = dot(tint, vec3(0.2126, 0.7152, 0.0722));
  tint = clamp(mix(vec3(tintLum), tint, 1.18), 0.0, 1.0);
  if (uPreset == 7) tint = mix(tint, metal, 0.65);
  float glint = pow(max(dot(normalize(vec3(f.facet, 1.0)), halfway), 0.0), 20.0) * step(0.001, length(f.facet));
  bool layered = uPreset == 2 || uPreset == 4 || uPreset == 5 || uPreset == 7;
  vec3 foil = (layered ? tint : mix(tint, vec3(1.0), 0.06)) * (1.28 + 0.36 * sheen) + metal * glint * 1.48;
  float tilted = smoothstep(0.02, 0.21, length(sin(uTilt)));
  float awake = mix(0.2, 1.0, tilted);
  float strength = uIntensity * f.mask * (1.0 - frame) * awake * uActive;
  float band = uPreset == 5 ? spoke : layered ? 0.25 + 0.75 * smoothstep(0.3, 0.95, 0.5 + 0.5 * cos(phase * TAU * 0.5 + 1.3)) : 1.0;

  vec3 sparkleTerm = sparkles(p, halfway, sweep, mix(0.55, 1.0, tilted)) * uEdge * frame * uActive;
  vec3 frameSheen = uFoil * sheen * 0.16 * frame * uActive;
  vec3 glareTerm = vec3(sheen * 0.08 + shine * 0.36) * uGlare * uActive;

  if (uOverlayOnly > 0.5) {
    vec3 holoLight = foil * look.w * band * strength * 0.88 + sparkleTerm * 1.0 + frameSheen + glareTerm;
    vec3 srgb = pow(clamp(holoLight, 0.0, 1.0), vec3(1.0 / 2.2));
    float lum = max(srgb.r, max(srgb.g, srgb.b));
    float outAlpha = clamp(lum * 1.02, 0.0, 0.78) * alpha * uActive;
    outColor = vec4(srgb * outAlpha, outAlpha);
    return;
  }

  vec3 color = layered
    ? 1.0 - (1.0 - art) * (1.0 - clamp(foil * look.w * band * strength, 0.0, 1.0))
    : mix(art, foil, clamp(strength * look.w, 0.0, 1.0));
  color += sparkleTerm;
  color += frameSheen;
  color += glareTerm;
  color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));
  outColor = vec4(color * alpha, alpha);
}
`;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const parseColor = value => {
    const fallback = [0.78, 0.8, 0.84];
    if (typeof document === 'undefined') return fallback;
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (!resolved.startsWith('#') || resolved.length !== 7) return fallback;
    return [1, 3, 5].map(i => Math.pow(parseInt(resolved.slice(i, i + 2), 16) / 255, 2.2));
  };

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };

  const DEFAULT_HOVER_OPTIONS = {
    preset: 'stars',
    intensity: 0.57,
    scale: 1,
    edgeSparkle: 0.50,
    frame: 3,
    glare: 0.33,
    foilColor: '#d8dee9',
    tiltMax: 7,
    hoverScale: 1.02,
    idle: false,
    radius: 10
  };

  const ARTWORK_SELECTOR = [
    '.tile-art',
    '.tile-img-box',
    '.card-art-wrap',
    '.sample-card-art-wrap',
    '.hc-img-wrap',
    '.fsc-img-wrap',
    '.inspector-art-wrap',
    '#modalArtStage'
  ].join(', ');

  const EXCLUDED_TARGET_SELECTOR = [
    '.tile-cost',
    '.tile-deck-count-pill',
    '.tile-colors',
    '.tile-hover-actions',
    '.hc-cost-badge',
    '.hc-zoom-btn',
    '.hc-partner-badge',
    '.hc-advent-badge',
    '.fsc-zoom-btn',
    '.fsc-drag-handle',
    '.modal-art-nav-btn',
    '.modal-art-indicator',
    'button',
    'a'
  ].join(', ');

  const instances = new WeakMap();
  const activeInstances = new Set();
  const liveInstances = new Set();
  let observer = null;
  let globalOptions = { ...DEFAULT_HOVER_OPTIONS };

  function isExcludedTarget(target) {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(target.closest(EXCLUDED_TARGET_SELECTOR));
  }

  function isPointerInsideArtwork(artEl, clientX, clientY) {
    const img = artEl.querySelector('img');
    const rect = (img && img.getBoundingClientRect().width > 0)
      ? img.getBoundingClientRect()
      : artEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return { inside: false, rect };
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    return { inside, rect };
  }

  /**
   * Independent HoloCard instance bound directly to a single card artwork element.
   * Creates WebGL2 resources lazily on hover enter and disposes them when settled.
   */
  function createArtworkInstance(artEl, options = {}) {
    if (!artEl || instances.has(artEl)) return instances.get(artEl) || null;

    const settings = {
      preset: Math.max(0, PRESETS.indexOf(options.preset || DEFAULT_HOVER_OPTIONS.preset)),
      intensity: clamp(options.intensity ?? DEFAULT_HOVER_OPTIONS.intensity, 0, 1),
      scale: clamp(options.scale ?? DEFAULT_HOVER_OPTIONS.scale, 0.25, 4),
      edgeSparkle: clamp(options.edgeSparkle ?? DEFAULT_HOVER_OPTIONS.edgeSparkle, 0, 1),
      frame: clamp(options.frame ?? DEFAULT_HOVER_OPTIONS.frame, 0, 20) / 100,
      glare: clamp(options.glare ?? DEFAULT_HOVER_OPTIONS.glare, 0, 1),
      foil: parseColor(options.foilColor || DEFAULT_HOVER_OPTIONS.foilColor),
      tiltMax: clamp(options.tiltMax ?? DEFAULT_HOVER_OPTIONS.tiltMax, 0, 45),
      hoverScale: clamp(options.hoverScale ?? DEFAULT_HOVER_OPTIONS.hoverScale, 0.8, 1.3),
      idle: false
    };

    const reduce = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    const pointer = { x: 0.5, y: 0.5, inside: false };
    const state = {
      tiltX: 0,
      tiltY: 0,
      tiltVX: 0,
      tiltVY: 0,
      lightX: 0.5,
      lightY: 0.5,
      lightVX: 0,
      lightVY: 0,
      lift: 1,
      liftV: 0,
      active: 0
    };

    let canvas = null;
    let gl = null;
    let program = null;
    let texture = null;
    let buffer = null;
    let uniforms = {};
    let textureReady = false;
    let uploadedSrc = '';
    let corsProbeSrc = '';
    let webglUnavailable = false;
    let raf = 0;
    let last = 0;
    let calm = 0;
    let destroyed = false;

    function getRadiusPx() {
      if (artEl.id === 'modalArtStage') return 14;
      try {
        const r = parseFloat(window.getComputedStyle(artEl).borderTopLeftRadius);
        if (!Number.isNaN(r) && r > 0) return r;
      } catch {}
      return options.radius ?? DEFAULT_HOVER_OPTIONS.radius;
    }

    function disposeWebGL() {
      if (gl) {
        try {
          if (texture) gl.deleteTexture(texture);
          if (buffer) gl.deleteBuffer(buffer);
          if (program) gl.deleteProgram(program);
          const loseExt = gl.getExtension('WEBGL_lose_context');
          if (loseExt) loseExt.loseContext();
        } catch {}
      }
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
      gl = null;
      program = null;
      texture = null;
      buffer = null;
      uniforms = {};
      textureReady = false;
      uploadedSrc = '';
    }

    function ensureWebGL() {
      if (webglUnavailable || destroyed) return false;
      if (gl && program && canvas && canvas.isConnected) return true;

      canvas = document.createElement('canvas');
      canvas.className = 'holo-card__canvas-overlay';
      canvas.setAttribute('aria-hidden', 'true');

      try {
        gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
      } catch {
        gl = null;
      }
      if (!gl) {
        webglUnavailable = true;
        canvas = null;
        return false;
      }

      const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
      const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      if (vertex && fragment) {
        program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.bindAttribLocation(program, 0, 'position');
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program);
          program = null;
        }
      }
      if (!program) {
        webglUnavailable = true;
        disposeWebGL();
        return false;
      }

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

      for (const name of [
        'uArt', 'uSize', 'uAspect', 'uTilt', 'uLight', 'uDistance',
        'uPreset', 'uIntensity', 'uScale', 'uEdge', 'uFrame', 'uRadius',
        'uGlare', 'uFoil', 'uReady', 'uActive', 'uOverlayOnly'
      ]) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }

      artEl.appendChild(canvas);
      syncCanvasSize();
      tryUploadArtworkTexture();
      return true;
    }

    function syncCanvasSize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round((artEl.clientWidth || 160) * dpr));
      const h = Math.max(1, Math.round((artEl.clientHeight || 220) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function tryUploadArtworkTexture() {
      if (!gl || !program || !texture) return;
      const domImg = artEl.querySelector('img');
      const src = domImg ? (domImg.currentSrc || domImg.src || '') : '';
      if (!src) {
        textureReady = false;
        return;
      }
      if (uploadedSrc === src && textureReady) return;

      // 1. Try direct upload first (succeeds for same-origin, data URI, or CORS-clean images)
      if (domImg.complete && domImg.naturalWidth > 0) {
        try {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, domImg);
          gl.generateMipmap(gl.TEXTURE_2D);
          textureReady = true;
          uploadedSrc = src;
          return;
        } catch {
          textureReady = false;
        }
      }

      // 2. Probe once via crossOrigin = 'anonymous' if external URL
      if (corsProbeSrc === src) return;
      corsProbeSrc = src;
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.decoding = 'async';
      probe.onload = () => {
        if (destroyed || !gl || !program || !texture || !pointer.inside) return;
        try {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, probe);
          gl.generateMipmap(gl.TEXTURE_2D);
          textureReady = true;
          uploadedSrc = src;
          draw();
        } catch {
          textureReady = false;
        }
      };
      probe.onerror = () => {
        textureReady = false;
      };
      probe.src = src;
    }

    function draw() {
      if (!gl || !program || !canvas) return;
      syncCanvasSize();
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;

      if (textureReady) {
        canvas.classList.remove('holo-overlay-blend');
      } else {
        canvas.classList.add('holo-overlay-blend');
      }

      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.uArt, 0);
      gl.uniform2f(uniforms.uSize, w, h);
      gl.uniform1f(uniforms.uAspect, h / w);
      gl.uniform2f(uniforms.uTilt, (state.tiltX * Math.PI) / 180, (state.tiltY * Math.PI) / 180);
      gl.uniform2f(uniforms.uLight, state.lightX, state.lightY);
      gl.uniform1f(uniforms.uDistance, PERSPECTIVE / Math.max(1, artEl.clientWidth || 160));
      gl.uniform1i(uniforms.uPreset, settings.preset);
      gl.uniform1f(uniforms.uIntensity, settings.intensity);
      gl.uniform1f(uniforms.uScale, settings.scale);
      gl.uniform1f(uniforms.uEdge, settings.edgeSparkle);
      gl.uniform1f(uniforms.uFrame, settings.frame);
      gl.uniform1f(uniforms.uRadius, getRadiusPx() / Math.max(1, artEl.clientWidth || 160));
      gl.uniform1f(uniforms.uGlare, settings.glare);
      gl.uniform3f(uniforms.uFoil, settings.foil[0], settings.foil[1], settings.foil[2]);
      gl.uniform1f(uniforms.uReady, textureReady ? 1 : 0);
      gl.uniform1f(uniforms.uActive, state.active);
      gl.uniform1f(uniforms.uOverlayOnly, textureReady ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function spring(value, velocity, target, stiffness, damping, dt) {
      const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
      return [value + next * dt, next];
    }

    function resetElementVisuals() {
      artEl.removeAttribute('data-holo-active');
      artEl.classList.remove('holo-card--active');
      artEl.style.removeProperty('--holo-tilt-x');
      artEl.style.removeProperty('--holo-tilt-y');
      artEl.style.removeProperty('--holo-scale');
      artEl.style.removeProperty('--holo-active');
      artEl.style.removeProperty('transform');
    }

    function settleAndCleanup() {
      cancelAnimationFrame(raf);
      raf = 0;
      state.tiltX = 0; state.tiltY = 0; state.tiltVX = 0; state.tiltVY = 0;
      state.lift = 1; state.liftV = 0;
      state.active = 0;
      activeInstances.delete(instance);
      liveInstances.delete(instance);
      disposeWebGL();
      resetElementVisuals();
    }

    function tick(now) {
      raf = 0;
      if (destroyed || !artEl.isConnected) {
        settleAndCleanup();
        return;
      }

      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000 || 1 / 60));
      last = now;

      let targetX = 0;
      let targetY = 0;
      let lightX = 0.5;
      let lightY = 0.5;
      let lift = 1;
      const targetActive = pointer.inside ? 1 : 0;

      if (pointer.inside) {
        lightX = pointer.x;
        lightY = pointer.y;
        if (!reduce) {
          targetX = (0.5 - pointer.y) * 2 * settings.tiltMax;
          targetY = (pointer.x - 0.5) * 2 * settings.tiltMax;
          lift = settings.hoverScale;
        }
      }

      const activeTau = targetActive > state.active ? 0.08 : 0.11;
      state.active += (targetActive - state.active) * (1 - Math.exp(-dt / activeTau));
      if (Math.abs(targetActive - state.active) < 0.01) state.active = targetActive;

      const steps = Math.ceil(dt / (1 / 240));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        [state.tiltX, state.tiltVX] = spring(state.tiltX, state.tiltVX, targetX, 150, 16, h);
        [state.tiltY, state.tiltVY] = spring(state.tiltY, state.tiltVY, targetY, 150, 16, h);
        [state.lightX, state.lightVX] = spring(state.lightX, state.lightVX, lightX, 220, 30, h);
        [state.lightY, state.lightVY] = spring(state.lightY, state.lightVY, lightY, 220, 30, h);
        [state.lift, state.liftV] = spring(state.lift, state.liftV, lift, 320, 30, h);
      }

      if (!reduce) {
        artEl.style.setProperty('--holo-tilt-x', `${state.tiltX.toFixed(3)}deg`);
        artEl.style.setProperty('--holo-tilt-y', `${state.tiltY.toFixed(3)}deg`);
        artEl.style.setProperty('--holo-scale', state.lift.toFixed(4));
        artEl.style.transform = `perspective(${PERSPECTIVE}px) scale(${state.lift.toFixed(4)}) rotateX(${state.tiltX.toFixed(3)}deg) rotateY(${state.tiltY.toFixed(3)}deg)`;
      }
      artEl.style.setProperty('--holo-active', state.active.toFixed(4));

      draw();

      const motion =
        Math.abs(state.tiltVX) +
        Math.abs(state.tiltVY) +
        Math.abs(state.liftV) * 40 +
        (Math.abs(state.lightVX) + Math.abs(state.lightVY)) * 60 +
        Math.abs(state.tiltX - targetX) +
        Math.abs(state.tiltY - targetY) +
        Math.abs(state.active - targetActive) * 40;

      calm = motion > 0.04 ? 0 : calm + dt;

      if (!pointer.inside && (calm > 0.12 || (state.active === 0 && motion <= 0.1))) {
        settleAndCleanup();
        return;
      }

      if (pointer.inside && calm > 0.35 && state.active === 1) {
        // Pointer is stationary inside artwork; pause RAF until next pointermove or pointerleave!
        return;
      }

      raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (raf || destroyed) return;
      calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function enter(clientX, clientY, rect) {
      pointer.x = clamp((clientX - rect.left) / rect.width, 0, 1);
      pointer.y = clamp((clientY - rect.top) / rect.height, 0, 1);
      if (!pointer.inside) {
        pointer.inside = true;
        activeInstances.add(instance);
        liveInstances.add(instance);
        artEl.setAttribute('data-holo-active', 'true');
        artEl.classList.add('holo-card--active');
        ensureWebGL();
      }
      wake();
    }

    function leave() {
      if (!pointer.inside && !raf) return;
      pointer.inside = false;
      activeInstances.delete(instance);
      artEl.removeAttribute('data-holo-active');
      wake();
    }

    const onPointerEnter = e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (isExcludedTarget(e.target)) {
        leave();
        return;
      }
      const { inside, rect } = isPointerInsideArtwork(artEl, e.clientX, e.clientY);
      if (!inside) {
        leave();
        return;
      }
      enter(e.clientX, e.clientY, rect);
    };

    const onPointerMove = e => {
      if (e.pointerType === 'touch' && !e.buttons) return;
      if (isExcludedTarget(e.target)) {
        leave();
        return;
      }
      const { inside, rect } = isPointerInsideArtwork(artEl, e.clientX, e.clientY);
      if (!inside) {
        leave();
        return;
      }
      enter(e.clientX, e.clientY, rect);
    };

    const onPointerDown = e => {
      if (e.pointerType !== 'touch') return;
      if (isExcludedTarget(e.target)) return;
      const { inside, rect } = isPointerInsideArtwork(artEl, e.clientX, e.clientY);
      if (inside) enter(e.clientX, e.clientY, rect);
    };

    const onPointerLeave = () => {
      leave();
    };

    const onDragStart = () => {
      settleAndCleanup();
    };

    artEl.addEventListener('pointerenter', onPointerEnter);
    artEl.addEventListener('pointermove', onPointerMove);
    artEl.addEventListener('pointerdown', onPointerDown);
    artEl.addEventListener('pointerleave', onPointerLeave);
    artEl.addEventListener('pointercancel', onPointerLeave);
    artEl.addEventListener('dragstart', onDragStart);

    const instance = {
      element: artEl,
      isActive() {
        return pointer.inside;
      },
      getState() {
        return {
          inside: pointer.inside,
          active: state.active,
          tiltX: state.tiltX,
          tiltY: state.tiltY,
          lift: state.lift,
          hasCanvas: Boolean(canvas && canvas.isConnected),
          webglUnavailable
        };
      },
      leave,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        artEl.removeEventListener('pointerenter', onPointerEnter);
        artEl.removeEventListener('pointermove', onPointerMove);
        artEl.removeEventListener('pointerdown', onPointerDown);
        artEl.removeEventListener('pointerleave', onPointerLeave);
        artEl.removeEventListener('pointercancel', onPointerLeave);
        artEl.removeEventListener('dragstart', onDragStart);
        settleAndCleanup();
        instances.delete(artEl);
      }
    };

    instances.set(artEl, instance);
    return instance;
  }

  function attachAll(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return 0;
    let count = 0;
    const nodes = root.querySelectorAll(ARTWORK_SELECTOR);
    for (const el of nodes) {
      if (!instances.has(el)) {
        createArtworkInstance(el, globalOptions);
        count++;
      }
    }
    return count;
  }

  function initCollectionHolo(options = {}) {
    if (typeof document === 'undefined') return null;
    globalOptions = { ...DEFAULT_HOVER_OPTIONS, ...options, idle: false };
    attachAll(document);

    if (!observer && typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of m.removedNodes) {
            if (node && node.nodeType === 1) {
              if (instances.has(node)) instances.get(node).destroy();
              const children = node.querySelectorAll ? node.querySelectorAll(ARTWORK_SELECTOR) : [];
              for (const child of children) {
                if (instances.has(child)) instances.get(child).destroy();
              }
            }
          }
          for (const node of m.addedNodes) {
            if (node && node.nodeType === 1) {
              if (node.matches && node.matches(ARTWORK_SELECTOR)) {
                createArtworkInstance(node, globalOptions);
              }
              attachAll(node);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return {
      attachAll,
      getInstance: el => instances.get(el) || null,
      getActiveCount: () => activeInstances.size,
      destroyAll() {
        for (const inst of Array.from(liveInstances)) {
          inst.destroy();
        }
        activeInstances.clear();
        liveInstances.clear();
        observer?.disconnect();
        observer = null;
      }
    };
  }

  const HoloCardAPI = {
    initCollectionHolo,
    attachAll,
    getInstance: el => instances.get(el) || null,
    getActiveCount: () => activeInstances.size,
    DEFAULT_HOVER_OPTIONS,
    ARTWORK_SELECTOR,
    PRESETS,
    CARD_RATIO,
    SHADERS: { VERTEX, FRAGMENT }
  };

  if (typeof globalScope !== 'undefined') globalScope.HoloCard = HoloCardAPI;
  if (typeof globalThis !== 'undefined') globalThis.HoloCard = HoloCardAPI;
  if (typeof module !== 'undefined' && module.exports) module.exports = HoloCardAPI;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initCollectionHolo());
    } else {
      initCollectionHolo();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
