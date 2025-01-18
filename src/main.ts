// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;
layout(location=2) in vec3 aOffset;
layout(location=3) in float aScale;
layout(location=4) in vec4 aColor;
layout(location=5) in vec2 aUV;

uniform float uWorldX;
uniform float uWorldY;

out vec4 vColor;
out vec2 vTexCoord;

void main()
{
    vColor = aColor;
    vTexCoord = vec2(aTexCoord * 0.015625) + aUV;
    // gl_Position = vec4(aPosition.xyz * aScale + aOffset, 1.0);
    vec3 pos = aPosition.xyz * aScale + aOffset;
    // uWorldX and uWorldY are factors for the x and y coordinates to convert from screen space to world space
    // This brings it in the range 0-2. So it also needs a -1 to 1 conversion by subtracting 1.
    gl_Position = vec4((pos.x * uWorldX) - 1.0, (pos.y * uWorldY) + 1.0, pos.z, 1.0);

}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

uniform mediump sampler2D uSampler;

in vec4 vColor;
in vec2 vTexCoord;
out vec4 fragColor;

void main()
{
    fragColor = vColor * texture(uSampler, vTexCoord);
}`;

// Load image asynchronously
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = src;
    });
}
(async () => {

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

    // * Start Program *

    const image = await loadImage('images/alien.png');

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4096, 4096, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    const GameScreenX = 400;
    const GameScreenY = 300;

    const uWorldXLoc = gl.getUniformLocation(program, 'uWorldX')!;
    gl.uniform1f(uWorldXLoc, 2 / GameScreenX);

    const uWorldYLoc = gl.getUniformLocation(program, 'uWorldY')!;
    gl.uniform1f(uWorldYLoc, 2 / -GameScreenY);

    const modelData = new Float32Array([
        // XY Coords, UV Offset 
        1, 0, 1, 0,
        0, 1, 0, 1,
        1, 1, 1, 1,
        1, 0, 1, 0,
        0, 0, 0, 0,
        0, 1, 0, 1,
    ]);

    const u = (sprite: number, orientation: number) => { return ((sprite % 16) * 0.015625) + (orientation % 4) * 0.25; }

    const v = (sprite: number, orientation: number) => { return (Math.floor(sprite / 16) * 0.015625) + Math.floor(orientation / 4) * 0.25; }

    const transformData = new Float32Array([
        // posX, posY, scale,  colorR, colorG, colorB, U(frame, orientation), V(frame, orientation). Usually set by game engine. 8 floats for a stride of 32 bytes.
        0, 0, 64, 0, 1.5, 0, u(0, 0), v(0, 0),// Green Test at origin
        200, 150, 128, 0, 0, 1, u(0, 1), v(0, 1), // Blue Test at center
        380, 280, 32, 1, 0, 1, u(1, 1), v(1, 1),// Purple Test at bottom right
    ]);

    const modelBuffer = gl.createBuffer(); // Create a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW); // Put data in the buffer
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);  // XY
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8); // UV Offset
    gl.enableVertexAttribArray(0); // Enable the attribute which is bound to the buffer
    gl.enableVertexAttribArray(1);

    const transformBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
    gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 0); // Describe the data in the buffer: the x and y coordinates after no offset.
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 8); // Describe the data in the buffer, the scale (after the 8 bytes of the 2 floats for x and y)
    gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 32, 12); // Describe the data in the buffer

    gl.vertexAttribDivisor(2, 1); // Tell the GPU to update the position attribute every instance
    gl.vertexAttribDivisor(3, 1); // Tell the GPU to update the scale attribute every instance
    gl.vertexAttribDivisor(4, 1); // Tell the GPU to update the color attribute every instance

    gl.enableVertexAttribArray(2); // Enable the attribute
    gl.enableVertexAttribArray(3); // Enable the attribute
    gl.enableVertexAttribArray(4); // Enable the attribute

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 3);

    // * End Program *

})();

