import {
  Clock,
  sRGBEncoding,
  WebGLRenderer,
} from 'three';

class Renderer {
  constructor(dom) {
    this.clock = new Clock();
    this.clock.localStartTime = Date.now();
    this.fps = {
      count: 0,
      lastTick: this.clock.oldTime / 1000,
    };
    this.dom = dom;

    this.renderer = new WebGLRenderer({
      antialias: true,
      stencil: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputEncoding = sRGBEncoding;
    // this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setScissorTest(true);
    dom.renderer.appendChild(this.renderer.domElement);

    this.views = [];
    this.viewport = {};

    window.addEventListener('resize', this.onResize.bind(this), false);
    this.renderer.setAnimationLoop(this.onAnimationTick.bind(this));

    const mouse = this.mouse = { x: 0, y: 0, primary: false, secondary: false };
    dom.renderer.addEventListener('mousedown', ({ button }) => {
      button === 0 && (mouse.primary = true);
      button === 2 && (mouse.secondary = true);
    });
    document.addEventListener('mouseup', ({ button }) => {
      button === 0 && (mouse.primary = false);
      button === 2 && (mouse.secondary = false);
    });
    document.addEventListener('mousemove', ({ clientX, clientY }) => {
      mouse.x = (clientX - this.viewport.left) / this.viewport.width;
      mouse.y = (clientY - this.viewport.top) / this.viewport.height;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onAnimationTick() {
    const {
      clock,
      dom,
      fps,
      renderer,
      views,
    } = this;

    const animation = {
      delta: Math.min(clock.getDelta(), 1 / 30),
      time: clock.oldTime / 1000,
    };
    views.forEach((view) => {
      const { left, bottom, width, height } = view.viewport;
      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.setClearColor(view.background || 0);
      view.onAnimationTick && view.onAnimationTick(animation);
      renderer.render(view, view.camera);
    });

    fps.count += 1;
    if (animation.time >= fps.lastTick + 1) {
      renderer.fps = Math.round(fps.count / (animation.time - fps.lastTick));
      dom.fps.innerText = `${renderer.fps}fps`;
      fps.lastTick = animation.time;
      fps.count = 0;
    }
  }

  onResize() {
    const {
      dom,
      renderer,
      views,
    } = this;
    const viewport = this.viewport = dom.renderer.getBoundingClientRect();
    renderer.setSize(viewport.width, viewport.height);
    views.forEach((view) => {
      if (!view.viewport) {
        view.viewport = {};
      }
      view.viewport.left = Math.floor(viewport.width * view.screen.left);
      view.viewport.bottom = Math.floor(viewport.height * view.screen.bottom);
      view.viewport.width = Math.floor(viewport.width * view.screen.width);
      view.viewport.height = Math.floor(viewport.height * view.screen.height);
      if (view.camera.isPerspectiveCamera) {
        view.camera.aspect = view.viewport.width / view.viewport.height;
        view.camera.updateProjectionMatrix();
      }
      view.onResize && view.onResize();
    });
  }
}

export default Renderer;
