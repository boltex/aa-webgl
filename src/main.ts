type Vec2 = { x: number, y: number };

interface GLResources {
    buffers: WebGLBuffer[];
    textures: WebGLTexture[];
    shaders: WebGLShader[];
}

type Color = {
    r: number;
    g: number;
    b: number;
};

interface RenderableSprite {
    position: Vec2;
    scale: number;
    color: Color;
    frame: number;
    orientation: number;
}

type SpriteUpdate = {
    index: number;
    properties: Partial<RenderableSprite>;
};

enum ShaderAttribute {
    POSITION = 0,
    TEXCOORD = 1,
    OFFSET = 2,
    SCALE = 3,
    COLOR = 4,
    DEPTH = 5,
    UV = 5,
    LINE_OFFSET = 1,
    LINE_SCALE_X = 2,
    LINE_SCALE_Y = 3,
    LINE_COLOR = 4
}

enum ShaderType {
    VERTEX = WebGL2RenderingContext.VERTEX_SHADER,
    FRAGMENT = WebGL2RenderingContext.FRAGMENT_SHADER
}

type WebGLError = {
    type: 'shader' | 'program' | 'buffer' | 'texture';
    message: string;
    details?: string;
}

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

layout(std140) uniform World {
    float uWorldX;
    float uWorldY;
};

out vec4 vColor;
out vec2 vTexCoord;
out float vDepth;

