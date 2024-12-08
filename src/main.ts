// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main()
{
    vTexCoord = aTexCoord;
    gl_Position = aPosition;
}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

uniform sampler2D uSampler;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    // Sample demo mix of textures
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

function getSpriteUV(sprite: number, orientation: number): [number, number, number, number, number, number, number, number, number, number, number, number] {

    const h = 64 / 4096;
    const w = 64 / 4096;

    // The sprite number (0 to 255) is the index of the 64x64 sprite in the 1024x1024 sprite sub-sheet
    // The orientation is the index (0 to 15) of the 1024x1024 sprite sub-sheet in the 4096x4096 sprite sheet.

    // Calculate in the 1024x1024 sprite sub-sheet and 
    // add the offset of the 1024x1024 sprite sub-sheet in the 4096x4096 sprite sheet
    const u = ((sprite % 16) * w) + (orientation % 4) * 0.25;
    const v = (Math.floor(sprite / 16) * h) + Math.floor(orientation / 4) * 0.25;

    return [
        u, v + h,
        u + w, v,
        u, v,

        u, v + h,
        u + w, v + h,
        u + w, v

    ];
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


    const positionData = new Float32Array([
        // Quad 1
        -1, 0,
        0, 1,
        -1, 1,
        -1, 0,
        0, 0,
        0, 1,
        // Quad 2
        0, 0,
        1, 1,
        0, 1,
        0, 0,
        1, 0,
        1, 1,
        // Quad 3
        -1, -1,
        0, 0,
        -1, 0,
        -1, -1,
        0, -1,
        0, 0,
        // Quad 4
        0, -1,
        1, 0,
        0, 0,
        0, -1,
        1, -1,
        1, 0,
    ]);

    const image = await loadImage('images/alien.png');

    // Flip Y not needed?
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const texCoordData = new Float32Array(2 * 4 * 6);
    const texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoordData.byteLength, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    // Set texture
    texCoordData.set(getSpriteUV(120, 15), 0);
    texCoordData.set(getSpriteUV(120, 0), 12);
    texCoordData.set(getSpriteUV(120, 1), 24);
    texCoordData.set(getSpriteUV(120, 2), 36);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, texCoordData);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4096, 4096, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw call
    gl.drawArrays(gl.TRIANGLES, 0, 24);

})();
