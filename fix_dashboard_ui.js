const fs = require('fs');
let html = fs.readFileSync('verifier_dashboard.html', 'utf8');

// Replace the old .notif-item and notification related CSS with the strict new flex layout rules
const cssStart = html.indexOf('/* Notification List Styling */');
const headEnd = html.indexOf('</style>');

if (cssStart !== -1 && headEnd !== -1) {
    const strictCSS = `/* Notification List Styling */
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

        /* STRICT CARD LAYOUT */
        .notif-item {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 12px;
            display: flex;
            flex-direction: row;        
            align-items: center;        
            justify-content: space-between; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            transition: all 0.2s;
            overflow: hidden;
        }

        .notif-item:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        }

        /* Fixed Profile Image */
        .notif-photo {
            flex-shrink: 0;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid var(--border);
            margin-right: 12px;
            cursor: zoom-in;
        }

        /* Center Section: Info */
        .notif-content {
            flex: 1;
            min-width: 0;           /* CRITICAL: Allows flex children to truncate text */
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .notif-name {
            font-weight: 700;
            color: var(--text-main);
            font-size: 1.05rem;
            margin-bottom: 2px;
            /* Truncate long names */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .notif-roll {
            color: var(--text-muted);
            font-weight: 500;
            font-size: 0.9em;
            margin-left: 6px;
        }

        .notif-details {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .notif-time {
            font-size: 0.75rem;
            color: #94a3b8;
        }

        /* Right Section: Status + Edit */
        .notif-actions {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;  /* Stack badge and edit vertically */
            align-items: flex-end;   /* Align them to the right wall */
            justify-content: center;
            gap: 8px;                /* strict gap between stacked items */
            margin-left: 12px;
        }

        /* Pending Action Row (Accept/Reject side by side) */
        .action-row-pending {
            display: flex;
            flex-direction: row;
            gap: 8px;
        }

        /* Clean Pill Status Badges */
        .badge-status {
            padding: 6px 12px;
            border-radius: 20px;     /* strict pill shape */
            font-size: 12px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;     /* NO text breaking */
        }

        .badge-approved { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge-rejected { background: #ffe5e5; color: #d32f2f; border: 1px solid #fecaca; }  
        .badge-pending { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }

        /* Small rounded edit button */
        .btn-edit {
            background: #f1f5f9;
            color: var(--text-main);
            border: 1px solid var(--border);
            padding: 6px 12px;       
            font-size: 12px;         
            border-radius: 20px;     
        }
        .btn-edit:hover {
            background: #e2e8f0;
        }

        /* Mobile Responsive Stack Fix */
        @media (max-width: 600px) {
            .notif-item {
                flex-direction: column;    /* Stack Image/Info on top of Actions */
                align-items: flex-start;
                padding: 16px;
            }
            
            .notif-photo-wrapper {
                display: flex;
                flex-direction: row;
                width: 100%;
                align-items: center;
                margin-bottom: 12px; /* space before actions */
            }

            .notif-photo {
                margin-right: 12px;
            }

            .notif-content {
                width: 100%; /* Take remaining space */
            }

            .notif-actions {
                width: 100%;
                flex-direction: row;     /* On mobile, lay actions out horizontally */
                align-items: center;
                justify-content: space-between; /* Spread status and edit apart */
                margin-left: 0;
            }
        }
    `;

    html = html.substring(0, cssStart) + strictCSS + '\n    ' + html.substring(headEnd);
}

// Ensure the HTML template string strictly uses the Mobile layout wrappers
html = html.replace(/<img src="\${req\.face_image_url.*onclick=".*">\s*<div class="notif-content">/g, 
    \`<div class="notif-photo-wrapper">
        <img src="\${req.face_image_url || 'https://via.placeholder.com/50'}" alt="Face" class="notif-photo" onclick="window.open('\${req.face_image_url}', '_blank')">
        <div class="notif-content">\`);

// Close the wrapper
html = html.replace(/<div class="notif-time">\${formatTime\(req\.created_at\)}<\/div>\s*<\/div>/g, 
    \`<div class="notif-time">\${formatTime(req.created_at)}</div>
        </div>
    </div>\`);

// Also update getActionsHtml to output the action-row-pending class
html = html.replace(
    /return `\s*<button class="btn btn-success".*?Accept<\/button>\s*<button class="btn btn-danger".*?Reject<\/button>\s*`;/,
    \`return \\\`
        <div class="action-row-pending">
            <button class="btn btn-success" onclick="processRequest('\${req.id}', 'approved')" id="btn-acc-\${req.id}">Accept</button>
            <button class="btn btn-danger" onclick="processRequest('\${req.id}', 'rejected')" id="btn-rej-\${req.id}">Reject</button>
        </div>
    \\\`;\`);

fs.writeFileSync('verifier_dashboard.html', html, 'utf8');
console.log('Successfully updated CSS hierarchy and HTML string rendering for verifier_dashboard.html');
