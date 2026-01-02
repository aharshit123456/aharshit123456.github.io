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

    initReadMore();
});
