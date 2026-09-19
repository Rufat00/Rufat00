import QRCode from 'qrcode';

class BusinessCardElement extends HTMLElement {
  connectedCallback() {
    const pull = this.querySelector<HTMLButtonElement>('.card-pull')!;
    const share = this.querySelector<HTMLButtonElement>('.card-share')!;
    const qr = this.querySelector<HTMLElement>('.card-qr')!;
    const sheet = this.querySelector<HTMLElement>('.contact-sheet')!;
    const qrInner = this.querySelector<HTMLElement>('.card-qr__inner')!;
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
    let mouseTarget: HTMLElement = pull;

    const reveal = (progress: number) => {
      const amount = Math.max(0, Math.min(1, progress));
      this.style.setProperty('--qr-height', `${qrInner.scrollHeight * amount}px`);
      this.style.setProperty('--qr-opacity', String(amount));
      this.style.setProperty('--sheet-scale', String(1 - amount * .04));
    };
    const drag = (dy: number) => {
      this.dataset.dragging = '';
      reveal((open ? 1 : 0) + dy / Math.max(1, qrInner.scrollHeight));
    };

    const setOpen = (next: boolean) => {
      open = mobile.matches && next;
      this.dataset.mode = open ? 'share' : 'contact';
      qr.inert = !open;
      qr.setAttribute('aria-hidden', String(!open));
      pull.setAttribute('aria-expanded', String(open));
      pull.setAttribute('aria-label', open ? 'Hide QR code' : 'Show QR code');
      delete this.dataset.dragging;
      reveal(open ? 1 : 0);
    };

    mobile.addEventListener('change', () => setOpen(false));
    window.addEventListener('resize', () => reveal(open ? 1 : 0));

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
    this.addEventListener('pointerdown', (event) => {
      if (!mobile.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
      if (!(event.target as Element).closest('.card-pull') &&
        (!open || (event.target as Element).closest('a, button'))) return;
      event.preventDefault();
      startY = event.clientY;
      distance = 0;
      mouseTarget = (event.target as Element).closest('.card-pull') ? pull : this;
      mouseTarget.setPointerCapture(event.pointerId);
    });
    this.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !mouseTarget.hasPointerCapture(event.pointerId)) return;
      distance = event.clientY - startY;
      drag(distance);
    });
    this.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse' || !mouseTarget.hasPointerCapture(event.pointerId)) return;
      mouseTarget.releasePointerCapture(event.pointerId);
      if (Math.abs(distance) > 8) suppressClickUntil = Date.now() + 400;
      if ((!open && distance > 65) || (open && distance < -65)) {
        suppressClickUntil = Date.now() + 400;
        setOpen(!open);
      } else {
        setOpen(open);
      }
    });
    this.addEventListener('pointercancel', () => setOpen(open));
    this.addEventListener('click', (event) => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true });
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

    // Expanded cards use upward drags to close; the normal view can scroll.
    this.addEventListener('touchstart', (event) => {
      tracking = mobile.matches && event.touches.length === 1 &&
        (open || (sheet.scrollTop <= 0 &&
          !(event.target as Element).closest('a, button:not(.card-pull)')));
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
      if ((!open && dy <= 0) || (open && dy >= 0)) {
        distance = 0;
        if (this.hasAttribute('data-dragging')) drag(0);
        return;
      }
      if (event.cancelable) event.preventDefault();
      distance = dy;
      drag(dy);
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
      if (!mobile.matches || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (!open && (sheet.scrollTop > 0 || event.deltaY >= 0)) return;
      if (event.cancelable) event.preventDefault();
      if (open && event.deltaY <= 0) return;
      const now = Date.now();
      if (now - wheelTime > 250) wheelDistance = 0;
      wheelTime = now;
      wheelDistance += Math.abs(event.deltaY);
      if (wheelDistance > 80) { wheelDistance = 0; setOpen(!open); }
    }, { passive: false });
  }
}

if (!customElements.get('business-card')) customElements.define('business-card', BusinessCardElement);
