// Basic JavaScript Initialization for the NexusTech Website
// Optimized to defer loading and play nicely with Cloudflare Rocket Loader.

document.addEventListener('DOMContentLoaded', () => {
    console.log('NexusTech Edge Website - Loaded Successfully.');

    // Feature: Highlight the active navigation link based on the URL path
    const currentLocation = location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        if(link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Add simple smooth scrolling for anchor links if any are added
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
