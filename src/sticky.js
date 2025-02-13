class Sticky {
  constructor(selector = '', options = {}) {
    this.selector = selector;
    this.elements = [];
    this.version = '1.3.0';
    this.vp = this.getViewportSize();
    this.body = document.body;

    this.options = Object.assign({
      wrap: false,
      wrapWith: '<span></span>',
      marginTop: 0,
      marginBottom: 0,
      stickyFor: 0,
      stickyClass: null,
      stickyContainer: 'body'
    }, options);

    this.updateScrollTopPosition = this.updateScrollTopPosition.bind(this);
    window.addEventListener('load', this.updateScrollTopPosition);
    window.addEventListener('scroll', this.updateScrollTopPosition);

    this.run();
  }

  run() {
    const pageLoaded = setInterval(() => {
      if (document.readyState === 'complete') {
        clearInterval(pageLoaded);
        document.querySelectorAll(this.selector).forEach(el => this.renderElement(el));
      }
    }, 10);
  }

  renderElement(element) {
    element.sticky = {
      active: false,
      marginTop: parseInt(element.dataset.marginTop) || this.options.marginTop,
      marginBottom: parseInt(element.dataset.marginBottom) || this.options.marginBottom,
      stickyFor: parseInt(element.dataset.stickyFor) || this.options.stickyFor,
      stickyClass: element.dataset.stickyClass || this.options.stickyClass,
      wrap: element.hasAttribute('data-sticky-wrap') || this.options.wrap,
      stickyContainer: this.options.stickyContainer,
      container: this.getStickyContainer(element)
    };

    element.sticky.container.rect = this.getRectangle(element.sticky.container);
    element.sticky.rect = this.getRectangle(element);
    if (element.tagName.toLowerCase() === 'img') {
      element.onload = () => element.sticky.rect = this.getRectangle(element);
    }
    if (element.sticky.wrap) this.wrapElement(element);
    this.activate(element);
  }

  wrapElement(element) {
    element.insertAdjacentHTML('beforebegin', element.dataset.stickyWrapWith || this.options.wrapWith);
    element.previousSibling.appendChild(element);
  }

  activate(element) {
    if (
      (element.sticky.rect.top + element.sticky.rect.height < element.sticky.container.rect.top + element.sticky.container.rect.height) &&
      (element.sticky.stickyFor < this.vp.width) &&
      !element.sticky.active
    ) {
      element.sticky.active = true;
    }
    if (!this.elements.includes(element)) this.elements.push(element);
    if (!element.sticky.resizeEvent) this.initResizeEvents(element);
    if (!element.sticky.scrollEvent) this.initScrollEvents(element);
    this.setPosition(element);
  }

  initResizeEvents(element) {
    element.sticky.resizeListener = () => this.onResizeEvents(element);
    window.addEventListener('resize', element.sticky.resizeListener);
  }

  destroyResizeEvents(element) {
    window.removeEventListener('resize', element.sticky.resizeListener);
  }

  onResizeEvents(element) {
    this.vp = this.getViewportSize();
    element.sticky.rect = this.getRectangle(element);
    element.sticky.container.rect = this.getRectangle(element.sticky.container);
    element.sticky.active =
      (element.sticky.rect.top + element.sticky.rect.height < element.sticky.container.rect.top + element.sticky.container.rect.height) &&
      (element.sticky.stickyFor < this.vp.width);
    this.setPosition(element);
  }

  initScrollEvents(element) {
    element.sticky.scrollListener = () => this.onScrollEvents(element);
    window.addEventListener('scroll', element.sticky.scrollListener);
  }

  destroyScrollEvents(element) {
    window.removeEventListener('scroll', element.sticky.scrollListener);
  }

  onScrollEvents(element) {
    if (element.sticky.active) this.setPosition(element);
  }

  setPosition(element) {
    this.css(element, { position: '', width: '', top: '', left: '' });
    if (!element.sticky.active || this.vp.height < element.sticky.rect.height) return;

    if (!element.sticky.rect.width) element.sticky.rect = this.getRectangle(element);
    if (element.sticky.wrap) {
      this.css(element.parentNode, {
        display: 'block',
        width: `${element.sticky.rect.width}px`,
        height: `${element.sticky.rect.height}px`
      });
    }

    if (this.scrollTop > element.sticky.rect.top - element.sticky.marginTop) {
      this.css(element, {
        position: 'fixed',
        width: `${element.sticky.rect.width}px`,
        left: `${element.sticky.rect.left}px`
      });
      const maxTop = element.sticky.container.rect.top + element.sticky.container.offsetHeight - this.scrollTop - element.sticky.rect.height - element.sticky.marginBottom;
      this.css(element, { top: maxTop > 0 ? `${element.sticky.marginTop}px` : `${maxTop}px` });
      element.sticky.stickyClass && element.classList.add(element.sticky.stickyClass);
    } else {
      element.sticky.stickyClass && element.classList.remove(element.sticky.stickyClass);
      this.css(element, { position: '', width: '', top: '', left: '' });
      if (element.sticky.wrap) this.css(element.parentNode, { display: '', width: '', height: '' });
    }
  }

  update() {
    this.elements.forEach(el => {
      el.sticky.rect = this.getRectangle(el);
      el.sticky.container.rect = this.getRectangle(el.sticky.container);
      this.activate(el);
      this.setPosition(el);
    });
  }

  destroy() {
    window.removeEventListener('load', this.updateScrollTopPosition);
    window.removeEventListener('scroll', this.updateScrollTopPosition);
    this.elements.forEach(el => {
      this.destroyResizeEvents(el);
      this.destroyScrollEvents(el);
      delete el.sticky;
    });
  }

  getStickyContainer(element) {
    let container = element.parentNode;
    while (!container.hasAttribute('data-sticky-container') && container !== this.body) {
      container = container.parentNode;
    }
    return container;
  }

  getRectangle(element) {
    const { offsetTop: top, offsetLeft: left, offsetWidth: width, offsetHeight: height } = element;
    return { top, left, width, height };
  }

  getViewportSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  updateScrollTopPosition() {
    this.scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  }

  css(element, properties) {
    Object.assign(element.style, properties);
  }
}

export default Sticky;
