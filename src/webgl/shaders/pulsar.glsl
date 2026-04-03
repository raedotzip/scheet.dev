#version 300 es
precision highp float;
uniform float time;
uniform vec2 resolution;
uniform float quality; // 1.0 = desktop, 0.0 = mobile
out vec4 fragColor;

#define PI 3.14159265359
#define TAU 6.28318530718

vec3 palette(float t){
    t = fract(t);
    float r = 0.1 + 0.2*sin(TAU*t + 0.0);
    float g = 0.1 + 0.1*sin(TAU*t + 2.0);
    float b = 0.3 + 0.3*sin(TAU*t + 4.0);
    return vec3(r,g,b);
}

float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float noise(vec2 p){
    vec2 i=floor(p); vec2 f=fract(p);
    f=f*f*(3.0-2.0*f);
    float a=hash(i),b=hash(i+vec2(1.0,0.0));
    float c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

float fbm(vec2 p){
    float v=0.0; float a=0.5;
    // 5 octaves on desktop, 3 on mobile — each octave is a full noise sample
    int octaves = quality > 0.5 ? 5 : 3;
    for(int i=0;i<5;i++){
        if(i >= octaves) break;
        v+=noise(p)*a; p*=2.2; a*=0.5;
    }
    return v;
}

float drawStar(vec2 uv,vec2 pos,float size){
    float d=length(uv-pos);
    return smoothstep(size,0.0,d)+pow(smoothstep(size*0.6,0.0,d),4.0)*2.0;
}

void main(){
    vec2 uv=gl_FragCoord.xy/resolution;
    float aspect=resolution.x/resolution.y;
    vec2 gv=(uv*2.0-1.0)*vec2(aspect,1.0);

    float t_bg = time*0.02;
    float t_star = time*0.5;
    float t_rotate = time*0.01;
    float d = length(gv);

    float angle = t_rotate;
    float ca=cos(angle), sa=sin(angle);
    gv = vec2(gv.x*ca-gv.y*sa, gv.x*sa+gv.y*ca);

    vec2 nebUv = gv*0.5 + t_bg*0.02;
    float neb = fbm(nebUv*0.5) * 0.4 + fbm(nebUv*1.5)*0.2;
    vec3 nebulaColor = vec3(0.2,0.0,0.5)*0.5 + vec3(0.3,0.0,0.6)*0.3*neb;
    nebulaColor *= smoothstep(0.0, 1.0, 1.2-d*0.9);

    float n1 = fbm(gv*0.3+t_bg);
    vec2 warp = gv + vec2(sin(n1*PI+t_bg), cos(n1*PI+t_bg))*0.1;
    float n2 = fbm(warp*0.8-t_bg);
    vec3 background = palette(n2+t_bg*0.5)*0.5;

    // --- Pulsing stars: 40 on desktop, 20 on mobile ---
    vec3 pulsar = vec3(0.0);
    int pulsarCount = quality > 0.5 ? 40 : 20;
    for(int i=0;i<40;i++){
        if(i >= pulsarCount) break;
        vec2 seed = vec2(float(i)*1.7,float(i)*3.1);
        vec2 p = vec2(hash(seed+vec2(0.2,0.1))*2.0-1.0, hash(seed+vec2(0.3,0.5))*2.0-1.0)*vec2(aspect*1.1,1.1);
        p += vec2(noise(p*2.0+t_bg*0.2),noise(p*1.8+t_bg*0.2+10.0))*0.05;
        float rate = 1.0+hash(seed*10.0)*1.5;
        float f = pow(smoothstep(0.0,0.2,sin(t_star*rate+hash(seed*5.0)*TAU))*0.5+0.5,2.0+hash(seed)*2.0);
        float size = 0.005 + hash(seed)*0.008;
        vec3 col = palette(hash(seed*17.0));
        col.r *= 0.3; col.g *= 0.5;
        pulsar += col*drawStar(gv,p,size)*f;
    }

    // --- Sparkles: 200 on desktop, skipped entirely on mobile (most expensive pass) ---
    vec3 sparkle = vec3(0.0);
    if(quality > 0.5){
        for(int i=0;i<200;i++){
            vec2 seed = vec2(float(i)*5.0,float(i)*9.0);
            vec2 p = vec2(hash(seed+vec2(0.12,0.34))*2.0-1.0, hash(seed+vec2(0.56,0.78))*2.0-1.0)*vec2(aspect*1.1,1.1);
            float dist = length(p);
            float a = atan(p.y,p.x)+t_star*0.015*(0.5+hash(seed));
            p = vec2(cos(a),sin(a))*dist;
            p += vec2(noise(p*2.0+t_bg*0.05),noise(p*1.8+t_bg*0.05+10.0))*0.01;
            float f = pow(smoothstep(0.0,0.2,sin(t_star*4.0+hash(seed*11.0)*TAU))*0.6+0.4,1.5);
            float size = 0.003 + hash(seed)*0.006;
            vec3 col = palette(hash(seed*13.0));
            col.r *= 0.3; col.g *= 0.5;
            sparkle += col*drawStar(gv,p,size)*f;
        }
    }

    // --- Super stars: 20 on desktop, 10 on mobile ---
    vec3 superStar = vec3(0.0);
    int superStarCount = quality > 0.5 ? 20 : 10;
    for(int i=0;i<20;i++){
        if(i >= superStarCount) break;
        vec2 seed = vec2(float(i)*2.0,float(i)*7.0);
        vec2 p = vec2(hash(seed)*2.0-1.0, hash(seed+vec2(1.0))*2.0-1.0)*vec2(aspect,1.0);
        float size = 0.01+hash(seed)*0.02;
        float f = pow(smoothstep(0.0,0.5,sin(t_star*0.3+hash(seed*3.0)*TAU)),2.0);
        vec3 col = palette(hash(seed*5.0)); col.r*=0.3; col.g*=0.5;
        superStar += col*drawStar(gv,p,size)*f;
    }

    // --- Wandering orbs: 5 on desktop, 3 on mobile ---
    vec3 wander = vec3(0.0);
    int wanderCount = quality > 0.5 ? 5 : 3;
    for(int i=0;i<5;i++){
        if(i >= wanderCount) break;
        float t = t_bg + float(i)*4.0;
        vec2 p = vec2(sin(t*0.7), cos(t*0.3))*0.8 + vec2(sin(t*1.3), cos(t*1.0))*0.1;
        float dist = length(gv-p);
        wander += palette(float(i)*0.1+t_bg)*pow(smoothstep(0.08,0.0,dist),7.0)*1.7;
    }

    // --- Fluid flow: skip fbm warp on mobile, use cheaper version ---
    float ripple = time * 0.5 - d * 2.5;
    vec3 flow = vec3(0.0);
    if(quality > 0.5){
        vec2 fluidGv = gv + fbm(gv + time * 0.1) * 0.2;
        float stream = pow(1.0 - abs(fbm(fluidGv + ripple * 0.3) - 0.5), 3.5);
        float flowMask = smoothstep(3.0, 1.5, d);
        flow = palette(ripple * 0.1 + t_bg) * stream * flowMask * 0.8;
    } else {
        // Cheap approximation: single noise sample, no warp
        float stream = pow(1.0 - abs(noise(gv * 1.5 + ripple * 0.3) - 0.5), 3.5);
        float flowMask = smoothstep(3.0, 1.5, d);
        flow = palette(ripple * 0.1 + t_bg) * stream * flowMask * 0.5;
    }

    vec3 final = nebulaColor + background + pulsar + sparkle + superStar + wander + flow;
    final = pow(final,vec3(0.8));
    fragColor = vec4(final,1.0);
}
