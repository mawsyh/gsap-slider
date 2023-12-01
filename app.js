var scene = new THREE.Scene();
scene.background = new THREE.Color("#080808");
let isDragging = false;
let xDirection = 1;
let xStart, xEnd;

gsap.set(".ew-cursor", { xPercent: -50, yPercent: 0 });

let xTo = gsap.quickTo(".ew-cursor", "x", { duration: 0.6, ease: "power3" }),
  yTo = gsap.quickTo(".ew-cursor", "y", { duration: 0.6, ease: "power3" });

document.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    isDragging = true;
    xStart = e.clientX;
  }
});

document.addEventListener("mousemove", (e) => {
  xTo(e.clientX);
  yTo(e.clientY);
  if (isDragging) onMouseDrag(e);
});

document.addEventListener("mouseup", (e) => {
  xEnd = e.clientX;
  const diff = xEnd - xStart;
  xDirection = diff !== 0 ? Math.sign(diff) : xDirection;
  isDragging = false;
});
let height =
  window.innerWidth > 1600
    ? window.innerWidth * 0.6
    : window.innerWidth > 1000
    ? window.innerWidth * 0.8
    : window.innerWidth > 650
    ? window.innerWidth * 1.2
    : 800;
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / height,
  1000,
  0.1
);
var mouseX;
var mouseY;

const globe = document.querySelector("#globe");

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, height);
globe.appendChild(renderer.domElement);

window.addEventListener("resize", function () {
  height =
    window.innerWidth > 1600
      ? window.innerWidth * 0.6
      : window.innerWidth > 1000
      ? window.innerWidth * 0.8
      : window.innerWidth > 650
      ? window.innerWidth * 1.2
      : 800;
  camera.aspect = window.innerWidth / height;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, height);
});

var distance = Math.min(200, 800 / 4);
var geometry = new THREE.Geometry();

for (var i = 0; i < 600; i++) {
  var vertex = new THREE.Vector3();
  var theta = Math.acos(THREE.Math.randFloatSpread(2));
  var phi = THREE.Math.randFloatSpread(360);

  vertex.x = distance * Math.sin(theta) * Math.cos(phi);
  vertex.y = distance * Math.sin(theta) * Math.sin(phi);
  vertex.z = distance * Math.cos(theta);

  geometry.vertices.push(vertex);
}

const size = 0.7;
gsap.to(size, { duration: 0.7, x: 1.2, y: 1.2 });
var particles = new THREE.Points(
  geometry,
  new THREE.PointsMaterial({ color: "white", size })
);
particles.boundingSphere = 50;

var renderingParent = new THREE.Group();
renderingParent.add(particles);

var resizeContainer = new THREE.Group();
resizeContainer.add(renderingParent);
scene.add(resizeContainer);

camera.position.z = 400;

var animate = function () {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};
var myTween;
function onMouseDrag(event) {
  if (myTween) myTween.kill();

  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  myTween = gsap.to(particles.rotation, {
    duration: 0.1,
    y: mouseX,
  });
  //particles.rotation.x = mouseY*-1;
  //particles.rotation.y = mouseX;
}
animate();

// Scaling animation
var animProps = { scale: 1, xRot: 0, yRot: 0 };

gsap.to(animProps, {
  duration: 120,
  yRot: 10,
  repeat: -1,
  yoyo: true,
  ease: "none",
  onUpdate: () => {
    renderingParent.rotation.set(0, xDirection * animProps.yRot, 0);
  },
});

// =================================================================

gsap.registerPlugin(Draggable);

let iteration = 0;
gsap.set(".cards li", { xPercent: 400, opacity: 0, scale: 0 });

const spacing = 0.2,
  snapTime = gsap.utils.snap(spacing),
  cards = gsap.utils.toArray(".cards li"),
  animateFunc = (element) => {
    const tl = gsap.timeline();
    tl.fromTo(
      element,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, zIndex: 100, duration: 0.15 }
    )
      .to(element, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
        immediateRender: false,
      })
      .fromTo(
        element,
        { scale: 1, opacity: 1 },
        { scale: 0, opacity: 0, zIndex: 0, duration: 0.15 }
      )
      .fromTo(
        element,
        { xPercent: 400 },
        { xPercent: -400, duration: 1, ease: "none", immediateRender: false },
        0
      );
    return tl;
  },
  seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc),
  playhead = { offset: 0 },
  wrapTime = gsap.utils.wrap(0, seamlessLoop.duration()),
  scrub = gsap.to(playhead, {
    offset: 0,
    onUpdate() {
      seamlessLoop.time(wrapTime(playhead.offset));
    },
    duration: 0.5,
    ease: "power3",
    paused: true,
  }),
  progressToScroll = (progress) =>
    gsap.utils.clamp(
      1,
      trigger.end - 1,
      gsap.utils.wrap(0, 1, progress) * trigger.end
    ),
  wrap = (iterationDelta, scrollTo) => {
    iteration += iterationDelta;
    trigger.scroll(scrollTo);
    trigger.update();
  };

function buildSeamlessLoop(items, spacing, animateFunc) {
  let rawSequence = gsap.timeline({ paused: true }),
    seamlessLoop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat() {
        this._time === this._dur && (this._tTime += this._dur - 0.01);
      },
      onReverseComplete() {
        this.totalTime(this.rawTime() + this.duration() * 100);
      },
    }),
    cycleDuration = spacing * items.length,
    dur;

  items
    .concat(items)
    .concat(items)
    .forEach((item, i) => {
      let anim = animateFunc(items[i % items.length]);
      rawSequence.add(anim, i * spacing);
      dur || (dur = anim.duration());
    });
  seamlessLoop.fromTo(
    rawSequence,
    {
      time: cycleDuration + dur / 2,
    },
    {
      time: "+=" + cycleDuration,
      duration: cycleDuration,
      ease: "none",
    }
  );
  return seamlessLoop;
}

Draggable.create(".drag-proxy", {
  type: "x",
  trigger: ".hero-wrapper",
  onPress() {
    this.startOffset = scrub.vars.offset;
  },
  cursor: "default",
  onDrag() {
    scrub.vars.offset = this.startOffset + (this.startX - this.x) * 0.0015;
    scrub.invalidate().restart();
  },
});

// ==============

document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".cards li");

  cards.forEach((card) => {
    // Generate a random value between 10% and 50% for the 'top' property
    const randomTop = Math.random() * (50 - 10) + 10;
    card.style.bottom = `${randomTop}%`;
  });
});

// ==============
