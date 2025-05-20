document.addEventListener('DOMContentLoaded', () => {
    const app = {
        cvData: null,
        portfolioData: null,
        currentTheme: localStorage.getItem('theme') || 'dark-theme', // Default to dark
        currentLang: localStorage.getItem('lang') || 'ar',
        typingTextsMaster: { ar: [], en: [] },
        typingTextElement: document.getElementById('typing-text'),
        cursorElement: document.querySelector('.typing-text-container .cursor'),
        typeIndex: 0,
        charIndex: 0,
        isDeleting: false,
        heroParticles: [],
        heroCanvas: null,
        heroCtx: null,


        init() {
            this.applyTheme(this.currentTheme);
            this.setLanguage(this.currentLang, true);
            this.loadData();
            this.setupEventListeners();
            this.updateCopyrightYear();
            this.initHeroParticles();
        },

        initHeroParticles() {
            this.heroCanvas = document.createElement('canvas');
            const heroSection = document.getElementById('hero');
            if (!heroSection) return;

            this.heroCanvas.id = 'hero-particle-canvas';
            heroSection.appendChild(this.heroCanvas);
            this.heroCtx = this.heroCanvas.getContext('2d');
            
            this.resizeHeroCanvas();
            window.addEventListener('resize', () => this.resizeHeroCanvas());

            for (let i = 0; i < 50; i++) { // Number of particles
                this.heroParticles.push(this.createParticle());
            }
            this.animateHeroParticles();
        },

        resizeHeroCanvas() {
            const heroSection = document.getElementById('hero');
            if (this.heroCanvas && heroSection) {
                this.heroCanvas.width = heroSection.offsetWidth;
                this.heroCanvas.height = heroSection.offsetHeight;
            }
        },

        createParticle(x, y) {
            const size = Math.random() * 3 + 1; // Particle size
            return {
                x: x || Math.random() * this.heroCanvas.width,
                y: y || Math.random() * this.heroCanvas.height,
                size: size,
                speedX: Math.random() * 1 - 0.5, // Horizontal speed
                speedY: Math.random() * 1 - 0.5, // Vertical speed
                color: this.currentTheme === 'dark-theme' ? 'rgba(0, 245, 212, 0.5)' : 'rgba(0, 123, 255, 0.5)' // Teal for dark, Blue for light
            };
        },

        drawParticle(particle) {
            this.heroCtx.fillStyle = particle.color;
            this.heroCtx.beginPath();
            this.heroCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.heroCtx.fill();
        },

        updateParticles() {
            for (let i = 0; i < this.heroParticles.length; i++) {
                let p = this.heroParticles[i];
                p.x += p.speedX;
                p.y += p.speedY;

                // Boundary check (bounce off edges)
                if (p.x + p.size > this.heroCanvas.width || p.x - p.size < 0) {
                    p.speedX *= -1;
                }
                if (p.y + p.size > this.heroCanvas.height || p.y - p.size < 0) {
                    p.speedY *= -1;
                }
                // Update color based on theme (in case theme changes)
                p.color = this.currentTheme === 'dark-theme' ? 'rgba(0, 245, 212, 0.3)' : 'rgba(0, 123, 255, 0.3)';
            }
        },
        
        animateHeroParticles() {
            if (!this.heroCtx || !this.heroCanvas) return;
            this.heroCtx.clearRect(0, 0, this.heroCanvas.width, this.heroCanvas.height);
            this.updateParticles();
            for (let i = 0; i < this.heroParticles.length; i++) {
                this.drawParticle(this.heroParticles[i]);
            }
            requestAnimationFrame(() => this.animateHeroParticles());
        },
        
        setupMobileNavigation() {
            const burger = document.querySelector('.burger');
            const nav = document.querySelector('.nav-links');
            const navLinks = document.querySelectorAll('.nav-links li');
            
            if (burger && nav) {
                burger.addEventListener('click', () => {
                    // Toggle Nav
                    nav.classList.toggle('nav-active');
                    
                    // Toggle Burger Animation
                    burger.classList.toggle('toggle');
                    
                    // Animate Links
                    const isRTL = document.documentElement.dir === 'rtl';
                    const animationName = isRTL ? 'navLinkFadeRTL' : 'navLinkFade';
                    
                    navLinks.forEach((link, index) => {
                        if (link.style.animation) {
                            link.style.animation = '';
                        } else {
                            link.style.animation = `${animationName} 0.5s ease forwards ${index / 7 + 0.3}s`;
                        }
                    });
                });
                
                // Close mobile menu when clicking on a link
                navLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        if (nav.classList.contains('nav-active')) {
                            nav.classList.remove('nav-active');
                            burger.classList.remove('toggle');
                            
                            navLinks.forEach(link => {
                                link.style.animation = '';
                            });
                        }
                    });
                });
            }
        },


        async loadData() {
            try {
                const cvResponse = await fetch('cv_data.json');
                if (!cvResponse.ok) throw new Error(`HTTP error! status: ${cvResponse.status} for cv_data.json`);
                this.cvData = await cvResponse.json();

                const portfolioResponse = await fetch('portfolio_data.json');
                if (!portfolioResponse.ok) throw new Error(`HTTP error! status: ${portfolioResponse.status} for portfolio_data.json`);
                this.portfolioData = await portfolioResponse.json();

                this.updateUIForLanguage(this.currentLang);

            } catch (error) {
                console.error("Error loading data:", error);
                const errorKey = this.cvData?.[this.currentLang]?.ui_text?.error_loading_data || "Error loading data.";
                if (this.typingTextElement) this.typingTextElement.textContent = errorKey;
            }
        },

        setLanguage(lang, isInitial = false) {
            this.currentLang = lang;
            localStorage.setItem('lang', lang);
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

            const langButton = document.getElementById('language-toggle-button');
            if (langButton) {
                const titleKey = lang === 'ar' ? 'language_toggle_en' : 'language_toggle_ar';
                const titleText = this.cvData?.[lang === 'ar' ? 'en' : 'ar']?.ui_text?.[titleKey] || (lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية');
                langButton.title = titleText;
            }
            
            if (this.cvData && this.portfolioData && !isInitial) {
                this.updateUIForLanguage(lang);
            }
        },

        updateUIForLanguage(lang) {
            if (!this.cvData || !this.portfolioData) return;
            this.populateHeroAndAbout(lang);
            this.populateJourney(lang);
            this.populateToolkit(lang);
            this.populateRecognitions(lang);
            this.populatePortfolio(lang);
            this.updateStaticText(lang);
            this.setupTypingAnimation(lang);
        },
        
        updateStaticText(lang) {
            if (!this.cvData || !this.cvData[lang] || !this.cvData[lang].ui_text) return;
            const uiText = this.cvData[lang].ui_text;
            const aboutMeData = this.cvData[lang].about_me;

            document.querySelectorAll('[data-lang-key]').forEach(element => {
                const key = element.getAttribute('data-lang-key');
                if (uiText[key]) {
                    element.textContent = uiText[key];
                }
            });

            document.querySelectorAll('[data-placeholder-lang-key]').forEach(element => {
                const key = element.getAttribute('data-placeholder-lang-key');
                if (uiText[key]) {
                    element.placeholder = uiText[key];
                }
            });
            
            const pageTitleElement = document.querySelector('title');
            if (pageTitleElement) {
                const titleText = uiText.page_title || `${aboutMeData.name} | Portfolio & Innovations`;
                pageTitleElement.textContent = titleText.replace('حسين فاضل', aboutMeData.name).replace('Hussein Fadhel', aboutMeData.name);
            }

            const themeButton = document.getElementById('theme-toggle-button');
            if (themeButton && uiText.theme_toggle_dark && uiText.theme_toggle_light) {
                const moonIcon = themeButton.querySelector('.icon-moon');
                const sunIcon = themeButton.querySelector('.icon-sun');
                if (moonIcon && sunIcon) {
                    if (this.currentTheme === 'light-theme') {
                        moonIcon.style.display = 'inline-block';
                        sunIcon.style.display = 'none';
                        themeButton.title = uiText.theme_toggle_dark;
                    } else {
                        moonIcon.style.display = 'none';
                        sunIcon.style.display = 'inline-block';
                        themeButton.title = uiText.theme_toggle_light;
                    }
                }
            }
            const copyrightNameSpan = document.querySelector('footer p span[data-cv-key="about_me.name"]');
            if (copyrightNameSpan && aboutMeData) {
                copyrightNameSpan.textContent = aboutMeData.name;
            }
        },

        populateHeroAndAbout(lang) {
            if (!this.cvData || !this.cvData[lang] || !this.cvData[lang].about_me) return;
            const aboutMeData = this.cvData[lang].about_me;
            const uiText = this.cvData[lang].ui_text;

            document.getElementById('nav-name').textContent = aboutMeData.name;
            document.getElementById('hero-name').textContent = aboutMeData.name;
            document.getElementById('hero-title').textContent = aboutMeData.title;
            document.getElementById('hero-tagline').textContent = aboutMeData.tagline;

            const heroTextDiv = document.querySelector('.hero-text');
            if (heroTextDiv) {
                // Remove existing CV download button if any
                const existingCvButton = heroTextDiv.querySelector('.download-cv-button');
                if (existingCvButton) {
                    existingCvButton.remove();
                }
                // Add Download CV button
                const downloadCvButton = document.createElement('a');
                downloadCvButton.href = 'cv.pdf'; // Assuming cv.pdf is in the root
                downloadCvButton.textContent = uiText.download_cv_button || (lang === 'ar' ? 'تحميل السيرة الذاتية' : 'Download CV');
                downloadCvButton.classList.add('cta-button', 'download-cv-button');
                downloadCvButton.setAttribute('target', '_blank'); // Open in new tab
                downloadCvButton.style.marginTop = '1.5rem'; // Add some space
                
                const ctaButton = heroTextDiv.querySelector('.cta-button'); // Find existing CTA
                if (ctaButton && ctaButton.nextSibling) {
                    heroTextDiv.insertBefore(downloadCvButton, ctaButton.nextSibling);
                } else if (ctaButton) {
                    heroTextDiv.appendChild(downloadCvButton);
                } else {
                     // If no CTA button, find tagline and insert after it
                    const taglineElement = document.getElementById('hero-tagline');
                    if (taglineElement) {
                        taglineElement.insertAdjacentElement('afterend', downloadCvButton);
                    } else {
                        heroTextDiv.appendChild(downloadCvButton); // Fallback
                    }
                }
            }
            
            const heroPersonalPhoto = document.getElementById('hero-personal-photo');
            if (heroPersonalPhoto) heroPersonalPhoto.src = aboutMeData.profile_image;

            const aboutMeIntroSection = document.getElementById('about-me-intro');
            if (aboutMeIntroSection) {
                aboutMeIntroSection.innerHTML = `
                    <h2>${aboutMeData.name}</h2>
                    <p class="tagline">${aboutMeData.tagline}</p>
                    <p>${aboutMeData.introduction}</p>
                `;
            }
            
            const contactInfoShowcase = document.getElementById('contact-info-showcase');
            if (contactInfoShowcase && aboutMeData.contact_details) {
                const { email, phone, linkedin } = aboutMeData.contact_details;
                contactInfoShowcase.innerHTML = `
                    <p><i class="fas fa-envelope"></i> <a href="mailto:${email}">${email}</a></p>
                    <p><i class="fas fa-phone"></i> ${phone}</p>
                    ${linkedin ? `<p><i class="fab fa-linkedin"></i> <a href="https://linkedin.com/in/${linkedin}" target="_blank">${uiText.contact_my_linkedin || 'LinkedIn Profile'}</a></p>` : ''}
                `;
            }

            this.typingTextsMaster[lang] = [];
            this.typingTextsMaster[lang].push(aboutMeData.title);
            if (this.cvData[lang].my_toolkit && this.cvData[lang].my_toolkit.categories) {
                this.cvData[lang].my_toolkit.categories.forEach(category => {
                    this.typingTextsMaster[lang].push(`${uiText.hero_i_am_specialized_in || (lang === 'ar' ? 'فنان في' : 'An artist in')} ${category.name}`);
                });
            }
            this.typingTextsMaster[lang].push(uiText.hero_generic_skill || (lang === 'ar' ? "مبتكر حلول تقنية شاملة." : "An innovator of comprehensive tech solutions."));
        },
        
        populateJourney(lang) {
            if (!this.cvData || !this.cvData[lang] || !this.cvData[lang].my_journey) return;
            const journeyData = this.cvData[lang].my_journey;
            const timelineContainer = document.querySelector('.timeline-container');
            const journeyIntroP = document.getElementById('journey-intro');

            if(journeyIntroP) journeyIntroP.textContent = journeyData.intro || "";

            if (!timelineContainer) return;
            timelineContainer.innerHTML = ''; 

            journeyData.timeline.forEach(item => {
                const timelineItem = document.createElement('div');
                timelineItem.classList.add('timeline-item', `timeline-item-${item.type}`);
                timelineItem.innerHTML = `
                    <div class="timeline-icon"><i class="fas fa-${item.icon || 'circle'}"></i></div>
                    <div class="timeline-content">
                        <span class="timeline-period">${item.period}</span>
                        <h3>${item.heading}</h3>
                        ${item.subheading ? `<h4>${item.subheading}</h4>` : ''}
                        <p>${item.description}</p>
                    </div>
                `;
                timelineContainer.appendChild(timelineItem);
            });
        },

        populateToolkit(lang) {
            if (!this.cvData || !this.cvData[lang] || !this.cvData[lang].my_toolkit) return;
            const toolkitData = this.cvData[lang].my_toolkit;
            const toolkitGrid = document.querySelector('.toolkit-grid');
            const toolkitIntroP = document.getElementById('toolkit-intro');

            if(toolkitIntroP) toolkitIntroP.textContent = toolkitData.intro_text || "";

            if (!toolkitGrid) return;
            toolkitGrid.innerHTML = '';

            toolkitData.categories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.classList.add('toolkit-category-card');
                
                let skillsHtml = '<ul class="skills-list-detailed">';
                if (category.skills && category.skills.length > 0) {
                    category.skills.forEach(skill => {
                        skillsHtml += `
                            <li class="skill-item">
                                <div class="skill-name-progress">
                                    <span class="skill-name">${skill.name}</span>
                                    ${skill.level_percentage ? `
                                    <div class="skill-level-indicator">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar" style="width: ${skill.level_percentage}%;">

                                            </div>
                                        </div>
                                        <span class="skill-percentage-text">${skill.level_percentage}%</span>
                                    </div>` : ''}
                                </div>
                                ${skill.details ? `<p class="skill-details">${skill.details}</p>` : ''}
                            </li>`;
                    });
                }
                skillsHtml += '</ul>';

                categoryCard.innerHTML = `
                    <div class="toolkit-category-header">
                        <i class="fas fa-${category.icon || 'tools'}"></i>
                        <h3>${category.name}</h3>
                    </div>
                    ${category.description ? `<p class="category-description">${category.description}</p>` : ''}
                    ${skillsHtml}
                `;
                toolkitGrid.appendChild(categoryCard);
            });
        },

        populateRecognitions(lang) {
            if (!this.cvData || !this.cvData[lang] || !this.cvData[lang].recognitions) return;
            const recogData = this.cvData[lang].recognitions;
            
            const langShowcaseDiv = document.getElementById('languages-showcase');
            const certShowcaseDiv = document.getElementById('certificates-showcase');
            const langIntroText = document.getElementById('languages-intro-text');
            const certIntroText = document.getElementById('certificates-intro-text');

            if (langIntroText) langIntroText.textContent = recogData.languages_intro || "";
            if (certIntroText) certIntroText.textContent = recogData.certificates_intro || "";

            if (langShowcaseDiv && recogData.languages) {
                let langHtml = '<ul class="languages-list-detailed">'; // Use a class similar to skills for potential styling
                recogData.languages.forEach(l => {
                    langHtml += `
                        <li class="language-item">
                            <div class="language-name-progress">
                                <span class="language-name">${l.language} (${l.proficiency})</span>
                                ${l.level_percentage ? `
                                <div class="skill-level-indicator">
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" style="width: ${l.level_percentage}%;">
                                        </div>
                                    </div>
                                    <span class="skill-percentage-text">${l.level_percentage}%</span>
                                </div>` : `<span class="language-proficiency-text">${l.proficiency}</span>`}
                            </div>
                        </li>`;
                });
                langHtml += '</ul>';
                const existingH3Lang = langShowcaseDiv.querySelector('h3');
                langShowcaseDiv.innerHTML = '';
                if(existingH3Lang) langShowcaseDiv.appendChild(existingH3Lang);
                langShowcaseDiv.insertAdjacentHTML('beforeend', langHtml);
            }

            if (certShowcaseDiv && recogData.certificates) {
                let certHtml = '<ul class="certificates-list">';
                recogData.certificates.forEach(cert => {
                    const downloadButtonText = this.cvData[lang]?.ui_text?.download_certificate_button || (lang === 'ar' ? 'تحميل الشهادة' : 'Download Certificate');
                    let downloadButtonHtml = '';
                    if (cert.file) {
                        downloadButtonHtml = `<a href="${cert.file}" target="_blank" class="cta-button-small download-certificate-button">${downloadButtonText}</a>`;
                    }

                    certHtml += `
                        <li class="certificate-item">
                            <div class="certificate-main-content">
                                <div class="certificate-info">
                                    <i class="fas fa-${cert.issuer_icon || 'certificate'}"></i>
                                    <div class="certificate-info-text">
                                        <strong>${cert.name}</strong>
                                        <span>${cert.date ? `(${cert.date})` : ''}</span>
                                    </div>
                                </div>
                                ${cert.description ? `<p class="certificate-description">${cert.description}</p>` : ''}
                            </div>
                            ${downloadButtonHtml}
                        </li>`;
                });
                certHtml += '</ul>';
                const existingH3Cert = certShowcaseDiv.querySelector('h3');
                certShowcaseDiv.innerHTML = ''; 
                if(existingH3Cert) certShowcaseDiv.appendChild(existingH3Cert);
                certShowcaseDiv.insertAdjacentHTML('beforeend', certHtml);
            }
        },

        setupTypingAnimation(lang) {
            this.typeIndex = 0; 
            this.charIndex = 0;
            this.isDeleting = false;
            if (this.typingTextElement) this.typingTextElement.textContent = ''; 

            const textsForLang = this.typingTextsMaster[lang];
            if (textsForLang && textsForLang.length > 0 && this.typingTextElement && this.cursorElement) {
                this.type();
            } else if (this.typingTextElement) {
                this.typingTextElement.textContent = this.cvData?.[lang]?.about_me?.title || (lang === 'ar' ? "مبتكر ومطور" : "Innovator and Developer");
                if(this.cursorElement) this.cursorElement.style.display = 'none';
            }
        },

        type() {
            const textsForLang = this.typingTextsMaster[this.currentLang];
            if (!textsForLang || textsForLang.length === 0) return;

            const currentText = textsForLang[this.typeIndex];
            let typeSpeed = 150;

            if (this.isDeleting) {
                this.typingTextElement.textContent = currentText.substring(0, this.charIndex - 1);
                this.charIndex--;
                typeSpeed = 75;
            } else {
                this.typingTextElement.textContent = currentText.substring(0, this.charIndex + 1);
                this.charIndex++;
            }

            if (!this.isDeleting && this.charIndex === currentText.length) {
                this.isDeleting = true;
                typeSpeed = 2000;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.typeIndex = (this.typeIndex + 1) % textsForLang.length;
                typeSpeed = 500;
            }
            setTimeout(() => {
                if (textsForLang === this.typingTextsMaster[this.currentLang]) { 
                    this.type();
                }
            }, typeSpeed);
        },

        populatePortfolio(lang) { 
            if (!this.portfolioData || !this.portfolioData[lang] || !this.portfolioData[lang].projects) return;
            const currentLangPortfolio = this.portfolioData[lang];
            const portfolioGrid = document.getElementById('portfolio-grid');
            if (!portfolioGrid) return;

            portfolioGrid.innerHTML = '';

            // Process existing projects
            currentLangPortfolio.projects.forEach(project => {
                const item = document.createElement('div');
                item.classList.add('portfolio-item');
                item.setAttribute('data-id', project.id);

                let mediaHtml = '';
                if (project.video_url) {
                    // Create a video element for the project with proper styling
                    mediaHtml = `<div class="portfolio-media-container video-container">
                        <video class="portfolio-video" controls preload="metadata">
                            <source src="${project.video_url}" type="video/mp4">
                            ${lang === 'ar' ? 'متصفحك لا يدعم تشغيل الفيديو' : 'Your browser does not support the video tag'}
                        </video>
                    </div>`;
                } else if (project.image) {
                    mediaHtml = `<div class="portfolio-media-container">
                        <img src="${project.image}" alt="${project.title}">
                    </div>`;
                } else {
                    mediaHtml = `<div class="portfolio-media-container">
                        <div class="video-placeholder">${lang === 'ar' ? 'مشروع' : 'Project'}: ${project.title} (${lang === 'ar' ? 'لا توجد صورة' : 'No image'})</div>
                    </div>`;
                }

                item.innerHTML = `
                    ${mediaHtml}
                    <div class="portfolio-item-content">
                        <h4>${project.title}</h4>
                        <span class="category">${project.category}</span>
                        <p>${project.description}</p>
                        <div class="technologies">
                            ${project.technologies.map(tech => `<span>${tech}</span>`).join('')}
                        </div>
                        <div class="project-links">
                            ${project.live_url && project.live_url !== "#" ? `<a href="${project.live_url}" target="_blank" class="cta-button-small">${project.view_live_button || (lang === 'ar' ? 'مشاهدة مباشرة' : 'View Live')}</a>` : ''}
                            ${project.source_code_url && project.source_code_url !== "#" ? `<a href="${project.source_code_url}" target="_blank" class="cta-button-small outline">${project.view_source_button || (lang === 'ar' ? 'الكود المصدري' : 'Source Code')}</a>` : ''}
                        </div>
                    </div>
                `;
                portfolioGrid.appendChild(item);
            });
            
            // Add a placeholder card for future projects
            const comingSoonItem = document.createElement('div');
            comingSoonItem.classList.add('portfolio-item', 'coming-soon-item');
            
            const comingSoonText = lang === 'ar' ? 
                'سيتم إضافة المزيد من المشاريع تدريجياً. ترقبوا الإضافات الجديدة!' : 
                'More projects will be added gradually. Stay tuned for new additions!';
                
            comingSoonItem.innerHTML = `
                <div class="portfolio-media-container">
                    <div class="coming-soon-placeholder">
                        <i class="fas fa-code"></i>
                    </div>
                </div>
                <div class="portfolio-item-content">
                    <h4>${lang === 'ar' ? 'قريباً' : 'Coming Soon'}</h4>
                    <span class="category">${lang === 'ar' ? 'مشاريع مستقبلية' : 'Future Projects'}</span>
                    <p>${comingSoonText}</p>
                </div>
            `;
            
            portfolioGrid.appendChild(comingSoonItem);
        },

        applyTheme(themeName) {
            document.body.className = ''; 
            document.body.classList.add(themeName); 
            localStorage.setItem('theme', themeName);
            this.currentTheme = themeName;
            
            if (this.heroParticles && this.heroParticles.length > 0) {
                this.heroParticles.forEach(p => {
                    p.color = this.currentTheme === 'dark-theme' ? 'rgba(0, 245, 212, 0.3)' : 'rgba(0, 123, 255, 0.3)';
                });
            }

            if (this.cvData && this.cvData[this.currentLang] && this.cvData[this.currentLang].ui_text) {
                const uiText = this.cvData[this.currentLang].ui_text;
                const themeButton = document.getElementById('theme-toggle-button');
                if (themeButton && uiText.theme_toggle_dark && uiText.theme_toggle_light) {
                    const moonIcon = themeButton.querySelector('.icon-moon');
                    const sunIcon = themeButton.querySelector('.icon-sun');
                    if (moonIcon && sunIcon) {
                        if (themeName === 'light-theme') {
                            moonIcon.style.display = 'inline-block';
                            sunIcon.style.display = 'none';
                            themeButton.title = uiText.theme_toggle_dark;
                        } else {
                            moonIcon.style.display = 'none';
                            sunIcon.style.display = 'inline-block';
                            themeButton.title = uiText.theme_toggle_light;
                        }
                    }
                }
            }
        },

        toggleTheme() {
            const newTheme = this.currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
            this.applyTheme(newTheme);
        },

        setupEventListeners() {
            const themeButton = document.getElementById('theme-toggle-button');
            if (themeButton) {
                themeButton.addEventListener('click', () => this.toggleTheme());
            }

            const langButton = document.getElementById('language-toggle-button');
            if (langButton) {
                langButton.addEventListener('click', () => {
                    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
                    this.setLanguage(newLang);
                });
            }
            
            // Mobile Navigation
            const burger = document.querySelector('.burger');
            const navLinks = document.querySelector('.nav-links');
            const navLinkItems = document.querySelectorAll('.nav-links li');

            if (burger && navLinks) {
                burger.addEventListener('click', () => {
                    navLinks.classList.toggle('nav-active');
                    burger.classList.toggle('toggle');
                    document.body.classList.toggle('nav-open-overflow-hidden'); // Toggle class on body

                    navLinkItems.forEach((link, index) => {
                        if (link.style.animation) link.style.animation = '';
                        else {
                            const animationName = document.documentElement.dir === 'rtl' ? 'navLinkFadeRTL' : 'navLinkFadeLTR';
                            link.style.animation = `${animationName} 0.5s ease forwards ${index / 7 + 0.3}s`;
                        }
                    });
                });
            }

            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        if (navLinks && navLinks.classList.contains('nav-active')) {
                            navLinks.classList.remove('nav-active');
                            if(burger) burger.classList.remove('toggle');
                            document.body.classList.remove('nav-open-overflow-hidden'); // Remove class from body
                            navLinkItems.forEach(link => link.style.animation = '');
                        }
                    }
                });
            });

            const contactForm = document.getElementById('contact-form');
            if (contactForm) {
                contactForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const message = this.cvData?.[this.currentLang]?.ui_text?.contact_form_submitted || "Message sent (demo).";
                    alert(message);
                    contactForm.reset();
                });
            }
        },

        updateCopyrightYear() {
            const yearSpan = document.getElementById('current-year');
            if (yearSpan) {
                yearSpan.textContent = new Date().getFullYear();
            }
        }
    };

    app.init();
});