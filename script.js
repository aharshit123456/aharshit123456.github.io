document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabContainer = document.querySelector('.tab-bar');
    const contentContainer = document.querySelector('.content-container');
    const themeToggle = document.querySelector('.theme-toggle');
    const hobbyLinks = document.querySelectorAll('.hobby-link');

    // State
    let tabs = [{ id: 'main', title: 'harshit_agarwal.dev' }];
    let activeTabId = 'main';

    // Theme Logic
    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };

    themeToggle.addEventListener('click', toggleTheme);

    // Tab Logic
    window.openTab = (id, title, content) => {
        // Check if tab exists within the current state array to avoid duplicates if logical, 
        // but for now we allow multiple tabs or focus existing.
        const existingTab = tabs.find(t => t.id === id);

        if (existingTab) {
            switchTab(id);
            return;
        }

        const newTab = { id, title };
        tabs.push(newTab);

        // Create Tab Element
        const tabEl = document.createElement('div');
        tabEl.className = 'tab active';
        tabEl.dataset.id = id;
        tabEl.innerHTML = `
            <span class="tab-title">${title}</span>
            <span class="tab-close" onclick="closeTab(event, '${id}')"><i class="fas fa-times"></i></span>
        `;
        tabEl.onclick = (e) => {
            if (!e.target.closest('.tab-close')) switchTab(id);
        };

        // Append to DOM
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); // clear active
        tabContainer.appendChild(tabEl);

        // Create Content Element
        const contentEl = document.createElement('div');
        contentEl.className = 'tab-content active';
        contentEl.id = `content-${id}`;
        contentEl.innerHTML = content;

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        contentContainer.appendChild(contentEl);

        activeTabId = id;
    };

    window.closeTab = (e, id) => {
        e.stopPropagation();
        if (id === 'main') return; // Cannot close main tab for now

        // Remove from state
        tabs = tabs.filter(t => t.id !== id);

        // Remove from DOM
        const tabEl = document.querySelector(`.tab[data-id="${id}"]`);
        const contentEl = document.getElementById(`content-${id}`);

        if (tabEl) tabEl.remove();
        if (contentEl) contentEl.remove();

        // Switch to last available tab if closed tab was active
        if (activeTabId === id) {
            const lastTab = tabs[tabs.length - 1];
            if (lastTab) switchTab(lastTab.id);
        }
    };

    window.switchTab = (id) => {
        activeTabId = id;

        // Update Tabs UI
        document.querySelectorAll('.tab').forEach(t => {
            if (t.dataset.id === id) t.classList.add('active');
            else t.classList.remove('active');
        });

        // Update Content UI
        document.querySelectorAll('.tab-content').forEach(c => {
            if (c.id === `content-${id}`) c.classList.add('active');
            else c.classList.remove('active');
        });
    };

    // Attach event listeners to hobbies (delegation or direct)
    // We will attach these in index.html via onclick attributes for simplicity with the dynamic content

    window.openResumeTab = () => {
        const id = 'resume';
        const title = 'Resume.pdf';
        const content = `<iframe src="resume.pdf#toolbar=0" style="width:100%; height:100%; border:none;"></iframe>`;

        openTab(id, title, content);

        // Remove padding for full-screen PDF feel
        const contentEl = document.getElementById(`content-${id}`);
        if (contentEl) {
            contentEl.style.padding = '0';
            contentEl.style.height = '100%';
            contentEl.style.overflow = 'hidden';
        }
    };

    window.openImageTab = (title, imagePath) => {
        const id = 'certificate-' + Date.now(); // unique id
        const content = `<div style="display:flex; justify-content:center; align-items:center; height:100%; background:#000;">
                            <img src="${imagePath}" style="max-width:100%; max-height:100%; box-shadow: 0 0 20px rgba(0,0,0,0.5);" alt="${title}">
                         </div>`;

        openTab(id, title, content);

        // Remove padding for full-window feel
        const contentEl = document.getElementById(`content-${id}`);
        if (contentEl) {
            contentEl.style.padding = '0';
            contentEl.style.height = '100%';
            contentEl.style.overflow = 'hidden';
            contentEl.style.display = 'flex'; // Ensure flex centering works
            contentEl.style.justifyContent = 'center';
            contentEl.style.alignItems = 'center';
        }
    };

    // Profile Flip Logic (Click to Toggle)
    const flipContainer = document.querySelector('.profile-flip-container');
    const flipper = document.querySelector('.flipper');

    // Way Through Films Production Data
    // Way Through Films Production Data
    const productionData = {
        omwt: {
            title: "On My Way Through",
            type: "Docu-Series",
            description: "A raw and unpolished docuseries capturing the perspective of a 22-year-old navigating societal complexities. It seeks to understand the world by asking the difficult questions that demand answers.",
            videoId: "" // Archive/Upcoming
        },
        pause: {
            title: "Pause",
            type: "Micro Film",
            description: "A 75-second micro-film featuring the Honda SP 160. Through a deliberate interplay of right-heavy close-ups and distant, left-heavy compositions, the visual narrative explores the act of pausing to reflect amidst motion, telling a story without words.",
            videoId: "10RxkMV5kwM?si=MMBf4eLxTUt9eZ7A"
        },
        morning: {
            title: "Morning",
            type: "Micro Film",
            description: "A cinematic micro-film created in a single hour by a 15-year-old filmmaker. This experimental piece explores the entire pipeline from storyboarding to final rendering, transforming a simple morning routine into a visual experience.",
            videoId: "0g_dcVBP0ms?si=yd_TVBa-QnD7-5v2"
        }
    };

    window.openProductionTab = (key) => {
        const data = productionData[key];
        if (!data) return;

        const id = `production-${key}`;
        // Use a placeholder if no videoId provided
        // Added standard YouTube attributes (referrerpolicy, title, web-share) to fix potential config errors
        const videoEmbed = data.videoId
            ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${data.videoId}" title="${data.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
            : `<div style="width:100%; height:315px; background:#222; display:flex; align-items:center; justify-content:center; color:#666;">[Video Placeholder]</div>`;

        const content = `
            <div class="production-modal">
                <div class="prod-header">
                    <h2>${data.title}</h2>
                    <span class="prod-type">${data.type}</span>
                </div>
                <div class="video-container">
                    ${videoEmbed}
                </div>
                <p class="prod-desc">${data.description}</p>
            </div>
        `;

        openTab(id, data.title, content);
    };

    if (flipContainer && flipper) {
        flipContainer.addEventListener('click', () => {
            flipper.classList.toggle('flipped');
        });
        flipper.classList.toggle('flipped');
    }

    // Profile Flip Hint Logic
    const hintEl = document.querySelector('.flip-hint');
    if (hintEl) {
        const showHint = () => {
            hintEl.classList.add('visible');
            setTimeout(() => {
                hintEl.classList.remove('visible');
            }, 4000); // Stays for 4 seconds
        };

        // Initial delay of 4 seconds
        setTimeout(() => {
            showHint();
            // Then repeat every 60 seconds
            setInterval(showHint, 60000);
        }, 4000);
    }

    // Read More Logic (Generalized)
    const initReadMore = () => {
        const sections = [
            { selector: '.experience-section', itemSelector: '.exp-item' },
            { selector: '.projects-section', itemSelector: '.project-card' },
            { selector: '.hackathons-section', itemSelector: '.project-card' },
            { selector: '.volunteering-section', itemSelector: '.vol-item' },
            { selector: '.awards-section', itemSelector: 'li' },
            { selector: '.certificates-section', itemSelector: 'li' },
            { selector: '.writings-section', itemSelector: '.blog-item' }
        ];

        sections.forEach(config => {
            const section = document.querySelector(config.selector);
            if (!section) return;

            // Collect items based on selector context
            // For sections where button goes at bottom, we append to section.
            // For ULs, we append after UL.

            let items = [];
            let container = section; // Default append target

            if (config.itemSelector === 'li') {
                const ul = section.querySelector('ul');
                if (ul) {
                    items = Array.from(ul.children);
                    container = ul; // Append button after UL
                }
            } else if (config.itemSelector === '.blog-item') {
                const list = section.querySelector('.blog-list');
                if (list) {
                    items = Array.from(list.children);
                    container = list;
                }
            } else {
                items = Array.from(section.querySelectorAll(config.itemSelector));
            }

            if (items.length > 3) {
                // Hide items from index 3 onwards
                items.slice(3).forEach(item => item.classList.add('hidden-item'));

                // Create Toggle Button
                const btn = document.createElement('button');
                btn.className = 'read-more-btn';
                btn.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';

                // Toggle Logic
                btn.addEventListener('click', () => {
                    const isExpanded = btn.classList.contains('expanded');

                    if (isExpanded) {
                        // Collapse
                        items.slice(3).forEach(item => item.classList.add('hidden-item'));
                        btn.innerHTML = 'Read More <i class="fas fa-chevron-down"></i>';
                        btn.classList.remove('expanded');
                        // Scroll logic can be added here if needed
                    } else {
                        // Expand
                        items.slice(3).forEach(item => item.classList.remove('hidden-item'));
                        btn.innerHTML = 'Read Less <i class="fas fa-chevron-up"></i>';
                        btn.classList.add('expanded');
                    }
                });

                // Append button logic
                if (container.tagName === 'UL' || container.classList.contains('blog-list')) {
                    container.parentNode.insertBefore(btn, container.nextSibling);
                } else {
                    container.appendChild(btn);
                }
            }
        });
    };

    window.openShoppinStats = () => {
        const id = 'shoppin-stats';
        const title = 'Shoppin\' Progression';

        // Data Points
        // Data Points
        const milestones = [
            { x: 5, y: 3, label: 'Dec \'24', title: 'Multimodal AI', desc: 'Starting Intern. CLIP/VLLM systems.' },
            { x: 30, y: 4, label: 'Apr \'25', title: 'Backend APIs', desc: 'CRUD APIs, Robust Patterns.' },
            { x: 42, y: 5, label: 'May \'25', title: 'Aesthetic Agents', desc: 'Classifying Stores (Human Params) & Redis.' },
            { x: 55, y: 6, label: 'Jul \'25', title: 'Internal Tools', desc: 'Techblogs, Dashboards & On-Call Reliability.' },
            { x: 70, y: 7, label: 'Aug \'25', title: 'Order Agents', desc: 'Shopify Order Placement & Automations.' },
            { x: 80, y: 8, label: 'Sep \'25', title: 'Scale & Rancher', desc: 'Rancher Expansion & 200+ Store Scrapers.' },
            { x: 95, y: 10, label: 'Nov \'25', title: 'Microservices', desc: 'Event-Driven SQS/DLQ Architecture.' }
        ];

        // Generate SVG Path
        // Map x (0-100) to width (0-800) and y (0-10) to height (400-0)
        const formatPoints = milestones.map(m => {
            const px = m.x * 8; // 800px width
            const py = 400 - (m.y * 35); // Scale y. Max 10 * 35 = 350. Bottom padding 50.
            return `${px},${py}`;
        }).join(' ');

        // Generate Circles & Tooltips
        const circles = milestones.map((m, i) => {
            const px = m.x * 8;
            const py = 400 - (m.y * 35);
            return `
                <g class="point-group" 
                   onmouseenter="document.getElementById('tooltip-${i}').style.opacity=1; document.getElementById('tooltip-${i}').style.top='${py - 60}px'; document.getElementById('tooltip-${i}').style.left='${px - 100}px';"
                   onmouseleave="document.getElementById('tooltip-${i}').style.opacity=0;">
                    <circle cx="${px}" cy="${py}" r="5" class="graph-point" />
                    <text x="${px}" y="420" text-anchor="middle" class="graph-text">${m.label}</text>
                </g>
            `;
        }).join('');

        const tooltips = milestones.map((m, i) => {
            return `
                <div id="tooltip-${i}" class="graph-tooltip" style="top:0; left:0;">
                    <strong>${m.title} (Lvl ${m.y})</strong><br/>
                    ${m.desc}
                </div>
            `;
        }).join('');

        const content = `
            <div class="timeline-container">
                <div class="stats-header">
                    <h2>Stats: shoppin'</h2>
                    <p>Level Progression (Dec '24 - Nov '25)</p>
                    <p class="mobile-hint" style="font-size: 0.75rem; opacity: 0.8; margin-top: 5px; display: none;"> <i class="fas fa-arrows-alt-h"></i> Scroll to view full timeline</p>
                </div>
                
                <div class="graph-scroll-wrapper" style="width: 100%; overflow-x: auto; padding-bottom: 30px; -webkit-overflow-scrolling: touch;">
                    <div style="position: relative; width: 800px; margin: 0 auto;">
                        <svg class="graph-svg" viewBox="0 0 850 450" preserveAspectRatio="xMidYMid meet">
                            <!-- Grid Lines -->
                            <line x1="0" y1="365" x2="800" y2="365" class="grid-line" /> <!-- Base -->
                            <line x1="0" y1="190" x2="800" y2="190" class="grid-line" /> <!-- Mid -->
                            <line x1="0" y1="15" x2="800" y2="15" class="grid-line" /> <!-- Top -->
                            
                            <!-- Axes -->
                            <line x1="0" y1="400" x2="800" y2="400" class="graph-axis" />
                            <line x1="0" y1="400" x2="0" y2="0" class="graph-axis" />
                            
                            <!-- Path -->
                            <polyline points="${formatPoints}" class="graph-line" />
                            
                            <!-- Points -->
                            ${circles}
                        </svg>
                        ${tooltips}
                    </div>
                </div>
                <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.7;">
                    *Y-Axis represents Technical Complexity & Responsibility
                </p>
            </div>
        `;

        openTab(id, title, content);
    };

    window.openFamcareNotes = () => {
        const id = 'famcare-notes';
        const title = 'FamCARE Architecture Notes';
        const content = `
            <div class="personal-notes">
                <h1>Architecting for the Hyper-Local Economy: Building the FamCARE Distributed Marketplace</h1>
                <p><em>By Harshit Agarwal, System Architect & Lead</em></p>
                <p>Building a service marketplace isn't just about matching supply and demand; it’s about managing a high-fidelity "Physical World State" in digital real-time. At <strong>FamCARE</strong>, we faced a classic distributed systems challenge: how to coordinate users, caretakers, and administrators across a modular ecosystem while maintaining strict transactional integrity and sub-second latency.</p>
                <p>In this post, I’ll dive into the architectural decisions and engineering patterns I implemented to scale FamCARE from a prototype to a production-ready engine handling thousands of requests.</p>
                <hr>
                <h2>1. The Modular Monolith: Balancing Velocity and Domain Isolation</h2>
                <p>Early-stage startups often fall into the "Microservices Trap" too soon. For FamCARE, I opted for a <strong>Modular Monolith</strong> architecture using <strong>FastAPI</strong> and <strong>PostgreSQL (SQLAlchemy/AsyncPG)</strong>.</p>
                <p>By enforcing strict domain boundaries within a single repository (<strong>Sutram</strong>), we avoided the overhead of network-level service discovery while ensuring that the <code>payments</code>, <code>riders</code>, and <code>assignments</code> modules remained decoupled. This allowed us to maintain a shared database schema with ACID guarantees—critical when handling wallet deductions and service bookings.</p>
                <h2>2. Solving the Distributed State Problem: The Request Lifecycle</h2>
                <p>The core of FamCARE is the <strong>Service Request Engine</strong>. The complexity lies in the state machine: a request isn't just "Created"; it is a living entity that transitions through <code>proposing</code>, <code>accepting</code>, <code>ongoing</code>, and <code>settling</code>.</p>
                <h3>The "Ghost Assignment" Challenge</h3>
                <p>A common failure mode in marketplaces is the "Ghost Assignment"—where a rider is proposed a task but remains "available" to other systems. I implemented a <strong>locking and timeout reservation pattern</strong>:</p>
                <ul>
                    <li><strong>Atomic Proposals:</strong> When a rider is proposed, they are marked as <code>busy</code> in a Redis-backed cache layer.</li>
                    <li><strong>Background Schedulers:</strong> Using <code>APScheduler</code>, I built a reaper service that monitors pending proposals and automatically expires them after 180 seconds, re-injecting the request into the assignment queue.</li>
                </ul>
                <h2>3. Real-Time Synchronization via Redis Pub/Sub</h2>
                <p>To achieve a "live" feel, we couldn't rely on polling. We needed a unified broadcasting system.</p>
                <p>We used <strong>WebSockets</strong> for the frontends, but scaling WebSockets across multiple server instances requires a shared backplane. I architected a <strong>Redis Pub/Sub relay</strong>:</p>
                <ul>
                    <li>When a state change occurs (e.g., Rider accepts a job), the backend publishes a message to a Redis channel.</li>
                    <li>Every active FastAPI worker listens to this channel and broadcasts the update only to the relevant connected clients (User, Caretaker, or Admin).</li>
                    <li><strong>Result:</strong> We achieved sub-300ms propagation of status updates across the entire ecosystem.</li>
                </ul>
                <h2>4. Engineering the Dynamic Operational Slot Engine</h2>
                <p>Perhaps the most mathematically complex piece was the <strong>Hub-Aware Slot Engine</strong>. Unlike a standard calendar, our "slots" are dynamic functions of:</p>
                <ul>
                    <li><strong>Operational Windows:</strong> Hub-specific start/end times.</li>
                    <li><strong>Rider Density:</strong> Real-time count of active vs. assigned riders in a specific geofence.</li>
                    <li><strong>Service Duration:</strong> A 4-hour dog-walking service cannot be booked 2 hours before a hub closes.</li>
                </ul>
                <p>I implemented this using a <strong>Duration-Aware Lookahead Algorithm</strong> that calculates availability by intersecting the requested service duration with the remaining operational window and the concurrent booking capacity of the local hub.</p>
                <h2>5. Stress Testing: Proving the Architecture</h2>
                <p>An architecture is only as good as its breaking point. I developed a custom asynchronous benchmarking suite to simulate high-load scenarios.</p>
                <p><strong>The Findings:</strong></p>
                <ul>
                    <li><strong>Concurrency:</strong> The system maintained a <strong>100% success rate</strong> at 50 concurrent users.</li>
                    <li><strong>Throughput:</strong> Handled <strong>2,000+ requests/minute</strong> with an average latency of ~950ms.</li>
                    <li><strong>Bottleneck Identification:</strong> Under extreme load (100+ concurrent users), the P95 latency shifted to 8s, identifying the database connection pool as the primary scaling target. This data-driven approach allowed us to pre-emptively optimize our RDS instance sizing.</li>
                </ul>
                <h2>6. Deployment & The Developer Experience</h2>
                <p>Speed of delivery is a feature. I automated the entire mobile deployment pipeline using <strong>Fastlane and GitHub Actions</strong>.</p>
                <ul>
                    <li><strong>CI/CD:</strong> Automated builds for three different Flutter apps (User, Caretaker, Admin) are triggered on merge to <code>staging</code>, reducing deployment overhead by <strong>70%</strong>.</li>
                    <li><strong>Observability:</strong> Integrated <strong>Sentry</strong> with custom breadcrumbs to track distributed traces—allowing us to debug a failed payment in the User app by tracing it back to a specific async task in the backend.</li>
                </ul>
                <hr>
                <h2>Conclusion</h2>
                <p>Building FamCARE was an exercise in balancing "High Performance" with "High Reliability." By focusing on a robust state machine, a real-time event-driven backplane, and rigorous performance benchmarking, we created a system that doesn't just match services—it manages the physical world with digital precision.</p>
                <p><em>If you’re interested in the code behind these patterns, reach out to discuss distributed systems.</em></p>
            </div>
        `;

        openTab(id, title, content);
    };

    initReadMore();
});
