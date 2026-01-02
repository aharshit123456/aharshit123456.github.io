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

    if (flipContainer && flipper) {
        flipContainer.addEventListener('click', () => {
            flipper.classList.toggle('flipped');
        });
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
