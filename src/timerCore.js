const { EventEmitter } = require('events');

class TimerCore extends EventEmitter {
  constructor() {
    super();
    this.timeLeft = 0;
    this.totalTime = 0;
    this.isRunning = false;
    this._interval = null;
    this._targetTime = null; // ms timestamp when timer should hit 0
  }

  getState() {
    return {
      timeLeft: this.timeLeft,
      totalTime: this.totalTime,
      isRunning: this.isRunning,
    };
  }

  setTime(minutes, seconds = 0) {
    const m = Number.isFinite(Number(minutes)) ? Number(minutes) : parseInt(minutes, 10);
    const s = Number.isFinite(Number(seconds)) ? Number(seconds) : parseInt(seconds, 10);
    const safeMinutes = Math.max(0, Math.floor(Number.isFinite(m) ? m : 0));
    const safeSeconds = Math.max(0, Math.floor(Number.isFinite(s) ? s : 0));
    const total = Math.max(0, safeMinutes * 60 + safeSeconds);

    // Setting time should be authoritative: stop any running timer to avoid state divergence.
    this.isRunning = false;
    this._clearInterval();
    this._targetTime = null;
    this.totalTime = total;
    this.timeLeft = total;
    // Do not auto-start
    this._emitUpdate();
  }

  start() {
    if (this.isRunning) return;
    if (!Number.isFinite(this.timeLeft) || this.timeLeft <= 0) {
      this.timeLeft = Math.max(0, Number(this.timeLeft) || 0);
      this.totalTime = Math.max(this.totalTime || 0, this.timeLeft);
      this._emitUpdate();
      return;
    }
    this.isRunning = true;
    const now = Date.now();
    this._targetTime = now + this.timeLeft * 1000;
    this._clearInterval();
    try { console.log('[TimerCore] start: timeLeft=', this.timeLeft, 'target=', new Date(this._targetTime).toISOString()); } catch (_) {}
    this._interval = setInterval(() => this._tick(), 1000);
    // Immediate update for snappy UI
    this._emitUpdate();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this._clearInterval();
    // Recompute timeLeft based on target
    if (this._targetTime) {
      const now = Date.now();
      this.timeLeft = Math.max(0, Math.floor((this._targetTime - now) / 1000));
    }
    this._targetTime = null;
    try { console.log('[TimerCore] pause: timeLeft=', this.timeLeft); } catch (_) {}
    this._emitUpdate();
  }

  reset() {
    this.isRunning = false;
    this._clearInterval();
    this.timeLeft = this.totalTime;
    this._targetTime = null;
    try { console.log('[TimerCore] reset: totalTime=', this.totalTime); } catch (_) {}
    this._emitUpdate();
  }

  _tick() {
    if (!this.isRunning) return;
    if (!Number.isFinite(this._targetTime)) {
      // Defensive: invalid target time means we can't compute remaining.
      this.isRunning = false;
      this._clearInterval();
      this._targetTime = null;
      this._emitUpdate();
      return;
    }
    const now = Date.now();
    const remaining = Math.floor((this._targetTime - now) / 1000);
    this.timeLeft = Math.max(0, remaining);
    try { if (this.timeLeft % 10 === 0) console.log('[TimerCore] tick: timeLeft=', this.timeLeft); } catch (_) {}
    this._emitUpdate();
    if (this.timeLeft <= 0) {
      this.isRunning = false;
      this._clearInterval();
      this._targetTime = null;
      try { console.log('[TimerCore] complete'); } catch (_) {}
      this._emitComplete();
    }
  }

  _clearInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  _emitUpdate() {
    try {
      this.emit('update', this.getState());
    } catch (e) { /* ignore */ }
  }

  _emitComplete() {
    try {
      this.emit('complete', this.getState());
    } catch (e) { /* ignore */ }
  }
}

module.exports = TimerCore;
