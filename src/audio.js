// Web Audio API Synthesizer & Web Speech API Voice Engine (TR & EN)
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastFootstep = 0;
    this.voices = [];
    this.lastSpokenKey = null;
    this.lastSpokenTime = 0;
    this.initSpeech();
  }

  initSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          this.voices = window.speechSynthesis.getVoices() || [];
        } catch (e) {}
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.enabled;
  }

  speakCountry(country, lang = 'tr') {
    if (!this.enabled || !country) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const countryId = country.id || country.name;
    const now = Date.now();
    // Rate limit repeating the exact same country speech within 700ms
    if (this.lastSpokenKey === `${countryId}_${lang}` && now - this.lastSpokenTime < 700) {
      return;
    }
    this.lastSpokenKey = `${countryId}_${lang}`;
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel();

      let textToSpeak = '';
      let targetLang = 'tr-TR';

      if (lang === 'tr') {
        textToSpeak = country.name_tr || country.name;
        targetLang = 'tr-TR';
      } else {
        // English expansions
        const nameExpansions = {
          'Bosnia and Herz.': 'Bosnia and Herzegovina',
          'Central African Rep.': 'Central African Republic',
          'Dem. Rep. Congo': 'Democratic Republic of the Congo',
          'Dominican Rep.': 'Dominican Republic',
          'Eq. Guinea': 'Equatorial Guinea',
          'Falkland Is.': 'Falkland Islands',
          'Fr. S. Antarctic Lands': 'French Southern and Antarctic Lands',
          'N. Cyprus': 'Northern Cyprus',
          'S. Sudan': 'South Sudan',
          'Solomon Is.': 'Solomon Islands',
          'W. Sahara': 'Western Sahara'
        };
        textToSpeak = nameExpansions[country.name] || country.name;
        targetLang = 'en-US';
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = targetLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      if (!this.voices || this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices() || [];
      }

      if (this.voices.length > 0) {
        if (lang === 'tr') {
          const trVoice =
            this.voices.find(
              (v) =>
                v.lang === 'tr-TR' ||
                v.lang === 'tr_TR' ||
                v.lang.startsWith('tr')
            );
          if (trVoice) {
            utterance.voice = trVoice;
          }
        } else {
          const enVoice =
            this.voices.find(
              (v) =>
                (v.lang === 'en-US' || v.lang === 'en-GB') &&
                (v.name.includes('Natural') ||
                  v.name.includes('Google') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Daniel') ||
                  v.name.includes('Jenny'))
            ) ||
            this.voices.find((v) => v.lang === 'en-US') ||
            this.voices.find((v) => v.lang.startsWith('en'));
          if (enVoice) {
            utterance.voice = enVoice;
          }
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  playFootstep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = Date.now();
    if (now - this.lastFootstep < 180) return;
    this.lastFootstep = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  playCountryChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  }

  playOceanBreeze() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(160, t + 0.5);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  playCelebration() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const chords = [
        [523.25, 659.25],
        [659.25, 783.99],
        [783.99, 1046.50],
        [1046.50, 1318.51]
      ];
      chords.forEach(([f1, f2], idx) => {
        const t = this.ctx.currentTime + idx * 0.12;
        [f1, f2].forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      });
    } catch (e) {}
  }
}

export const sounds = new SoundEffects();
