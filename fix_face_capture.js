const fs = require('fs');
let html = fs.readFileSync('face_capture.html', 'utf8');

const overlayHTML = `
    <!-- Camera Start Overlay -->
    <div id="startCameraOverlay" style="position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,15,36,0.9);backdrop-filter:blur(10px);">
        <svg viewBox="0 0 24 24" style="width:64px;height:64px;stroke:#4d7dff;fill:none;stroke-width:1.5;margin-bottom:20px;">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin-bottom:8px;">Camera Access</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;text-align:center;max-width:280px;margin-bottom:30px;">We need camera permission to capture your face for attendance.</p>
        <button onclick="requestCameraAccess()" style="background:linear-gradient(135deg, #1a4fdb, #4d7dff);border:none;border-radius:14px;padding:15px 32px;color:#fff;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 8px 24px rgba(26, 79, 219, 0.4);">
            Allow & Start Camera
        </button>
    </div>
`;

// Insert overlay just after <body>
if (!html.includes('startCameraOverlay')) {
    html = html.replace('<body>', '<body>\n' + overlayHTML);
}

// Replace the entire <script> block at the end
const scriptStart = html.lastIndexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');

if (scriptStart !== -1 && scriptEnd !== -1) {
    const newScript = `
        let stream = null;
        let facingMode = 'user';
        let capturedBlob = null;
        let currentUser = null;
        
        let faceModelsLoaded = false;
        let isTracking = false;
        let consecutiveFrames = 0;
        let trackingInterval = null;

        // ── Auth guard ──
        window.addEventListener('load', async () => {
            const { data: { session } } = await sb.auth.getSession();
            if (!session) { window.location.href = 'login.html'; return; }
            currentUser = session.user;

            try {
                // Initialize Face API models
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
                faceModelsLoaded = true;
            } catch (err) {
                console.warn("Face models could not be loaded", err);
                showToast("Failed to load AI models. Refresh page.", true);
            }
            
            // Show start camera overlay
            document.getElementById('startCameraOverlay').style.display = 'flex';
        });

        async function requestCameraAccess() {
            const btn = document.querySelector('#startCameraOverlay button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Starting...';
            btn.disabled = true;

            try {
                await startCamera();
                document.getElementById('startCameraOverlay').style.display = 'none';
                
                // Start continuous face tracking if models loaded
                if (faceModelsLoaded) {
                    startFaceTracking();
                }
            } catch (e) {
                console.error("Camera access denied:", e);
                alert("Camera access denied or unavailable. Please allow camera permissions in your browser settings.");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // ── Continuous Face Tracking ──
        async function startFaceTracking() {
            if (isTracking) return;
            isTracking = true;
            
            const video = document.getElementById('videoEl');
            const scanLine = document.querySelector('.scan-line');
            const ring = document.querySelector('.oval-ring');
            
            async function track() {
                if (!isTracking || video.paused || video.ended) {
                    trackingInterval = requestAnimationFrame(track);
                    return;
                }

                // Use TinyFaceDetector for fast performance tracking
                const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
                const detection = await faceapi.detectSingleFace(video, opts);

                if (detection && detection.score > 0.6) {
                    consecutiveFrames++;
                    // Turn ring green when highly confident
                    if (consecutiveFrames > 5) {
                        ring.style.stroke = 'rgba(18, 183, 106, 0.8)';
                        scanLine.style.background = 'linear-gradient(90deg, transparent, rgba(18, 183, 106, 0.85), transparent)';
                    }
                } else {
                    consecutiveFrames = 0;
                    ring.style.stroke = 'rgba(77, 125, 255, 0.75)';
                    scanLine.style.background = 'linear-gradient(90deg, transparent, rgba(77, 125, 255, 0.85), transparent)';
                }

                trackingInterval = requestAnimationFrame(track);
            }
            
            video.addEventListener('play', () => {
                track();
            });
            if (!video.paused) track();
        }

        function stopFaceTracking() {
            isTracking = false;
            if (trackingInterval) cancelAnimationFrame(trackingInterval);
        }

        // ── Face Validation & AI Score (On High-Res Image) ──
        async function validateFace(imageElement) {
            let score = 100;
            const detections = await faceapi.detectAllFaces(
                imageElement,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
            ).withFaceLandmarks().withFaceDescriptors();

            // RULE 1: No face
            if (detections.length === 0) {
                return { valid: false, message: "No clear face detected in photo. Please ensure good lighting." };
            }

            // RULE 2: Multiple faces
            if (detections.length > 1) {
                score = 0;
            }

            const detection = detections[0];
            const box = detection.detection.box;

            // Face size check (too small/unclear)
            if (box.width < 90 || box.height < 90) {
                score -= 30;
                if (box.width < 60) return { valid: false, message: "Face is too far away. Move closer." };
            }

            // RULE 4: Brightness check
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageElement.naturalWidth || 600;
            canvas.height = imageElement.naturalHeight || 800;
            ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

            const pixels = ctx.getImageData(0, 0, 100, 100).data;
            let brightness = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                brightness += pixels[i];
            }
            brightness = brightness / (pixels.length / 4);

            if (brightness < 40) {
                score -= 30;
                // Still keep a hard stop if it's completely black/unreadable
                if (brightness < 12) return { valid: false, message: "Image is too dark to read." };
            }

            const descriptor = Array.from(detection.descriptor);

            return { valid: true, score: score, descriptor: descriptor };
        }

        // ── Camera ──
        async function startCamera() {
            if (stream) stream.getTracks().forEach(t => t.stop());
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            document.getElementById('videoEl').srcObject = stream;
        }

        // ── Capture (compress to max 600px wide, JPEG 0.82) ──
        function capturePhoto() {
            if (consecutiveFrames < 3 && faceModelsLoaded) {
                showToast("Please keep still until face is detected.", true);
                return; // DO NOT block completely for safety, but discourage random shooting
            }

            const video = document.getElementById('videoEl');
            const canvas = document.getElementById('canvasEl');
            const maxW = 600;
            const scale = Math.min(1, maxW / (video.videoWidth || 600));
            const w = Math.round((video.videoWidth || 600) * scale);
            const h = Math.round((video.videoHeight || 800) * scale);
            
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            
            if (facingMode === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
            ctx.drawImage(video, 0, 0, w, h);

            // Store as blob for upload
            canvas.toBlob(blob => {
                capturedBlob = blob;
                const url = URL.createObjectURL(blob);
                document.getElementById('thumbImg').src = url;
                document.getElementById('capturedOverlay').classList.add('show');
                stopFaceTracking(); // Pause tracking while reviewing
                // Stop camera to save battery
                if (stream) stream.getTracks().forEach(t => t.stop());
            }, 'image/jpeg', 0.82);

            const btn = document.getElementById('captureBtn');
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => { btn.style.transform = ''; }, 180);
        }

        // ── Retake ──
        async function retakePhoto() {
            document.getElementById('capturedOverlay').classList.remove('show');
            capturedBlob = null;
            // Restart camera and tracking
            await startCamera();
            startFaceTracking();
        }

        // ── Save confirmed photo ──
        async function confirmPhoto() {
            if (!capturedBlob || !currentUser) return;
            const btn = document.querySelector('.btn-confirm');
            const originalHTML = btn.innerHTML;
            
            btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spinRing 0.8s linear infinite;"></div> Saving...';
            btn.disabled = true;
            document.querySelector('.btn-retake').disabled = true;

            try {
                // Validation before upload
                const imgElement = document.getElementById('thumbImg');
                const result = await validateFace(imgElement);
                if (!result.valid) {
                    showToast(result.message, true);
                    throw new Error("Validation Failed: " + result.message);
                }

                // Upload to storage
                const fileName = \`\${currentUser.id}/\${Date.now()}.jpg\`;
                const { error: upErr } = await sb.storage
                    .from('student-faces')
                    .upload(fileName, capturedBlob, { contentType: 'image/jpeg' });

                if (upErr) throw upErr;

                // get public url
                const { data: { publicUrl } } = sb.storage.from('student-faces').getPublicUrl(fileName);

                // Determine Registration State
                const finalStatus = result.score < 50 ? 'rejected' : 'pending';

                // Update database: student_requests status -> pending with image url and AI metadata
                const { error: dbErr } = await sb
                    .from('student_requests')
                    .update({
                        face_image_url: publicUrl,
                        status: finalStatus
                    })
                    .eq('uid', currentUser.id);

                if (dbErr) throw dbErr;

                if (finalStatus === 'rejected') {
                    showToast(\`AI Auto-Rejected ❌ (Score: \${result.score}/100)\`, true);
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                    document.querySelector('.btn-retake').disabled = false;
                    return;
                }

                showToast("Face saved successfully!");
                setTimeout(() => {
                    // Redirect to pending approval
                    window.location.href = 'pending_approval.html';
                }, 1200);

            } catch (e) {
                console.error(e);
                // Do not use confusing alert for validation errors, toast is enough
                if (!e.message.includes("Validation Failed")) {
                    alert("System Error: " + e.message);
                }
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                document.querySelector('.btn-retake').disabled = false;
            }
        }

        // ── Switch camera ──
        async function switchCamera() {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            const btn = document.getElementById('switchBtn');
            btn.style.transform = 'rotate(180deg)';
            btn.style.transition = 'transform 0.4s ease';
            await startCamera();
            setTimeout(() => { btn.style.transform = 'rotate(0deg)'; }, 450);
        }

        // ── Flash toggle ──
        let flashOn = false;
        function toggleFlash() {
            flashOn = !flashOn;
            const btn = document.getElementById('flashBtn');
            btn.style.background = flashOn ? 'rgba(255,220,80,0.25)' : 'rgba(10,16,38,0.55)';
            btn.querySelector('svg').style.stroke = flashOn ? '#ffd050' : '#fff';
            if (stream) {
                const track = stream.getVideoTracks()[0];
                if (track?.getCapabilities?.().torch) {
                    track.applyConstraints({ advanced: [{ torch: flashOn }] });
                }
            }
        }

        // ── Toast ──
        function showToast(msg, isErr = false) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.style.color = isErr ? '#e53e5a' : '#12b76a';
            t.style.background = isErr ? 'rgba(229,62,90,0.15)' : 'rgba(18,183,106,0.15)';
            t.style.borderColor = isErr ? 'rgba(229,62,90,0.4)' : 'rgba(18,183,106,0.4)';
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2800);
        }
    `;

    html = html.substring(0, scriptStart) + '<script>' + newScript + '\n    </script>\n' + html.substring(scriptEnd + 9);
    fs.writeFileSync('face_capture.html', html, 'utf8');
    console.log('Successfully updated face_capture.html');
} else {
    console.log('Error: Could not find <script> tags boundary.');
}
