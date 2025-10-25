/**
 * Scroll Spy Navigation
 * 
 * This script adds smooth scrolling and active section highlighting to the navigation.
 * It works with both desktop and mobile navigation.
 */

// Wait for everything to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Give the browser a moment to finish rendering
  setTimeout(initializeScrollSpy, 300);
});

function initializeScrollSpy() {
  console.log('Initializing scroll spy...');
  // Select all navigation links that point to sections
  const desktopNavLinks = document.querySelectorAll('.topnav a[href^="#"]');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-item[href^="#"]');
  const allNavLinks = [...desktopNavLinks, ...mobileNavLinks];
  const sections = document.querySelectorAll('section[id]');
  
  // Add smooth scrolling to all navigation links
  allNavLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        // Calculate the offset to account for fixed headers
        const headerOffset = 100;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        // Smooth scroll to the section
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update URL without page jump
        if (history.pushState) {
          history.pushState(null, null, targetId);
        } else {
          window.location.hash = targetId;
        }
      }
    });
  });

  // Function to get the current section in viewport
  function getCurrentSection() {
    let currentSection = '';
    const scrollPosition = window.scrollY + (window.innerHeight * 0.2); // 20% from top of viewport
    
    // Find the current section in viewport
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      // If we've scrolled past this section's top
      if (scrollPosition >= sectionTop) {
        currentSection = sectionId;
      } else {
        // As soon as we find a section below the current scroll position, we can break
        break;
      }
    }
    
    // If no section found (shouldn't happen), default to home
    return currentSection || 'home';
  }

  // Function to update the active navigation link
  function updateActiveLink() {
    const currentSection = getCurrentSection();
    console.log('Current section:', currentSection);
    
    // Update active state for all navigation links (desktop and mobile)
    allNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      const targetSection = href.substring(1); // Remove the '#'
      const isActive = targetSection === currentSection;
      
      // For mobile nav items, they have a parent <li> that might need updating
      if (link.classList.contains('mobile-nav-item')) {
        const parentLi = link.closest('li');
        if (parentLi) {
          parentLi.classList.toggle('active', isActive);
        }
      }
      
      // Toggle active class on the link itself
      link.classList.toggle('active', isActive);
      
      // Update aria-current for accessibility
      if (isActive) {
        link.setAttribute('aria-current', 'page');
        console.log('Setting active:', href);
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Throttle the scroll event for better performance
  let isScrolling;
  
  // Single scroll event listener with throttling
  window.addEventListener('scroll', function() {
    // Clear any existing timeout
    window.clearTimeout(isScrolling);
    
    // Set a new timeout to run after scrolling ends
    isScrolling = setTimeout(updateActiveLink, 50);
  }, { passive: true });

  // Run once on page load to set initial active state
  updateActiveLink();

  // Handle browser back/forward navigation
  window.addEventListener('popstate', updateActiveLink);
  window.addEventListener('hashchange', updateActiveLink);
  
  // Handle initial load with hash
  if (window.location.hash) {
    // Small delay to ensure everything is rendered
    setTimeout(updateActiveLink, 100);
  }
  
  // Add click handlers for smooth scrolling
  allNavLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const headerOffset = 100;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update URL without page jump
        if (history.pushState) {
          history.pushState(null, null, targetId);
        } else {
          window.location.hash = targetId;
        }
        
        // Update active state after a small delay
        setTimeout(updateActiveLink, 100);
      }
    });
  });
}
