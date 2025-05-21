document.addEventListener('DOMContentLoaded', function() {
  const loadingElement = document.getElementById('loading-container');
  
  // Show loading screen
  if (loadingElement) {
    loadingElement.style.display = 'flex';
  }
  
  // Hide loading screen when page is fully loaded
  window.addEventListener('load', function() {
    if (loadingElement) {
      setTimeout(function() {
        loadingElement.style.opacity = '0';
        setTimeout(function() {
          loadingElement.style.display = 'none';
        }, 500);
      }, 300);
    }
  });
}); 