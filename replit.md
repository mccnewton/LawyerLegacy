# Sharon K. Lowry Law Website

## Overview

This is a professional law firm website for Sharon K. Lowry, an estate planning and probate attorney based in Denton, TX. The website is built as a static frontend application using modern web technologies to provide information about legal services, attorney background, and client contact options.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Static Website**: Multi-page HTML structure with shared navigation and styling
- **Responsive Design**: Bootstrap 5.3.0 framework for mobile-first responsive layout
- **Progressive Enhancement**: Vanilla JavaScript for interactive features and animations
- **SEO Optimized**: Semantic HTML structure with proper meta tags and descriptions

### Technology Stack
- **HTML5**: Semantic markup with accessibility considerations
- **CSS3**: Custom CSS with CSS variables for consistent theming
- **Bootstrap 5.3.0**: Responsive grid system and UI components
- **Font Awesome 6.4.0**: Icon library for visual elements
- **Vanilla JavaScript**: Client-side interactivity without framework dependencies

## Key Components

### Page Structure
1. **index.html**: Homepage with hero section and service overview
2. **about.html**: Attorney biography and credentials
3. **blog.html**: Legal insights and educational content
4. **contact.html**: Contact information, Google Maps integration, and interactive consultation chatbot
5. **styles.css**: Global styling with purple branding theme
6. **script.js**: Interactive functionality, animations, and chatbot logic

### Navigation System
- Fixed-top navigation bar with responsive collapse for mobile
- Active page highlighting based on current URL
- Smooth scrolling for anchor links
- Scroll-based styling changes for enhanced UX

### Interactive Features
- **Consultation Chatbot**: Interactive assistant on contact page that collects client information through conversational interface
- **Client Data Collection**: Gathers name, email, phone, service type, timeline, and case details
- **Smart Validation**: Real-time input validation for email and phone formats
- **Quick Options**: Pre-defined response buttons for common selections
- **Email Integration**: Generates consultation summary emails to Sharon's inbox
- **Professional Animations**: Typing indicators, message animations, and smooth transitions

### Design System
- **Color Palette**: Purple-based theme (primary: #6c5ce7) for legal professionalism
- **Typography**: System fonts (Segoe UI family) for readability and performance
- **Animations**: CSS-based fade-in effects and smooth transitions
- **Accessibility**: Semantic HTML and keyboard navigation support

## Data Flow

### Static Content Delivery
1. HTML pages served directly from web server
2. CSS and JavaScript assets loaded via CDN (Bootstrap, Font Awesome) and local files
3. No server-side processing or database interactions
4. Client-side JavaScript handles UI interactions and animations

### User Interactions
1. Navigation between pages via standard HTTP requests
2. Form submissions (contact forms) would require backend integration
3. JavaScript handles smooth scrolling and visual feedback
4. Responsive design adapts to different screen sizes

## External Dependencies

### CDN Resources
- **Bootstrap 5.3.0**: UI framework and responsive utilities
- **Font Awesome 6.4.0**: Icon library for visual elements

### Third-Party Integrations
- Currently no external API integrations
- Contact forms would require email service integration (future enhancement)
- Analytics tracking could be added (Google Analytics, etc.)

## Deployment Strategy

### Static Hosting
- **Approach**: Static file hosting suitable for GitHub Pages, Netlify, Vercel, or traditional web servers
- **Build Process**: No build step required - direct file deployment
- **Performance**: Fast loading with CDN-delivered assets and minimal JavaScript

### Future Considerations
- **Content Management**: Could be enhanced with headless CMS for blog content
- **Contact Forms**: Backend service needed for form processing and email delivery
- **Analytics**: Third-party analytics service integration for visitor tracking
- **SEO**: Already optimized with proper meta tags and semantic HTML

### Scalability
- Current architecture supports adding more pages easily
- JavaScript is modular and can be extended
- CSS variables allow for easy theme customization
- Bootstrap framework provides consistent design patterns for expansion