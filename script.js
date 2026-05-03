// ═══════════════════════════════════════════════════════════
// PRODUCTION ERROR HANDLING SUITE
// ═══════════════════════════════════════════════════════════

// 1. Global synchronous error handler — prevents script crashes from breaking the site
window.addEventListener('error', (e) => {
    console.warn('[Production Guard]: Caught runtime error ->', e.message, '| Source:', e.filename, '| Line:', e.lineno);
    // Prevent error from propagating and killing the page
    return true;
});

// 2. Unhandled Promise rejection handler — catches async/fetch failures silently
window.addEventListener('unhandledrejection', (e) => {
    console.warn('[Production Guard]: Unhandled Promise rejection ->', e.reason);
    e.preventDefault();
});

// 3. Preloader Safety Net — if ANYTHING prevents the preloader from completing
//    within 15 seconds, force-reveal the site so the user is never stuck
window.__preloaderCompleted = false;
setTimeout(() => {
    if (window.__preloaderCompleted) return;
    console.warn('[Production Guard]: Preloader timeout reached (15s). Force-revealing site.');
    const preloader = document.getElementById('apex-preloader');
    if (preloader) preloader.style.display = 'none';
    const mainWrapper = document.getElementById('main-wrapper');
    if (mainWrapper) {
        mainWrapper.style.opacity = '1';
        mainWrapper.style.transform = 'none';
        mainWrapper.style.filter = 'none';
    }
    document.body.classList.remove('locked');
}, 15000);

if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.error("FATAL: GSAP Engine missing from CDN. Aborting animation systems.");
    // Emergency reveal: force all invisible elements to show natively
    document.documentElement.style.setProperty('--engine-status', 'failed');
    window.addEventListener('DOMContentLoaded', () => {
        // Remove preloader so user can see the site
        const preloader = document.getElementById('apex-preloader');
        if (preloader) preloader.style.display = 'none';
        document.body.classList.remove('locked');
        const mainWrapper = document.getElementById('main-wrapper');
        if (mainWrapper) {
            mainWrapper.style.opacity = '1';
            mainWrapper.style.transform = 'none';
            mainWrapper.style.filter = 'none';
        }
        // Force all opacity-zero elements visible
        document.querySelectorAll('*').forEach(el => {
            if (window.getComputedStyle(el).opacity === '0') {
                el.style.setProperty('opacity', '1', 'important');
            }
        });
    });
} else {
    try {
        // Register all GSAP plugins
        gsap.registerPlugin(ScrollTrigger);
        if (typeof ScrollToPlugin !== 'undefined') {
            gsap.registerPlugin(ScrollToPlugin);
        }
    } catch (err) {
        console.error("GSAP Core execution failed:", err);
    }
}

/**
 * ============================================================
 * CINEMATIC MASK REVEAL SYSTEM
 * ============================================================
 */

