// VERTEX SHADER
const vertexShaderSource = /*glsl*/ `#version 300 es

// The next two are the repeated geometry and UV for each instance of the model
layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

// Those next four use vertexAttribDivisor and are updated every instance
layout(location=2) in vec3 aOffset;
layout(location=3) in float aScale;
layout(location=4) in vec4 aColor;
layout(location=5) in float aDepth;

uniform float uWorldX;
uniform float uWorldY;

out vec4 vColor;
out vec2 vTexCoord;
out float vDepth;

void main()
{
    vColor = aColor;
    vTexCoord = aTexCoord;
    vDepth = aDepth;
    vec3 pos = aPosition.xyz * aScale + aOffset;
    // uWorldX and uWorldY are factors for the x and y coordinates to convert from screen space to world space
    // This brings it in the range 0-2. So it also needs a -1 to 1 conversion by subtracting 1.
    gl_Position = vec4((pos.x * uWorldX) - 1.0, (pos.y * uWorldY) + 1.0, pos.z, 1.0);

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
    fragColor =  vColor * texture(uSampler, vec3(vTexCoord, vDepth));
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
        throw new Error('Shader compilation failed');
    }

    gl.useProgram(program);

    // * Start Program *

    const image = await loadImage('images/plancher-vertical.png');

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, 128, 128, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, image); // 64 textures of 128x128 pixels
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);

    const GameScreenX = 400;
    const GameScreenY = 300;

    const uWorldXLoc = gl.getUniformLocation(program, 'uWorldX')!;
    gl.uniform1f(uWorldXLoc, 2 / GameScreenX);

    const uWorldYLoc = gl.getUniformLocation(program, 'uWorldY')!;
    gl.uniform1f(uWorldYLoc, 2 / -GameScreenY);

    // Create a buffer for the model data of two triangles that form a rectangle
    const modelData = new Float32Array([
        // XY Coords, UV Offset 
        1, 0, 1, 0,
        0, 1, 0, 1,
        1, 1, 1, 1,
        1, 0, 1, 0,
        0, 0, 0, 0,
        0, 1, 0, 1,
    ]);

    // Create a buffer for the transformation data of the three instances

    // Test data with posX and posY for a 400x300 resolution instead of -1 to 1.
    const transformData = new Float32Array([
        // posX, posY, scale, colorR, colorG, colorB, depth
        0, 0, 64, 0, 1.5, 0, 0,      // Green Test at origin
        200, 150, 128, 0, 0, 1, 1,    // Blue Test at center
        380, 280, 32, 1, 0, 1, 22,   // Purple Test at bottom right
    ]);

    const modelBuffer = gl.createBuffer(); // Create a buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
    gl.bufferData(gl.ARRAY_BUFFER, modelData, gl.STATIC_DRAW); // Put data in the buffer
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0); // Describe the data in the buffer with a size of 2 because it's a 2D model, and a stride of 16 bytes because there are 4 floats per vertex
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(0); // Enable the attribute which is bound to the buffer
    gl.enableVertexAttribArray(1);
    gl.vertexAttribDivisor(0, 0); // Model vertices - changes every vertex
    gl.vertexAttribDivisor(1, 0); // Texture coords - changes every vertex

    const transformBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
    gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 28, 0); // Describe the data in the buffer: the x and y coordinates after no offset.
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 28, 8); // Describe the data in the buffer, the scale (after the 8 bytes of the 2 floats for x and y)
    gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 28, 12); // Describe the data in the buffer, the color (after 12 bytes of the 2 floats for x and y and the 1 float for scale)
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 28, 24); // Describe the data in the buffer, the depth (after 24 bytes of the 2 floats for x and y and the 1 float for scale and the 3 floats for color)

    gl.vertexAttribDivisor(2, 1); // Tell the GPU to update the position attribute every instance
    gl.vertexAttribDivisor(3, 1); // Tell the GPU to update the scale attribute every instance
    gl.vertexAttribDivisor(4, 1); // Tell the GPU to update the color attribute every instance
    gl.vertexAttribDivisor(5, 1); // Tell the GPU to update the depth attribute every instance

    gl.enableVertexAttribArray(2); // Enable the attribute
    gl.enableVertexAttribArray(3); // Enable the attribute
    gl.enableVertexAttribArray(4); // Enable the attribute
    gl.enableVertexAttribArray(5); // Enable the attribute

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 3); // Draw the model of 6 vertex that form 2 triangles, 3 times

    // * End Program *


})();

class Point {

    public x: number;
    public y: number;

    constructor(x = 0.0, y = 0.0) {
        this.x = x;
        this.y = y;
    }

}

class M3x3 {

    public static M00 = 0;
    public static M01 = 1;
    public static M02 = 2;
    public static M10 = 3;
    public static M11 = 4;
    public static M12 = 5;
    public static M20 = 6;
    public static M21 = 7;
    public static M22 = 8;

    public matrix: [
        number, number, number,
        number, number, number,
        number, number, number,
    ];

    constructor() {
        this.matrix = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
    }

    multiply(m: M3x3): M3x3 {
        const output = new M3x3();
        output.matrix = [
            this.matrix[M3x3.M00] * m.matrix[M3x3.M00] + this.matrix[M3x3.M10] * m.matrix[M3x3.M01] + this.matrix[M3x3.M20] * m.matrix[M3x3.M02],
            this.matrix[M3x3.M01] * m.matrix[M3x3.M00] + this.matrix[M3x3.M11] * m.matrix[M3x3.M01] + this.matrix[M3x3.M21] * m.matrix[M3x3.M02],
            this.matrix[M3x3.M02] * m.matrix[M3x3.M00] + this.matrix[M3x3.M12] * m.matrix[M3x3.M01] + this.matrix[M3x3.M22] * m.matrix[M3x3.M02],

            this.matrix[M3x3.M00] * m.matrix[M3x3.M10] + this.matrix[M3x3.M10] * m.matrix[M3x3.M11] + this.matrix[M3x3.M20] * m.matrix[M3x3.M12],
            this.matrix[M3x3.M01] * m.matrix[M3x3.M10] + this.matrix[M3x3.M11] * m.matrix[M3x3.M11] + this.matrix[M3x3.M21] * m.matrix[M3x3.M12],
            this.matrix[M3x3.M02] * m.matrix[M3x3.M10] + this.matrix[M3x3.M12] * m.matrix[M3x3.M11] + this.matrix[M3x3.M22] * m.matrix[M3x3.M12],

            this.matrix[M3x3.M00] * m.matrix[M3x3.M20] + this.matrix[M3x3.M10] * m.matrix[M3x3.M21] + this.matrix[M3x3.M20] * m.matrix[M3x3.M22],
            this.matrix[M3x3.M01] * m.matrix[M3x3.M20] + this.matrix[M3x3.M11] * m.matrix[M3x3.M21] + this.matrix[M3x3.M21] * m.matrix[M3x3.M22],
            this.matrix[M3x3.M02] * m.matrix[M3x3.M20] + this.matrix[M3x3.M12] * m.matrix[M3x3.M21] + this.matrix[M3x3.M22] * m.matrix[M3x3.M22]
        ];
        return output;
    }

    translation(x: number, y: number): M3x3 {
        const output = new M3x3();
        output.matrix = [
            this.matrix[M3x3.M00],
            this.matrix[M3x3.M01],
            this.matrix[M3x3.M02],
            this.matrix[M3x3.M10],
            this.matrix[M3x3.M11],
            this.matrix[M3x3.M12],

            x * this.matrix[M3x3.M00] + y * this.matrix[M3x3.M10] + this.matrix[M3x3.M20],
            x * this.matrix[M3x3.M01] + y * this.matrix[M3x3.M11] + this.matrix[M3x3.M21],
            x * this.matrix[M3x3.M02] + y * this.matrix[M3x3.M12] + this.matrix[M3x3.M22]
        ];
        return output;
    }

    scale(x: number, y: number): M3x3 {
        const output = new M3x3();
        output.matrix = [
            this.matrix[M3x3.M00] * x,
            this.matrix[M3x3.M01] * x,
            this.matrix[M3x3.M02] * x,

            this.matrix[M3x3.M10] * y,
            this.matrix[M3x3.M11] * y,
            this.matrix[M3x3.M12] * y,

            this.matrix[M3x3.M20],
            this.matrix[M3x3.M21],
            this.matrix[M3x3.M22]
        ];
        return output;
    }

    getFloatArray(): Float32Array {
        return new Float32Array(this.matrix);
    }


}


