// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location=0) in vec4 aPosition;
layout(location=1) in vec3 aOffset;
layout(location=2) in float aScale;
layout(location=3) in vec4 aColor;
layout(location=4) in vec2 aTexCoord;
layout(location=5) in float aDepth;

out vec4 vColor;
out vec2 vTexCoord;
out float vDepth;

void main()
{
    vColor = aColor;
    vTexCoord = aTexCoord;
    vDepth = aDepth;
    gl_Position = vec4(aPosition.xyz * aScale + aOffset, 1.0);
}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

uniform mediump sampler2DArray uSampler;

in vec4 vColor;
in vec2 vTexCoord;
in float vDepth;
out vec4 fragColor;

void main()
{
    fragColor = texture(uSampler, vec3(vTexCoord, vDepth));
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

    const image = await loadImage('images/plancher-vertical.png');

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, 128, 128, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, image); // 64 textures of 128x128 pixels
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const modelData = new Float32Array([
        // Position   texCoord
        -1, -0.7, 0, 1,
        0, 0.8, 0.5, 0,
        1, -0.7, 1, 1,
    ]);

    const transformData = new Float32Array([
        // posX, posY, scale, colorR, colorG, colorB, depth
        -0.2, 0.7, 0.1, 1, 0, 0, 0,
        0.3, -0.5, 0.4, 0, 0, 1, 1,
        -0.4, 0.2, 0.2, 1, 0, 1, 22,
    ]);

    const modelBuffer = gl.createBuffer(); // Create a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW); // Put data in the buffer
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); // Describe the data in the buffer with a size of 2 because it's a 2D model, and a stride and offset of 0 because the data is tightly packed
    gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(0); // Enable the attribute which is bound to the buffer
    gl.enableVertexAttribArray(4);

    const transformBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
    gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 0); // Describe the data in the buffer: the x and y coordinates after no offset.
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 8); // Describe the data in the buffer, the scale (after the 8 bytes of the 2 floats for x and y)
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 28, 12); // Describe the data in the buffer, the color (after 12 bytes of the 2 floats for x and y and the 1 float for scale)
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 28, 24); // Describe the data in the buffer, the color (after 12 bytes of the 2 floats for x and y and the 1 float for scale)

    gl.vertexAttribDivisor(1, 1); // Tell the GPU to update the position attribute every instance
    gl.vertexAttribDivisor(2, 1); // Tell the GPU to update the scale attribute every instance
    gl.vertexAttribDivisor(3, 1); // Tell the GPU to update the color attribute every instance
    gl.vertexAttribDivisor(5, 1); // Tell the GPU to update the color attribute every instance

    gl.enableVertexAttribArray(1); // Enable the attribute
    gl.enableVertexAttribArray(2); // Enable the attribute
    gl.enableVertexAttribArray(3); // Enable the attribute
    gl.enableVertexAttribArray(5); // Enable the attribute

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 3);

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