function initProReveals() {
    // 1. TYPOGRAPHY 3D FOLD (Bulletproof Failsafe)
    const titles = document.querySelectorAll('.main-title, .section-title, .pre-title');

    titles.forEach(title => {
        // Failsafe: Ensure the parent container is visible before math runs
        title.style.opacity = 1;
        title.style.visibility = "visible";

        // Split text into words (dropping the fragile 'lines' wrapper)
        const text = new SplitType(title, { types: 'words' });

        // Use fromTo to explicitly force both the start and end states
        gsap.fromTo(text.words,
            {
                y: 40,         // Subtle slide-up for a premium feel
                opacity: 0,
                skewY: 6       // Reduced skew for a more professional look
            },
            {
                y: 0,
                opacity: 1,
                skewY: 0,      // Snaps perfectly back to baseline
                duration: 1.2,
                ease: "power4.out",
                stagger: 0.04, // Smooth rippling effect
                scrollTrigger: {
                    trigger: title,
                    start: "top 95%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    // 2. PARALLAX UNROLL
    const mediaWrappers = document.querySelectorAll('.edu-card, .project-image-wrapper');
    mediaWrappers.forEach(wrapper => {
        const innerContent = wrapper.querySelector('img') || wrapper.children[0];
        let tl = gsap.timeline({
            scrollTrigger: { trigger: wrapper, start: "top 85%", toggleActions: "play none none reverse" }
        });

        tl.fromTo(wrapper,
            { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
            { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.4, ease: "power4.inOut" }
        );

        if (innerContent) {
            tl.fromTo(innerContent,
                { scale: 1.3 }, { scale: 1, duration: 1.4, ease: "power4.inOut" }, "<"
            );
        }
    });

    // 3. THE GRAVITY DROP (Skills Bubbles)
    const skillBubbles = document.querySelectorAll('.matter-bubble');
    if (skillBubbles.length > 0) {
        gsap.fromTo(skillBubbles,
            { y: -150, opacity: 0, scale: 0.5 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.5,
                stagger: 0.05,
                ease: "elastic.out(1, 0.6)",
                scrollTrigger: {
                    trigger: '.physics-skills-container',
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                onComplete: () => {
                    gsap.set(skillBubbles, { clearProps: "transform, scale" });
                }
            }
        );
    }

    // 4. THE SEQUENTIAL CASCADE (Certificates) — Editorial slide-in
    const certificates = document.querySelectorAll('.accordion-item');
    if (certificates.length > 0) {
        gsap.fromTo(certificates,
            { x: -60, opacity: 0, skewX: -2 },
            {
                x: 0,
                opacity: 1,
                skewX: 0,
                transformOrigin: "left center",
                duration: 1.0,
                stagger: 0.08,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: '.certifications-section',
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                onComplete: () => {
                    gsap.set(certificates, { clearProps: "transform" });
                }
            }
        );
    }
}

// Initialize Lenis Smooth Scroll — AGENCY-TUNED
const lenis = new Lenis({
    lerp: 0.06,           // Lower = heavier, more cinematic inertia
    smoothWheel: true,
    wheelMultiplier: 0.8,  // Reduces scroll speed for deliberate pacing
});

lenis.on('scroll', ScrollTrigger.update);

// Scroll Progress Bar — fixed laser at top of viewport
lenis.on('scroll', (e) => {
    const progress = document.getElementById('scroll-progress');
    if (progress) {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progress.style.width = scrollPercent + '%';
    }
});

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// 3. INITIALIZATION LOCK
document.body.classList.add("locked");

// Force scroll to top — prevents browser from restoring a cached scroll position
// which would cause hero exit animations to fire during preloader
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Pre-set: Main site starts pushed back (will pull forward on reveal)
gsap.set("#main-wrapper", { scale: 0.97, opacity: 0, filter: "blur(5px)" });

document.addEventListener("DOMContentLoaded", () => {
  const tl = gsap.timeline();

  // Advanced initial states for maximum creativity
  gsap.set(".char", { yPercent: 100, rotationX: -50, scale: 1.2, opacity: 0, filter: "blur(12px)" });
  gsap.set(".apex-role", { yPercent: 120, opacity: 0, filter: "blur(5px)" });
  gsap.set(".apex-meta", { opacity: 0, y: 15 });
  gsap.set(".g-text", { yPercent: 120, opacity: 0, filter: "blur(8px)", rotationX: 20 });
  
  tl

    // ─── PHASE 1: BOOT — Corner metadata bleeds in ─────────────
    .to(".apex-meta", {
      opacity: 1,
      y: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: "power2.out"
    })

    // ─── PHASE 2: THE WELCOME — Greeting reveals in 3D ─────────────
    .to(".g-text", {
      yPercent: 0,
      opacity: 1,
      rotationX: 0,
      filter: "blur(0px)",
      duration: 1.2,
      stagger: 0.15,
      ease: "expo.out"
    }, "-=0.6")

    // Status text swap
    .add(() => {
      const s = document.getElementById("apex-status");
      if (s) s.innerText = "HANDSHAKE SECURED";
    }, "-=0.8")

    // The Hold (allow user to read the greeting)
    .to({}, { duration: 1.4 })

    // ─── PHASE 3: THE COLLAPSE — Greeting scatters up ─
    .to(".g-text", {
      yPercent: -120,
      opacity: 0,
      filter: "blur(8px)",
      duration: 0.6,
      stagger: 0.05,
      ease: "power4.in"
    })

    // ─── PHASE 4: BRAND REVEAL — 3D Kinetic typography ─
    .to(".char", {
      yPercent: 0,
      rotationX: 0,
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      stagger: 0.04,
      ease: "expo.out"
    }, "-=0.1")

    // Role slides up
    .to(".apex-role", {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.5")

    // Status update
    .add(() => {
      const s = document.getElementById("apex-status");
      if (s) s.innerText = "SEQUENCE INITIATED";
    }, "-=0.2")

    // ─── PHASE 5: THE HOLD — Tension builds ────────
    .to({}, { duration: 0.5 })

    // ─── PHASE 6: EXIT — Typography scatters in 3D, tension line readies ─
    .to(".char", {
      yPercent: -100,
      rotationX: 45,
      opacity: 0,
      filter: "blur(10px)",
      duration: 0.5,
      stagger: 0.02,
      ease: "power3.in"
    })

    .to(".apex-role", {
      yPercent: -100,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in"
    }, "<")

    // ─── PHASE 7: TENSION LINE — The laser flash ─
    .to(".tension-line", {
      opacity: 1,
      width: "100vw",
      duration: 0.8,
      ease: "expo.inOut"
    }, "-=0.3")
    
    // The flash pulse (explosive energy before the snap)
    .to(".tension-line", {
      height: "4px",
      boxShadow: "0 0 40px #CBA365, 0 0 80px #ffffff",
      duration: 0.15,
      yoyo: true,
      repeat: 1
    }, "-=0.1")

    // Corner metadata fades out
    .to(".apex-meta", {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    }, "<")

    // ─── PHASE 8: THE SHARD SNAP — Perfect column masking ─
    .to(".s-1", { yPercent: -100, duration: 1.4, ease: "expo.inOut" }, "+=0.05")
    .to(".s-2", { yPercent: 100, duration: 1.4, ease: "expo.inOut" }, "<")
    .to(".s-3", { yPercent: -100, duration: 1.4, ease: "expo.inOut" }, "<")
    .to(".s-4", { yPercent: 100, duration: 1.4, ease: "expo.inOut" }, "<")

    // Tension line collapses instantly & noise fades to reveal site cleanly
    .to(".tension-line", { opacity: 0, width: "0vw", duration: 0.4, ease: "power2.in" }, "-=1.2")
    .to(".apex-noise", { opacity: 0, duration: 1.2, ease: "expo.inOut" }, "<")

    // ─── PHASE 9: SITE PULL-FORWARD — Main content emerges ─────
    .to("#main-wrapper", {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      duration: 1.4,
      ease: "expo.out"
    }, "-=0.9")

    // ─── FINAL CLEANUP ─────────────────────────────────────────
    .add(() => {
      // Mark preloader as completed (disarms the safety-net timeout)
      window.__preloaderCompleted = true;

      // 1. Force scroll to absolute top BEFORE unlocking
      //    Prevents cached scroll positions from triggering hero-exit scrubs
      window.scrollTo(0, 0);
      if (typeof lenis !== 'undefined') {
        lenis.scrollTo(0, { immediate: true, force: true });
      }

      // 2. Remove the preloader from the DOM entirely
      const preloader = document.getElementById("apex-preloader");
      if (preloader) preloader.style.display = "none";

      // 3. Clear all GSAP-applied inline styles from main-wrapper
      gsap.set("#main-wrapper", { clearProps: "all" });

      // 4. Explicitly guarantee hero elements are fully visible
      //    (Guards against any residual scroll-scrub states)
      gsap.set(".anti-hero", { opacity: 1, visibility: "visible" });
      gsap.set(".content", { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", clearProps: "transform" });
      gsap.set(".title", { opacity: 1, visibility: "visible" });
      gsap.set(".subtitle", { opacity: 1, visibility: "visible" });
      gsap.set("#hero-canvas", { opacity: 1, y: 0 });
      gsap.set(".scroll-indicator", { opacity: 1, y: 0 });

      // 5. Unlock the body AFTER scroll is reset
      document.body.classList.remove("locked");

      // 6. Refresh ScrollTrigger so all start/end calculations
      //    are based on the correct scrollY=0 position
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
      }

      // 7. Initialize section reveal animations
      initProReveals();
    });
});

/**
 * WebGL Kinetic Data Ocean (Hero Background)
 */
function initHeroTopography() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Read CSS variables for theme-aware colors
    function getThemeColors() {
        const s = getComputedStyle(document.documentElement);
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
        const accent = s.getPropertyValue('--accent').trim() || '#CBA365';
        const textPrimary = s.getPropertyValue('--text-primary').trim() || '#EBE9E1';
        // Dark mode: gold dust glow. Light mode: deep ink dots.
        return isLightTheme ? textPrimary : accent;
    }

    const scene = new THREE.Scene();

    // Camera — floating just above the data sea, looking to horizon
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 40);
    camera.lookAt(0, 0, 0);

    // Transparent renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // --- Particle Grid Geometry ---
    const gridSize = 120;
    const particleCount = gridSize * gridSize;
    const spacing = 0.6;
    const halfGrid = (gridSize - 1) * spacing * 0.5;

    const positions = new Float32Array(particleCount * 3);

    for (let ix = 0; ix < gridSize; ix++) {
        for (let iz = 0; iz < gridSize; iz++) {
            const index = (ix * gridSize + iz) * 3;
            positions[index] = ix * spacing - halfGrid; // X
            positions[index + 1] = 0;                        // Y (will be animated)
            positions[index + 2] = iz * spacing - halfGrid; // Z
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // --- Luxury Data Material ---
    const material = new THREE.PointsMaterial({
        color: getThemeColors(),
        size: 0.08,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- Theme sync ---
    window.addEventListener('theme-changed', () => {
        setTimeout(() => {
            material.color.set(getThemeColors());
        }, 50);
    });

    // --- Resize ---
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // --- Liquid Gravity Well (Lerped Cursor) ---
    const raycaster = new THREE.Raycaster();
    const mouseTarget = new THREE.Vector2(0, 0);
    const currentMouse = new THREE.Vector2(0, 0);

    // Invisible tracking plane at y=0 for smooth raycasting
    const trackPlaneGeo = new THREE.PlaneGeometry(300, 300);
    const trackPlaneMat = new THREE.MeshBasicMaterial({ visible: false });
    const trackPlane = new THREE.Mesh(trackPlaneGeo, trackPlaneMat);
    trackPlane.rotation.x = -Math.PI / 2;
    trackPlane.position.y = 0;
    scene.add(trackPlane);

    window.addEventListener('mousemove', (e) => {
        mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Wave Animation ---
    const clock = new THREE.Clock();
    const posArray = geometry.attributes.position.array;

    function render() {
        requestAnimationFrame(render);
        const time = clock.getElapsedTime() * 0.5;

        // Smoothly interpolate current mouse toward target (heavy fluid trailing)
        currentMouse.lerp(mouseTarget, 0.08);

        // Raycast using the lerped cursor for smooth 3D tracking
        raycaster.setFromCamera(currentMouse, camera);
        const intersects = raycaster.intersectObject(trackPlane);
        let hitX = -9999, hitZ = -9999;
        if (intersects.length > 0) {
            hitX = intersects[0].point.x;
            hitZ = intersects[0].point.z;
        }

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = posArray[i3];
            const z = posArray[i3 + 2];

            // Base wave interference pattern
            const baseWave = Math.sin((x * 0.1) + time) * 2 + Math.cos((z * 0.1) + time) * 2;

            // Gaussian gravity well (avoids sqrt for performance)
            const dx = x - hitX;
            const dz = z - hitZ;
            const distanceSq = (dx * dx) + (dz * dz);
            const pullForce = Math.exp(-distanceSq / 60.0);

            // Combine base wave with localized upward pull
            posArray[i3 + 1] = baseWave + (pullForce * 8.0);
        }
        geometry.attributes.position.needsUpdate = true;

        // Slow panoramic rotation
        particles.rotation.y += 0.001;

        renderer.render(scene, camera);
    }

    render();
}

// Call instantly after layout setup
initHeroTopography();

/**
 * ═══════════════════════════════════════════════════════════
 * CINEMATIC SCROLL ORCHESTRATION ENGINE
 * Multi-million-dollar agency scroll choreography
 * ═══════════════════════════════════════════════════════════
 */

// ── 1. HERO EXIT — Parallax fade + scale + blur ──────────────
gsap.to('.scroll-indicator', {
    scrollTrigger: {
        trigger: '.anti-hero',
        start: 'top top',
        end: '15% top',
        scrub: true
    },
    opacity: 0,
    y: 30
});

gsap.to('.content', {
    scrollTrigger: {
        trigger: '.anti-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    },
    y: 150,
    scale: 0.92,
    opacity: 0,
    filter: "blur(6px)"
});

// Hero canvas fades slower than content (differential parallax)
gsap.to('#hero-canvas', {
    scrollTrigger: {
        trigger: '.anti-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
    },
    y: 80,
    opacity: 0.3
});

// ── 2. SECTION HEADER PARALLAX — Headers float at different speed ─
document.querySelectorAll('.premium-header-wrapper').forEach(header => {
    gsap.to(header, {
        y: -40,
        scrollTrigger: {
            trigger: header,
            start: 'top 90%',
            end: 'top 30%',
            scrub: 1.5
        }
    });
});

// ── 3. SECTION DIVIDERS — Draw from center outward ───────────
document.querySelectorAll('.section-divider').forEach(divider => {
    gsap.fromTo(divider,
        { scaleX: 0, transformOrigin: "center center" },
        {
            scaleX: 1,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: {
                trigger: divider,
                start: "top 90%",
                toggleActions: "play none none none"
            }
        }
    );
});


// ── 5. ABOUT SECTION — Split-screen cinematic reveal ─────────
const aboutContent = document.querySelector('.about-content');
const aboutPortrait = document.querySelector('.about-portrait-wrapper');

if (aboutContent) {
    gsap.fromTo(aboutContent,
        { x: -60, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: {
                trigger: '.about-section',
                start: 'top 75%',
                toggleActions: "play none none none"
            }
        }
    );
}

if (aboutPortrait) {
    gsap.fromTo(aboutPortrait,
        { x: 60, opacity: 0, scale: 0.95 },
        {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: {
                trigger: '.about-section',
                start: 'top 75%',
                toggleActions: "play none none none"
            }
        }
    );
}

// ── 6. EXPERIENCE TIMELINE — Nodes emerge with weight ────────
document.querySelectorAll('.timeline-node').forEach((node, i) => {
    gsap.fromTo(node,
        { x: -40, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 1.2,
            delay: i * 0.15,
            ease: "power4.out",
            scrollTrigger: {
                trigger: node,
                start: "top 80%",
                toggleActions: "play none none none"
            }
        }
    );
});

// ── 7. EDUCATION CARDS — Scale depth on scroll ───────────────
document.querySelectorAll('.edu-card').forEach(card => {
    gsap.fromTo(card,
        { y: 100, opacity: 0, scale: 0.96 },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        }
    );
});

// ── 8. FOOTER CINEMATIC ENTRANCE — Heavy pull-up ─────────────
const footer = document.querySelector('.premium-footer');
if (footer) {
    gsap.fromTo(footer,
        { y: 80, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: {
                trigger: footer,
                start: "top 90%",
                toggleActions: "play none none none"
            }
        }
    );
}


/**
 * Cinematic Horizontal Scrolling Gallery
 */
var track = document.querySelector(".projects-track");
var wrapper = document.querySelector(".projects-wrapper");

if (track && wrapper) {
    let mm = gsap.matchMedia();
    mm.add("(min-width: 769px)", () => {
        let scrollTween = gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                trigger: wrapper,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                scrub: 2,  // Heavier trailing for premium feel
                start: "top top",
                end: () => "+=" + (track.scrollWidth - window.innerWidth),
                invalidateOnRefresh: true
            }
        });

        // Per-card depth animation inside horizontal scroll
        document.querySelectorAll('.project-card').forEach((card, i) => {
            gsap.fromTo(card,
                { scale: 0.9, opacity: 0.4 },
                {
                    scale: 1,
                    opacity: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: scrollTween,
                        start: "left 85%",
                        end: "left 40%",
                        scrub: true
                    }
                }
            );
        });
    });
}

/**
 * Liquid Distortion Image Hover Effect
 */
const projectContents = document.querySelectorAll('.project-content');
const displacement = document.querySelector('#displacement');

// Animation loop state for liquid filter
let filterScale = 0;
let targetScale = 0;

function animateDistortion() {
    filterScale += (targetScale - filterScale) * 0.1;
    if (displacement) {
        displacement.setAttribute('scale', filterScale);
    }
    requestAnimationFrame(animateDistortion);
}
animateDistortion();

projectContents.forEach(content => {
    const imgWrapper = content.querySelector('.project-image-wrapper');
    gsap.set(imgWrapper, { xPercent: -50, yPercent: -50, scale: 0.8, rotation: -5 });

    content.addEventListener('mouseenter', () => {
        filterScale = 80;
        targetScale = 0;
        gsap.to(imgWrapper, { scale: 1, rotation: 0, duration: 0.8, ease: "power3.out", overwrite: "auto" });
    });

    content.addEventListener('mousemove', (e) => {
        const rect = content.getBoundingClientRect();
        // Mouse coordinate relative to the center of the content block
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(imgWrapper, {
            x: x * 0.2, // Move 20% of the distance from center
            y: y * 0.2,
            rotation: x * 0.015,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto"
        });
        targetScale = 15; // Keep a subtle ripple moving
    });

    content.addEventListener('mouseleave', () => {
        targetScale = 0;
        gsap.to(imgWrapper, {
            x: 0,
            y: 0,
            scale: 0.8,
            rotation: -5,
            duration: 1.2,
            ease: "power3.out",
            overwrite: "auto"
        });
    });
});

/**
 * Cinematic Click-to-Reveal Projects Logic
 */
const projectCardsForClick = document.querySelectorAll('.project-card'); // Or whatever wrapper holds your project

projectCardsForClick.forEach(card => {
    const title = card.querySelector('h2'); // The element the user clicks
    const imgWrapper = card.querySelector('.project-image-wrapper');

    // Set a tracker variable
    let isOpen = false;

    title.addEventListener('click', () => {
        if (!isOpen) {
            // REVEAL ANIMATION
            gsap.to(imgWrapper, {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "expo.out"
            });
            isOpen = true;
        } else {
            // HIDE ANIMATION
            gsap.to(imgWrapper, {
                clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
                opacity: 0,
                scale: 1.1,
                duration: 0.8,
                ease: "power3.in"
            });
            isOpen = false;
        }
    });
});

/**
 * Experience Timeline SVG Animation
 */
const timelinePath = document.querySelector('.timeline-path');
if (timelinePath) {
    const pathLength = timelinePath.getTotalLength();

    // Set initial dash properties to hide the path
    timelinePath.style.strokeDasharray = pathLength;
    timelinePath.style.strokeDashoffset = pathLength;

    // Draw the SVG line dynamically on scroll
    gsap.to(timelinePath, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
            trigger: '.timeline-container',
            start: "top 80%",
            end: "bottom 60%",
            scrub: 1
        }
    });

    // Reveal text nodes individually when the line roughly reaches them
    const tNodes = document.querySelectorAll('.timeline-node');
    tNodes.forEach(node => {
        ScrollTrigger.create({
            trigger: node,
            start: "top 65%", // Trigger point corresponding to the SVG drawing speed
            toggleClass: "active"
        });
    });
}

/**
 * Scrubbing About Text Animation & Liquid Glass Photo Reveal
 */
const aboutText = document.getElementById('about-text');
if (aboutText) {
    const textContent = aboutText.innerText;
    const words = textContent.split(/\s+/);
    aboutText.innerHTML = '';

    words.forEach(word => {
        if (!word) return;
        const span = document.createElement('span');
        span.className = 'about-word';
        span.innerText = word;
        aboutText.appendChild(span);
        aboutText.appendChild(document.createTextNode(' '));
    });

    const wordSpans = aboutText.querySelectorAll('.about-word');
    const portrait = document.querySelector('.about-portrait');
    const portraitWrapper = document.querySelector('.about-portrait-wrapper');
    const aboutDisplacement = document.getElementById('about-displacement');

    // --- 1. Scrubbing words ScrollTrigger ---
    gsap.to(wordSpans, {
        opacity: 1,
        stagger: 0.1,
        ease: "power1.out",
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 65%',
            end: 'bottom 75%',
            scrub: 1
        }
    });

    // --- 2. Liquid Glass Scroll Reveal (displacement scale 100 → 0) ---
    if (portrait && aboutDisplacement) {
        const dispProxy = { scale: 100 };

        gsap.to(dispProxy, {
            scale: 0,
            ease: "power2.inOut",
            scrollTrigger: {
                trigger: '.about-section',
                start: 'top 60%',
                end: 'center 50%',
                scrub: 1.5
            },
            onUpdate: () => {
                aboutDisplacement.setAttribute('scale', dispProxy.scale);
            }
        });

        // Sync grayscale: fades away as bubbling distortion clears
        gsap.to(portrait, {
            filter: "url(#about-liquid) grayscale(0%)",
            ease: "none",
            scrollTrigger: {
                trigger: '.about-section',
                start: 'center 60%',
                end: 'bottom 70%',
                scrub: 1
            }
        });
    }

    // --- 3. Interactive Hover: Ripple + Parallax Lerp Tilt ---
    if (portrait && portraitWrapper && aboutDisplacement) {
        // Lerp targets
        let targetRotX = 0, targetRotY = 0;
        let currentRotX = 0, currentRotY = 0;
        let targetDisp = 0;
        let currentDisp = 0;
        let isHovering = false;
        let hoverRafId = null;

        function lerpTilt() {
            const ease = 0.06; // lower = heavier/lazier

            currentRotX += (targetRotX - currentRotX) * ease;
            currentRotY += (targetRotY - currentRotY) * ease;
            currentDisp += (targetDisp - currentDisp) * 0.08;

            portrait.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;

            // Only write to SVG attribute if scroll has already cleared distortion
            const scrolledScale = parseFloat(aboutDisplacement.getAttribute('scale') || 0);
            if (scrolledScale < 5) {
                aboutDisplacement.setAttribute('scale', currentDisp);
            }

            if (isHovering || Math.abs(currentRotX) > 0.05 || Math.abs(currentRotY) > 0.05) {
                hoverRafId = requestAnimationFrame(lerpTilt);
            }
        }

        portraitWrapper.addEventListener('mouseenter', () => {
            isHovering = true;
            targetDisp = 15;
            // Snap to color on enter
            portrait.style.filter = 'url(#about-liquid) grayscale(0%)';
            cancelAnimationFrame(hoverRafId);
            lerpTilt();
        });

        portraitWrapper.addEventListener('mousemove', (e) => {
            const rect = portraitWrapper.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            // Normalise to -1 → +1 range then scale to ±5°
            const nx = (e.clientX - cx) / (rect.width / 2);
            const ny = (e.clientY - cy) / (rect.height / 2);

            targetRotX = -ny * 5;   // tilt up/down
            targetRotY = nx * 5;   // tilt left/right

            // Vary ripple intensity slightly by position for organic feel
            targetDisp = 15 + Math.abs(nx * ny) * 5;
        });

        portraitWrapper.addEventListener('mouseleave', () => {
            isHovering = false;
            targetRotX = 0;
            targetRotY = 0;
            targetDisp = 0;
            portrait.style.filter = 'url(#about-liquid) grayscale(100%)';
            // Don't cancel RAF — let it lerp back to neutral
            cancelAnimationFrame(hoverRafId);
            lerpTilt();
        });
    }
}

/**
 * Custom Magnetic Cursor Engine
 */
const cursor = document.querySelector('.custom-cursor');

// Initialize positions to middle of screen
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;

// Adjusting easing factor controls the 'lag' or smoothness. Lower = smoother.
const speed = 0.15;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    // Lerp coordinates
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;

    if (cursor) {
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
    }

    requestAnimationFrame(animateCursor);
}

// Kick off loop
animateCursor();

// Attach smart hover listeners to all interactables
const interactables = document.querySelectorAll('a, button, .scroll-indicator, .panel-content');
interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor?.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
        cursor?.classList.remove('hovered');
    });
});

/**
 * Matter.js Skills Engine
 */
const physicsContainer = document.getElementById('physics-container');
if (physicsContainer && typeof Matter !== 'undefined') {
    const Engine = Matter.Engine,
        Runner = Matter.Runner,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body;

    const engine = Engine.create();
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    let width = physicsContainer.offsetWidth || window.innerWidth;
    let height = physicsContainer.offsetHeight || window.innerHeight * 0.6;

    const wallOptions = { isStatic: true, render: { visible: false } };

    // Create walls matching dimensions
    const topWall = Bodies.rectangle(width / 2, -50, width * 2, 100, wallOptions);
    const bottomWall = Bodies.rectangle(width / 2, height + 50, width * 2, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);

    World.add(engine.world, [topWall, bottomWall, leftWall, rightWall]);

    // Handle Resize
    window.addEventListener('resize', () => {
        if (!physicsContainer) return;
        width = physicsContainer.offsetWidth || window.innerWidth;
        height = physicsContainer.offsetHeight || window.innerHeight * 0.6;

        Body.setPosition(topWall, { x: width / 2, y: -50 });
        Body.setPosition(bottomWall, { x: width / 2, y: height + 50 });
        Body.setPosition(leftWall, { x: -50, y: height / 2 });
        Body.setPosition(rightWall, { x: width + 50, y: height / 2 });
    });

    const categories = {
        'Python Programming': ['Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'Streamlit'],
        'Data Analysis': ['SQL', 'Power BI', 'Tableau', 'Excel'],
        'Statistics & ML': ['Regression', 'Classification', 'Clustering', 'EDA',' Hypothesis Testing','Correlation Analysis','Distribution Analysis'],
        'Cloud & ETL': ['AWS', 'S3', 'Lambda', 'Glue', 'Crawler', 'IAM'],
        'Developer Tools': ['MySQL', 'PostgreSQL', 'Jupyter', 'VS Code']
    };

    const domBodies = [];

    function createBubble(text, x, y, baseRadius, isParent) {
        const scaleFactor = Math.min(1, window.innerWidth / 800);
        const radius = baseRadius * scaleFactor;

        const el = document.createElement('div');
        el.className = isParent ? 'matter-bubble parent-bubble' : 'matter-bubble child-bubble';
        el.innerText = text;
        el.style.width = `${radius * 2}px`;
        el.style.height = `${radius * 2}px`;
        // Scale down fonts on mobile using scaleFactor
        if (scaleFactor < 1) {
            el.style.fontSize = `${isParent ? 1.3 * scaleFactor : 0.9 * scaleFactor}rem`;
        }
        physicsContainer.appendChild(el);

        const body = Bodies.circle(x, y, radius, {
            restitution: 0.95, // High restitution
            frictionAir: 0.015,
            friction: 0.01,
            density: 0.005
        });

        Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 6,
            y: (Math.random() - 0.5) * 6
        });

        World.add(engine.world, body);

        const bubbleObj = { body, el, text, isParent, baseRadius, radius };
        domBodies.push(bubbleObj);

        if (isParent) {
            const splitHandler = (e) => {
                e.preventDefault();
                splitParent(bubbleObj);
            };
            el.addEventListener('pointerdown', splitHandler, { once: true });
        }

        return bubbleObj;
    }

    function splitParent(parentObj) {
        if (!parentObj.body || !parentObj.isParent) return;

        if (parentObj.el.parentNode === physicsContainer) {
            physicsContainer.removeChild(parentObj.el);
        }
        World.remove(engine.world, parentObj.body);

        const index = domBodies.indexOf(parentObj);
        if (index > -1) domBodies.splice(index, 1);

        const otherParents = domBodies.filter(b => b.isParent);
        otherParents.forEach(p => {
            p.el.style.transition = 'opacity 0.6s ease';
            p.el.style.opacity = '0.2';
            p.body.isSensor = true;
        });

        const childrenText = categories[parentObj.text] || [];
        const childrenObjs = [];

        childrenText.forEach((childText, i) => {
            const angle = (Math.PI * 2 / childrenText.length) * i;
            const dist = parentObj.radius * 0.4;

            const cx = parentObj.body.position.x + Math.cos(angle) * dist;
            const cy = parentObj.body.position.y + Math.sin(angle) * dist;

            const childBaseRadius = Math.max(35, childText.length * 4 + 20);
            const childObj = createBubble(childText, cx, cy, childBaseRadius, false);
            childrenObjs.push(childObj);

            // Radial burst exactly from coordinate center
            Body.applyForce(childObj.body, childObj.body.position, {
                x: Math.cos(angle) * 0.05,
                y: Math.sin(angle) * 0.05
            });
        });

        setTimeout(() => {
            childrenObjs.forEach(child => {
                if (!child.el) return;
                const currentTransform = child.el.style.transform;
                child.el.style.transition = 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
                child.el.style.transform = currentTransform + ' scale(1.5)';
                child.el.style.opacity = '0';
                child.el.style.filter = 'blur(10px)';
                World.remove(engine.world, child.body);
            });

            setTimeout(() => {
                otherParents.forEach(p => {
                    p.el.style.opacity = '1';
                    p.body.isSensor = false;
                });

                childrenObjs.forEach(child => {
                    if (child.el && child.el.parentNode === physicsContainer) {
                        physicsContainer.removeChild(child.el);
                    }
                    const cIdx = domBodies.indexOf(child);
                    if (cIdx > -1) domBodies.splice(cIdx, 1);
                });

                createBubble(parentObj.text, width / 2, height / 2, parentObj.baseRadius, true);
            }, 600);
        }, 4000);
    }

    const parentKeys = Object.keys(categories);
    parentKeys.forEach((key, i) => {
        const baseRadius = Math.max(70, key.length * 6 + 30);
        const px = width / 2 + (Math.random() - 0.5) * 300;
        const py = height / 2 + (Math.random() - 0.5) * 200;
        createBubble(key, px, py, baseRadius, true);
    });

    Runner.run(Runner.create(), engine);

    function updateDOM() {
        domBodies.forEach(b => {
            if (b.el.style.opacity !== '0' && !b.el.style.transform.includes('scale(1.5)')) {
                b.el.style.transform = `translate(${b.body.position.x - b.radius}px, ${b.body.position.y - b.radius}px) rotate(${b.body.angle}rad)`;
            }
        });
        requestAnimationFrame(updateDOM);
    }
    updateDOM();

    setInterval(() => {
        domBodies.forEach(b => {
            if (b.body.speed < 0.5) {
                Body.applyForce(b.body, b.body.position, {
                    x: (Math.random() - 0.5) * 0.005,
                    y: (Math.random() - 0.5) * 0.005
                });
            }
        });
    }, 1000);
}

