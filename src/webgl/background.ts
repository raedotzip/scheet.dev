import vsCode from "./shaders/vertex.glsl?raw";
import fsCode from "./shaders/pulsar.glsl?raw";

export function initBackground() {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", { antialias: false }) as WebGL2RenderingContext;

  if (!gl) {
    console.error("WebGL2 not supported");
    return;
  }

  // --- Device detection ---
  // navigator.userAgentData is the modern API (Chrome/Edge); fall back to userAgent for Safari/Firefox
  const uaData = (navigator as any).userAgentData;
  const isApple = uaData
    ? uaData.platform === "macOS" || uaData.platform === "iOS"  // userAgentData reports iOS correctly
    : /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent)); // iPadOS 13+ spoofs Mac
  const isAndroid = uaData
    ? uaData.platform === "Android"
    : /Android/i.test(navigator.userAgent);
  const isMobile = isApple || isAndroid;

  // iPhones have capable GPUs but throttle under sustained load — cap at 2x
  // Android is highly variable in GPU quality — cap lower to be safe
  const mobileDprCap = isApple ? 2.0 : 1.5;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cappedDpr = isMobile ? Math.min(dpr, mobileDprCap) : dpr;
    canvas.width = window.innerWidth * cappedDpr;
    canvas.height = window.innerHeight * cappedDpr;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resize);
  resize();

  function compile(type: number, src: string): WebGLShader {
    const sh = gl.createShader(type) as WebGLShader;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsCode));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsCode));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer() as WebGLBuffer;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, "position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const timeLoc = gl.getUniformLocation(prog, "time") as WebGLUniformLocation;
  const resLoc = gl.getUniformLocation(prog, "resolution") as WebGLUniformLocation;
  const qualityLoc = gl.getUniformLocation(prog, "quality") as WebGLUniformLocation;

  // 1.0 = full desktop quality, 0.0 = reduced mobile quality
  gl.uniform1f(qualityLoc, isMobile ? 0.0 : 1.0);

  // Throttle to 30fps on mobile — sustained 60fps on a background shader causes thermal throttling
  const targetFPS = isMobile ? 30 : 60;
  const frameInterval = 1000 / targetFPS;
  let lastFrame = 0;

  function draw(now: number) {
    requestAnimationFrame(draw);
    if (now - lastFrame < frameInterval) return;
    lastFrame = now;
    gl.uniform1f(timeLoc, now * 0.001);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  requestAnimationFrame(draw);
}