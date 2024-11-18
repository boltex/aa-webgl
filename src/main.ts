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

// * ALL IN SAME BUFFER AS FLOAT *
const bufferData = new Float32Array([
    -0.3, 0.5, 100, 1, 0, 0,
    0.3, -0.5, 10, 0, 1, 0,
    0.8, 0.8, 50, 0, 0, 1,
    0.4, -0.1, 70, 0.2, 0.5, 0.8,
    0.1, 0.2, 20, 0.9, 0.2, 0.4,
    0.4, 0.3, 30, 0.6, 0.6, 0.1
]);

// create 16 bits from floats
console.log(
    bufferData
        .map((v: number) => Math.floor(v * (1 << 15)))
        .reduce((c: string[], v: number) => [...c, v.toString(10).padStart(6)], [])
        .join()
);
// * ALL IN SAME BUFFER AS SIGNED 16 BIT INT (-32767 to 32767, NOT 0-65536) *
const bufferData2 = new Int16Array([
    -9831, 16384, 100, 32767, 0, 0,
    9830, -16384, 10, 0, 32767, 0,
    26214, 26214, 50, 0, 0, 32767,
    13107, -3277, 70, 6553, 16384, 26214,
    3276, 6553, 20, 29491, 6553, 13107,
    13107, 9830, 30, 19660, 19660, 3276
]);

// create 8 bits from 16 bit
console.log(
    bufferData2
        .map((v: number) => (v >> 8))
        .reduce((c: string[], v: number) => [...c, v.toString(10).padStart(4)], [])
        .join()
);
// * ALL IN SAME BUFFER AS SIGNED 8 BIT INT (-127 to 127, NOT 0-255) *
const bufferData3 = new Int8Array([
    -39, 64, 100, 127, 0, 0,
    38, -64, 10, 0, 127, 0,
    102, 102, 50, 0, 0, 127,
    51, -13, 70, 25, 64, 102,
    12, 25, 20, 115, 25, 51,
    51, 38, 30, 76, 76, 12
]);

const buffer = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

// gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
// gl.bufferData(gl.ARRAY_BUFFER, bufferData2, gl.STATIC_DRAW);
gl.bufferData(gl.ARRAY_BUFFER, bufferData3, gl.STATIC_DRAW);

// Bind attributes: Match the layout in the buffer data
// gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 6 * 4, 0);
// gl.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 6 * 4, 2 * 4);
// gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

// gl.vertexAttribPointer(aPositionLoc, 2, gl.SHORT, true, 6 * 2, 0);
// gl.vertexAttribPointer(aPointSizeLoc, 1, gl.SHORT, false, 6 * 2, 2 * 2);
// gl.vertexAttribPointer(aColorLoc, 3, gl.SHORT, true, 6 * 2, 3 * 2);

gl.vertexAttribPointer(aPositionLoc, 2, gl.BYTE, true, 6 * 1, 0);
gl.vertexAttribPointer(aPointSizeLoc, 1, gl.BYTE, false, 6 * 1, 2 * 1);
gl.vertexAttribPointer(aColorLoc, 3, gl.BYTE, true, 6 * 1, 3 * 1);

// * SEPARATE BUFFERS *
// const positionData = new Float32Array([
//     -0.3, 0.5,
//     0.3, -0.5,
//     0.8, 0.8,
//     0.4, -0.1,
//     0.1, 0.2,
//     0.4, 0.3
// ]);
// const pointSizeData = new Float32Array([
//     100,
//     10,
//     50,
//     70,
//     20,
//     30
// ]);
// const colorData = new Float32Array([
//     1, 0, 0,
//     0, 1, 0,
//     0, 0, 1,
//     0.2, 0.5, 0.8,
//     0.9, 0.2, 0.4,
//     0.6, 0.6, 0.1
// ]);

// const positionBuffer = gl.createBuffer()!;
// gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

// const pointSizeBuffer = gl.createBuffer()!;
// gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, pointSizeData, gl.STATIC_DRAW);

// const colorBuffer = gl.createBuffer()!;
// gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);

// gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

// gl.bindBuffer(gl.ARRAY_BUFFER, pointSizeBuffer);
// gl.vertexAttribPointer(aPointSizeLoc, 1, gl.FLOAT, false, 0, 0);

// gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
// gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 0, 0);

// Comment any of those 3 lines to see the effect of DEFAULTS above
gl.enableVertexAttribArray(aPointSizeLoc);
gl.enableVertexAttribArray(aPositionLoc);
gl.enableVertexAttribArray(aColorLoc);

gl.drawArrays(gl.POINTS, 0, 6);  // Points sizes controled by third value in buffer data
// gl.drawArrays(gl.LINE_LOOP, 0, 6); // Will draw a triangle
// gl.drawArrays(gl.TRIANGLES, 0, 6); // Will draw a filled triangle
