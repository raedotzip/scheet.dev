import vsCode from "./shaders/vertex.glsl?raw";
import fsCode from "./shaders/pulsar.glsl?raw";

export function initBackground() {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", { antialias: false }) as WebGL2RenderingContext;

  if (!gl) {
    console.error("WebGL2 not supported");
    return;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, "position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const timeLoc = gl.getUniformLocation(prog, "time") as WebGLUniformLocation;
  const resLoc = gl.getUniformLocation(prog, "resolution") as WebGLUniformLocation;

  function draw(now: number) {
    gl.uniform1f(timeLoc, now * 0.001);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}