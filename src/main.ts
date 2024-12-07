// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;
layout(location=2) in float aDepth;

out vec2 vTexCoord;
out float vDepth;

void main()
{
    vTexCoord = aTexCoord;
    vDepth = aDepth;
    gl_Position = aPosition;
}`;

// FRAGMENT SHADER
const fragmentShaderSource = /*glsl*/ `#version 300 es

precision mediump float;

uniform mediump sampler2DArray uSampler;

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

function getImageData(image: HTMLImageElement): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, image.width, image.height).data;
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
        -1, -1, 0, 1,
        1, 1, 1, 0,
        -1, 1, 0, 0,
        -1, -1, 0, 1,
        1, -1, 1, 1,
        1, 1, 1, 0
    ]);

    // * Start Program *

    // const image = await loadImage('images/alien-vertical.png');
    // const image = await loadImage('images/plancher-vertical.png');
    const image = await loadImage('images/plancher2.png'); // plancher 2 is 24 bits
    const imageData = getImageData(image);

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, 128, 128, 64);

    const pbo = gl.createBuffer()!;
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, imageData, gl.STATIC_DRAW);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, image.width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, image.height);

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, x * 128);
            gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y * 128);
            gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, y * 8 + x, 128, 128, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
        }
    }

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttrib1f(2, 0); // Depth: change second parameter to change sprite.

    // Transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw call
    gl.drawArrays(gl.TRIANGLES, 0, 6);

})();

