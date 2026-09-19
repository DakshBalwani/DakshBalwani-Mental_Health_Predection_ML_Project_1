(() => {  'use strict';

  // ---------------------------------------------------
  // Config
  // ---------------------------------------------------
  const API_URL = 'http://127.0.0.1:8000/predict';

  const TOP_COUNTRIES = ['India', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France'];
  const PLATFORMS = ['Instagram', 'Facebook', 'Snapchat', 'TikTok', 'Twitter', 'YouTube', 'Whatsapp', 'LINE', 'LinkedIn', 'kakoaTalk', 'WeChat', 'VKontakte'];

  const TOTAL_STEPS = 4;

  // ---------------------------------------------------
  // Elements
  // ---------------------------------------------------
  const form = document.getElementById('predictForm');
  const formPanel = document.getElementById('formPanel');
  const resultPanel = document.getElementById('resultPanel');
  const formError = document.getElementById('formError');

  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const retryBtn = document.getElementById('retryBtn');

  const progressFill = document.getElementById('progressFill');
  const stepListItems = Array.from(document.querySelectorAll('.step'));
  const stepPanels = Array.from(document.querySelectorAll('.step-panel'));

  const countryList = document.getElementById('countryList');
  const platformSelect = document.getElementById('most_used_platform');

  const stressGroup = document.getElementById('stressGroup');
  const stressInput = document.getElementById('stress_level');

  let currentStep = 1;

  // ---------------------------------------------------
  // Populate dynamic option lists
  // ---------------------------------------------------
  TOP_COUNTRIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    countryList.appendChild(opt);
  });

  PLATFORMS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p === 'kakoaTalk' ? 'KakaoTalk' : p;
    platformSelect.appendChild(opt);
  });

  // ---------------------------------------------------
  // Sliders: live readout + fill track
  // ---------------------------------------------------
  const sliderConfigs = [
    { id: 'avg_daily_usage_hours', out: 'usageOut', suffix: 'h', max: 24 },
    { id: 'study_hours', out: 'studyOut', suffix: 'h', max: 24 },
    { id: 'physical_activity_hours', out: 'activityOut', suffix: 'h', max: 24 },
    { id: 'sleep_hours_per_night', out: 'sleepOut', suffix: 'h', max: 24 },
  ];

  sliderConfigs.forEach(cfg => {
    const input = document.getElementById(cfg.id);
    const out = document.getElementById(cfg.out);
    const update = () => {
      out.textContent = `${input.value}${cfg.suffix}`;
      const pct = (input.value / cfg.max) * 100;
      input.style.setProperty('--fill', `${pct}%`);
    };
    input.addEventListener('input', update);
    update();
  });

  // ---------------------------------------------------
  // Stress pill group
  // ---------------------------------------------------
  stressGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    stressGroup.querySelectorAll('.pill').forEach(p => p.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    stressInput.value = btn.dataset.value;
    clearFieldError('stress_level');
  });

  // ---------------------------------------------------
  // Step navigation
  // ---------------------------------------------------
  function goToStep(step) {
    currentStep = step;

    stepPanels.forEach(panel => {
      panel.classList.toggle('is-active', Number(panel.dataset.step) === step);
    });

    stepListItems.forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-active', n === step);
      li.classList.toggle('is-done', n < step);
    });

    progressFill.style.width = `${(step / TOTAL_STEPS) * 100}%`;

    backBtn.hidden = step === 1;
    nextBtn.hidden = step === TOTAL_STEPS;
    submitBtn.hidden = step !== TOTAL_STEPS;

    hideFormBanner();
    formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(step) {
    let valid = true;
    const panel = document.querySelector(`.step-panel[data-step="${step}"]`);

    panel.querySelectorAll('[required]').forEach(el => {
      const name = el.name || el.id;
      const value = el.value;
      if (!value || (el.tagName === 'SELECT' && value === '')) {
        setFieldError(name, 'This field is required.');
        valid = false;
      } else {
        clearFieldError(name);
      }
    });

    return valid;
  }

  nextBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
  });

  backBtn.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  // ---------------------------------------------------
  // Field error helpers
  // ---------------------------------------------------
  function setFieldError(name, message) {
    const errorEl = document.querySelector(`.field-error[data-for="${name}"]`);
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.closest('.field')?.classList.add('has-error');
  }

  function clearFieldError(name) {
    const errorEl = document.querySelector(`.field-error[data-for="${name}"]`);
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.closest('.field')?.classList.remove('has-error');
  }

  function clearAllFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.closest('.field')?.classList.remove('has-error');
    });
  }

  function showFormBanner(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function hideFormBanner() {
    formError.hidden = true;
    formError.textContent = '';
  }

  // Jump to whichever step contains the first invalid field
  function stepForField(name) {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return null;
    const panel = el.closest('.step-panel');
    return panel ? Number(panel.dataset.step) : null;
  }

  // ---------------------------------------------------
  // Build request payload matching the Pydantic schema
  // ---------------------------------------------------
  function buildPayload() {
    const fd = new FormData(form);
    return {
      age: parseInt(fd.get('age'), 10),
      gender: fd.get('gender'),
      country: fd.get('country').trim(),
      academic_level: fd.get('academic_level'),
      most_used_platform: fd.get('most_used_platform'),
      purpose_of_use: fd.get('purpose_of_use'),
      avg_daily_usage_hours: parseInt(fd.get('avg_daily_usage_hours'), 10),
      daily_unlocks: parseFloat(fd.get('daily_unlocks')),
      study_hours: parseFloat(fd.get('study_hours')),
      physical_activity_hours: parseFloat(fd.get('physical_activity_hours')),
      sleep_hours_per_night: parseFloat(fd.get('sleep_hours_per_night')),
      stress_level: fd.get('stress_level'),
    };
  }

  // ---------------------------------------------------
  // Submit
  // ---------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateStep(TOTAL_STEPS)) return;

    clearAllFieldErrors();
    hideFormBanner();

    setLoading(true);

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
    } catch (networkErr) {
    setLoading(false);

    console.error('Fetch error:', networkErr);

    showFormBanner(
        `Request failed: ${networkErr.message}`
    );

    return;
}

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    setLoading(false);

    if (response.ok && data) {
      showResult(data.predicted_mental_health_score);
      return;
    }

    if (response.status === 422 && data?.detail) {
      handleValidationErrors(data.detail);
      return;
    }

    showFormBanner(
      data?.detail
        ? `The server couldn't process this request: ${typeof data.detail === 'string' ? data.detail : 'please check your answers and try again.'}`
        : `Something went wrong (status ${response.status}). Please try again.`
    );
  });

  function handleValidationErrors(details) {
    let firstStep = null;

    details.forEach(err => {
      const field = err.loc?.[err.loc.length - 1];
      if (!field) return;
      setFieldError(field, humanizeError(err));
      const s = stepForField(field);
      if (s && (firstStep === null || s < firstStep)) firstStep = s;
    });

    showFormBanner('A few answers need a second look before we can predict your score.');
    if (firstStep) goToStep(firstStep);
  }

  function humanizeError(err) {
    const msg = err.msg || 'Invalid value.';
    return msg.replace(/^Value error, /, '');
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
  }

  // ---------------------------------------------------
  // Result rendering
  // ---------------------------------------------------
  const GAUGE_ARC_LENGTH = 282.7; // matches the SVG path length in index.html
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeScore = document.getElementById('gaugeScore');
  const resultTag = document.getElementById('resultTag');
  const resultHeading = document.getElementById('resultHeading');
  const resultBody = document.getElementById('resultBody');

  function showResult(rawScore) {
    const score = Number(rawScore);
    const clamped = Math.max(0, Math.min(10, score));

    formPanel.hidden = true;
    resultPanel.hidden = false;

    let band;
    if (clamped >= 7) {
      band = {
        color: 'var(--primary)',
        tag: 'Predicted wellbeing score',
        heading: 'You look to be in a good place',
        body: 'Your habits &mdash; sleep, study balance, activity, and stress &mdash; line up with patterns the model associates with stronger wellbeing. Keep an eye on what\u2019s working.',
      };
    } else if (clamped >= 4) {
      band = {
        color: 'var(--amber)',
        tag: 'Predicted wellbeing score',
        heading: 'Steady, with room to recover',
        body: 'A mix of factors &mdash; maybe screen time, sleep, or stress &mdash; are pulling your score down. Small, consistent changes to sleep or activity tend to move this the most.',
      };
    } else {
      band = {
        color: 'var(--brick)',
        tag: 'Predicted wellbeing score',
        heading: 'This score suggests you could use support',
        body: 'Your answers point to real strain. This isn\u2019t a diagnosis &mdash; but if things feel heavy, talking to someone you trust or a mental health professional is a good next step.',
      };
    }

    gaugeFill.style.stroke = band.color;
    resultTag.textContent = band.tag;
    resultHeading.textContent = band.heading;
    resultBody.innerHTML = band.body;

    // Animate the count-up + arc fill
    const offset = GAUGE_ARC_LENGTH - (clamped / 10) * GAUGE_ARC_LENGTH;
    requestAnimationFrame(() => {
      gaugeFill.style.strokeDashoffset = String(offset);
    });
    animateCount(gaugeScore, score);

    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function animateCount(el, target) {
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = target * eased;
      el.textContent = current.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------
  // Retry
  // ---------------------------------------------------
  retryBtn.addEventListener('click', () => {
    resultPanel.hidden = true;
    formPanel.hidden = false;
    gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH);
    goToStep(1);
  });

  // ---------------------------------------------------
  // Init
  // ---------------------------------------------------
  goToStep(1);
})();
