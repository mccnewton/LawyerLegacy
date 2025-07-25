// Main JavaScript file for Sharon K. Lowry Law website

// Global consultation bot variables
let currentStep = 'name';
let userData = {};
let conversationState = {
    step: 0,
    data: {
        name: '',
        email: '',
        phone: '',
        serviceType: '',
        timeline: '',
        details: '',
        urgency: ''
    }
};

document.addEventListener('DOMContentLoaded', function() {
    
    // Prevent hash-based scrolling on contact page unless coming from services
    if (window.location.pathname.includes('contact.html') && window.location.hash) {
        const referrer = document.referrer;
        if (!referrer.includes('services.html')) {
            // Prevent default hash behavior
            history.replaceState(null, null, window.location.pathname);
            // Override any existing scroll position
            window.history.scrollRestoration = 'manual';
            window.scrollTo(0, 0);
        }
    }
    
    // Initialize all functionality
    initNavigation();
    initAnimations();
    initScrollEffects();
    initAccessibility();
    initFloatingChatbot();
    initConsultationBot();
    
    // Navigation functionality
    function initNavigation() {
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Handle navbar scroll effect
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Set active navigation link based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (href === 'index.html' && currentPage === '')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Smooth scroll for anchor links only when clicked, not on page load
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                
                // Special handling for #top - always scroll to very top
                if (href === '#top') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Force contact page to stay at top when accessed directly via menu
        if (window.location.pathname.includes('contact.html')) {
            const referrer = document.referrer;
            // If not coming from services page, force scroll to top and remove hash
            if (!referrer.includes('services.html')) {
                // Remove any hash from URL immediately
                if (window.location.hash) {
                    history.replaceState(null, null, window.location.pathname);
                }
                // Force scroll to top multiple times to override browser behavior
                window.scrollTo(0, 0);
                setTimeout(() => window.scrollTo(0, 0), 100);
                setTimeout(() => window.scrollTo(0, 0), 500);
                setTimeout(() => window.scrollTo(0, 0), 1000);
            }
        }
    }
    
    // Animation functionality
    function initAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);
        
        // Observe all fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
        
        // Enhanced hover effects for service cards
        document.querySelectorAll('.service-card, .testimonial-card, .contact-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // Pulse animation for CTA buttons
        document.querySelectorAll('.pulse-btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.animationPlayState = 'paused';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.animationPlayState = 'running';
            });
        });
    }
    
    // Scroll effects
    function initScrollEffects() {
        // Parallax effect for hero section
        const hero = document.querySelector('.hero-section');
        if (hero) {
            window.addEventListener('scroll', function() {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            });
        }
        
        // Show/hide scroll-to-top button (if implemented)
        const scrollTopBtn = document.querySelector('.scroll-top');
        if (scrollTopBtn) {
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    scrollTopBtn.style.opacity = '1';
                    scrollTopBtn.style.visibility = 'visible';
                } else {
                    scrollTopBtn.style.opacity = '0';
                    scrollTopBtn.style.visibility = 'hidden';
                }
            });
        }
        
        // Progressive enhancement for scroll-based animations
        const animateOnScroll = document.querySelectorAll('.hover-lift');
        const scrollObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });
        
        animateOnScroll.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            scrollObserver.observe(el);
        });
    }
    
    // Accessibility enhancements
    function initAccessibility() {
        // Add focus indicators for keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Announce page changes for screen readers
        const pageTitle = document.title;
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Page loaded: ${pageTitle}`;
        document.body.appendChild(announcement);
        
        // Enhanced button interactions
        document.querySelectorAll('button, .btn').forEach(btn => {
            btn.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
        
        // Skip link functionality
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link sr-only';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--purple-primary);
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            z-index: 9999;
            border-radius: 4px;
        `;
        
        skipLink.addEventListener('focus', function() {
            this.style.top = '6px';
            this.classList.remove('sr-only');
        });
        
        skipLink.addEventListener('blur', function() {
            this.style.top = '-40px';
            this.classList.add('sr-only');
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Contact form enhancements (if contact form is added later)
    function initContactForm() {
        const contactForm = document.querySelector('#contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Form validation
                const formData = new FormData(this);
                const errors = [];
                
                // Validate required fields
                if (!formData.get('name')?.trim()) {
                    errors.push('Name is required');
                }
                
                if (!formData.get('email')?.trim()) {
                    errors.push('Email is required');
                } else if (!isValidEmail(formData.get('email'))) {
                    errors.push('Please enter a valid email address');
                }
                
                if (!formData.get('message')?.trim()) {
                    errors.push('Message is required');
                }
                
                if (errors.length > 0) {
                    showFormErrors(errors);
                    return;
                }
                
                // Show success message
                showFormSuccess();
            });
        }
    }
    
    // Utility functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showFormErrors(errors) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'alert alert-danger';
        errorContainer.innerHTML = `
            <h5>Please correct the following errors:</h5>
            <ul class="mb-0">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        const form = document.querySelector('#contact-form');
        form.insertBefore(errorContainer, form.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
        
        // Scroll to errors
        errorContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    function showFormSuccess() {
        const successContainer = document.createElement('div');
        successContainer.className = 'alert alert-success';
        successContainer.innerHTML = `
            <h5><i class="fas fa-check-circle me-2"></i>Message Sent Successfully!</h5>
            <p class="mb-0">Thank you for your message. Sharon will get back to you soon.</p>
        `;
        
        const form = document.querySelector('#contact-form');
        form.innerHTML = '';
        form.appendChild(successContainer);
        
        successContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Phone number formatting
    function formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    }
    
    // Initialize phone number formatting for any phone inputs
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function() {
            this.value = formatPhoneNumber(this.value);
        });
    });
    
    // Google Analytics (if GA ID is provided)
    function initAnalytics() {
        // Track page views
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href
            });
        }
        
        // Track button clicks
        document.querySelectorAll('.pulse-btn, .btn-primary').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.textContent.trim();
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'click', {
                        event_category: 'engagement',
                        event_label: action
                    });
                }
            });
        });
        
        // Track phone number clicks
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
            link.addEventListener('click', function() {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'phone_call', {
                        event_category: 'contact',
                        event_label: this.href
                    });
                }
            });
        });
        
        // Track email clicks
        document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
            link.addEventListener('click', function() {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'email_click', {
                        event_category: 'contact',
                        event_label: this.href
                    });
                }
            });
        });
    }
    
    // Performance optimization
    function initPerformanceOptimizations() {
        // Lazy load images (if any are added later)
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
        
        // Preload critical resources
        const preloadLinks = [
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        ];
        
        preloadLinks.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    // Error handling
    window.addEventListener('error', function(e) {
        console.error('JavaScript error:', e.error);
        
        // Optional: Send error to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: e.error.toString(),
                fatal: false
            });
        }
    });
    
    // Consultation Bot functionality (for Contact page)
    function initConsultationBot() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const chatMessages = document.getElementById('chat-messages');
        const summarySection = document.getElementById('consultation-summary');
        const summaryContent = document.getElementById('summary-content');
        const scheduleBtn = document.getElementById('schedule-btn');

        // Only initialize if chatbot elements exist (on contact page)
        if (!chatInput || !sendBtn || !chatMessages) {
            return;
        }

        // Additional check: prevent scroll to chatbot if not coming from services
        const referrer = document.referrer;
        if (!referrer.includes('services.html')) {
            // Force page to stay at top
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }

        // Reset conversation state for contact page
        conversationState = {
            step: 0,
            data: {
                name: '',
                email: '',
                phone: '',
                serviceType: '',
                timeline: '',
                details: '',
                urgency: ''
            }
        };

        // Conversation flow questions
        const botQuestions = [
            {
                question: "Hello! I'm here to help you prepare for your consultation with Sharon K. Lowry. May I start by getting your name?",
                field: 'name',
                validation: (input) => input.trim().length > 0,
                errorMessage: "Please enter your name to continue."
            },
            {
                question: "Nice to meet you, {name}! What's the best email address to reach you at?",
                field: 'email',
                validation: (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input),
                errorMessage: "Please enter a valid email address."
            },
            {
                question: "Great! And what's your phone number? (This helps Sharon prepare for your call)",
                field: 'phone',
                validation: (input) => input.replace(/\D/g, '').length >= 10,
                errorMessage: "Please enter a valid phone number with at least 10 digits."
            },
            {
                question: "Perfect! Now, which legal service are you most interested in?",
                field: 'serviceType',
                options: [
                    'Will & Estate Planning',
                    'Probate Administration', 
                    'Applications for Heirship',
                    'Powers of Attorney',
                    'Guardianship Applications',
                    'Small Estate Affidavits',
                    'Not sure - need guidance'
                ],
                validation: (input) => input.trim().length > 0,
                errorMessage: "Please select a service or let me know if you need guidance."
            },
            {
                question: "Excellent choice. When would you like to schedule your consultation?",
                field: 'timeline',
                options: [
                    'As soon as possible',
                    'Within the next week',
                    'Within the next month',
                    'I have a flexible schedule',
                    'I need to discuss urgency first'
                ],
                validation: (input) => input.trim().length > 0,
                errorMessage: "Please let me know your preferred timing."
            },
            {
                question: "Finally, could you briefly describe your situation or any key details Sharon should know about? (For example: recent loss in family, estate size, specific concerns, etc.)",
                field: 'details',
                validation: (input) => input.trim().length > 10,
                errorMessage: "Please provide some details to help Sharon prepare for your consultation."
            }
        ];

        // Enable chat input initially, but only focus if user came from services page with hash
        setTimeout(() => {
            chatInput.disabled = false;
            sendBtn.disabled = false;
            
            // Only auto-focus if coming from services page with hash link
            const referrer = document.referrer;
            const hasHash = window.location.hash.includes('chat-messages');
            
            if (hasHash && referrer.includes('services.html')) {
                chatInput.focus();
            }
        }, 1000);

        // Handle enter key in chat input
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserResponse();
            }
        });

        // Handle send button click
        sendBtn.addEventListener('click', handleUserResponse);

        // Handle quick option clicks
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('quick-option')) {
                const value = e.target.textContent;
                chatInput.value = value;
                handleUserResponse();
            }
        });

        // Handle schedule button click
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', async function() {
                // Save consultation data to database
                try {
                    const response = await fetch('/api/consultation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: conversationState.data.name,
                            email: conversationState.data.email,
                            phone: conversationState.data.phone,
                            service_type: conversationState.data.serviceType,
                            timeline: conversationState.data.timeline,
                            case_details: conversationState.data.details
                        })
                    });

                    if (response.ok) {
                        // Show success message
                        addMessage("✅ Your consultation request has been saved! Sharon will review it and contact you soon.", 'bot');
                    }
                } catch (error) {
                    console.error('Error saving consultation:', error);
                    addMessage("⚠️ Your request was noted, but there was an issue saving it. Please call directly at (940) 765-4992.", 'bot');
                }

                // Generate consultation summary email
                const emailSubject = `Consultation Request - ${conversationState.data.name}`;
                const emailBody = generateEmailBody();
                const mailtoLink = `mailto:sklowry@sklowrylaw.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                
                // Open email client
                window.location.href = mailtoLink;
                
                // Also try to call the phone number
                setTimeout(() => {
                    if (confirm('Would you like to call Sharon directly now at (940) 765-4992?')) {
                        window.location.href = 'tel:9407654992';
                    }
                }, 500);
            });
        }

        function handleUserResponse() {
            const input = chatInput.value.trim();
            if (!input) return;

            // Add user message
            addMessage(input, 'user');
            chatInput.value = '';

            // Use shared consultation logic
            processSharedConsultationResponse(input, false);
        }

        function askNextQuestion() {
            const question = botQuestions[conversationState.step];
            let questionText = question.question;
            
            // Replace placeholders with user data
            Object.keys(conversationState.data).forEach(key => {
                questionText = questionText.replace(`{${key}}`, conversationState.data[key]);
            });
            
            addMessage(questionText, 'bot');

            // Add quick options if available
            if (question.options) {
                setTimeout(() => {
                    addQuickOptions(question.options);
                }, 300);
            }
        }

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = `<p>${text}</p>`;
            
            messageDiv.appendChild(contentDiv);
            chatMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function addQuickOptions(options) {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quick-options';
            
            options.forEach(option => {
                const optionBtn = document.createElement('button');
                optionBtn.className = 'quick-option';
                optionBtn.textContent = option;
                optionBtn.type = 'button';
                optionsDiv.appendChild(optionBtn);
            });

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            messageDiv.appendChild(optionsDiv);
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typing-indicator';
            
            const dotsDiv = document.createElement('div');
            dotsDiv.className = 'typing-dots';
            dotsDiv.innerHTML = '<span></span><span></span><span></span>';
            
            typingDiv.appendChild(dotsDiv);
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function hideTypingIndicator() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        function completeConsultation() {
            const completionMessage = `Thank you, ${conversationState.data.name}! I've gathered all the information Sharon needs to prepare for your consultation. Here's a summary of what we discussed:`;
            addMessage(completionMessage, 'bot');

            // Save response to localStorage
            saveConsultationResponse(conversationState.data);

            // Show summary
            setTimeout(() => {
                displaySummary();
                
                const finalMessage = `Sharon will review this information before your consultation. You can click "Schedule My Consultation" below to send this summary via email, or call (940) 765-4992 directly.`;
                addMessage(finalMessage, 'bot');
                
                // Update saved responses display
                displaySavedResponses();
            }, 800);
        }

        function displaySummary() {
            const summary = `
                <div class="summary-item"><strong>Name:</strong> ${conversationState.data.name}</div>
                <div class="summary-item"><strong>Email:</strong> ${conversationState.data.email}</div>
                <div class="summary-item"><strong>Phone:</strong> ${conversationState.data.phone}</div>
                <div class="summary-item"><strong>Service Needed:</strong> ${conversationState.data.serviceType}</div>
                <div class="summary-item"><strong>Timeline:</strong> ${conversationState.data.timeline}</div>
                <div class="summary-item"><strong>Details:</strong> ${conversationState.data.details}</div>
            `;
            
            summaryContent.innerHTML = summary;
            summarySection.style.display = 'block';
            
            // Scroll summary into view
            summarySection.scrollIntoView({ behavior: 'smooth' });
        }

        function generateEmailBody() {
            const { name, email, phone, serviceType, timeline, details } = conversationState.data;
            
            return `Dear Sharon,

I would like to schedule a consultation regarding ${serviceType.toLowerCase()}.

Contact Information:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}

Service Requested: ${serviceType}
Preferred Timeline: ${timeline}

Background/Details:
${details}

I look forward to hearing from you soon.

Best regards,
${name}

---
This request was submitted through the consultation assistant on sklowrylaw.com`;
        }

        // Local storage functions for saving consultation responses
        function saveConsultationResponse(data) {
            const responses = getConsultationResponses();
            const newResponse = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                data: { ...data }
            };
            responses.push(newResponse);
            localStorage.setItem('consultationResponses', JSON.stringify(responses));
        }

        function getConsultationResponses() {
            try {
                const stored = localStorage.getItem('consultationResponses');
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error('Error reading consultation responses:', error);
                return [];
            }
        }

        function deleteConsultationResponse(id) {
            const responses = getConsultationResponses();
            const filtered = responses.filter(response => response.id !== id);
            localStorage.setItem('consultationResponses', JSON.stringify(filtered));
            displaySavedResponses();
        }

        function displaySavedResponses() {
            const responsesSection = document.getElementById('saved-responses-section');
            const responsesList = document.getElementById('responses-list');
            const responsesEmpty = document.getElementById('responses-empty');
            
            if (!responsesSection || !responsesList || !responsesEmpty) return;

            const responses = getConsultationResponses();
            
            if (responses.length === 0) {
                responsesSection.style.display = 'none';
                return;
            }

            responsesSection.style.display = 'block';
            responsesEmpty.style.display = 'none';
            
            responsesList.innerHTML = '';
            
            responses.reverse().forEach(response => {
                const responseCard = createResponseCard(response);
                responsesList.appendChild(responseCard);
            });
        }

        function createResponseCard(response) {
            const { id, timestamp, data } = response;
            const date = new Date(timestamp);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const card = document.createElement('div');
            card.className = 'response-card';
            card.innerHTML = `
                <div class="response-header">
                    <div>
                        <h4 class="response-title">${data.name}</h4>
                        <p class="response-timestamp">${formattedDate}</p>
                    </div>
                    <button class="delete-response" onclick="deleteConsultationResponse('${id}')" title="Delete this response">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="response-body">
                    <div class="response-field">
                        <span class="response-label">Email:</span>
                        <span class="response-value">${data.email}</span>
                    </div>
                    <div class="response-field">
                        <span class="response-label">Phone:</span>
                        <span class="response-value">${data.phone}</span>
                    </div>
                    <div class="response-field">
                        <span class="response-label">Service:</span>
                        <span class="response-value">${data.serviceType}</span>
                    </div>
                    <div class="response-field">
                        <span class="response-label">Timeline:</span>
                        <span class="response-value">${data.timeline}</span>
                    </div>
                    <div class="response-details">
                        <span class="response-label">Case Details:</span>
                        <div class="response-value">${data.details}</div>
                    </div>
                </div>
                <div class="response-actions">
                    <a href="tel:${data.phone.replace(/\D/g, '')}" class="response-action action-call">
                        <i class="fas fa-phone"></i>
                        Call ${data.name.split(' ')[0]}
                    </a>
                    <a href="mailto:${data.email}?subject=Re: Your Consultation Request&body=Dear ${data.name},%0D%0A%0D%0AThank you for your consultation request regarding ${data.serviceType.toLowerCase()}. I would be happy to schedule a time to discuss your needs.%0D%0A%0D%0ABest regards,%0D%0ASharon K. Lowry" 
                       class="response-action action-email">
                        <i class="fas fa-envelope"></i>
                        Email ${data.name.split(' ')[0]}
                    </a>
                </div>
            `;

            return card;
        }

        // Initialize saved responses display on page load
        displaySavedResponses();

        // Make delete function globally available
        window.deleteConsultationResponse = deleteConsultationResponse;
    }

    // Initialize additional features
    initContactForm();
    initAnalytics();
    initPerformanceOptimizations();
    
    // Service worker registration (for future PWA features)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Uncomment when service worker is implemented
            // navigator.serviceWorker.register('/sw.js');
        });
    }
    
    // Console message for developers
    console.log('Sharon K. Lowry Law website loaded successfully');
    console.log('For technical support, contact the web development team');
});

