// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location = 0) in vec4 aPosition;
layout(location = 1) in vec4 aColor;

out vec4 vColor;

void main()
{
    vColor = aColor;
    gl_Position = aPosition;
}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

in vec4 vColor;

out vec4 fragColor;

void main()
{
    fragColor = vColor;
}`;

// Start
const canvas = document.querySelector('canvas')!;
const gl = canvas.getContext('webgl2')!;

const program = gl.createProgram()!;

const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);
gl.attachShader(program, vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
    console.log(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// For usage with drawArrays
const arrayVertexData = new Float32Array([
    0, 0, 1, 0, 0,
    0.0, 1.0, 1, 0, 0,
    0.951, 0.309, 1, 0, 0,

    0, 0, 0, 1, 0,
    0.951, 0.309, 0, 1, 0,
    0.587, -0.809, 0, 1, 0,

    0, 0, 0, 0, 1,
    0.587, -0.809, 0, 0, 1,
    -0.587, -0.809, 0, 0, 1,

    0, 0, 1, 1, 0,
    -0.587, -0.809, 1, 1, 0,
    -0.951, 0.309, 1, 1, 0,

    0, 0, 1, 0, 1,
    -0.951, 0.309, 1, 0, 1,
    0.0, 1.0, 1, 0, 1,

]);

const arrayVertexDataBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, arrayVertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, arrayVertexData, gl.STATIC_DRAW);

// For usage with drawElements
const elementVertexData = new Float32Array([
    0, 0, 0, 0, 0,
    0.0, 1.0, 1, 0, 0,
    0.951, 0.309, 0, 1, 0,
    0.587, -0.809, 0, 0, 1,
    -0.587, -0.809, 1, 1, 0,
    -0.951, 0.309, 1, 0, 1,
]);

const elementIndexData = new Uint8Array([
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 5,
    0, 5, 1,
]);

const elementVertexBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, elementVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, elementVertexData, gl.STATIC_DRAW);

const elementIndexBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elementIndexData, gl.STATIC_DRAW);

// gl.bindBuffer(gl.ARRAY_BUFFER, arrayVertexBufferData);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 5 * 4, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 5 * 4, 2 * 4);

gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);

// gl.drawArrays(gl.TRIANGLES, 0, 15);
gl.drawElements(gl.TRIANGLES, 15, gl.UNSIGNED_BYTE, 0);