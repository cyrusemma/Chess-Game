const SoundEngine = (() => {
    let ctx = null;
    let enabled = true;
    let volume = 0.7;

    function getContext() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function setEnabled(val) { enabled = val; }
    function setVolume(val) { volume = Math.max(0, Math.min(1, val)); }
    function isEnabled() { return enabled; }
    function getVolume() { return volume; }

    function playNote(freq, duration, type = 'sine', gainVal = 0.3, delay = 0) {
        if (!enabled) return;
        const c = getContext();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainVal * volume, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration);
    }

    function playNoise(duration, gainVal = 0.2, delay = 0) {
        if (!enabled) return;
        const c = getContext();
        const bufferSize = c.sampleRate * duration;
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = c.createBufferSource();
        source.buffer = buffer;
        const gain = c.createGain();
        gain.gain.setValueAtTime(gainVal * volume, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
        source.connect(gain);
        gain.connect(c.destination);
        source.start(c.currentTime + delay);
    }

    function move() {
        playNote(150, 0.08, 'sine', 0.4);
        playNote(100, 0.06, 'sine', 0.2, 0.02);
    }

    function capture() {
        playNoise(0.08, 0.3);
        playNote(200, 0.1, 'square', 0.2, 0.02);
    }

    function check() {
        playNote(440, 0.15, 'square', 0.3);
        playNote(370, 0.2, 'square', 0.25, 0.12);
    }

    function castle() {
        playNote(150, 0.08, 'sine', 0.4);
        playNote(150, 0.08, 'sine', 0.4, 0.12);
    }

    function promotion() {
        playNote(523, 0.12, 'sine', 0.3);
        playNote(659, 0.12, 'sine', 0.3, 0.1);
        playNote(784, 0.15, 'sine', 0.3, 0.2);
    }

    function victory() {
        playNote(523, 0.2, 'sine', 0.3);
        playNote(659, 0.2, 'sine', 0.3, 0.15);
        playNote(784, 0.2, 'sine', 0.3, 0.3);
        playNote(1047, 0.4, 'sine', 0.35, 0.45);
    }

    function defeat() {
        playNote(392, 0.25, 'sine', 0.3);
        playNote(349, 0.25, 'sine', 0.3, 0.2);
        playNote(311, 0.35, 'sine', 0.25, 0.4);
    }

    function xp() {
        playNote(880, 0.08, 'sine', 0.2);
        playNote(1100, 0.12, 'sine', 0.15, 0.06);
    }

    function invalid() {
        playNote(200, 0.1, 'square', 0.15);
    }

    return { setEnabled, setVolume, isEnabled, getVolume, move, capture, check, castle, promotion, victory, defeat, xp, invalid };
})();
