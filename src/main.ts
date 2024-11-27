// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location = 0) in float aPointSize;
layout(location = 1) in vec2 aPosition;
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
    throw new Error('Failed to link program');
}

gl.useProgram(program);

const data1 = new Float32Array([
    -0.8, 0.6, 1.0, 0.75, 0.75, 125,
    -0.3, 0.6, 0.0, 0.75, 1.0, 32,
    0.3, 0.6, 0.5, 1.0, 0.75, 75,
    0.8, 0.6, 0.0, 0.75, 0.75, 9,
]);
const buffer1 = gl.createBuffer()!;

gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
gl.bufferData(gl.ARRAY_BUFFER, data1, gl.STATIC_DRAW);

// No need to bindBuffer inside of the VAO, because vertexAttribPointer will do it for us.
const vao1 = gl.createVertexArray()!;
gl.bindVertexArray(vao1);

gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 20);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 0);
gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 8);

gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);

gl.bindVertexArray(null); // Snapshot has been taken

const data2 = new Float32Array([
    -0.8, -0.6, 1.0, 0.25, 0.25, 125,
    -0.3, -0.6, 0.0, 0.25, 1.0, 32,
    0.3, -0.6, 0.5, 1.0, 0.25, 75,
    0.8, -0.6, 0.0, 0.25, 0.25, 9,
]);
const buffer2 = gl.createBuffer()!;

gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
gl.bufferData(gl.ARRAY_BUFFER, data2, gl.STATIC_DRAW);

// Again, no need bind second buffer inside of the VAO, because vertexAttribPointer will do it for us.
const vao2 = gl.createVertexArray()!;
gl.bindVertexArray(vao2);

gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 20); // 20 because last after 5*4
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 0); // 0 because those x/y are at start
gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 8); // 8 because after 2 * 4

gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);

gl.bindVertexArray(null); // Another snapshot has been taken

const draw = () => {
    gl.bindVertexArray(vao1);
    gl.drawArrays(gl.POINTS, 0, 4);
    gl.bindVertexArray(null);

    gl.bindVertexArray(vao2);
    gl.drawArrays(gl.POINTS, 0, 4);
    gl.bindVertexArray(null);

    requestAnimationFrame(draw);
}

draw();

// gl.enableVertexAttribArray(0);
// gl.enableVertexAttribArray(1);
// gl.enableVertexAttribArray(2);

// gl.drawArrays(gl.POINTS, 0, 4); // Draw the second set of points

// gl.flush(); // Simulate the next frame
// gl.clear(gl.COLOR_BUFFER_BIT);

// gl.bindBuffer(gl.ARRAY_BUFFER, buffer1); // Have to rebind the buffer
// gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 20);
// gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 0);
// gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 8);

// gl.drawArrays(gl.POINTS, 0, 4); // Draw the first set of points

// gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
// gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 20);
// gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 0);
// gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, 8);

// gl.drawArrays(gl.POINTS, 0, 4); // Draw the second set of points
