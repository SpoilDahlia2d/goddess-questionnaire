document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('questionnaire-form');
  const alertBanner = document.getElementById('alert-banner');
  const formContainer = document.getElementById('form-container');
  const successContainer = document.getElementById('success-container');
  const successId = document.getElementById('success-id');
  const successTime = document.getElementById('success-time');
  const throneLinkBtn = document.getElementById('throne-link-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Stages 1 to 9
  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4'),
    document.getElementById('step-5'),
    document.getElementById('step-6'),
    document.getElementById('step-7'),
    document.getElementById('step-8'),
    document.getElementById('step-9')
  ];

  const dots = [
    document.getElementById('dot-1'),
    document.getElementById('dot-2'),
    document.getElementById('dot-3'),
    document.getElementById('dot-4'),
    document.getElementById('dot-5'),
    document.getElementById('dot-6'),
    document.getElementById('dot-7'),
    document.getElementById('dot-8'),
    document.getElementById('dot-9')
  ];

  const stepLabel = document.getElementById('step-label');
  const stepPercentage = document.getElementById('step-percentage');
  const progressBarFill = document.getElementById('progress-bar-fill');

  const stageTitles = [
    'Stage 1 of 9: Devotee Identity',
    'Stage 2 of 9: Financial Surrender',
    'Stage 3 of 9: Obsession Profile',
    'Stage 4 of 9: Financial Confession',
    'Stage 5 of 9: Discipline & Tasks',
    'Stage 6 of 9: Worship Rituals',
    'Stage 7 of 9: Selfie Verification',
    'Stage 8 of 9: Penalties & Vows',
    'Stage 9 of 9: Devotion Covenant'
  ];

  // ---- Proof / Selfie Upload ----
  const proofFileInput = document.getElementById('proofFileInput');
  const proofPreviewContainer = document.getElementById('proof-preview-container');
  const proofPreviewImg = document.getElementById('proof-preview-img');
  const selfieStatusPending = document.getElementById('selfie-status-pending');
  const selfieBox = document.getElementById('selfie-box');
  let proofImageBase64 = null;

  if (proofFileInput) {
    proofFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 12 * 1024 * 1024) {
          showAlert('Image size exceeds 12MB. Please select a smaller photo.');
          proofFileInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1200;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Compressed JPEG ~300KB-600KB, guaranteed < 1.5MB for Vercel
            proofImageBase64 = canvas.toDataURL('image/jpeg', 0.82);
            proofPreviewImg.src = proofImageBase64;
            proofPreviewContainer.classList.remove('hidden');
            if (selfieStatusPending) selfieStatusPending.classList.add('hidden');
            selfieBox.classList.remove('border-gold-500/40', 'selfie-pulse', 'border-rose-500');
            selfieBox.classList.add('border-emerald-500');
            hideAlert();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        proofImageBase64 = null;
        proofPreviewContainer.classList.add('hidden');
        if (selfieStatusPending) selfieStatusPending.classList.remove('hidden');
        selfieBox.classList.remove('border-emerald-500');
        selfieBox.classList.add('border-gold-500/40', 'selfie-pulse');
      }
    });
  }

  // ---- Obsession Slider ----
  const obsessionSlider = document.getElementById('obsessionLevel');
  const obsessionLabel = document.getElementById('obsession-label');
  const obsessionLabels = [
    '',
    '😐 Barely Interested (1/10)',
    '🌱 Mildly Curious (2/10)',
    '👀 Drawn In (3/10)',
    '💭 Frequently Thinking About It (4/10)',
    '💸 Already Spending (5/10)',
    '🔥 Deeply Interested (6/10)',
    '🔥 Deeply Addicted (7/10)',
    '💀 Consumed (8/10)',
    '🧠 Brain Hijacked (9/10)',
    '💎 Totally Owned — No Control Left (10/10)'
  ];
  if (obsessionSlider && obsessionLabel) {
    obsessionSlider.addEventListener('input', () => {
      const val = parseInt(obsessionSlider.value, 10);
      obsessionLabel.textContent = obsessionLabels[val] || `Level ${val}/10`;
    });
  }

  // ---- Letter Counter ----
  const letterTextarea = document.getElementById('letter');
  const letterCounter = document.getElementById('letter-counter');
  if (letterTextarea && letterCounter) {
    letterTextarea.addEventListener('input', () => {
      const len = letterTextarea.value.length;
      letterCounter.textContent = `${len} characters`;
      letterCounter.className = `text-[10px] mt-1 text-right transition ${len >= 30 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`;
    });
  }

  // ---- Oath Live Check ----
  const oathInput = document.getElementById('oathRepeat');
  const oathStatus = document.getElementById('oath-status');
  const OATH_TEXT = "I surrender my wallet, my will, and my worth to Goddess Dahlia Star. I am Her property.";
  if (oathInput && oathStatus) {
    oathInput.addEventListener('input', () => {
      const typed = oathInput.value.trim();
      if (typed === OATH_TEXT) {
        oathStatus.textContent = '✓ Oath confirmed — you are sealed.';
        oathStatus.className = 'text-[10px] mt-1 text-emerald-400 font-bold';
        oathInput.classList.remove('input-error');
        oathInput.classList.add('border-emerald-500');
      } else if (OATH_TEXT.startsWith(typed) && typed.length > 0) {
        oathStatus.textContent = `Keep typing... (${typed.length}/${OATH_TEXT.length})`;
        oathStatus.className = 'text-[10px] mt-1 text-gold-400';
        oathInput.classList.remove('border-emerald-500', 'input-error');
      } else if (typed.length > 0) {
        oathStatus.textContent = '✗ Text does not match the oath. Must match character for character.';
        oathStatus.className = 'text-[10px] mt-1 text-rose-400';
        oathInput.classList.remove('border-emerald-500');
        oathInput.classList.add('input-error');
      } else {
        oathStatus.textContent = 'Oath not yet confirmed.';
        oathStatus.className = 'text-[10px] mt-1 text-slate-500';
        oathInput.classList.remove('border-emerald-500', 'input-error');
      }
    });
  }

  // Clear error styles on input
  document.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('input-error'));
    el.addEventListener('change', () => el.classList.remove('input-error'));
  });

  // ---- NAVIGATION & STRICT STAGE CONTROLS ----

  // Step 1 -> 2
  document.getElementById('btn-next-1').addEventListener('click', () => {
    const slaveName = document.getElementById('slaveName');
    const discordTag = document.getElementById('discordTag');
    const phone = document.getElementById('phoneWhatsapp');
    const age = document.getElementById('age');
    const occupation = document.getElementById('occupation');
    const country = document.getElementById('country');

    const sVal = slaveName.value.trim();
    const dVal = discordTag.value.trim();
    const pVal = phone.value.trim();
    const aVal = parseInt(age.value, 10);
    const oVal = occupation.value.trim();
    const cVal = country.value.trim();

    if (!sVal || sVal.length < 3 || !/[a-zA-Z]/.test(sVal)) {
      slaveName.classList.add('input-error');
      slaveName.focus();
      showAlert('Stage 1 Blocked: Enter a genuine devotee name / title (minimum 3 letters).');
      triggerShake();
      return;
    }
    if (!dVal || dVal.length < 3) {
      discordTag.classList.add('input-error');
      discordTag.focus();
      showAlert('Stage 1 Blocked: A valid Discord username is required for the Goddess to summon you.');
      triggerShake();
      return;
    }
    if (!pVal || pVal.length < 7 || !/\d/.test(pVal)) {
      phone.classList.add('input-error');
      phone.focus();
      showAlert('Stage 1 Blocked: A valid phone/WhatsApp number with country code is required.');
      triggerShake();
      return;
    }
    if (isNaN(aVal) || aVal < 18 || aVal > 99) {
      age.classList.add('input-error');
      age.focus();
      showAlert('Stage 1 Blocked: Access Denied. You must be at least 18 years of age.');
      triggerShake();
      return;
    }
    if (!oVal || oVal.length < 3) {
      occupation.classList.add('input-error');
      occupation.focus();
      showAlert('Stage 1 Blocked: State your genuine profession or source of income.');
      triggerShake();
      return;
    }
    if (!cVal || cVal.length < 2) {
      country.classList.add('input-error');
      country.focus();
      showAlert('Stage 1 Blocked: State your country of residence.');
      triggerShake();
      return;
    }

    goToStage(2);
  });

  // Step 2 -> 1 or 3
  document.getElementById('btn-prev-2').addEventListener('click', () => goToStage(1));
  document.getElementById('btn-next-2').addEventListener('click', () => {
    const budgetSelected = document.querySelector('input[name="monthlyBudget"]:checked');
    const savingsSacrifice = document.getElementById('savingsSacrifice');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethods"]:checked');

    if (!budgetSelected) {
      showAlert('Stage 2 Blocked: Select your dedicated monthly tribute tier.');
      triggerShake();
      return;
    }
    if (!savingsSacrifice.value) {
      savingsSacrifice.classList.add('input-error');
      showAlert('Stage 2 Blocked: Select your portion of income dedicated to Goddess Dahlia.');
      triggerShake();
      return;
    }
    if (paymentMethods.length === 0) {
      showAlert('Stage 2 Blocked: Select at least one available payment channel for tributes.');
      triggerShake();
      return;
    }

    goToStage(3);
  });

  // Step 3 -> 2 or 4
  document.getElementById('btn-prev-3').addEventListener('click', () => goToStage(2));
  document.getElementById('btn-next-3').addEventListener('click', () => {
    const devotionType = document.querySelector('input[name="devotionType"]:checked');
    const weaknesses = document.getElementById('weaknesses');
    const wVal = weaknesses.value.trim();
    const goddessEffect = document.querySelectorAll('input[name="goddessEffect"]:checked');

    if (!devotionType) {
      showAlert('Stage 3 Blocked: Select your preferred submission dynamic.');
      triggerShake();
      return;
    }
    if (!wVal || wVal.length < 15 || !isCoherentText(wVal, 15, 3)) {
      weaknesses.classList.add('input-error');
      weaknesses.focus();
      showAlert('Stage 3 Blocked: Detail your psychological weaknesses and triggers (minimum 15 characters, no gibberish).');
      triggerShake();
      return;
    }
    if (goddessEffect.length === 0) {
      showAlert('Stage 3 Blocked: Select at least one effect Goddess Dahlia triggers in you.');
      triggerShake();
      return;
    }

    goToStage(4);
  });

  // Step 4 -> 3 or 5
  document.getElementById('btn-prev-4').addEventListener('click', () => goToStage(3));
  document.getElementById('btn-next-4').addEventListener('click', () => {
    const totalSent = document.getElementById('totalSentPast');
    const milestone = document.getElementById('tributeMilestone');
    const confession = document.getElementById('financialConfession');
    const specialOccasions = document.getElementById('specialOccasions');
    const cVal = confession.value.trim();

    if (!totalSent.value) {
      totalSent.classList.add('input-error');
      showAlert('Stage 4 Blocked: Select your past findom tribute history.');
      triggerShake();
      return;
    }
    if (!milestone.value) {
      milestone.classList.add('input-error');
      showAlert('Stage 4 Blocked: Select your target lifetime milestone for the Throne.');
      triggerShake();
      return;
    }
    if (!cVal || cVal.length < 15 || !isCoherentText(cVal, 15, 3)) {
      confession.classList.add('input-error');
      confession.focus();
      showAlert('Stage 4 Blocked: You must make an authentic financial confession (min 15 characters).');
      triggerShake();
      return;
    }
    if (!specialOccasions.value) {
      specialOccasions.classList.add('input-error');
      showAlert('Stage 4 Blocked: Select celebratory tribute commitments.');
      triggerShake();
      return;
    }

    goToStage(5);
  });

  // Step 5 -> 4 or 6
  document.getElementById('btn-prev-5').addEventListener('click', () => goToStage(4));
  document.getElementById('btn-next-5').addEventListener('click', () => {
    const spendingApproval = document.getElementById('spendingApproval');
    const tributeFrequency = document.getElementById('tributeFrequency');
    const tasks = document.querySelectorAll('input[name="humiliationTasks"]:checked');

    if (!spendingApproval.value) {
      spendingApproval.classList.add('input-error');
      showAlert('Stage 5 Blocked: Select your personal spending oversight level.');
      triggerShake();
      return;
    }
    if (!tributeFrequency.value) {
      tributeFrequency.classList.add('input-error');
      showAlert('Stage 5 Blocked: Select your tribute frequency rhythm.');
      triggerShake();
      return;
    }
    if (tasks.length === 0) {
      showAlert('Stage 5 Blocked: Select at least one submission / humiliation task you agree to execute.');
      triggerShake();
      return;
    }

    goToStage(6);
  });

  // Step 6 -> 5 or 7
  document.getElementById('btn-prev-6').addEventListener('click', () => goToStage(5));
  document.getElementById('btn-next-6').addEventListener('click', () => {
    const worshipRitual = document.getElementById('worshipRitual');
    const checkIn = document.getElementById('checkInFrequency');
    const session = document.getElementById('sessionPreference');
    const dreamRitual = document.getElementById('dreamRitual');
    const dVal = dreamRitual.value.trim();

    if (!worshipRitual.value) {
      worshipRitual.classList.add('input-error');
      showAlert('Stage 6 Blocked: Select your worship ritual format.');
      triggerShake();
      return;
    }
    if (!checkIn.value) {
      checkIn.classList.add('input-error');
      showAlert('Stage 6 Blocked: Select check-in presence frequency.');
      triggerShake();
      return;
    }
    if (!session.value) {
      session.classList.add('input-error');
      showAlert('Stage 6 Blocked: Select session preference.');
      triggerShake();
      return;
    }
    if (!dVal || dVal.length < 20 || !isCoherentText(dVal, 20, 4)) {
      dreamRitual.classList.add('input-error');
      dreamRitual.focus();
      showAlert('Stage 6 Blocked: Describe your ultimate worship session in detail (minimum 20 characters).');
      triggerShake();
      return;
    }

    goToStage(7);
  });

  // Step 7 -> 6 or 8 (Selfie Verification)
  document.getElementById('btn-prev-7').addEventListener('click', () => goToStage(6));
  document.getElementById('btn-next-7').addEventListener('click', () => {
    const initialTributeStatus = document.getElementById('initialTributeStatus');
    if (!initialTributeStatus.value) {
      initialTributeStatus.classList.add('input-error');
      showAlert('Stage 7 Blocked: Select your initial tribute status.');
      triggerShake();
      return;
    }

    if (!proofImageBase64) {
      showAlert('📸 Stage 7 Blocked: You MUST upload your selfie verification photo holding the handwritten note. You cannot bypass this.');
      triggerShake();
      selfieBox.classList.remove('border-emerald-500');
      selfieBox.classList.add('border-rose-500');
      setTimeout(() => {
        if (!proofImageBase64) {
          selfieBox.classList.remove('border-rose-500');
          selfieBox.classList.add('border-gold-500/40');
        }
      }, 1800);
      return;
    }

    goToStage(8);
  });

  // Step 8 -> 7 or 9 (NEW Penalties & Vows)
  document.getElementById('btn-prev-8').addEventListener('click', () => goToStage(7));
  document.getElementById('btn-next-8').addEventListener('click', () => {
    const delayPenalty = document.getElementById('delayPenalty');
    const relapseProtocol = document.getElementById('relapseProtocol');
    const controlDepth = document.getElementById('financialControlDepth');
    const silenceRule = document.getElementById('silenceRule');
    const blacklistConsent = document.getElementById('blacklistConsent');

    if (!delayPenalty.value) {
      delayPenalty.classList.add('input-error');
      showAlert('Stage 8 Blocked: Select the late tribute / hesitation disciplinary penalty.');
      triggerShake();
      return;
    }
    if (!relapseProtocol.value) {
      relapseProtocol.classList.add('input-error');
      showAlert('Stage 8 Blocked: Select your doubt / sub-drop protocol.');
      triggerShake();
      return;
    }
    if (!controlDepth.value) {
      controlDepth.classList.add('input-error');
      showAlert('Stage 8 Blocked: Select your submission depth aspiration.');
      triggerShake();
      return;
    }
    if (!silenceRule.checked) {
      showAlert('Stage 8 Blocked: You must agree to the Code of Respect & Devotion.');
      triggerShake();
      return;
    }
    if (!blacklistConsent.checked) {
      showAlert('Stage 8 Blocked: You must acknowledge the Permanent Blacklist Clause.');
      triggerShake();
      return;
    }

    goToStage(9);
  });

  // Step 9 -> 8
  document.getElementById('btn-prev-9').addEventListener('click', () => goToStage(8));

  // Switch Stage
  function goToStage(num) {
    hideAlert();
    steps.forEach((s, idx) => {
      if (s) {
        if (idx === num - 1) s.classList.remove('hidden-step');
        else s.classList.add('hidden-step');
      }
    });

    const percent = Math.round((num / 9) * 100);
    stepLabel.textContent = stageTitles[num - 1];
    stepPercentage.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;

    dots.forEach((d, idx) => {
      if (d) {
        if (idx + 1 === num) d.className = 'text-gold-400 font-extrabold';
        else if (idx + 1 < num) d.className = 'text-emerald-400';
        else d.className = 'text-slate-500';
      }
    });

    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- FINAL SUBMIT (Stage 9) ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const letter = document.getElementById('letter');
    const oathInput = document.getElementById('oathRepeat');
    const consent = document.getElementById('consent');

    const lVal = letter.value.trim();
    const oVal = oathInput.value.trim();

    if (!lVal || lVal.length < 30 || !isCoherentText(lVal, 30, 5)) {
      letter.classList.add('input-error');
      letter.focus();
      showAlert('Stage 9 Blocked: Write a genuine letter of devotion (minimum 30 characters, real words).');
      triggerShake();
      return;
    }
    if (oVal !== OATH_TEXT) {
      oathInput.classList.add('input-error');
      oathInput.focus();
      showAlert('Stage 9 Blocked: Your oath must be typed word for word to seal your covenant.');
      triggerShake();
      return;
    }
    if (!consent.checked) {
      showAlert('Stage 9 Blocked: You must solemnly certify legal age (18+) and the non-refundable nature of all tributes.');
      triggerShake();
      return;
    }

    // Double check selfie
    if (!proofImageBase64) {
      showAlert('Fatal Error: Selfie verification is missing. Return to Stage 7 to upload.');
      goToStage(7);
      return;
    }

    const formData = new FormData(form);
    const data = {};

    const payList = [];
    document.querySelectorAll('input[name="paymentMethods"]:checked').forEach(cb => payList.push(cb.value));
    data.paymentMethods = payList;

    const effectList = [];
    document.querySelectorAll('input[name="goddessEffect"]:checked').forEach(cb => effectList.push(cb.value));
    data.goddessEffect = effectList;

    const taskList = [];
    document.querySelectorAll('input[name="humiliationTasks"]:checked').forEach(cb => taskList.push(cb.value));
    data.humiliationTasks = taskList;

    for (const [key, val] of formData.entries()) {
      if (!['paymentMethods', 'goddessEffect', 'humiliationTasks', 'proofFileInput'].includes(key)) {
        data[key] = typeof val === 'string' ? val.trim() : val;
      }
    }

    data.proofImage = proofImageBase64;
    data.silenceRule = document.getElementById('silenceRule').checked ? 'Acknowledged & Sworn' : 'No';
    data.blacklistConsent = document.getElementById('blacklistConsent').checked ? 'Agreed & Bound' : 'No';

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-black inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Delivering Protocol to the Throne...</span>
    `;

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Transmission to the Throne failed.');

      formContainer.classList.add('hidden');
      const stepper = document.querySelector('.mb-6.bg-onyx-800\\/90');
      if (stepper) stepper.classList.add('hidden');
      successContainer.classList.remove('hidden');
      successId.textContent = resData.id || 'N/A';
      successTime.textContent = new Date().toLocaleString('en-US');
      if (resData.throneUrl) throneLinkBtn.href = resData.throneUrl;
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      showAlert(err.message || 'Connection failure. Please retry.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    proofImageBase64 = null;
    if (proofPreviewContainer) proofPreviewContainer.classList.add('hidden');
    if (selfieStatusPending) selfieStatusPending.classList.remove('hidden');
    if (selfieBox) {
      selfieBox.classList.remove('border-emerald-500', 'border-rose-500');
      selfieBox.classList.add('border-gold-500/40', 'selfie-pulse');
    }
    if (obsessionLabel) obsessionLabel.textContent = '🔥 Deeply Addicted (7/10)';
    if (letterCounter) { letterCounter.textContent = '0 characters'; letterCounter.className = 'text-[10px] mt-1 text-right text-slate-500'; }
    if (oathStatus) { oathStatus.textContent = 'Oath not yet confirmed.'; oathStatus.className = 'text-[10px] mt-1 text-slate-500'; }
    hideAlert();
    successContainer.classList.add('hidden');
    const stepper = document.querySelector('.mb-6.bg-onyx-800\\/90');
    if (stepper) stepper.classList.remove('hidden');
    formContainer.classList.remove('hidden');
    goToStage(1);
  });

  // ---- Audio Autoplay ----
  const voiceAudio = document.getElementById('voice-audio');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioText = document.getElementById('audio-text');
  const soundIcon = document.getElementById('sound-icon');
  const audioAnimation = document.getElementById('audio-animation');
  let isPlayingAudio = false;

  function setAudioUI(playing) {
    isPlayingAudio = playing;
    if (playing) {
      audioText.textContent = 'Voice: ON';
      soundIcon.textContent = '🔊';
      audioAnimation.classList.remove('hidden');
      audioToggleBtn.classList.add('border-gold-400', 'bg-gold-500/20');
    } else {
      audioText.textContent = 'Voice: OFF';
      soundIcon.textContent = '🔇';
      audioAnimation.classList.add('hidden');
      audioToggleBtn.classList.remove('border-gold-400', 'bg-gold-500/20');
    }
  }

  function startVoiceAudio() {
    if (isPlayingAudio) return;
    voiceAudio.play().then(() => setAudioUI(true)).catch(() => {
      const unlock = () => {
        voiceAudio.play().then(() => setAudioUI(true)).catch(() => {});
        document.removeEventListener('pointerdown', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('pointerdown', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
    });
  }
  startVoiceAudio();

  audioToggleBtn.addEventListener('click', () => {
    if (!isPlayingAudio) {
      voiceAudio.play().then(() => setAudioUI(true)).catch(() => {});
    } else {
      voiceAudio.pause();
      setAudioUI(false);
    }
  });

  // ---- Video Background Crossfade ----
  const videoPlaylist = ['/assets/video1.mp4', '/assets/video2.mp4', '/assets/video3.mp4', '/assets/video4.mp4'];
  let currentVideoIndex = 0;
  let activeVideoEl = document.getElementById('bg-video-A');
  let standbyVideoEl = document.getElementById('bg-video-B');

  function initCrossfadeVideos() {
    activeVideoEl.src = videoPlaylist[currentVideoIndex];
    activeVideoEl.play().catch(() => {});

    function setupEndListener(videoEl) {
      videoEl.addEventListener('ended', () => {
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
        standbyVideoEl.src = videoPlaylist[currentVideoIndex];
        standbyVideoEl.load();
        standbyVideoEl.play().then(() => {
          standbyVideoEl.classList.remove('opacity-0');
          standbyVideoEl.classList.add('opacity-40');
          activeVideoEl.classList.remove('opacity-40');
          activeVideoEl.classList.add('opacity-0');
          const temp = activeVideoEl;
          activeVideoEl = standbyVideoEl;
          standbyVideoEl = temp;
        }).catch(err => {
          console.warn('Video crossfade error:', err);
          activeVideoEl.play().catch(() => {});
        });
      });
    }

    setupEndListener(activeVideoEl);
    setupEndListener(standbyVideoEl);
  }
  initCrossfadeVideos();

  // ---- Anti-Spam Coherence Check ----
  function isCoherentText(text, minLength = 15, minWords = 3) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (trimmed.length < minLength) return false;
    const words = trimmed.split(/\s+/).filter(w => w.length > 1);
    if (words.length < minWords) return false;
    if (/(.)\1{4,}/.test(trimmed)) return false;
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 15) {
      const vowels = trimmed.replace(/[^aeiouAEIOU]/g, '');
      const ratio = vowels.length / letters.length;
      if (ratio < 0.15 || ratio > 0.85) return false;
    }
    return true;
  }

  function triggerShake() {
    formContainer.classList.add('shake');
    setTimeout(() => formContainer.classList.remove('shake'), 400);
  }

  function showAlert(message, type = 'error') {
    alertBanner.textContent = message;
    alertBanner.classList.remove('hidden', 'bg-rose-950/90', 'text-rose-200', 'border-rose-700', 'bg-emerald-950/90', 'text-emerald-200', 'border-emerald-700');
    if (type === 'error') {
      alertBanner.classList.add('bg-rose-950/90', 'text-rose-200', 'border', 'border-rose-700');
    } else {
      alertBanner.classList.add('bg-emerald-950/90', 'text-emerald-200', 'border', 'border-emerald-700');
    }
    alertBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    alertBanner.classList.add('hidden');
  }
});
