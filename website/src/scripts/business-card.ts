import QRCode from 'qrcode';

class BusinessCardElement extends HTMLElement {
  connectedCallback() {
    const pull = this.querySelector<HTMLButtonElement>('.card-pull')!;
    const share = this.querySelector<HTMLButtonElement>('.card-share')!;
    const qr = this.querySelector<HTMLElement>('.card-qr')!;
    const status = this.querySelector<HTMLElement>('.card-status')!;
    const mobile = window.matchMedia('(max-width: 700px)');
    const url = this.dataset.url || new URL(location.pathname, location.origin).href;
    let open = false;
    let startX = 0;
    let startY = 0;
    let distance = 0;
    let tracking = false;
    let wheelDistance = 0;
    let wheelTime = 0;
    let suppressClickUntil = 0;

    const setOpen = (next: boolean) => {
      open = mobile.matches && next;
      this.dataset.mode = open ? 'share' : 'contact';
      qr.inert = !open;
      qr.setAttribute('aria-hidden', String(!open));
      pull.setAttribute('aria-expanded', String(open));
      pull.setAttribute('aria-label', open ? 'Hide QR code' : 'Show QR code');
      this.style.removeProperty('--pull-offset');
      delete this.dataset.dragging;
    };

    mobile.addEventListener('change', () => setOpen(false));

    Promise.all(Array.from(this.querySelectorAll('canvas')).map((canvas) => QRCode.toCanvas(canvas, url, {
      width: 360, margin: 3, errorCorrectionLevel: 'M',
      color: { dark: '#242938', light: '#ffffff' },
    }))).catch(() => {
      status.textContent = 'QR unavailable. You can still share the card link.';
      this.querySelectorAll('canvas').forEach((canvas) => { canvas.style.display = 'none'; });
    });

    pull.addEventListener('click', () => {
      if (Date.now() >= suppressClickUntil) setOpen(!open);
    });
    pull.addEventListener('pointerdown', (event) => {
      if (!mobile.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
      startY = event.clientY;
      distance = 0;
      pull.setPointerCapture(event.pointerId);
    });
    pull.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !pull.hasPointerCapture(event.pointerId)) return;
      distance = event.clientY - startY;
      if (!open && distance > 0) {
        this.dataset.dragging = '';
        this.style.setProperty('--pull-offset', `${Math.min(75, distance * .4)}px`);
      }
    });
    pull.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse' || !pull.hasPointerCapture(event.pointerId)) return;
      pull.releasePointerCapture(event.pointerId);
      if ((!open && distance > 65) || (open && distance < -65)) {
        suppressClickUntil = Date.now() + 400;
        setOpen(!open);
      } else {
        setOpen(open);
      }
    });
    pull.addEventListener('pointercancel', () => setOpen(open));
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && open) { setOpen(false); pull.focus(); }
    });
    share.addEventListener('click', async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title: `${this.dataset.name} — Business card`, url });
        } else {
          await navigator.clipboard.writeText(url);
          status.textContent = 'Link copied';
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        status.textContent = '';
        const link = document.createElement('a');
        link.href = url;
        link.textContent = url;
        status.append('Copy this link: ', link);
      }
    });

    // Only intercept vertical pulls at the top; normal scrolling remains available.
    this.addEventListener('touchstart', (event) => {
      tracking = mobile.matches && event.touches.length === 1 && window.scrollY <= 0 &&
        !(event.target as Element).closest('a, button:not(.card-pull)');
      if (!tracking) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      distance = 0;
    }, { passive: true });
    this.addEventListener('touchmove', (event) => {
      if (!tracking || event.touches.length !== 1) return;
      const dy = event.touches[0].clientY - startY;
      const dx = event.touches[0].clientX - startX;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { tracking = false; setOpen(open); return; }
      if ((!open && dy <= 0) || (open && dy >= 0)) return;
      if (event.cancelable) event.preventDefault();
      distance = dy;
      if (!open) {
        this.dataset.dragging = '';
        this.style.setProperty('--pull-offset', `${Math.min(75, dy * .4)}px`);
      }
    }, { passive: false });
    this.addEventListener('touchend', () => {
      if (!tracking) return;
      tracking = false;
      if (Math.abs(distance) > 8) suppressClickUntil = Date.now() + 400;
      const shouldOpen = !open && distance > 65;
      const shouldClose = open && distance < -65;
      setOpen(shouldOpen ? true : shouldClose ? false : open);
    });
    this.addEventListener('touchcancel', () => { tracking = false; setOpen(open); });
    this.addEventListener('wheel', (event) => {
      if (!mobile.matches || open || window.scrollY > 0 || event.deltaY >= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.cancelable) event.preventDefault();
      const now = Date.now();
      if (now - wheelTime > 250) wheelDistance = 0;
      wheelTime = now;
      wheelDistance += Math.abs(event.deltaY);
      if (wheelDistance > 80) { wheelDistance = 0; setOpen(true); }
    }, { passive: false });
  }
}

if (!customElements.get('business-card')) customElements.define('business-card', BusinessCardElement);
