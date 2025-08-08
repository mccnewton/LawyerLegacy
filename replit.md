# Sharon K. Lowry Law Website

## Overview
This project is a professional law firm website for Sharon K. Lowry, an estate planning and probate attorney. The site aims to provide comprehensive information about legal services, attorney background, and contact options to potential clients. It serves as a static frontend application, featuring professional photography to establish credibility and local connection. The business vision is to provide a clear and direct pathway for clients to access information and initiate legal consultations efficiently, supporting Sharon K. Lowry's practice in Denton, TX.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The website is built as a static, multi-page frontend application emphasizing responsiveness and user experience.

### Frontend Architecture
- **Static Website**: Multi-page HTML structure with shared navigation and styling.
- **Responsive Design**: Utilizes Bootstrap 5.3.0 for a mobile-first, responsive layout.
- **Progressive Enhancement**: Vanilla JavaScript is used for interactive features and animations.
- **SEO Optimized**: Employs semantic HTML with proper meta tags and descriptions.

### Technology Stack
- **HTML5**: Semantic markup for accessibility.
- **CSS3**: Custom CSS with variables for consistent theming, primarily a deep royal purple (#4B0082) color palette.
- **Bootstrap 5.3.0**: Responsive grid system and UI components.
- **Font Awesome 6.4.0**: Icon library for visual elements.
- **Vanilla JavaScript**: Client-side interactivity without external framework dependencies.

### Key Features and Design Decisions
- **Comprehensive Estate Planning Form**: Includes 25 fields organized into 6 logical sections with conditional visibility, single-line layout for cleaner appearance, and open text field for additional details/questions.
- **Complete Footer Navigation**: All dedicated service pages feature "Other Practice Areas" sections listing the 5 alternative services with direct links, excluding only the current page service.
- **Enhanced Testimonials Section**: Features 6 authentic client testimonials from various platforms.
- **Streamlined Contact Page**: Incorporates a "Get Started with Sharon" section with 6 attractive service buttons linking to dedicated practice area forms.
- **Direct Service Navigation**: Home page service cards and contact page buttons link directly to individual service form pages, bypassing intermediate navigation.
- **Dedicated Service Pages**: Six dedicated pages for services (Wills & Estate Planning, Probate Administration, Applications for Heirship, Powers of Attorney, Guardianship Applications, Small Estate Affidavits), each with detailed information and specific consultation forms.
- **Blog/Resources Enhancement**: Individual blog post pages with full content, professional layouts, and a card-based navigation system on the Resources page.
- **Navigation Update**: Renamed "Legal Services" to "Practice Areas" and "Blog & FAQ" to "Resources", with a consistent updated navigation order.
- **Enhanced Email System**: Automated email notifications with form-specific identification in subject lines and improved formatting for readability.
- **Consultation Request System**: Backend system to securely store client inquiries (name, email, phone, legal service, message) for admin review, with email notifications.
- **Authentication System Removal**: All authentication systems (OAuth, admin dashboard) have been completely removed, streamlining the codebase to focus solely on client consultation requests.
- **Design System**: Consistent color palette (purple-based), typography (Segoe UI family), CSS-based animations, and accessibility considerations.

## External Dependencies

### CDN Resources
- **Bootstrap 5.3.0**: For UI framework and responsive utilities.
- **Font Awesome 6.4.0**: For icon library.

### Third-Party Integrations
- **Nodemailer**: Used for handling automated email notifications for form submissions.
- **Gmail SMTP**: Configured for sending emails using secure app password authentication.