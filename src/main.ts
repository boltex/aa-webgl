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

in vec2 vTexCoord;

out vec4 fragColor;

uniform sampler2D uPixelSampler;
uniform sampler2D uSpriteSampler;

void main()
{
    // Sample demo mix of textures
    fragColor = texture(uPixelSampler, vTexCoord) * texture(uSpriteSampler, vTexCoord);
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

    const colors = new Uint8Array([
        255, 255, 255, 142, 35, 344, 34, 127, 77, 127, 127, 127,
        90, 212, 222, 43, 212, 122, 33, 22, 11, 213, 17, 78,
        99, 88, 232, 22, 22, 11, 213, 111, 83, 211, 211, 22,
        0, 0, 0, 244, 211, 231, 112, 112, 22, 73, 172, 243,
    ]);

    const image = await loadImage('images/sprite.png');

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const vertexBufferData = new Float32Array([
        -0.9, -0.9,
        0.0, 0.9,
        0.9, -0.9,
    ]);

    const texCoordBufferData = new Float32Array([
        0, 0,
        0.5, 1,
        1, 0,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexBufferData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoordBufferData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    const pixelTextureUnit = 0;
    const spriteTextureUnit = 5;

    gl.uniform1i(gl.getUniformLocation(program, 'uPixelSampler'), pixelTextureUnit);
    gl.uniform1i(gl.getUniformLocation(program, 'uSpriteSampler'), spriteTextureUnit);

    const pixelTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + pixelTextureUnit);
    gl.bindTexture(gl.TEXTURE_2D, pixelTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 4, 4, 0, gl.RGB, gl.UNSIGNED_BYTE, colors);
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const spriteTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + spriteTextureUnit);
    gl.bindTexture(gl.TEXTURE_2D, spriteTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw call
    gl.drawArrays(gl.TRIANGLES, 0, 3);

})();

