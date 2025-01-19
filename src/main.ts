type Vec2 = { x: number, y: number };

// BACKGROUND MAP VERTEX SHADER
const TILE_VERTEX_SHADER = /*glsl*/ `#version 300 es

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

// BACKGROUND MAP FRAGMENT SHADER
const TILE_FRAGMENT_SHADER = /*glsl*/ `#version 300 es

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

// ALIEN CREATURE SPRITE VERTEX SHADER
const SPRITE_VERTEX_SHADER = /*glsl*/ `#version 300 es

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

    vec3 pos = aPosition.xyz * aScale + aOffset;

    // uWorldX and uWorldY are factors for the x and y coordinates to convert from screen space to world space
    // This brings it in the range 0-2. So it also needs a -1 to 1 conversion by subtracting 1.
    gl_Position = vec4((pos.x * uWorldX) - 1.0, (pos.y * uWorldY) + 1.0, pos.z, 1.0);

}`;

// ALIEN CREATURE SPRITE FRAGMENT SHADER
const SPRITE_FRAGMENT_SHADER = /*glsl*/ `#version 300 es

precision mediump float;

uniform mediump sampler2D uSampler;

in vec4 vColor;
in vec2 vTexCoord;
out vec4 fragColor;

void main()
{
    fragColor = vColor * texture(uSampler, vTexCoord);
}`;

const MODEL_DATA = new Float32Array([
    // XY Coords, UV Offset 
    1, 0, 1, 0,
    0, 1, 0, 1,
    1, 1, 1, 1,
    1, 0, 1, 0,
    0, 0, 0, 0,
    0, 1, 0, 1,
]);

const CONFIG = {
    GAME_SCREEN_X: 400,
    GAME_SCREEN_Y: 300,
    TEXTURE_SIZE: 128,
    TEXTURE_DEPTH: 64,
} as const;

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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent black

    const tileImage = await loadImage('images/plancher-vertical.png');

    const spriteImage = await loadImage('images/alien.png');

    const tileRenderer = new TileRenderer(gl, tileImage);
    const spriteRenderer = new SpriteRenderer(gl, spriteImage);

    let counter = 0;

    function loop(timestamp: number): void {
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Render background tiles first
        tileRenderer.render();

        // Update the sprite position every frame demonstrating the dynamic nature of the sprite renderer
        spriteRenderer.updateTransform(0, { x: Math.sin(timestamp / 1000) * 100 + 100, y: Math.cos(timestamp / 1000) * 100 + 100 });

        // Then render sprites on top
        spriteRenderer.render();

        requestAnimationFrame(loop);

        // Console output just to make sure this is running.
        counter++;
        if (counter % 60 == 0) {
            console.log('Frames so far:', counter);
        }
    }

    // Start the animation loop
    requestAnimationFrame(loop);


})();

export abstract class BaseRenderer {
    protected gl: WebGL2RenderingContext;
    protected program: WebGLProgram;
    protected vao: WebGLVertexArrayObject;

    constructor(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
        this.gl = gl;
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);
        this.vao = this.gl.createVertexArray()!;
    }

    protected createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const program = this.gl.createProgram()!;
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource)!;
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource)!;

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        return program;
    }

    protected createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            throw new Error('Shader compilation failed');
        }
        return shader;
    }

    abstract render(): void;
    dispose(): void {
        this.gl.deleteProgram(this.program);
        this.gl.deleteVertexArray(this.vao);
    }
}

export class TileRenderer extends BaseRenderer {
    private transformBuffer: WebGLBuffer;
    private modelBuffer: WebGLBuffer;
    private transformData: Float32Array;
    private image: HTMLImageElement
    private texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, image: HTMLImageElement) {
        super(gl, TILE_VERTEX_SHADER, TILE_FRAGMENT_SHADER);
        // Move existing shader setup & buffer creation here
        this.image = image;
        this.texture = gl.createTexture()!;
        this.modelBuffer = gl.createBuffer()!; // Create a buffer
        this.transformBuffer = gl.createBuffer()!;

        this.transformData = new Float32Array([
            // posX, posY, scale, colorR, colorG, colorB, depth. A stride of 28 bytes.
            0, 0, 64, 0, 1.5, 0, 0,      // Green Test at origin
            200, 150, 128, 0, 0, 1, 1,    // Blue Test at center
            380, 280, 32, 1, 0, 1, 22,   // Purple Test at bottom right
        ]);

        this.setupVAO();

    }

    private setupVAO() {
        this.gl.bindVertexArray(this.vao);

        this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, this.texture);
        this.gl.texImage3D(this.gl.TEXTURE_2D_ARRAY, 0, this.gl.RGBA, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_DEPTH, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image); // 64 textures of 128x128 pixels
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.generateMipmap(this.gl.TEXTURE_2D_ARRAY);

        const uWorldXLoc = this.gl.getUniformLocation(this.program, 'uWorldX')!;
        this.gl.uniform1f(uWorldXLoc, 2 / CONFIG.GAME_SCREEN_X);

        const uWorldYLoc = this.gl.getUniformLocation(this.program, 'uWorldY')!;
        this.gl.uniform1f(uWorldYLoc, 2 / -CONFIG.GAME_SCREEN_Y);

        // Create a buffer for the transformation data of the three instances
        // Test data with posX and posY for a 400x300 resolution instead of -1 to 1.
        this.transformData = new Float32Array([
            // posX, posY, scale, colorR, colorG, colorB, depth. A stride of 28 bytes.
            0, 0, 64, 0, 1.5, 0, 0,      // Green Test at origin
            200, 150, 128, 0, 0, 1, 1,    // Blue Test at center
            380, 280, 32, 1, 0, 1, 22,   // Purple Test at bottom right
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, MODEL_DATA, this.gl.STATIC_DRAW); // Put data in the buffer
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 16, 0); // Describe the data in the buffer with a size of 2 because it's a 2D model, and a stride of 16 bytes because there are 4 floats per vertex in MODEL_DATA.
        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 16, 8);
        this.gl.enableVertexAttribArray(0); // Enable the attribute which is bound to the buffer
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribDivisor(0, 0); // Model vertices - changes every vertex
        this.gl.vertexAttribDivisor(1, 0); // Texture coords - changes every vertex

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, 28, 0); // Describe the data in the buffer: the x and y coordinates after no offset.
        this.gl.vertexAttribPointer(3, 1, this.gl.FLOAT, false, 28, 8); // Describe the data in the buffer, the scale (after the 8 bytes of the 2 floats for x and y)
        this.gl.vertexAttribPointer(4, 3, this.gl.FLOAT, false, 28, 12); // Describe the data in the buffer, the color (after 12 bytes of the 2 floats for x and y and the 1 float for scale)
        this.gl.vertexAttribPointer(5, 1, this.gl.FLOAT, false, 28, 24); // Describe the data in the buffer, the depth (after 24 bytes of the 2 floats for x and y and the 1 float for scale and the 3 floats for color)

        this.gl.vertexAttribDivisor(2, 1); // Tell the GPU to update the position attribute every instance
        this.gl.vertexAttribDivisor(3, 1); // Tell the GPU to update the scale attribute every instance
        this.gl.vertexAttribDivisor(4, 1); // Tell the GPU to update the color attribute every instance
        this.gl.vertexAttribDivisor(5, 1); // Tell the GPU to update the depth attribute every instance

        this.gl.enableVertexAttribArray(2); // Enable the attribute
        this.gl.enableVertexAttribArray(3); // Enable the attribute
        this.gl.enableVertexAttribArray(4); // Enable the attribute
        this.gl.enableVertexAttribArray(5); // Enable the attribute

        this.gl.bindVertexArray(null); // All done, unbind the VAO

    }

    render(): void {
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        // Update the buffer with the new transform data and draw the sprites
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.STATIC_DRAW);
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, 3); // Draw the model of 6 vertex that form 2 triangles, 3 times

    }

}