// Blog post toggle functionality
function toggleBlogPost(postId) {
    const content = document.getElementById(postId + '-content');
    const icon = document.getElementById(postId + '-icon');
    
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        icon.classList.add('rotated');
    } else {
        content.style.display = 'none';
        icon.classList.remove('rotated');
    }
}

// Admin login functionality
async function adminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const messageDiv = document.getElementById('admin-login-message');
    
    if (!email || !password) {
        showAdminMessage('Please enter both email and password', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAdminMessage('Login successful! Redirecting to admin dashboard...', 'success');
            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 1500);
        } else {
            showAdminMessage(result.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAdminMessage('Connection error. Please try again.', 'error');
    }
}

function showAdminMessage(message, type) {
    const messageDiv = document.getElementById('admin-login-message');
    messageDiv.style.display = 'block';
    messageDiv.className = `mt-2 text-center small ${type === 'success' ? 'text-success' : 'text-danger'}`;
    messageDiv.textContent = message;
    
    if (type === 'error') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Global function for blog post toggle
function toggleBlogPost(postId) {
    const content = document.getElementById(postId);
    const icon = document.querySelector(`[onclick="toggleBlogPost('${postId}')"] .blog-toggle-icon`);
    
    if (content && icon) {
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            icon.classList.add('rotated');
        } else {
            content.style.display = 'none';
            icon.classList.remove('rotated');
        }
    }
}

