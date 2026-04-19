/**
 * Virtual Tribal Tourism - Iruliga Tribe
 * Logic for Popup, Tabs, Navigation, and Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Supabase (Using window.supabase to avoid shadowing)
    let db = null;
    let LIVE_SETTINGS = {
        upi_id: null,
        upi_name: null
    };

    try {
        if (typeof window.supabase !== 'undefined' && typeof PAYMENT_CONFIG !== 'undefined') {
            db = window.supabase.createClient(PAYMENT_CONFIG.SUPABASE.URL, PAYMENT_CONFIG.SUPABASE.ANON_KEY);
            console.log("Supabase connected for live settings.");
            loadLiveSettings();
        } else {
            console.warn("Supabase or Config missing. Using local defaults.");
            applyGeneralConfig(); // Ensure local config is still applied
        }
    } catch (e) {
        console.error("Supabase Init Error:", e);
        applyGeneralConfig(); // Ensure local config is still applied
    }

    async function loadLiveSettings() {
        if (!db) return;
        try {
            const { data, error } = await db.from('settings').select('*');
            if (error) throw error;
            
            data.forEach(s => {
                if (s.id === 'upi_id') {
                    LIVE_SETTINGS.upi_id = s.value;
                    // Update UI text display
                    const upiText = document.getElementById('upiIdText');
                    if (upiText) upiText.innerText = s.value;
                }
                if (s.id === 'upi_name') {
                    LIVE_SETTINGS.upi_name = s.value;
                }
            });
        } catch (e) {
            console.error("Failed to load live settings:", e);
        } finally {
            // Apply General Config (Pulling from payment_config.js CENTRALIZED)
            applyGeneralConfig();
            initImpactCounters();
        }
    }

    // --- Impact Counters Logic ---
    async function initImpactCounters() {
        if (db) {
            try {
                // Fetch Settings (Impact Values)
                const { data: settings } = await db.from('settings').select('*');
                if (settings) {
                    settings.forEach(s => {
                        if (s.id === 'stat_families') {
                            const el = document.getElementById('stat-families');
                            if (el) el.setAttribute('data-target', s.value);
                        }
                        if (s.id === 'stat_volunteers') {
                            const el = document.getElementById('stat-volunteers');
                            if (el) el.setAttribute('data-target', s.value);
                        }
                        if (s.id === 'stat_media_override' && Number(s.value) > 0) {
                            const el = document.getElementById('stat-media');
                            if (el) el.setAttribute('data-target', s.value);
                        }
                    });
                }

                // Fetch Total Donations (Live calculating)
                const { data: donations, error: dError } = await db.from('donations').select('amount');
                if (!dError && donations) {
                    const total = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
                    const fundsEl = document.getElementById('stat-funds');
                    if (fundsEl && total > 0) fundsEl.setAttribute('data-target', total);
                }

                // Fetch Media Count (Only if no override)
                const mediaOverride = settings?.find(s => s.id === 'stat_media_override');
                if (!mediaOverride || Number(mediaOverride.value) === 0) {
                    const { count, error: mError } = await db.from('media').select('*', { count: 'exact', head: true });
                    if (!mError && count !== null) {
                        const mediaEl = document.getElementById('stat-media');
                        if (mediaEl && count > 0) mediaEl.setAttribute('data-target', count);
                    }
                }
            } catch (e) {
                console.error("Impact data fetch error:", e);
            }
        }

        // Intersection Observer for Animation
        const counters = document.querySelectorAll('.counter');
        const observerOptions = { threshold: 0.5 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target'));
                    animateCounter(counter, target);
                    observer.unobserve(counter);
                }
            });
        }, observerOptions);

        counters.forEach(c => observer.observe(c));
    }

    function animateCounter(el, target) {
        let current = 0;
        const duration = 2000; // 2 seconds
        const stepTime = 15;
        const totalSteps = duration / stepTime;
        const increment = target / totalSteps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.innerText = target.toLocaleString();
                clearInterval(timer);
            } else {
                el.innerText = Math.floor(current).toLocaleString();
            }
        }, stepTime);
    }

    function applyGeneralConfig() {
        if (typeof PAYMENT_CONFIG === 'undefined') return;
        const gen = PAYMENT_CONFIG.GENERAL;

        // Footer Contact
        const fEmail = document.getElementById('footerEmail');
        const fLoc = document.getElementById('footerLocation');
        const cName = document.getElementById('copyrightName');
        if (fEmail) fEmail.innerText = gen.EMAIL;
        if (fLoc) fLoc.innerText = gen.LOCATION;
        if (cName) cName.innerText = gen.NAME;

        // Social Links
        const sInsta = document.getElementById('socialInsta');
        const sYoutube = document.getElementById('socialYoutube');
        const sLinkedin = document.getElementById('socialLinkedin');
        const sFB = document.getElementById('socialFB');

        if (sInsta) sInsta.href = gen.SOCIAL.INSTAGRAM;
        if (sYoutube) sYoutube.href = gen.SOCIAL.YOUTUBE;
        if (sLinkedin) sLinkedin.href = gen.SOCIAL.LINKEDIN;
        if (sFB) sFB.href = gen.SOCIAL.FACEBOOK;
    }

    async function saveDonationToDB(data) {
        if (!db) {
            console.warn("Database not initialized. Saving locally for demo.");
            alert("Donation records simulated. Transaction ID: " + data.transaction_id);
            return;
        }
        const { error } = await db
            .from('donations')
            .insert([
                { 
                    donor_name: data.name, 
                    email: data.email, 
                    amount: data.amount,
                    transaction_id: data.transaction_id,
                    status: 'verified'
                }
            ]);
        
        if (error) {
            console.error("Database error:", error);
            alert("Error saving record. Please contact support.");
        } else {
            showSuccess();
            document.getElementById('donationForm').reset();
        }
    }

    function showSuccess() {
        const overlay = document.getElementById('paymentSuccess');
        if (overlay) {
            overlay.classList.add('active');
            createConfetti();
        }
    }

    window.closeSuccess = () => {
        const overlay = document.getElementById('paymentSuccess');
        if (overlay) overlay.classList.remove('active');
    };

    function createConfetti() {
        const container = document.getElementById('confetti');
        if (!container) return;
        container.innerHTML = '';
        const colors = ['#2d5a27', '#a0522d', '#5d4037', '#f4a027'];
        
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.width = Math.random() * 10 + 5 + 'px';
            piece.style.height = piece.style.width;
            container.appendChild(piece);
        }
    }

    // Handle Donation Form Submission
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Basic data extraction
            const name = donationForm.querySelector('input[type="text"]').value;
            const email = donationForm.querySelector('input[type="email"]').value;
            const amountField = document.getElementById('customAmountInput');
            const amount = (amountField && amountField.style.display === 'block') ? amountField.value : 1000;
            const txnId = document.getElementById('txnId').value;

            if (txnId.length !== 12) {
                alert("Please enter a valid 12-digit UPI Transaction ID.");
                return;
            }

            const submitBtn = donationForm.querySelector('.submit-proof-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Processing...";
            submitBtn.disabled = true;

            await saveDonationToDB({
                name,
                email,
                amount,
                transaction_id: txnId
            });

            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        });
    }

    // 1. Show Welcome Modal on Load
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        setTimeout(() => {
            welcomeModal.style.display = 'flex';
        }, 1000); 
    }

    // Global Close Modal function
    window.closeModal = () => {
        if (welcomeModal) welcomeModal.style.display = 'none';
    };

    // 2. Sticky Navbar Logic
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky');
        }
    });

    // 3. Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            // Deactivate all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Activate current
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // 4. Mobile Menu Navigation
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinksList = document.getElementById('navLinks');

    window.toggleMenu = () => {
        navLinksList.classList.toggle('active');
    };

    // Close menu and switch tabs when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const linkText = link.innerText.toLowerCase();
            const isDropdownBtn = link.classList.contains('dropbtn');
            
            const tabMap = {
                'food': 'food',
                'beverages': 'beverages',
                'attire': 'attire',
                'music': 'music',
                'rituals': 'rituals'
            };

            for (const key in tabMap) {
                if (linkText.includes(key)) {
                    // Activate corresponding tab
                    const tabBtn = document.querySelector(`[data-tab="${tabMap[key]}"]`);
                    const tabPanel = document.getElementById(tabMap[key]);
                    
                    if (tabBtn && tabPanel) {
                        tabBtns.forEach(b => b.classList.remove('active'));
                        tabPanels.forEach(p => p.classList.remove('active'));
                        
                        tabBtn.classList.add('active');
                        tabPanel.classList.add('active');
                    }
                    break;
                }
            }

            // Only close the main menu if it's NOT a dropdown toggle on mobile
            if (!isDropdownBtn || window.innerWidth > 768) {
                navLinksList.classList.remove('active');
            }
        });
    });

    // Global Modal Functions
    window.closeModal = () => {
        if (welcomeModal) welcomeModal.style.display = 'none';
    };

    window.openVideo = (url) => {
        window.open(url, '_blank');
    };

    // 7. UPI Copy Logic
    window.copyUPI = () => {
        const upiText = document.getElementById('upiIdText').innerText;
        navigator.clipboard.writeText(upiText).then(() => {
            const copyBtn = document.querySelector('.copy-btn');
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            copyBtn.style.background = '#2d5a27';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.background = 'white';
                copyBtn.style.color = '#2d5a27';
            }, 2000);
        });
    };

    // 8. Mobile Dropdown Toggle Logic
    const dropBtn = document.querySelector('.dropbtn');
    const dropdown = document.querySelector('.dropdown');
    
    if (dropBtn && dropdown) {
        dropBtn.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault(); // Stop immediate jump on mobile to allow toggle
                dropdown.classList.toggle('active');
            }
        });
    }

    // Reset dropdown when clicking any link inside it
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', () => {
            if (dropdown) dropdown.classList.remove('active');
        });
    });

    // 11. Tab Anchor Links — activate the correct tab and scroll to #explore
    const tabAnchorMap = {
        '#food': 'food',
        '#attire': 'attire',
        '#music': 'music',
        '#beverages': 'beverages',
        '#rituals': 'rituals'
    };

    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        
        if (tabAnchorMap[href]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tabAnchorMap[href];

                // Activate the correct tab button and panel
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                const targetBtn = document.querySelector(`[data-tab="${targetTab}"]`);
                const targetPanel = document.getElementById(targetTab);
                if (targetBtn) targetBtn.classList.add('active');
                if (targetPanel) targetPanel.classList.add('active');

                // Close mobile menu if open
                if (navLinks.classList.contains('active')) toggleMenu();
                // Close dropdown if open
                if (dropdown && dropdown.classList.contains('active')) dropdown.classList.remove('active');

                // Scroll to the explore section
                const exploreSection = document.getElementById('explore');
                if (exploreSection) {
                    exploreSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Fix Donate link global behavior
        if (href === '#donate') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const donateSection = document.getElementById('donate');
                if (donateSection) {
                    donateSection.scrollIntoView({ behavior: 'smooth' });
                }
                if (navLinks.classList.contains('active')) toggleMenu();
            });
        }
    });

    // 9. Tab Scrolling Logic
    window.scrollTabs = (direction) => {
        const nav = document.querySelector('.tabs-nav');
        if (nav) {
            const scrollAmount = 150 * direction;
            nav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    window.scrollTestimonials = (direction) => {
        const container = document.getElementById('testimonialContainer');
        if (container) {
            const scrollAmount = (container.offsetWidth * 0.8) * direction;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // 10. Donation Form Logic
    window.setAmount = (amount) => {
        // Update UI
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Hide custom field if preset selected
        document.getElementById('customAmountInput').style.display = 'none';
        
        console.log(`Amount set to: ${amount}`);
    };

    window.toggleCustomAmount = () => {
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const customField = document.getElementById('customAmountInput');
        customField.style.display = 'block';
        customField.focus();
    };

    window.openPaymentApp = () => {
        // Use live settings from DB if available, otherwise fallback to config
        const upiId = LIVE_SETTINGS.upi_id || PAYMENT_CONFIG.UPI.ID;
        const upiName = LIVE_SETTINGS.upi_name || PAYMENT_CONFIG.UPI.NAME;

        const amountField = document.getElementById('customAmountInput');
        const amount = (amountField && amountField.style.display === 'block') 
            ? amountField.value 
            : 1000;
        
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`;
        window.location.href = upiUrl;
    };

    // --- Voices of the Tribe (Testimonials) Logic ---
    async function initTestimonials() {
        if (!db) return;
        try {
            // Fetch testimonials (only Approved ones for public view)
            const { data, error } = await db
                .from('testimonials')
                .select('*')
                .eq('status', 'Approved')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const container = document.getElementById('testimonialContainer');
            if (!container) return;

            if (!data || data.length === 0) {
                container.innerHTML = '<div class="loading-placeholder">Be the first to share your voice.</div>';
                return;
            }

            container.innerHTML = data.map(t => {
                const words = t.content.split(' ');
                const isLong = words.length > 5;
                const displayContent = isLong ? words.slice(0, 5).join(' ') + '...' : t.content;
                
                return `
                <div class="testimonial-card">
                    <div class="t-author">
                        <img src="${t.photo_url}" alt="${t.name}">
                        <div class="t-info">
                            <h4>${t.name}</h4>
                            <span>${t.role}</span>
                        </div>
                    </div>
                    <div class="t-content" id="t-text-${t.id}">
                        ${displayContent}
                        ${isLong ? `<button class="read-more-btn" onclick="openTestimonialReader('${t.id}', \`${t.name}\`, \`${t.role}\`, \`${t.photo_url}\`, \`${t.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">Read More</button>` : ''}
                    </div>
                </div>
                `;
            }).join('');

        } catch (e) {
            console.error("Testimonial Init Error:", e);
        }
    }

    window.openTestimonialReader = (id, name, role, photo, content) => {
        const modal = document.getElementById('testimonialReaderModal');
        const authorBox = document.getElementById('readerAuthor');
        const contentBox = document.getElementById('readerContent');

        if (modal && authorBox && contentBox) {
            authorBox.innerHTML = `
                <img src="${photo}" alt="${name}">
                <div class="t-info">
                    <h4>${name}</h4>
                    <span>${role}</span>
                </div>
            `;
            contentBox.innerHTML = content;
            modal.classList.add('active');
        }
    };

    window.closeReaderModal = () => {
        const modal = document.getElementById('testimonialReaderModal');
        if (modal) modal.classList.remove('active');
    };

    window.openTestimonialModal = () => {
        const modal = document.getElementById('testimonialModal');
        if (modal) modal.classList.add('active');
    };

    window.closeTestimonialModal = () => {
        const modal = document.getElementById('testimonialModal');
        if (modal) modal.classList.remove('active');
    };

    window.handleTestimonialSubmit = async (e) => {
        e.preventDefault();
        if (!db) return;

        const btn = document.getElementById('t-submitBtn');
        const name = document.getElementById('t-name').value;
        const role = document.getElementById('t-role').value;
        const photo = document.getElementById('t-photo').value;
        const content = document.getElementById('t-message').value;

        btn.innerText = "Submitting...";
        btn.disabled = true;

        try {
            const avatarUrl = photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
            
            const { error } = await db.from('testimonials').insert([
                { name, role, content, status: 'Approved', photo_url: avatarUrl }
            ]);

            if (error) throw error;

            alert("Thank you! Your story has been posted instantly.");
            closeTestimonialModal();
            initTestimonials(); // Refresh the list instantly
            document.getElementById('testimonialForm').reset();
        } catch (err) {
            alert("Submission error: " + err.message);
        } finally {
            btn.innerText = "Submit Story";
            btn.disabled = false;
        }
    };

    // Initialize Testimonials
    initTestimonials();
});
