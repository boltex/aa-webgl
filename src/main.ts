// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location = 1) in float aPointSize;
layout(location = 0) in vec2 aPosition;
layout(location = 2) in vec3 aColor;

out vec3 vColor;

void main()
{
    vColor = aColor;
    gl_PointSize = aPointSize;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

in vec3 vColor;

out vec4 fragColor;

void main()
{
    fragColor = vec4(vColor, 1.0);
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

// Attributes
const aPositionLoc = 0;
const aPointSizeLoc = 1;
const aColorLoc = 2;

gl.vertexAttrib4f(aPositionLoc, 0, 0, 0, 1); // DEFAULT LOCATION
gl.vertexAttrib1f(aPointSizeLoc, 50); // DEFAULT POINT SIZE
gl.vertexAttrib4f(aColorLoc, 1, 0, 0, 1); // DEFAULT COLOR (RED)

// * ALL IN SAME BUFFER *
// Buffer: position x, position y, and point size
// const bufferData = new Float32Array([
//     -0.3, 0.5, 100, 1, 0, 0,
//     0.3, -0.5, 10, 0, 1, 0,
//     0.8, 0.8, 50, 0, 0, 1
// ]);
// const buffer = gl.createBuffer()!;

// Bind buffer
// gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

// Bind attributes: Match the layout in the buffer data
// gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 6 * 4, 0);
// gl.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 6 * 4, 2 * 4);
// gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

// * SEPARATE BUFFERS *
const positionData = new Float32Array([
    -0.3, 0.5,
    0.3, -0.5,
    0.8, 0.8,
    0.4, -0.1,
    0.1, 0.2,
    0.4, 0.3
]);
const pointSizeData = new Float32Array([
    100,
    10,
    50,
    70,
    20,
    30
]);
const colorData = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
    0.2, 0.5, 0.8,
    0.9, 0.2, 0.4,
    0.6, 0.6, 0.1
]);

const positionBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

const pointSizeBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
gl.bufferData(gl.ARRAY_BUFFER, pointSizeData, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);


gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
gl.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 0, 0);

// Comment any of those 3 lines to see the effect of DEFAULTS above
gl.enableVertexAttribArray(aPointSizeLoc);
gl.enableVertexAttribArray(aPositionLoc);
gl.enableVertexAttribArray(aColorLoc);

gl.drawArrays(gl.POINTS, 0, 6);  // Points sizes controled by third value in buffer data
// gl.drawArrays(gl.LINE_LOOP, 0, 6); // Will draw a triangle
// gl.drawArrays(gl.TRIANGLES, 0, 6); // Will draw a filled triangle