// Simple Floating Chatbot
function initFloatingChatbot() {
    console.log('Initializing floating chatbot...');
    
    const chatBubble = document.getElementById('chatBubble');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    
    console.log('Chat elements found:', {
        bubble: !!chatBubble,
        window: !!chatWindow,
        close: !!chatClose,
        input: !!chatInput,
        send: !!chatSend,
        messages: !!chatMessages
    });
    
    if (!chatBubble || !chatWindow) {
        console.error('Required chatbot elements not found');
        return;
    }
    
    // Make sure the bubble is visible
    console.log('Making chat bubble visible...');
    chatBubble.style.display = 'flex';
    
    let isOpen = false;
    let currentStep = 0;
    let userData = {};
    
    const questions = [
        "Hello! I'm here to help you prepare for your consultation with Sharon K. Lowry. What's your name?",
        "Nice to meet you, {name}! What's your email address?",
        "Great! What's your phone number?",
        "Which legal service interests you most? (Will & Estate Planning, Probate Administration, Powers of Attorney, etc.)",
        "When would you like to schedule your consultation?",
        "Please share any details about your situation that would help Sharon prepare."
    ];
    
    function addMessage(text, isBot = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isBot ? 'bot' : 'user'}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = text;
        
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function askQuestion() {
        if (currentStep < questions.length) {
            let question = questions[currentStep];
            
            // Replace placeholders
            Object.keys(userData).forEach(key => {
                question = question.replace(`{${key}}`, userData[key]);
            });
            
            setTimeout(() => addMessage(question), 500);
        } else {
            // Conversation complete
            setTimeout(() => {
                addMessage(`Thank you, ${userData.name}! I've gathered all the information Sharon needs. She'll review this before your consultation.`);
                
                setTimeout(() => {
                    const emailSubject = `Consultation Request - ${userData.name}`;
                    const emailBody = `Name: ${userData.name}\nEmail: ${userData.email}\nPhone: ${userData.phone}\nService: ${userData.service}\nTimeline: ${userData.timeline}\nDetails: ${userData.details}`;
                    const mailtoLink = `mailto:sklowry@sklowrylaw.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    
                    if (confirm('Would you like to send this consultation summary via email?')) {
                        window.location.href = mailtoLink;
                    }
                }, 1000);
            }, 500);
        }
    }
    
    function handleResponse() {
        const input = chatInput.value.trim();
        if (!input) return;
        
        addMessage(input, false);
        
        // Store response
        const fields = ['name', 'email', 'phone', 'service', 'timeline', 'details'];
        if (currentStep < fields.length) {
            userData[fields[currentStep]] = input;
        }
        
        chatInput.value = '';
        currentStep++;
        askQuestion();
    }
    
    // Event listeners
    chatBubble.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('active', isOpen);
        
        if (isOpen && currentStep === 0) {
            // Start conversation
            askQuestion();
        }
    });
    
    chatClose.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.remove('active');
    });
    
    chatSend.addEventListener('click', handleResponse);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleResponse();
        }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (isOpen && !chatWindow.contains(e.target) && !chatBubble.contains(e.target)) {
            isOpen = false;
            chatWindow.classList.remove('active');
        }
    });
}

// Function to open chatbot from external links (like Start Planning buttons)
function openChatbot() {
    const chatBubble = document.getElementById('chatBubble');
    if (chatBubble) {
        chatBubble.click();
    }
}

// Initialize floating chatbot when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize floating chatbot
    initFloatingChatbot();
    
    // Other initialization code can go here
});

// Floating chatbot helper functions
function addFloatingMessage(text, sender, isQuickOptions = false) {
    const chatMessages = document.querySelector('#chatbot-window #chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (isQuickOptions) {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
                <div class="quick-options">${arguments[3]}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleFloatingEnter(e) {
    if (e.key === 'Enter') {
        handleFloatingResponse();
    }
}

function handleFloatingResponse() {
    const chatInput = document.querySelector('#chatbot-window #chat-input');
    const userInput = chatInput.value.trim();
    
    if (userInput) {
        addFloatingMessage(userInput, 'user');
        chatInput.value = '';
        
        // Process the response using shared consultation logic
        processSharedConsultationResponse(userInput, true);
    }
}

// Shared consultation processing function that works for both contact page and floating chatbot
function processSharedConsultationResponse(input, isFloating = false) {
    // Conversation flow questions (shared between contact page and floating chatbot)
    const botQuestions = [
        {
            question: "Hello! I'm here to help you prepare for your consultation with Sharon K. Lowry. May I start by getting your name?",
            field: 'name',
            validation: (input) => input.trim().length > 0,
            errorMessage: "Please enter your name to continue."
        },
        {
            question: "Nice to meet you, {name}! What's the best email address to reach you at?",
            field: 'email',
            validation: (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input),
            errorMessage: "Please enter a valid email address."
        },
        {
            question: "Great! And what's your phone number? (This helps Sharon prepare for your call)",
            field: 'phone',
            validation: (input) => input.replace(/\D/g, '').length >= 10,
            errorMessage: "Please enter a valid phone number with at least 10 digits."
        },
        {
            question: "Perfect! Now, which legal service are you most interested in?",
            field: 'serviceType',
            options: [
                'Will & Estate Planning',
                'Probate Administration',
                'Applications for Heirship',
                'Powers of Attorney',
                'Guardianship Applications',
                'Small Estate Affidavits'
            ]
        },
        {
            question: "Excellent choice! When would you like to schedule your consultation?",
            field: 'timeline',
            options: [
                'This week',
                'Next week',
                'Within 2 weeks',
                'This month',
                'I\'m flexible'
            ]
        },
        {
            question: "Finally, please share any important details about your situation that would help Sharon prepare for your consultation:",
            field: 'details',
            validation: (input) => input.trim().length > 0,
            errorMessage: "Please provide some details about your situation."
        }
    ];

    // Validate input
    const currentQuestion = botQuestions[conversationState.step];
    if (currentQuestion && currentQuestion.validation && !currentQuestion.validation(input)) {
        setTimeout(() => {
            if (isFloating) {
                addFloatingMessage(currentQuestion.errorMessage, 'bot');
            } else {
                addMessage(currentQuestion.errorMessage, 'bot');
            }
        }, 500);
        return;
    }

    // Store user data
    if (currentQuestion && currentQuestion.field) {
        conversationState.data[currentQuestion.field] = input;
        
        // Format phone number
        if (currentQuestion.field === 'phone') {
            conversationState.data.phone = formatPhoneNumber(input);
        }
    }

    conversationState.step++;

    // Show typing indicator and continue conversation
    setTimeout(() => {
        if (conversationState.step < botQuestions.length) {
            // Ask next question
            const question = botQuestions[conversationState.step];
            let questionText = question.question;
            
            // Replace placeholders with user data
            Object.keys(conversationState.data).forEach(key => {
                questionText = questionText.replace(`{${key}}`, conversationState.data[key]);
            });
            
            if (isFloating) {
                addFloatingMessage(questionText, 'bot');
                
                // Add quick options if available
                if (question.options) {
                    setTimeout(() => {
                        addFloatingQuickOptions(question.options);
                    }, 300);
                }
            } else {
                addMessage(questionText, 'bot');
                
                // Add quick options if available
                if (question.options) {
                    setTimeout(() => {
                        addQuickOptions(question.options);
                    }, 300);
                }
            }
        } else {
            // Conversation complete
            completeSharedConsultation(isFloating);
        }
    }, 1500);
}

// Generate email body for consultation summary
function generateEmailBody() {
    return `New Consultation Request

Name: ${conversationState.data.name}
Email: ${conversationState.data.email}
Phone: ${conversationState.data.phone}
Service Interest: ${conversationState.data.serviceType}
Timeline: ${conversationState.data.timeline}
Details: ${conversationState.data.details}

This consultation request was submitted through the website consultation assistant.

Best regards,
Website Consultation Assistant`;
}

function addFloatingQuickOptions(options) {
    const chatMessages = document.querySelector('#chatbot-window #chat-messages');
    if (!chatMessages) return;
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'quick-options';
    
    options.forEach(option => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'quick-option';
        optionBtn.textContent = option;
        optionBtn.type = 'button';
        optionBtn.addEventListener('click', () => {
            processSharedConsultationResponse(option, true);
        });
        optionsDiv.appendChild(optionBtn);
    });

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.appendChild(optionsDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function completeSharedConsultation(isFloating = false) {
    const completionMessage = `Thank you, ${conversationState.data.name}! I've gathered all the information Sharon needs to prepare for your consultation.`;
    
    if (isFloating) {
        addFloatingMessage(completionMessage, 'bot');
        
        setTimeout(() => {
            const finalMessage = `Sharon will review this information before your consultation. You can call (940) 765-4992 directly to schedule your meeting.`;
            addFloatingMessage(finalMessage, 'bot');
            
            // Generate email summary
            const emailSubject = `Consultation Request - ${conversationState.data.name}`;
            const emailBody = generateEmailBody();
            const mailtoLink = `mailto:sklowry@sklowrylaw.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            
            setTimeout(() => {
                if (confirm('Would you like to send this consultation summary via email?')) {
                    window.location.href = mailtoLink;
                }
            }, 1000);
        }, 800);
    } else {
        // Use existing contact page completion logic
        completeConsultation();
    }
}

// Export functions for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPhoneNumber,
        isValidEmail,
        toggleBlogPost,
        adminLogin
    };
}
