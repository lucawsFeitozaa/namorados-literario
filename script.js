/**
 * Valentine's Day Letter - Clube Entre Livros e Café
 * Interactive script for writing, exporting, particle animations, and ambient music.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('hearts-canvas');
    const musicBtn = document.getElementById('music-toggle');
    const musicStatus = musicBtn.querySelector('.music-status');
    const downloadBtn = document.getElementById('download-letter-btn');
    const letterPaper = document.getElementById('letter-paper');
    const editableFields = document.querySelectorAll('.editable-field');
    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbZkgnfv6C8t3aYeoqkh7oPFddLCUu9xowKjqIapMBXFrxvSGYYjSsIOvGLHG52fLn/exec';

    // Helper to show custom premium toast messages
    function showToast(message, isError = false) {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        if (isError) {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }


    /* ==========================================================================
       1. Background Canvas Hearts Animation & Explosion Effect
       ========================================================================== */
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const hearts = [];
    const colors = ['#e8a5b8', '#a43a4d', '#8d2e3f', '#fcd7e1', '#c08497'];

    class Heart {
        constructor(x, y, size, speedX, speedY, opacity, drift) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.speedX = speedX;
            this.speedY = speedY;
            this.opacity = opacity;
            this.drift = drift;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.scale = 1;
            this.decay = 0;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            
            // Draw a standard heart path
            const topY = -this.size / 2;
            ctx.moveTo(0, this.size / 4);
            // Left curve
            ctx.bezierCurveTo(-this.size / 2, topY, -this.size, topY, -this.size, this.size / 4);
            ctx.bezierCurveTo(-this.size, this.size * 0.7, -this.size / 3, this.size * 1.1, 0, this.size * 1.4);
            // Right curve
            ctx.bezierCurveTo(this.size / 3, this.size * 1.1, this.size, this.size * 0.7, this.size, this.size / 4);
            ctx.bezierCurveTo(this.size, topY, this.size / 2, topY, 0, this.size / 4);
            
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.x += this.speedX + Math.sin(this.drift) * 0.4;
            this.y += this.speedY;
            this.drift += 0.02;

            if (this.decay > 0) {
                this.opacity -= this.decay;
                this.scale -= this.decay * 0.5;
            }

            // Wrap around or mark for deletion
            if (this.y < -30 && this.decay === 0) {
                this.y = height + 30;
                this.x = Math.random() * width;
            }
        }
    }

    // Populate initial background floating hearts
    const maxHearts = 35;
    for (let i = 0; i < maxHearts; i++) {
        hearts.push(new Heart(
            Math.random() * width,
            Math.random() * height,
            Math.random() * 12 + 6,
            (Math.random() - 0.5) * 0.4,
            -(Math.random() * 0.8 + 0.3),
            Math.random() * 0.5 + 0.2,
            Math.random() * 100
        ));
    }

    // Function to trigger a blast of hearts (e.g. when downloading)
    function createHeartExplosion(x, y) {
        const explosionCount = 45;
        for (let i = 0; i < explosionCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 7 + 3;
            const size = Math.random() * 14 + 8;
            const h = new Heart(
                x,
                y,
                size,
                Math.cos(angle) * velocity,
                Math.sin(angle) * velocity - 2, // Slight bias upwards
                1.0,
                Math.random() * 100
            );
            h.decay = Math.random() * 0.015 + 0.01; // Fade away decay
            hearts.push(h);
        }
    }

    // Canvas animation loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        for (let i = hearts.length - 1; i >= 0; i--) {
            hearts[i].update();
            hearts[i].draw();
            
            // Remove decayed hearts
            if (hearts[i].decay > 0 && hearts[i].opacity <= 0.01) {
                hearts.splice(i, 1);
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();


    /* ==========================================================================
       2. Web Audio API Ambient Synthesizer (Lofi Music Box)
       ========================================================================== */
    let audioCtx = null;
    let synthInterval = null;
    let noiseNode = null;
    let isPlaying = false;

    // A beautiful slow jazz / lofi chord progression
    // Cmaj7 (C3, E3, G3, B3) -> Amin7 (A2, E3, G3, C4) -> Fmaj7 (F2, C3, E3, A3) -> G7 (G2, D3, F3, B3)
    const chords = [
        [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3 (Cmaj7)
        [110.00, 164.81, 196.00, 261.63], // A2, E3, G3, C4 (Amin7)
        [87.31, 130.81, 164.81, 220.00],  // F2, C3, E3, A3 (Fmaj7)
        [98.00, 146.83, 174.61, 246.94]   // G2, D3, F3, B3 (G7)
    ];

    // High melody notes to randomly overlay (pentatonic scale for safety)
    const melodyNotes = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // E4, G4, A4, C5, D5, E5, G5

    function createVinylCrackle(ctx) {
        // Generate a 2-second buffer of filtered crackle and hiss
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // White noise base
            let noise = Math.random() * 2 - 1;
            
            // Add occasional pops/crackles (random impulse spikes)
            if (Math.random() > 0.9997) {
                noise += (Math.random() > 0.5 ? 0.8 : -0.8);
            }
            
            data[i] = noise;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Bandpass filter to make it sound vintage (muffled crackle/hiss)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        const gain = ctx.createGain();
        gain.gain.value = 0.008; // Very soft, in the background

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        return source;
    }

    function playPluck(frequency, time, duration = 1.5, volume = 0.15) {
        if (!audioCtx) return;

        // Create Nodes
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'triangle'; // Warm woodwind/rhodes sound
        osc.frequency.setValueAtTime(frequency, time);

        // Warm lofi low-pass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, time);
        filter.frequency.exponentialRampToValueAtTime(150, time + duration);

        // Amplitude Envelope (Slow pluck)
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(volume, time + 0.05); // Small attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration); // Smooth release

        // Delay feedback circuit for ambient spacer space
        const delay = audioCtx.createDelay(1.0);
        delay.delayTime.setValueAtTime(0.35, time);
        const delayGain = audioCtx.createGain();
        delayGain.gain.setValueAtTime(0.35, time); // Feedback volume

        // Connect synthesis graph
        osc.connect(filter);
        filter.connect(gainNode);
        
        // Connect to main out
        gainNode.connect(audioCtx.destination);

        // Feed into delay
        gainNode.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(delay); // Loop delay feedback
        delayGain.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + duration + 0.5);
    }

    function startAmbientSynth() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Play crackle
        noiseNode = createVinylCrackle(audioCtx);
        noiseNode.start(0);

        let beat = 0;
        let chordIndex = 0;

        // Scheduler loop
        const tempo = 120; // BPM
        const beatLength = 60 / tempo; // 0.5 seconds per beat

        function playLoop() {
            const now = audioCtx.currentTime;

            // Trigger base chord arpeggio at the start of each bar (every 8 beats)
            if (beat % 8 === 0) {
                chordIndex = (chordIndex + 1) % chords.length;
                const currentChord = chords[chordIndex];
                
                // Play bottom chord notes spread out
                playPluck(currentChord[0], now, 2.5, 0.06); // Root bass
                playPluck(currentChord[1], now + beatLength * 0.5, 2.0, 0.04);
                playPluck(currentChord[2], now + beatLength * 1.0, 1.8, 0.04);
                playPluck(currentChord[3], now + beatLength * 1.5, 1.8, 0.04);
            }

            // Randomly trigger soft high melody notes on odd beats
            if (beat % 2 === 1 && Math.random() > 0.4) {
                const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
                // Play with a slight random offset to sound human
                const humanize = (Math.random() - 0.5) * 0.05;
                playPluck(note, now + humanize, 1.2, 0.035);
            }

            beat++;
        }

        // Schedule first beats immediately
        playLoop();
        synthInterval = setInterval(playLoop, beatLength * 1000);
    }

    function stopAmbientSynth() {
        if (synthInterval) {
            clearInterval(synthInterval);
            synthInterval = null;
        }
        if (noiseNode) {
            try {
                noiseNode.stop();
            } catch(e) {}
            noiseNode = null;
        }
    }

    musicBtn.addEventListener('click', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (isPlaying) {
            stopAmbientSynth();
            musicBtn.classList.remove('playing');
            musicStatus.textContent = 'Lofi: OFF';
            isPlaying = false;
        } else {
            startAmbientSynth();
            musicBtn.classList.add('playing');
            musicStatus.textContent = 'Lofi: ON';
            isPlaying = true;
            
            // Small visual burst of hearts when starting music
            const rect = musicBtn.getBoundingClientRect();
            createHeartExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    });


    /* ==========================================================================
       3. Contenteditable Plain Text Paste Helper
       ========================================================================== */
    editableFields.forEach(field => {
        // Strip out styling and rich markup when copying and pasting text
        field.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Add character animation on keypress for a lovely micro-effect
        field.addEventListener('keypress', (e) => {
            if (e.key !== 'Enter') {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    // Spawn tiny heart occasionally near the typing cursor
                    if (Math.random() > 0.75 && rect.left > 0) {
                        createHeartExplosion(rect.left + window.scrollX, rect.top + window.scrollY - 10);
                    }
                }
            }
        });
    });


    /* ==========================================================================
       4. Image Exporting using html2canvas
       ========================================================================== */
    downloadBtn.addEventListener('click', () => {
        // Find click coordinate for explosion
        const btnRect = downloadBtn.getBoundingClientRect();
        createHeartExplosion(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);

        // UI feedback during export
        downloadBtn.disabled = true;
        downloadBtn.style.opacity = '0.7';
        downloadBtn.innerHTML = 'PREPARANDO PDF... <span class="btn-heart">⏳</span>';

        // Prepare letter content for export
        const recipient = letterPaper.querySelector('.recipient-field');
        const signature = letterPaper.querySelector('.signature-field');
        const bodyText = letterPaper.querySelector('.letter-text-editor');

        // Check if fields are empty, if so, fill them with decorative blanks
        // so they look beautiful and complete in the exported picture
        const originalRecVal = recipient.innerText.trim();
        const originalSigVal = signature.innerText.trim();
        const originalBodyVal = bodyText.innerText.trim();

        if (!originalRecVal) recipient.innerText = '_________________';
        if (!originalSigVal) signature.innerText = '_________________';
        if (!originalBodyVal) bodyText.innerText = 'Escrevi aqui a minha declaração de amor literária para você, inspirada nos livros que dividimos...';

        // Add class to force printing style if needed
        letterPaper.classList.add('export-mode');

        // Let the DOM update
        setTimeout(() => {
            html2canvas(letterPaper, {
                scale: 2, // High resolution download
                useCORS: true,
                backgroundColor: null, // Transparent background outside border
                logging: false,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    // Make sure custom styled scrollbars or focused states are clean in the clone
                    const clonedPaper = clonedDoc.getElementById('letter-paper');
                    clonedPaper.style.transform = 'none';
                    clonedPaper.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }
            }).then(canvas => {
                // Restore interactive fields to empty if they were filled
                if (!originalRecVal) recipient.innerHTML = '';
                if (!originalSigVal) signature.innerHTML = '';
                if (!originalBodyVal) bodyText.innerHTML = '';
                
                letterPaper.classList.remove('export-mode');

                // Generate PDF using jsPDF
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                // Get high quality JPEG from canvas
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                // Center and scale image inside A4 page
                const canvasRatio = canvas.height / canvas.width;
                const margin = 10;
                const targetWidth = pdfWidth - (margin * 2);
                let targetHeight = targetWidth * canvasRatio;
                let x = margin;
                let y = margin;
                
                if (targetHeight > (pdfHeight - (margin * 2))) {
                    const scaleFactor = (pdfHeight - (margin * 2)) / targetHeight;
                    const finalWidth = targetWidth * scaleFactor;
                    const finalHeight = targetHeight * scaleFactor;
                    x = margin + (targetWidth - finalWidth) / 2;
                    y = margin;
                    pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
                } else {
                    y = margin + (pdfHeight - (margin * 2) - targetHeight) / 2;
                    pdf.addImage(imgData, 'JPEG', x, y, targetWidth, targetHeight);
                }

                // Get PDF Base64 string for database transmission
                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                const dbDestinatario = originalRecVal || 'Ninguém';
                const dbAssinatura = originalSigVal || 'Anônimo';

                // Save PDF to Google Drive / Sheets
                downloadBtn.innerHTML = 'SALVANDO NO GOOGLE DRIVE... <span class="btn-heart">☁️</span>';
                
                fetch(GOOGLE_APP_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Bypasses CORS and successfully triggers doPost
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        destinatario: dbDestinatario,
                        assinatura: dbAssinatura,
                        pdfBase64: pdfBase64
                    })
                })
                .then(() => {
                    showToast('Sua cartinha foi salva no Google Drive com sucesso! ❤️');
                    proceedWithDownloadAndShare();
                })
                .catch(err => {
                    console.error('Erro ao salvar no banco de dados:', err);
                    showToast('Salvando cartinha localmente...', true);
                    proceedWithDownloadAndShare();
                });

                function proceedWithDownloadAndShare() {
                    // Download PDF locally
                    const pdfBlob = pdf.output('blob');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(pdfBlob);
                    const safeDest = dbDestinatario.replace(/[^a-zA-Z0-9]/g, "_");
                    downloadLink.download = `carta-dia-dos-namorados-${safeDest}.pdf`;
                    downloadLink.target = '_blank'; // Prevents tab unloading on iOS Safari
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);

                    // Helper to restore button state and trigger success effect
                    const completeExport = () => {
                        downloadBtn.disabled = false;
                        downloadBtn.style.opacity = '1';
                        downloadBtn.innerHTML = 'COMPARTILHAR MINHA CARTINHA <span class="btn-heart">❤️</span>';

                        // Success explosion!
                        setTimeout(() => {
                            createHeartExplosion(window.innerWidth / 2, window.innerHeight / 2);
                        }, 300);
                    };

                    // Check if sharing files is supported via Web Share API
                    if (navigator.canShare && typeof File !== 'undefined') {
                        try {
                            const file = new File([pdfBlob], `carta-dia-dos-namorados-${safeDest}.pdf`, { type: 'application/pdf' });
                            
                            if (navigator.canShare({ files: [file] })) {
                                navigator.share({
                                    files: [file],
                                    title: 'Minha Cartinha de Dia dos Namorados',
                                    text: 'Olha a cartinha de Dia dos Namorados que criei no Clube Entre Livros e Café! ❤️'
                                })
                                .then(() => {
                                    completeExport();
                                })
                                .catch((shareErr) => {
                                    if (shareErr.name === 'AbortError') {
                                        downloadBtn.disabled = false;
                                        downloadBtn.style.opacity = '1';
                                        downloadBtn.innerHTML = 'COMPARTILHAR MINHA CARTINHA <span class="btn-heart">❤️</span>';
                                    } else {
                                        console.error('Erro ao compartilhar via Web Share API:', shareErr);
                                        completeExport();
                                    }
                                });
                            } else {
                                completeExport();
                            }
                        } catch (err) {
                            console.error('Erro ao construir arquivo para compartilhamento:', err);
                            completeExport();
                        }
                    } else {
                        completeExport();
                    }
                }
            }).catch(err => {
                console.error('Erro ao gerar PDF:', err);
                
                // Revert changes on error
                if (!originalRecVal) recipient.innerHTML = '';
                if (!originalSigVal) signature.innerHTML = '';
                if (!originalBodyVal) bodyText.innerHTML = '';
                letterPaper.classList.remove('export-mode');

                downloadBtn.disabled = false;
                downloadBtn.style.opacity = '1';
                downloadBtn.innerHTML = 'TENTAR NOVAMENTE <span class="btn-heart">❤️</span>';
                showToast('Falha ao gerar o arquivo PDF.', true);
            });
        }, 300);
    });
});
