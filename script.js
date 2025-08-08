// Main JavaScript file for Sharon K. Lowry Law website

// Global functions that need to be accessible to onclick handlers
function showSection(sectionName) {
    // Hide all sections
    const blogSection = document.getElementById('blog-section');
    const faqSection = document.getElementById('faq-section');
    
    if (blogSection) blogSection.style.display = 'none';
    if (faqSection) faqSection.style.display = 'none';
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function toggleFaq(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('i');
    
    if (answer.style.display === 'none' || answer.style.display === '') {
        answer.style.display = 'block';
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
        faqItem.classList.add('active');
    } else {
        answer.style.display = 'none';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
        faqItem.classList.remove('active');
    }
}

// Blog post toggle function removed - posts now display in full

document.addEventListener('DOMContentLoaded', function() {
    

    
    // Initialize all functionality
    initNavigation();
    initAnimations();
    initScrollEffects();
    initAccessibility();
    initFormConditionalFields();

    
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
    

    // Initialize additional features
    initContactForm();
    initAnalytics();
    initPerformanceOptimizations();
    initFormConditionalFields();
    
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







// Service-specific form handlers
const handleServiceForm = async (formId, serviceType) => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
        
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Add service type to data
            data.serviceType = serviceType;
            data.legalService = serviceType; // For compatibility with existing backend
            
            // Handle checkboxes for Powers of Attorney form
            if (formId === 'powerAttorneyForm') {
                const documents = [];
                form.querySelectorAll('input[name="documents"]:checked').forEach(checkbox => {
                    documents.push(checkbox.value);
                });
                data.documents = documents.join(', ');
            }
            
            const response = await fetch('/api/consultation-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit request');
            }
            
            // Show success message with toast notification
            showToast(`${serviceType} request submitted successfully!`, 'success');
            
            // Reset form
            form.reset();
        } catch (error) {
            console.error(`Error submitting ${serviceType} request:`, error);
            showToast('Failed to submit request. Please try again.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
};

// Toast notification function
function showToast(message, type) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--purple-primary)' : '#dc3545'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: 500;
        max-width: 350px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Initialize service-specific forms when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the DOM to be fully ready
    setTimeout(() => {
        handleServiceForm('willsEstateForm', 'Wills & Estate Planning');
        handleServiceForm('probateForm', 'Probate Administration');
        handleServiceForm('heirshipForm', 'Applications for Heirship');
        handleServiceForm('powerAttorneyForm', 'Powers of Attorney');
        handleServiceForm('guardianshipForm', 'Guardianship Applications');
        handleServiceForm('smallEstateForm', 'Small Estate Affidavits');
    }, 100);
});

// Initialize conditional form fields for estate planning form
function initFormConditionalFields() {
    // Show/hide grandchildren details based on hasGrandchildren selection
    const hasGrandchildrenSelect = document.getElementById('hasGrandchildren');
    if (hasGrandchildrenSelect) {
        hasGrandchildrenSelect.addEventListener('change', function() {
            const grandchildrenDetails = document.getElementById('grandchildrenDetails');
            if (this.value === 'yes') {
                grandchildrenDetails.style.display = 'block';
            } else {
                grandchildrenDetails.style.display = 'none';
            }
        });
    }

    // Show/hide primary beneficiaries field based on spouse estate selection
    const leaveEntireEstateToSpouseSelect = document.getElementById('leaveEntireEstateToSpouse');
    if (leaveEntireEstateToSpouseSelect) {
        leaveEntireEstateToSpouseSelect.addEventListener('change', function() {
            const primaryBeneficiariesField = document.getElementById('primaryBeneficiariesField');
            if (this.value === 'no') {
                primaryBeneficiariesField.style.display = 'block';
            } else {
                primaryBeneficiariesField.style.display = 'none';
            }
        });
    }

    // Show/hide other arrangements field based on burial preference
    const burialPreferenceSelect = document.getElementById('burialPreference');
    if (burialPreferenceSelect) {
        burialPreferenceSelect.addEventListener('change', function() {
            const otherArrangementDetails = document.getElementById('otherArrangementDetails');
            if (this.value === 'other') {
                otherArrangementDetails.style.display = 'block';
            } else {
                otherArrangementDetails.style.display = 'none';
            }
        });
    }

    // Show/hide pet care details based on hasPets selection
    const hasPetsSelect = document.getElementById('hasPets');
    if (hasPetsSelect) {
        hasPetsSelect.addEventListener('change', function() {
            const petCareDetails = document.getElementById('petCareDetails');
            if (this.value === 'yes') {
                petCareDetails.style.display = 'block';
            } else {
                petCareDetails.style.display = 'none';
            }
        });
    }

    // Show/hide legal proceedings details based on legalProceedings selection
    const legalProceedingsSelect = document.getElementById('legalProceedings');
    if (legalProceedingsSelect) {
        legalProceedingsSelect.addEventListener('change', function() {
            const legalProceedingsDetails = document.getElementById('legalProceedingsDetails');
            if (this.value === 'yes') {
                legalProceedingsDetails.style.display = 'block';
            } else {
                legalProceedingsDetails.style.display = 'none';
            }
        });
    }
}

// Export functions for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPhoneNumber,
        isValidEmail,
        toggleBlogPost,
        toggleFaq,
        showSection,
        adminLogin,
        handleServiceForm,
        showToast,
        initFormConditionalFields
    };
}


