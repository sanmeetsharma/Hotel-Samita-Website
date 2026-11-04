/* The photographic reveal is drawn in one GPU pass instead of repainting an SVG clip. */
(() => {
    'use strict';

    window.createSamitaHeroRenderer = ({ host, onReady, onFallback }) => {
        const canvas = document.createElement('canvas');
        canvas.className = 'hero-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        const gl = canvas.getContext('webgl', {
            alpha: false, antialias: false, depth: false, stencil: false,
            powerPreference: 'high-performance'
        });
        const api = { ready: false, resize() {}, render() {} };
        if (!gl) return api;

        let cssWidth = 1, cssHeight = 1;
        let images;
        const uniforms = {};
        function compile(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader);
                throw new Error('The photographic reveal shader could not be compiled.');
            }
            return shader;
        }
        const vertexSource = `
            attribute vec2 aPosition;
            varying vec2 vUv;
            void main() {
                vUv = aPosition * 0.5 + 0.5;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;
        const fragmentSource = `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uDay;
            uniform sampler2D uNight;
            uniform vec2 uResolution;
            uniform vec2 uPointer;
            uniform vec2 uDayScale;
            uniform vec2 uDayOffset;
            uniform vec2 uNightScale;
            uniform vec2 uNightOffset;
            uniform float uRadius;
            uniform float uTime;
            uniform float uStretch;
            uniform float uAngle;
            void main() {
                vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
                vec2 point = uv * uResolution - uPointer;
                float c = cos(uAngle), s = sin(uAngle);
                point = vec2(c * point.x + s * point.y, -s * point.x + c * point.y);
                point /= vec2(uStretch, 1.0 / sqrt(uStretch));
                float theta = atan(point.y, point.x);
                float edge = uRadius * (1.0 + 0.045 * sin(3.0 * theta + uTime * 0.35)
                    + 0.018 * cos(5.0 * theta - uTime * 0.23));
                float reveal = uRadius < 0.1 ? 0.0 : 1.0 - smoothstep(-0.7, 0.7, length(point) - edge);
                vec4 day = texture2D(uDay, uv * uDayScale + uDayOffset);
                vec4 night = texture2D(uNight, uv * uNightScale + uNightOffset);
                gl_FragColor = vec4(mix(day.rgb, night.rgb, reveal), 1.0);
            }
        `;
        function image(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.decoding = 'async';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }
        function crop(img, prefix) {
            const scale = Math.max(cssWidth / img.naturalWidth, cssHeight / img.naturalHeight) * 1.04;
            const x = cssWidth / (img.naturalWidth * scale);
            const y = cssHeight / (img.naturalHeight * scale);
            gl.uniform2f(uniforms[prefix + 'Scale'], x, y);
            gl.uniform2f(uniforms[prefix + 'Offset'], (1 - x) * .5, (1 - y) * .58);
        }
        api.resize = (width, height) => {
            cssWidth = Math.max(1, width);
            cssHeight = Math.max(1, height);
            const ratio = Math.min(devicePixelRatio || 1, 1.5, 2560 / cssWidth);
            const w = Math.round(cssWidth * ratio), h = Math.round(cssHeight * ratio);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
            if (api.ready) {
                gl.uniform2f(uniforms.uResolution, cssWidth, cssHeight);
                crop(images[0], 'uDay');
                crop(images[1], 'uNight');
            }
        };
        api.render = ({ x, y, radius, time, stretch, angle }) => {
            if (!api.ready) return;
            gl.uniform2f(uniforms.uPointer, x, y);
            gl.uniform1f(uniforms.uRadius, radius);
            gl.uniform1f(uniforms.uTime, time);
            gl.uniform1f(uniforms.uStretch, stretch);
            gl.uniform1f(uniforms.uAngle, angle);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            api.ready = false;
            host.classList.remove('gpu-active');
            onFallback?.();
        });

        Promise.all([image('Background_daylight.png'), image('Background_nighttime.png')])
            .then(loaded => {
                images = loaded;
                const program = gl.createProgram();
                const vertex = compile(gl.VERTEX_SHADER, vertexSource);
                const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
                gl.attachShader(program, vertex);
                gl.attachShader(program, fragment);
                gl.linkProgram(program);
                gl.deleteShader(vertex);
                gl.deleteShader(fragment);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Reveal unavailable.');
                gl.useProgram(program);
                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
                const position = gl.getAttribLocation(program, 'aPosition');
                gl.enableVertexAttribArray(position);
                gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
                for (const name of ['uDay','uNight','uResolution','uPointer','uRadius','uTime','uStretch','uAngle','uDayScale','uDayOffset','uNightScale','uNightOffset']) {
                    uniforms[name] = gl.getUniformLocation(program, name);
                }
                images.forEach((img, index) => {
                    gl.activeTexture(gl.TEXTURE0 + index);
                    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    gl.uniform1i(index ? uniforms.uNight : uniforms.uDay, index);
                });
                api.ready = true;
                const bounds = host.getBoundingClientRect();
                api.resize(bounds.width, bounds.height);
                host.insertBefore(canvas, host.querySelector('.hero-lighting'));
                onReady?.();
            })
            .catch(() => { api.ready = false; onFallback?.(); });
        return api;
    };
})();