export class SpriteRenderer extends BaseRenderer {
    private transformBuffer: WebGLBuffer;
    private modelBuffer: WebGLBuffer;
    private transformData: Float32Array;
    private image: HTMLImageElement
    private texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, image: HTMLImageElement) {
        super(gl, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER);
        // Move existing shader setup & buffer creation here
        this.image = image;
        this.texture = gl.createTexture()!;
        this.modelBuffer = gl.createBuffer()!; // Create a buffer
        this.transformBuffer = gl.createBuffer()!;

        const u = (sprite: number, orientation: number) => { return ((sprite % 16) * 0.015625) + (orientation % 4) * 0.25; }
        const v = (sprite: number, orientation: number) => { return (Math.floor(sprite / 16) * 0.015625) + Math.floor(orientation / 4) * 0.25; }
        this.transformData = new Float32Array([
            // posX, posY, scale,  colorR, colorG, colorB, U(frame, orientation), V(frame, orientation). Usually set by game engine. 8 floats for a stride of 32 bytes.
            0, 0, 64, 0, 1.5, 0, u(0, 0), v(0, 0),// Green Test at origin
            200, 150, 128, 0, 0, 1, u(0, 1), v(0, 1), // Blue Test at center
            380, 280, 32, 1, 1, 1, u(1, 1), v(1, 1),// Purple Test at bottom right
        ]);

        this.setupVAO();

    }

    private setupVAO() {
        this.gl.bindVertexArray(this.vao);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 4096, 4096, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        const uWorldXLoc = this.gl.getUniformLocation(this.program, 'uWorldX')!;
        this.gl.uniform1f(uWorldXLoc, 2 / CONFIG.GAME_SCREEN_X);

        const uWorldYLoc = this.gl.getUniformLocation(this.program, 'uWorldY')!;
        this.gl.uniform1f(uWorldYLoc, 2 / -CONFIG.GAME_SCREEN_Y);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, MODEL_DATA, this.gl.STATIC_DRAW); // Put data in the buffer
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 16, 0);  // XY
        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 16, 8); // UV Offset
        this.gl.enableVertexAttribArray(0); // Enable the attribute which is bound to the buffer
        this.gl.enableVertexAttribArray(1);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.DYNAMIC_DRAW); // Change to DYNAMIC_DRAW to allow updates
        this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, 32, 0); // Describe the data in the buffer: the x and y coordinates after no offset.
        this.gl.vertexAttribPointer(3, 1, this.gl.FLOAT, false, 32, 8); // Describe the data in the buffer, the scale (after the 8 bytes of the 2 floats for x and y)
        this.gl.vertexAttribPointer(4, 3, this.gl.FLOAT, false, 32, 12); // Describe the data in the buffer

        this.gl.vertexAttribDivisor(2, 1); // Tell the GPU to update the position attribute every instance
        this.gl.vertexAttribDivisor(3, 1); // Tell the GPU to update the scale attribute every instance
        this.gl.vertexAttribDivisor(4, 1); // Tell the GPU to update the color attribute every instance

        this.gl.enableVertexAttribArray(2); // Enable the attribute
        this.gl.enableVertexAttribArray(3); // Enable the attribute
        this.gl.enableVertexAttribArray(4); // Enable the attribute

        this.gl.bindVertexArray(null); // All done, unbind the VAO

    }

    render(): void {
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        // Update the buffer with the new transform data and draw the sprites
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.STATIC_DRAW);
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, 3);

    }

    updateTransform(index: number, position: Vec2): void {
        this.transformData[index * 8] = position.x;
        this.transformData[index * 8 + 1] = position.y;
    }
}