/**
 * Minimalist Accordion & Floating Certificate
 */
const accordions = document.querySelectorAll('.accordion-item');
const certImg = document.querySelector('#cert-hover-image');
const certTitles = document.querySelectorAll('.cert-title');

if (certImg) {
    // Basic setup: permanent centering and initial zero-scale
    gsap.set(certImg, { xPercent: -50, yPercent: -50, scale: 0.5, opacity: 0 });

    // Trackers
    const moveX = gsap.quickTo(certImg, "x", { duration: 0.3, ease: "power3" });
    const moveY = gsap.quickTo(certImg, "y", { duration: 0.3, ease: "power3" });

    // Global mouse tracking
    window.addEventListener("mousemove", (e) => {
        moveX(e.clientX);
        moveY(e.clientY);
    });

    // Hover interactions
    certTitles.forEach(title => {
        const hoverTarget = title.closest('.accordion-header') || title;

        hoverTarget.addEventListener("mouseenter", () => {
            const imgSrc = title.getAttribute("data-img");
            if (imgSrc) {
                certImg.src = imgSrc;
                gsap.to(certImg, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" });
            }
        });

        hoverTarget.addEventListener("mouseleave", () => {
            gsap.to(certImg, { opacity: 0, scale: 0.5, duration: 0.3, ease: "power2.in" });
        });
    });
}

accordions.forEach(item => {
    const header = item.querySelector('.accordion-header');
    const content = item.querySelector('.accordion-content');
    const details = item.querySelector('.accordion-details');

    header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        accordions.forEach(acc => {
            acc.classList.remove('active');
            acc.querySelector('.accordion-content').style.height = '0px';
        });

        if (!isActive) {
            item.classList.add('active');
            content.style.height = `${details.offsetHeight}px`;
        }
    });
});