void main()
{
    vColor = aColor;
    vTexCoord = aTexCoord;
    vDepth = aDepth;
    vec3 pos = aPosition.xyz * aScale + aOffset;
    // This brings it in the range 0-2. So it also needs a -1 to 1 conversion.
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

// The next two are the repeated geometry and UV for each instance of the model
layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

// Those next four use vertexAttribDivisor and are updated every instance
layout(location=2) in vec3 aOffset;
layout(location=3) in float aScale;
layout(location=4) in vec4 aColor;
layout(location=5) in vec2 aUV;

layout(std140) uniform World {
    float uWorldX;
    float uWorldY;
};

out vec4 vColor;
out vec2 vTexCoord;

void main()
{
    vColor = aColor;
    vTexCoord = vec2(aTexCoord * 0.015625) + aUV;

    vec3 pos = aPosition.xyz * aScale + aOffset;

    // This brings it in the range 0-2. So it also needs a -1 to 1 conversion.
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

// SELECTION LINE VERTEX SHADER
const RECTANGLE_VERTEX_SHADER = /*glsl*/ `#version 300 es

// The next two are the repeated geometry and UV for each instance of the model
layout(location=0) in vec4 aPosition;

// Those next four use vertexAttribDivisor and are updated every instance
layout(location=1) in vec3 aOffset;
layout(location=2) in float aScaleX;
layout(location=3) in float aScaleY;
layout(location=4) in vec4 aColor;

layout(std140) uniform World {
    float uWorldX;
    float uWorldY;
};

out vec4 vColor;

void main()
{
    vColor = aColor;
    vec3 pos = aPosition.xyz * vec3(aScaleX, aScaleY, 1.0) + aOffset;
    
    // This brings it in the range 0-2. So it also needs a -1 to 1 conversion.
    gl_Position = vec4((pos.x * uWorldX) - 1.0, (pos.y * uWorldY) + 1.0, pos.z, 1.0);

}`;

// SELECTION LINE SPRITE FRAGMENT SHADER
const RECTANGLE_FRAGMENT_SHADER = /*glsl*/ `#version 300 es

precision mediump float;

in vec4 vColor;
out vec4 fragColor;

void main()
{
    fragColor = vColor;
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

const RECTANGLE_MODEL_DATA = new Float32Array([
    // XY Coords
    1, 0,
    0, 1,
    1, 1,
    1, 0,
    0, 0,
    0, 1,
]);

const CONFIG = {
    GAME_SCREEN_X: 400,
    GAME_SCREEN_Y: 300,
    TEXTURE_SIZE: 128,
    TEXTURE_DEPTH: 64,
    ATTRIBUTES: {
        POSITION_SIZE: 2,
        TEXCOORD_SIZE: 2,
        OFFSET_SIZE: 2,
        SCALE_SIZE: 1,
        COLOR_SIZE: 3,
        DEPTH_SIZE: 1
    }
} as const;

const SPRITE_SHEET = {
    SPRITES_PER_ROW: 16,
    ORIENTATIONS_PER_ROW: 4,
    UV_UNIT: 0.015625 // (1/64) Pre-calculated
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
    if (!gl) {
        throw new Error('WebGL2 not supported');
    }
    // Also check for required extensions
    if (!gl.getExtension('EXT_color_buffer_float')) {
        throw new Error('Required WebGL extensions not supported');
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent black

    const tileImage = await loadImage('images/plancher-vertical.png');

    const spriteImage = await loadImage('images/alien.png');

    const tileRenderer = new TileRenderer(gl, tileImage);
    const spriteRenderer = new SpriteRenderer(gl, spriteImage);
    const lineRenderer = new RectangleRenderer(gl);

    // Create a uniform buffer
    const worldBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, worldBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, 2 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

    // Bind the buffer to binding point 0
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, worldBuffer);

    // Set the uniform block binding for both programs
    const tileProgram = tileRenderer.program;
    const spriteProgram = spriteRenderer.program;
    const lineProgram = lineRenderer.program;
    const worldIndex = 0; // Binding point 0

    const tileBlockIndex = gl.getUniformBlockIndex(tileProgram, 'World');
    gl.uniformBlockBinding(tileProgram, tileBlockIndex, worldIndex);

    const spriteBlockIndex = gl.getUniformBlockIndex(spriteProgram, 'World');
    gl.uniformBlockBinding(spriteProgram, spriteBlockIndex, worldIndex);

    const lineBlockIndex = gl.getUniformBlockIndex(lineProgram, 'World');
    gl.uniformBlockBinding(lineProgram, lineBlockIndex, worldIndex);

    window.addEventListener('unload', () => {
        tileRenderer.dispose();
        spriteRenderer.dispose();
        // lineRenderer.dispose();
    });

    let counter = 0;

    function loop(timestamp: number): void {
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Update the uniform buffer with the new values along with a small variation demonstrating the UBO is working.
        const uboVariation = Math.sin(timestamp / 2000) * 100; // This will vary from -100 to 100
        const worldData = new Float32Array([2 / (CONFIG.GAME_SCREEN_X + uboVariation), 2 / -(CONFIG.GAME_SCREEN_Y + uboVariation)]);
        gl.bindBuffer(gl.UNIFORM_BUFFER, worldBuffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, worldData);

        // Render background tiles first
        tileRenderer.render();

        // Update the sprite position every frame demonstrating the dynamic nature of the sprite renderer
        spriteRenderer.updateSprites([{
            index: 0,
            properties: {
                position: {
                    x: Math.sin(timestamp / 1000) * 100 + 100,
                    y: Math.cos(timestamp / 1000) * 100 + 100
                }
            }
        }]);

        // Then render sprites
        spriteRenderer.render();

        // Render selection lines last
        lineRenderer.render();

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

abstract class BaseRenderer {
    protected gl: WebGL2RenderingContext;
    public program: WebGLProgram;
    protected vao: WebGLVertexArrayObject;
    protected resources: GLResources = {
        buffers: [],
        textures: [],
        shaders: []
    };

    constructor(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
        this.gl = gl;
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);
        this.vao = this.gl.createVertexArray()!;
    }

    protected createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const program = this.gl.createProgram()!;
        let errorLog = '';
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource)!;
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource)!;

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        // Check linking status
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            errorLog += `\nProgram linking failed: ${this.gl.getProgramInfoLog(program)}`;
        }

        // Validate program
        this.gl.validateProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
            errorLog += `\nProgram validation failed: ${this.gl.getProgramInfoLog(program)}`;
        }

        // Check if program can run in current WebGL state
        const activeAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        const activeUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);

        if (activeAttributes === 0 && activeUniforms === 0) {
            errorLog += '\nWarning: Program has no active attributes or uniforms';
        }

        if (errorLog) {
            throw new Error(`WebGL Program creation failed: ${errorLog}`);
        }

        return program;
    }

    protected createShader(type: ShaderType, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.resources.shaders.push(shader);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            throw new Error('Shader compilation failed');
        }
        return shader;
    }

    protected createBuffer(): WebGLBuffer {
        const buffer = this.gl.createBuffer()!;
        this.resources.buffers.push(buffer);
        return buffer;
    }

    protected createTexture(): WebGLTexture {
        const texture = this.gl.createTexture()!;
        this.resources.textures.push(texture);
        return texture;
    }

    protected setupAttribute(
        location: ShaderAttribute,
        size: number,
        stride: number,
        offset: number,
        divisor: number = 0
    ): void {
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, stride, offset);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribDivisor(location, divisor);
    }

    abstract render(): void;
    dispose(): void {
        // Delete all resources in reverse order
        this.resources.textures.forEach(texture => this.gl.deleteTexture(texture));
        this.resources.buffers.forEach(buffer => this.gl.deleteBuffer(buffer));
        this.resources.shaders.forEach(shader => this.gl.deleteShader(shader));
        this.gl.deleteProgram(this.program);
        this.gl.deleteVertexArray(this.vao);

        // Clear arrays
        this.resources.textures = [];
        this.resources.buffers = [];
        this.resources.shaders = [];
    }
}

class TileRenderer extends BaseRenderer {
    private transformBuffer: WebGLBuffer;
    private modelBuffer: WebGLBuffer;
    private transformData: Float32Array;
    private image: HTMLImageElement
    private texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, image: HTMLImageElement) {
        super(gl, TILE_VERTEX_SHADER, TILE_FRAGMENT_SHADER);
        // Move existing shader setup & buffer creation here
        this.image = image;
        this.texture = this.createTexture();
        this.modelBuffer = this.createBuffer(); // Create a buffer
        this.transformBuffer = this.createBuffer()!;

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
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR); // TODO : TRY MORE FILTERS
        this.gl.texParameteri(this.gl.TEXTURE_2D_ARRAY, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR_MIPMAP_LINEAR); // TODO : TRY MORE FILTERS
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
            300, 200, 128, 0, 0, 1, 1,    // Blue Test at center
            380, 280, 32, 1, 0, 1, 22,   // Purple Test at bottom right
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, MODEL_DATA, this.gl.STATIC_DRAW); // Put data in the buffer
        this.setupAttribute(ShaderAttribute.POSITION, CONFIG.ATTRIBUTES.POSITION_SIZE, 16, 0);
        this.setupAttribute(ShaderAttribute.TEXCOORD, CONFIG.ATTRIBUTES.TEXCOORD_SIZE, 16, 8);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.DYNAMIC_DRAW); // Change to DYNAMIC_DRAW to allow updates);
        this.setupAttribute(ShaderAttribute.OFFSET, CONFIG.ATTRIBUTES.OFFSET_SIZE, 28, 0, 1);
        this.setupAttribute(ShaderAttribute.SCALE, CONFIG.ATTRIBUTES.SCALE_SIZE, 28, 8, 1);
        this.setupAttribute(ShaderAttribute.COLOR, CONFIG.ATTRIBUTES.COLOR_SIZE, 28, 12, 1);
        this.setupAttribute(ShaderAttribute.DEPTH, CONFIG.ATTRIBUTES.DEPTH_SIZE, 28, 24, 1);

        this.gl.bindVertexArray(null); // All done, unbind the VAO

    }

    render(): void {
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        // bindTexture and bindBuffer not needed here because they are bound in the setupVAO function

        // Update the buffer with the new transform data and draw the sprites
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.STATIC_DRAW);
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, 3); // Draw the model of 6 vertex that form 2 triangles, 3 times

    }

}

class SpriteRenderer extends BaseRenderer {
    private transformBuffer: WebGLBuffer;
    private modelBuffer: WebGLBuffer;
    private transformData: Float32Array;
    private image: HTMLImageElement
    private texture: WebGLTexture;
    private dirtyTransforms = false;
    private sprites: RenderableSprite[];

    constructor(gl: WebGL2RenderingContext, image: HTMLImageElement) {
        super(gl, SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER);
        // Move existing shader setup & buffer creation here
        this.image = image;
        this.texture = this.createTexture()!;
        this.modelBuffer = this.createBuffer()!; // Create a buffer
        this.transformBuffer = this.createBuffer()!;
        this.transformData = new Float32Array(24); // 8 floats per sprite

        this.sprites = [
            { position: { x: 0, y: 0 }, scale: 64, color: { r: 0, g: 1.5, b: 0 }, frame: 0, orientation: 0 },
            { position: { x: 200, y: 150 }, scale: 128, color: { r: 0, g: 0, b: 1 }, frame: 22, orientation: 4 },
            { position: { x: 380, y: 280 }, scale: 32, color: { r: 1, g: 1, b: 1 }, frame: 33, orientation: 7 }
        ];

        this.updateTransformData();

        this.setupVAO();

    }

    private setupVAO() {
        this.gl.bindVertexArray(this.vao);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 4096, 4096, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR); // TODO : TRY MORE FILTERS
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR_MIPMAP_LINEAR); // TODO : TRY MORE FILTERS
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        const uWorldXLoc = this.gl.getUniformLocation(this.program, 'uWorldX')!;
        this.gl.uniform1f(uWorldXLoc, 2 / CONFIG.GAME_SCREEN_X);

        const uWorldYLoc = this.gl.getUniformLocation(this.program, 'uWorldY')!;
        this.gl.uniform1f(uWorldYLoc, 2 / -CONFIG.GAME_SCREEN_Y);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, MODEL_DATA, this.gl.STATIC_DRAW); // Put data in the buffer
        this.setupAttribute(ShaderAttribute.POSITION, CONFIG.ATTRIBUTES.POSITION_SIZE, 16, 0);
        this.setupAttribute(ShaderAttribute.TEXCOORD, CONFIG.ATTRIBUTES.TEXCOORD_SIZE, 16, 8);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.DYNAMIC_DRAW); // Change to DYNAMIC_DRAW to allow updates
        this.setupAttribute(ShaderAttribute.OFFSET, CONFIG.ATTRIBUTES.OFFSET_SIZE, 32, 0, 1);
        this.setupAttribute(ShaderAttribute.SCALE, CONFIG.ATTRIBUTES.SCALE_SIZE, 32, 8, 1);
        this.setupAttribute(ShaderAttribute.COLOR, CONFIG.ATTRIBUTES.COLOR_SIZE, 32, 12, 1);

        this.gl.bindVertexArray(null); // All done, unbind the VAO

    }

    render(): void {
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture); // This line is needed because the texture is unbound after the VAO is unbound

        // Update the buffer with the new transform data and draw the sprites
        if (this.dirtyTransforms) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer); // Need to bind the buffer before updating it because it was unbound after the VAO was unbound
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.DYNAMIC_DRAW);
            this.dirtyTransforms = false;
        }
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, 3);

    }

    private updateTransformData(): void {
        const u = (sprite: number, orientation: number) => ((sprite % SPRITE_SHEET.SPRITES_PER_ROW) * SPRITE_SHEET.UV_UNIT) + (orientation % SPRITE_SHEET.ORIENTATIONS_PER_ROW) * 0.25;
        const v = (sprite: number, orientation: number) => (Math.floor(sprite / SPRITE_SHEET.SPRITES_PER_ROW) * SPRITE_SHEET.UV_UNIT) + Math.floor(orientation / SPRITE_SHEET.ORIENTATIONS_PER_ROW) * 0.25;

        this.sprites.forEach((sprite, i) => {
            const offset = i * 8;
            this.transformData[offset] = sprite.position.x;
            this.transformData[offset + 1] = sprite.position.y;
            this.transformData[offset + 2] = sprite.scale;
            this.transformData[offset + 3] = sprite.color.r;
            this.transformData[offset + 4] = sprite.color.g;
            this.transformData[offset + 5] = sprite.color.b;
            this.transformData[offset + 6] = u(sprite.frame, sprite.orientation);
            this.transformData[offset + 7] = v(sprite.frame, sprite.orientation);
        });
        this.dirtyTransforms = true;
    }

    updateSprites(updates: SpriteUpdate[]): void {
        updates.forEach(({ index, properties }) => {
            this.sprites[index] = { ...this.sprites[index], ...properties };
        });
        this.updateTransformData();
    }

}

class RectangleRenderer extends BaseRenderer {
    private transformBuffer: WebGLBuffer;
    private modelBuffer: WebGLBuffer;
    private transformData: Float32Array;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, RECTANGLE_VERTEX_SHADER, RECTANGLE_FRAGMENT_SHADER);
        // Move existing shader setup & buffer creation here
        this.modelBuffer = this.createBuffer(); // Create a buffer
        this.transformBuffer = this.createBuffer()!;

        this.transformData = new Float32Array([
            // posX, posY, scaleX, scaleY, colorR, colorG, colorB. A stride of 28 bytes.
            20, 20, 64, 2, 0, 1, 0,       // Green Test at origin
            150, 100, 2, 32, 0, 1, 0,    // Blue Test at center
            280, 180, 32, 2, 0, 1, 0,  // Purple Test at bottom right
            // TODO : Add more to test negative scaling.
        ]);

        this.setupVAO();

    }

    private setupVAO() {
        this.gl.bindVertexArray(this.vao);

        const uWorldXLoc = this.gl.getUniformLocation(this.program, 'uWorldX')!;
        this.gl.uniform1f(uWorldXLoc, 2 / CONFIG.GAME_SCREEN_X);

        const uWorldYLoc = this.gl.getUniformLocation(this.program, 'uWorldY')!;
        this.gl.uniform1f(uWorldYLoc, 2 / -CONFIG.GAME_SCREEN_Y);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.modelBuffer); // Bind the buffer (meaning "use this buffer" for the following operations)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, RECTANGLE_MODEL_DATA, this.gl.STATIC_DRAW); // Put data in the buffer
        this.setupAttribute(ShaderAttribute.POSITION, CONFIG.ATTRIBUTES.POSITION_SIZE, 8, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer); // Bind the buffer (meaning "use this buffer for the following operations")
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.DYNAMIC_DRAW); // Change to DYNAMIC_DRAW to allow updates
        this.setupAttribute(ShaderAttribute.LINE_OFFSET, CONFIG.ATTRIBUTES.OFFSET_SIZE, 28, 0, 1);
        this.setupAttribute(ShaderAttribute.LINE_SCALE_X, CONFIG.ATTRIBUTES.SCALE_SIZE, 28, 8, 1);
        this.setupAttribute(ShaderAttribute.LINE_SCALE_Y, CONFIG.ATTRIBUTES.SCALE_SIZE, 28, 12, 1);
        this.setupAttribute(ShaderAttribute.LINE_COLOR, CONFIG.ATTRIBUTES.COLOR_SIZE, 28, 16, 1);

        this.gl.bindVertexArray(null); // All done, unbind the VAO

    }

    render(): void {
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.transformBuffer);

        // Update the buffer with the new transform data and draw the sprites
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.transformData, this.gl.STATIC_DRAW);
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6, 3); // Draw the model of 6 vertex that form 2 triangles, 3 times

    }

}


