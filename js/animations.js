const Animations = (() => {
    let enabled = true;

    function setEnabled(val) { enabled = val; }
    function isEnabled() { return enabled; }

    function movePiece(fromEl, toEl, callback) {
        if (!enabled || !fromEl || !toEl) { if (callback) callback(); return; }
        const img = fromEl.querySelector('.piece-img');
        if (!img) { if (callback) callback(); return; }

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const dx = toRect.left - fromRect.left;
        const dy = toRect.top - fromRect.top;

        // Smooth cubic-bezier easing for piece movement
        img.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        img.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
        img.style.zIndex = '100';

        setTimeout(() => {
            img.style.transform = '';
            img.style.transition = '';
            img.style.zIndex = '';
            if (callback) callback();
        }, 350);
    }

    function shakeSquare(el) {
        if (!enabled || !el) return;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 300);
    }

    function checkPulse(el) {
        if (!enabled || !el) return;
        el.classList.add('check-pulse');
        setTimeout(() => el.classList.remove('check-pulse'), 1500);
    }

    function captureEffect(el) {
        if (!enabled || !el) return;
        const img = el.querySelector('.piece-img');
        if (img) {
            img.style.transition = 'transform 150ms, opacity 150ms';
            img.style.transform = 'scale(0)';
            img.style.opacity = '0';
            setTimeout(() => {
                img.style.transition = '';
                img.style.transform = '';
                img.style.opacity = '';
            }, 150);
        }
    }

    function promotionSparkle(el) {
        if (!enabled || !el) return;
        el.classList.add('sparkle');
        setTimeout(() => el.classList.remove('sparkle'), 600);
    }

    function kingTipOver(el) {
        if (!enabled || !el) return;
        const img = el.querySelector('.piece-img');
        if (img) {
            img.style.transition = 'transform 800ms ease-in';
            img.style.transform = 'rotateZ(90deg)';
        }
    }

    function xpBarFill(el, percent) {
        if (!el) return;
        el.style.transition = 'width 600ms ease-out';
        el.style.width = percent + '%';
    }

    return { setEnabled, isEnabled, movePiece, shakeSquare, checkPulse, captureEffect, promotionSparkle, kingTipOver, xpBarFill };
})();
