const fs = require('fs');

let html = fs.readFileSync('verifier_dashboard.html', 'utf8');

// 1. We remove card-grid, empty-state, breadcrumb, and big header cards CSS.
// 2. We add generic tabs and notification lists CSS.
const newCss = `
        /* Notification List Styling */
        .tabs {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 8px;
        }

        .tab {
            padding: 8px 16px;
            font-weight: 600;
            cursor: pointer;
            color: var(--text-muted);
            border-radius: 6px;
            transition: all 0.2s;
        }

        .tab:hover {
            background: #f1f5f9;
        }

        .tab.active {
            color: var(--primary);
            background: #eef2ff;
        }

        .notification-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .notif-item {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            gap: 16px;
            align-items: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            transition: all 0.2s;
        }

        .notif-item:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 6px rgba(0,0,0,0.04);
        }

        .notif-photo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid var(--border);
            cursor: zoom-in;
        }

        .notif-content {
            flex: 1;
        }

        .notif-name {
            font-weight: 700;
            color: var(--text-main);
            font-size: 1.05rem;
            margin-bottom: 4px;
        }

        .notif-details {
            font-size: 0.85rem;
            color: var(--text-muted);
        }

        .notif-time {
            font-size: 0.75rem;
            color: #94a3b8;
            margin-top: 4px;
        }

        .notif-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .badge-status {
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .badge-approved { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .badge-pending { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }

        .btn-edit {
            background: #f1f5f9;
            color: var(--text-main);
            border: 1px solid var(--border);
        }
        .btn-edit:hover {
            background: #e2e8f0;
        }
`;

// Inject the CSS right before </style>
html = html.replace('</style>', newCss + '\n    </style>');

// 3. Remove "Back button"
html = html.replace(/<button onclick="goBack\(\)"[\s\S]*?<\/script>/, '');

// 4. Transform Header HTML
html = html.replace(
    /<div class="header-left">[\s\S]*?<\/div>\s*<div id="acceptAllContainer" style="display: none;">[\s\S]*?<\/div>/,
    `<div class="header-left">
                <h1 style="display: flex; align-items: center;">Approvals 
                    <span id="pending-count-badge" class="badge" style="display: none; background: #ef4444; color: white; border-radius: 999px; padding: 2px 10px; font-size: 1rem; margin-left: 12px; font-weight: 700;">0</span>
                </h1>
                <p>Manage pending, approved, and rejected requests.</p>
            </div>`
);

// 5. Transform Breadcrumb to Tabs
html = html.replace(
    /<div class="breadcrumb" id="breadcrumb" style="display: none;">[\s\S]*?<\/div>/,
    `<div class="tabs" id="viewTabs">
            <div class="tab active" onclick="switchTab('pending')">Pending</div>
            <div class="tab" onclick="switchTab('approved')">Approved</div>
            <div class="tab" onclick="switchTab('rejected')">Rejected</div>
        </div>`
);

// 6. Completely Rewrite the JS logic