/* ============================================================
   THREE.JS TACTILE GLOBE WITH CSS2D
   ============================================================ */
/* ============================================================
   THREE.JS PARTICLE DATA-MATRIX GLOBE
   ============================================================ */
(function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const wrapper = canvas.parentElement;

    // Dynamic theme colors
    const PLEXUS_DARK = 0xCBA365; // Brushed Brass
    const PLEXUS_LIGHT = 0xAD6C4A; // Polished Copper

    let PLEXUS_COLOR = document.documentElement.getAttribute('data-theme') === 'light' ? PLEXUS_LIGHT : PLEXUS_DARK;

    // --- Scene / Camera / Renderers ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2.0;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    function resize() {
        const w = wrapper.clientWidth || 500;
        const h = wrapper.clientHeight || 500;
        const s = Math.min(w, h);
        renderer.setSize(s, s);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // --- Hierarchy ---
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    tiltGroup.add(spinGroup);
    scene.add(tiltGroup);

    // --- Part 1: Neural Plexus Geometry ---
    const RADIUS = 1;
    const particleCount = 450;

    const basePositions = [];
    const currentPositions = [];

    const pointsGeo = new THREE.BufferGeometry();
    const pointsPosArray = new Float32Array(particleCount * 3);

    // Uniformly distribute points on the sphere using Golden Spiral
    const phiDelta = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < particleCount; i++) {
        const y = 1 - (i / (particleCount - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phiDelta * i;

        const vx = Math.cos(theta) * radiusAtY * RADIUS;
        const vy = y * RADIUS;
        const vz = Math.sin(theta) * radiusAtY * RADIUS;

        const vec = new THREE.Vector3(vx, vy, vz);
        basePositions.push(vec.clone());
        currentPositions.push(vec.clone());

        pointsPosArray[i * 3] = vx;
        pointsPosArray[i * 3 + 1] = vy;
        pointsPosArray[i * 3 + 2] = vz;
    }
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(pointsPosArray, 3));

    const pointsMat = new THREE.PointsMaterial({
        color: PLEXUS_COLOR,
        size: 0.035,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });

    // Circular particles
    pointsMat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
            `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
            `
            if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
            gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            `
        );
    };

    const particleSphere = new THREE.Points(pointsGeo, pointsMat);
    spinGroup.add(particleSphere);

    // Dynamic Line Segments Cache
    const maxLines = (particleCount * (particleCount - 1)) / 2;
    const linesPosArray = new Float32Array(maxLines * 6);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linesPosArray, 3));

    const lineMat = new THREE.LineBasicMaterial({
        color: PLEXUS_COLOR,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
    });

    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    spinGroup.add(linesMesh);

    window.addEventListener('theme-changed', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const updatedColor = isLight ? PLEXUS_LIGHT : PLEXUS_DARK;
        pointsMat.color.setHex(updatedColor);
        lineMat.color.setHex(updatedColor);
    });

    // --- Part 3: Magnetic Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    // Invisible hit sphere for raycasting against the surface
    const hitGeo = new THREE.SphereGeometry(RADIUS, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    spinGroup.add(hitMesh);

    let globeMouseX = 0, globeMouseY = 0;
    let targetTiltX = 0, targetTiltY = 0;

    window.addEventListener('mousemove', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        // NDC relative to canvas
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        globeMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        globeMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -999;
        mouse.y = -999;
    });

    // --- Render Loop ---
    const clock = new THREE.Clock();

    function animateGlobe() {
        requestAnimationFrame(animateGlobe);
        const t = clock.getElapsedTime();

        // Very slow, continuous auto-rotation
        spinGroup.rotation.y = t * 0.08;

        // Raycast against the invisible hit sphere to find magnetic target
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(hitMesh);

        let target3DPos = null;
        if (intersects.length > 0) {
            target3DPos = intersects[0].point.clone();
            // Convert to local spinGroup coordinates so the magnetic point sticks to the mouse over the rotating sphere
            target3DPos.applyMatrix4(new THREE.Matrix4().copy(spinGroup.matrixWorld).invert());
        }

        // Compute Plexus Gravity and Distances
        const ptsPos = pointsGeo.attributes.position.array;
        const linesPos = lineGeo.attributes.position.array;
        let lineVertexIndex = 0;

        for (let i = 0; i < particleCount; i++) {
            const basePos = basePositions[i];
            const currentPos = currentPositions[i];

            const targetVec = basePos.clone();

            // Apply Magnetic Gravity Distortion
            if (target3DPos) {
                const distToMouse = basePos.distanceTo(target3DPos);
                if (distToMouse < 0.7) {
                    const pullFactor = (0.7 - distToMouse) * 0.5;
                    targetVec.lerp(target3DPos, pullFactor);
                }
            }

            // Lerp current position smoothly towards the target position
            currentPos.lerp(targetVec, 0.1);

            ptsPos[i * 3] = currentPos.x;
            ptsPos[i * 3 + 1] = currentPos.y;
            ptsPos[i * 3 + 2] = currentPos.z;

            // Optimized Distance Check for thin Lines
            for (let j = i + 1; j < particleCount; j++) {
                const p2 = currentPositions[j];
                const dx = currentPos.x - p2.x;
                const dy = currentPos.y - p2.y;
                const dz = currentPos.z - p2.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < 0.065) {
                    linesPos[lineVertexIndex++] = currentPos.x;
                    linesPos[lineVertexIndex++] = currentPos.y;
                    linesPos[lineVertexIndex++] = currentPos.z;

                    linesPos[lineVertexIndex++] = p2.x;
                    linesPos[lineVertexIndex++] = p2.y;
                    linesPos[lineVertexIndex++] = p2.z;
                }
            }
        }

        pointsGeo.attributes.position.needsUpdate = true;
        lineGeo.setDrawRange(0, lineVertexIndex / 3); // 3 elements per vertex
        lineGeo.attributes.position.needsUpdate = true;

        // Parallax mouse tilt lerp -> holographic weight
        targetTiltX += (globeMouseY * 0.15 - targetTiltX) * 0.04;
        targetTiltY += (globeMouseX * -0.15 - targetTiltY) * 0.04;

        tiltGroup.rotation.x = targetTiltX;
        tiltGroup.rotation.y = targetTiltY;

        renderer.render(scene, camera);
    }
    animateGlobe();
})();

/* ============================================================
   HOLOGRAPHIC TERMINAL HUD
   ============================================================ */
(function initHoloTerminal() {
    const terminal = document.getElementById('holo-terminal');
    const timeEl = document.getElementById('live-ist-time');
    if (!terminal || !timeEl) return;

    // Live clock (IST)
    setInterval(() => {
        const d = new Date();
        const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        timeEl.textContent = 'LOCAL TIME (IST): ' + d.toLocaleTimeString('en-US', options);
    }, 1000);

    // Parallax Tilt 3D mousemove
    terminal.addEventListener('mousemove', (e) => {
        const rect = terminal.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate rotation degrees (up to 15 deg max)
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        terminal.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    terminal.addEventListener('mouseleave', () => {
        terminal.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        terminal.style.transition = 'transform 0.5s ease';
    });

    terminal.addEventListener('mouseenter', () => {
        terminal.style.transition = 'none'; // Lock step mapping while inside
    });
})();


/* ============================================================
   MAGNETIC PULL + BINARY SCRAMBLE HOVER
   ============================================================ */
(function initFooterLinks() {
    const MAGNETIC_RADIUS = 80;   // px attraction zone
    const BINARY_CHARS = '01';
    const SCRAMBLE_FRAMES = 14;   // how many scrambled frames before resolving

    document.querySelectorAll('.scramble-link').forEach(link => {
        const originalText = link.textContent.trim();
        let scrambleTimer = null;
        let magnetRafId = null;
        let linkX = 0, linkY = 0;
        let targetLX = 0, targetLY = 0;

        // ── Magnetic Pull RAF ──
        function runMagnet() {
            linkX += (targetLX - linkX) * 0.12;
            linkY += (targetLY - linkY) * 0.12;
            link.style.transform = `translate(${linkX}px, ${linkY}px)`;

            if (Math.abs(linkX) > 0.05 || Math.abs(linkY) > 0.05) {
                magnetRafId = requestAnimationFrame(runMagnet);
            } else {
                link.style.transform = '';
                linkX = linkY = 0;
            }
        }

        window.addEventListener('mousemove', (e) => {
            const rect = link.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MAGNETIC_RADIUS) {
                const pull = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;
                targetLX = dx * pull * 0.35;
                targetLY = dy * pull * 0.35;
                cancelAnimationFrame(magnetRafId);
                runMagnet();
            } else {
                targetLX = 0;
                targetLY = 0;
            }
        });

        // ── Binary Scramble Hover ──
        link.addEventListener('mouseenter', () => {
            clearInterval(scrambleTimer);
            let frame = 0;
            scrambleTimer = setInterval(() => {
                if (frame >= SCRAMBLE_FRAMES) {
                    clearInterval(scrambleTimer);
                    link.textContent = originalText;
                    return;
                }
                // Resolve letters one-by-one from left as frames increase
                const resolvedCount = Math.floor(frame / SCRAMBLE_FRAMES * originalText.length);
                let scrambled = originalText.slice(0, resolvedCount);
                for (let i = resolvedCount; i < originalText.length; i++) {
                    scrambled += originalText[i] === ' '
                        ? ' '
                        : BINARY_CHARS[Math.floor(Math.random() * BINARY_CHARS.length)];
                }
                link.textContent = scrambled;
                frame++;
            }, 22); // ~300ms total (22ms × 14 frames)
        });

        link.addEventListener('mouseleave', () => {
            clearInterval(scrambleTimer);
            link.textContent = originalText;
            // Spring back
            targetLX = 0;
            targetLY = 0;
        });
    });
})();

/* ============================================================
   EDUCATION — Sticky Parallax Stack (GSAP ScrollTrigger)
   ============================================================

   Strategy
   ─────────
   Both cards share `position: sticky; top: 15vh;`.
   Card 2 has a negative margin-top (-70vh) so it begins life
   hidden below Card 1's bottom edge.

   As the user scrolls, Card 2 rises into view naturally
   (sticky CSS handles the sticking).

   We use a GSAP scrub tween so that as Card 2 fully overlaps
   Card 1 the latter is "pushed back" in 3D space:
     • scale(0.92)
     • blur(8px)
     • opacity → 0.4

   The trigger fires when Card 2's top edge hits 90% of the
   viewport, and the animation completes when Card 2's top
   reaches 15vh (fully covering Card 1).
   ============================================================ */
(function initEduStack() {
    const card1 = document.getElementById('edu-card-1');
    const card2 = document.getElementById('edu-card-2');
    const canvas = document.querySelector('.edu-scroll-canvas');

    if (!card1 || !card2 || !canvas) return;

    /* Give the scroll canvas a perspective so scale looks 3D */
    canvas.style.perspective = '1000px';

    /* ── Set initial state (card1 at rest, card2 not pushed) ── */
    gsap.set(card1, {
        scale: 1,
        filter: 'blur(0px)',
        opacity: 1,
        transformOrigin: 'center top'
    });

    /* ── The scrubbed push-back tween ─────────────────────── */
    gsap.to(card1, {
        scale: 0.92,
        filter: 'blur(8px)',
        opacity: 0.4,
        ease: 'none',           /* linear scrub feels most physical */
        scrollTrigger: {
            trigger: card2,
            start: 'top 100%',  /* card 2 just enters the viewport base  */
            end: 'top 15%',     /* card 2 reaches its sticky top: 15vh   */
            scrub: 1.2,
            pinSpacing: false,
            onEnter: () => card1.classList.add('edu-card--pushed'),
            onLeaveBack: () => {
                card1.classList.remove('edu-card--pushed');
                /* Ensure a clean spring-back on scroll up */
                gsap.to(card1, {
                    scale: 1,
                    filter: 'blur(0px)',
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
        }
    });

    /* ── Subtle card-2 entry translate (slides up from below) ─ */
    /* This reinforces the "second plate arriving" feeling.      */
    gsap.fromTo(card2,
        { y: 80, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            ease: 'power3.out',
            duration: 1,
            scrollTrigger: {
                trigger: card2,
                start: 'top 100%',
                end: 'top 70%',
                scrub: 1,
                pinSpacing: false,
                toggleActions: 'play none none reverse'
            }
        }
    );
})();

/* ============================================================
   MAGNETIC NAV BUTTONS & THEME TOGGLE
   ============================================================ */
(function initNavControls() {
    // 1. Magnetic Hover Logic
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    if (magneticBtns.length > 0) {
        magneticBtns.forEach(btn => {
            let neutralBounds;

            const updateBounds = () => {
                const currentTransition = btn.style.transition;
                const currentTransform = btn.style.transform;

                btn.style.transition = 'none';
                btn.style.transform = 'translate(0px, 0px)';

                neutralBounds = btn.getBoundingClientRect();

                setTimeout(() => {
                    btn.style.transition = currentTransition;
                    btn.style.transform = currentTransform;
                }, 0);
            };

            window.addEventListener('load', updateBounds);
            window.addEventListener('resize', updateBounds);
            setTimeout(updateBounds, 150); // Ensure initial bounds are caught after layout

            window.addEventListener('mousemove', (e) => {
                if (!neutralBounds) return;

                const cx = neutralBounds.left + neutralBounds.width / 2;
                const cy = neutralBounds.top + neutralBounds.height / 2;

                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) { // Hover radius
                    const pullX = dx * 0.4;
                    const pullY = dy * 0.4;
                    btn.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
                    btn.style.transform = `translate(${pullX}px, ${pullY}px)`;
                } else {
                    btn.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.1, 1)';
                    btn.style.transform = 'translate(0px, 0px)';
                }
            });
        });
    }

    // 2. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        const root = document.documentElement;

        themeToggleBtn.addEventListener('click', () => {
            if (root.getAttribute('data-theme') === 'light') {
                root.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                root.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
            window.dispatchEvent(new Event('theme-changed'));
        });

        // Ensure accurate state loaded
        if (localStorage.getItem('theme') !== 'dark') {
            root.setAttribute('data-theme', 'light');
        }
        window.dispatchEvent(new Event('theme-changed'));
    }

    // 3. Keep Original references for Overlay Actions
    const magneticMenuBtn = document.getElementById('magnetic-menu');
    if (!magneticMenuBtn) return;

    // Overlay Toggle Logic
    let isMenuOpen = false;
    const menuOverlay = document.getElementById('menu-overlay');
    const menuLinks = document.querySelectorAll('.menu-link');
    const menuBg = document.querySelector('.menu-hover-background');

    // Background Reveal Logic
    menuLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            const bgImage = link.getAttribute('data-menu-bg');

            if (bgImage && bgImage !== 'none') {
                // Pre-load or set the background image directly
                menuBg.style.backgroundImage = `url('${bgImage}')`;
                menuBg.style.opacity = 0.4; // Boosted so content is readable
            } else {
                menuBg.style.opacity = 0;
            }
        });

        link.addEventListener('mouseleave', () => {
            menuBg.style.opacity = 0;
        });

        // Navigation click logic
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (!target) return;

            // The Lock: prevent additional clicks safely
            menuOverlay.style.pointerEvents = 'none';

            // The Exit Stagger: slide options down rapidly
            gsap.to(menuLinks, {
                y: 100,
                opacity: 0,
                duration: 0.4,
                stagger: 0.05,
                ease: 'power2.in'
            });

            // The Warp Effect: scale down the main wrapper
            const mainWrapper = document.getElementById('main-wrapper');
            gsap.to(mainWrapper, {
                scale: 0.95,
                filter: 'blur(5px)',
                duration: 0.4,
                ease: 'power2.out'
            });

            // The Transit: Smoothly scroll to the target section
            gsap.to(window, {
                scrollTo: { y: target, autoKill: false },
                duration: 1.2,
                ease: 'power4.inOut',
                onComplete: () => {
                    // The Arrival: Restore the wrapper scale
                    gsap.to(mainWrapper, {
                        scale: 1,
                        filter: 'blur(0px)',
                        duration: 0.6,
                        ease: 'power2.out',
                        clearProps: 'transform,filter'
                    });

                    // The Menu Dismissal
                    magneticMenuBtn.innerText = '[ MENU ]';
                    isMenuOpen = false;

                    gsap.to(menuOverlay, {
                        opacity: 0,
                        duration: 0.6,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            // Prepare inner links for the next toggle
                            gsap.set(menuLinks, { y: 100, opacity: 0 });
                        }
                    });
                }
            });
        });
    });

    magneticMenuBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;

        if (isMenuOpen) {
            magneticMenuBtn.innerText = '[ CLOSE ]';

            // GSAP Sequence for opening
            gsap.to(menuOverlay, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.inOut',
                onStart: () => { if (menuOverlay) menuOverlay.style.pointerEvents = 'all'; }
            });

            gsap.fromTo(menuLinks,
                { y: 100, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.1,
                    ease: 'expo.out',
                    delay: 0.1
                }
            );

        } else {
            magneticMenuBtn.innerText = '[ MENU ]';

            // GSAP Sequence for closing
            gsap.to(menuLinks, {
                y: 100,
                opacity: 0,
                duration: 0.4,
                stagger: -0.05,
                ease: 'power2.in'
            });

            gsap.to(menuOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                delay: 0.2,
                onComplete: () => { if (menuOverlay) menuOverlay.style.pointerEvents = 'none'; }
            });
        }
    });

})();

// Debounced resize listener to recalculate GSAP math on mobile orientation/UI changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh(true);
    }, 250); // Waits for the browser UI to settle before recalculating
});

window.addEventListener('load', () => {
    if (window.innerWidth < 768) {
        setTimeout(() => ScrollTrigger.refresh(true), 500);
    }
});

/* ============================================================
   LIVE PRELOADER CLOCK
   ============================================================ */
(function initApexClock() {
    const dateEl = document.getElementById('apex-date');
    const timeEl = document.getElementById('apex-time');
    if (!dateEl || !timeEl) return;

    function updateClock() {
        const d = new Date();
        // Format: YYYY.MM.DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateEl.textContent = `${year}.${month}.${day}`;

        // Format: HH:MM:SS
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
})();
