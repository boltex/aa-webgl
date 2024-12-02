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
        console.log(image.width, image.height);
    });
}

(async () => {

    const canvas = document.querySelector('canvas')!;
    const gl = canvas.getContext('webgl2')!;

    console.log(gl.getParameter(gl.MAX_TEXTURE_SIZE));

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

    // const image = await loadImage('images/alien-vertical.png');
    const image = await loadImage('images/alien-vertical.png'); // TOO BIG !

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, 64, 64, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw call
    gl.drawArrays(gl.TRIANGLES, 0, 3);

})();