const newScript = `
        // View State
        let allRequests = [];
        let currentTab = 'pending'; // 'pending', 'approved', 'rejected'

        async function updateNotificationBadge() {
            const pendingCount = allRequests.filter(r => r.status === 'pending').length;
            const badge = document.getElementById("pending-count-badge");
            if (!badge) return;

            if (pendingCount > 0) {
                badge.style.display = "inline-flex";
                badge.innerText = pendingCount;
            } else {
                badge.style.display = "none";
            }
        }

        window.addEventListener('load', async () => {
            const { data: { session } } = await sb.auth.getSession();
            if (!session) { window.location.replace('login.html'); return; }

            const role = await getUserRole(session.user);
            if (role !== 'verifier' && role !== 'admin') {
                window.location.replace('login.html'); return;
            }

            loadRequests();
        });

        async function logout() {
            await sb.auth.signOut();
            window.location.replace('login.html');
        }

        function switchTab(tabName) {
            currentTab = tabName;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.currentTarget.classList.add('active');
            renderUI();
        }

        function formatTime(isoString) {
            if (!isoString) return 'Just now';
            const d = new Date(isoString);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }

        async function loadRequests() {
            document.getElementById('loading').style.display = 'flex';
            
            // FETCH ALL REQUESTS (Not just pending)
            const { data, error } = await sb
                .from('student_requests')
                .select('*')
                .order('created_at', { ascending: false });

            document.getElementById('loading').style.display = 'none';

            if (error) {
                console.error("Fetch error:", error);
                document.getElementById('mainContent').innerHTML = \`<div class="empty-state">Failed to load requests: \${error.message}</div>\`;
                return;
            }

            allRequests = data || [];
            updateNotificationBadge();
            renderUI();
        }

        function renderUI() {
            const container = document.getElementById('mainContent');
            const filtered = allRequests.filter(r => r.status === currentTab);

            if (filtered.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <p>No \${currentTab} student requests.</p>
                    </div>\`;
                return;
            }

            let html = '<div class="notification-list">';
            
            filtered.forEach(req => {
                html += \`
                    <div class="notif-item" id="req-\${req.id}">
                        <img src="\${req.face_image_url || 'https://via.placeholder.com/50'}" alt="Face" class="notif-photo" onclick="window.open('\${req.face_image_url}', '_blank')">
                        <div class="notif-content">
                            <div class="notif-name">\${req.name} <span style="color:var(--text-muted); font-weight:500; font-size: 0.9em; margin-left: 6px;">\${req.roll_number}</span></div>
                            <div class="notif-details">\${req.year} Year • Sem \${req.semester} • Sec \${req.section} • \${req.branch}</div>
                            <div class="notif-time">\${formatTime(req.created_at)}</div>
                        </div>
                        <div class="notif-actions" id="actions-\${req.id}">
                            \${getActionsHtml(req)}
                        </div>
                    </div>
                \`;
            });

            html += '</div>';
            container.innerHTML = html;
        }

        function getActionsHtml(req) {
            if (req.status === 'pending') {
                return \`
                    <button class="btn btn-success" onclick="processRequest('\${req.id}', 'approved')" id="btn-acc-\${req.id}">Accept</button>
                    <button class="btn btn-danger" onclick="processRequest('\${req.id}', 'rejected')" id="btn-rej-\${req.id}">Reject</button>
                \`;
            } else if (req.status === 'approved') {
                return \`
                    <span class="badge-status badge-approved">Approved ✅</span>
                    <button class="btn btn-edit" onclick="editRequest('\${req.id}')">Edit</button>
                \`;
            } else {
                return \`
                    <span class="badge-status badge-rejected">Rejected ❌</span>
                    <button class="btn btn-edit" onclick="editRequest('\${req.id}')">Edit</button>
                \`;
            }
        }

        function editRequest(reqId) {
            const req = allRequests.find(r => r.id === reqId);
            if (!req) return;
            const actionsDiv = document.getElementById(\`actions-\${reqId}\`);
            if (actionsDiv) {
                // Temporarily show accept/reject buttons again without changing actual DB status yet
                actionsDiv.innerHTML = \`
                    <button class="btn btn-success" onclick="processRequest('\${req.id}', 'approved')" id="btn-acc-\${req.id}">Accept</button>
                    <button class="btn btn-danger" onclick="processRequest('\${req.id}', 'rejected')" id="btn-rej-\${req.id}">Reject</button>
                    <button class="btn btn-edit" style="padding: 10px 14px;" onclick="renderUI()">Cancel</button>
                \`;
            }
        }

        async function processRequest(reqId, newStatus) {
            const accBtn = document.getElementById(\`btn-acc-\${reqId}\`);
            const rejBtn = document.getElementById(\`btn-rej-\${reqId}\`);
            if (accBtn) { accBtn.disabled = true; if (newStatus === 'approved') accBtn.innerHTML = 'Processing...'; }
            if (rejBtn) { rejBtn.disabled = true; if (newStatus === 'rejected') rejBtn.innerHTML = 'Processing...'; }

            try {
                // Fetch full request
                const reqIndex = allRequests.findIndex(r => r.id === reqId);
                const student = allRequests[reqIndex];
                if (!student) throw Error("Request not found locally");

                // Fetch current user (verifier)
                const { data: { user } } = await sb.auth.getUser();

                let finalStudentId = student.uid || null;

                // STEP 1: If approved, insert/upsert into students table FIRST
                if (newStatus === 'approved') {
                    const { data: newStudent, error: insertError } = await sb
                        .from('students')
                        .upsert([{
                            uid: student.uid,
                            name: student.name,
                            roll_number: student.roll_number,
                            year: student.year,
                            semester: student.semester,
                            branch: student.branch,
                            section: student.section,
                            face_image_url: student.face_image_url
                        }], { onConflict: 'uid' })
                        .select()
                        .single();

                    if (insertError) {
                        alert("Upsert failed: " + insertError.message);
                        if (accBtn) { accBtn.disabled = false; accBtn.innerHTML = 'Accept'; }
                        if (rejBtn) { rejBtn.disabled = false; rejBtn.innerHTML = 'Reject'; }
                        return;
                    }

                    if (newStudent && newStudent.id) {
                        finalStudentId = newStudent.id;
                    }
                }

                // STEP 2: Insert into request_history
                const { error: histErr } = await sb.from('request_history').insert([{
                    request_id: student.id,
                    student_id: finalStudentId,
                    name: student.name,
                    roll_number: student.roll_number,
                    action: newStatus,
                    verified_by: user.email
                }]);
                if (histErr) throw histErr;

                // STEP 3: Update request (DO NOT DELETE)
                const { error: updErr } = await sb
                    .from('student_requests')
                    .update({ status: newStatus })
                    .eq('id', student.id);
                if (updErr) throw updErr;

                // Update local state
                allRequests[reqIndex].status = newStatus;
                
                // Re-render UI to move it to the correct tab automatically
                updateNotificationBadge();
                renderUI();

            } catch (e) {
                alert("Action failed: " + e.message);
                if (accBtn) { accBtn.disabled = false; accBtn.innerHTML = 'Accept'; }
                if (rejBtn) { rejBtn.disabled = false; rejBtn.innerHTML = 'Reject'; }
            }
        }
`;

html = html.replace(/<script>\s*\/\/ State Management[\s\S]*?<\/script>/, `<script>\n${newScript}\n</script>`);
fs.writeFileSync('verifier_dashboard.html', html);
console.log('UI Rewrite completed!');
