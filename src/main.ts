// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;
layout(location=2) in vec3 aOffset;
layout(location=3) in float aScale;
layout(location=4) in vec2 aUV;

out vec2 vTexCoord;

void main()
{
    vTexCoord = vec2(aTexCoord * 0.015625) + aUV;
    gl_Position = vec4(aPosition.xyz * aScale + aOffset, 1.0);
}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

uniform mediump sampler2D uSampler;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    fragColor = texture(uSampler, vTexCoord);
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

    const modelData = new Float32Array([
        // XY Coords, UV Offset to be multiplied by 0.015625 and added to the UV coordinates
        -1, 0, 0, 1,
        0, 1, 1, 0,
        -1, 1, 0, 0,
        // XY   UV
        -1, 0, 0, 1,
        0, 0, 1, 1,
        0, 1, 1, 0,
    ]);

    const u = (sprite: number, orientation: number) => { return ((sprite % 16) * 0.015625) + (orientation % 4) * 0.25; }

    const v = (sprite: number, orientation: number) => { return (Math.floor(sprite / 16) * 0.015625) + Math.floor(orientation / 4) * 0.25; }

    const transformData = new Float32Array([
        // posX, posY, scale, U(frame, orientation), V(frame, orientation) Usually set by game engine.
        0.2, -0.5, 0.1, u(0, 0), v(0, 0),
        0.2, 0.5, 0.1, u(0, 1), v(0, 1),
        0.4, 0.2, 0.1, u(1, 1), v(1, 1),
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
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 20, 0); // Describe the data in the buffer: the x and y coordinates after no offset.
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 20, 8); // Describe the data in the buffer, the scale (after the 8 bytes of the 2 floats for x and y)
    gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 20, 12); // Describe the data in the buffer

    gl.vertexAttribDivisor(2, 1); // Tell the GPU to update the position attribute every instance
    gl.vertexAttribDivisor(3, 1); // Tell the GPU to update the scale attribute every instance
    gl.vertexAttribDivisor(4, 1); // Tell the GPU to update the color attribute every instance

    gl.enableVertexAttribArray(2); // Enable the attribute
    gl.enableVertexAttribArray(3); // Enable the attribute
    gl.enableVertexAttribArray(4); // Enable the attribute

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 3);

    // * End Program *

    // for (let i = 0; i < transformData.length; i += 6) {
    //     gl.vertexAttrib2fv(1, transformData.slice(i, i + 2));
    //     gl.vertexAttrib1fv(2, transformData.slice(i + 2, i + 3));
    //     gl.vertexAttrib3fv(3, transformData.slice(i + 3, i + 6));

    //     gl.drawArrays(gl.TRIANGLES, 0, 3);
    // }

    // gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8 * 4, 0);
    // gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 8 * 4, 8);
    // gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 8 * 4, 16);
    // gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 8 * 4, 20);

    // gl.enableVertexAttribArray(0);
    // gl.enableVertexAttribArray(1);
    // gl.enableVertexAttribArray(2);
    // gl.enableVertexAttribArray(3);

    // // Transparency
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // // Draw call
    // gl.drawArrays(gl.TRIANGLES, 0, 6);

})();

