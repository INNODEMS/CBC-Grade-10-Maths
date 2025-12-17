
// hijack all permalinks to make them review links
window.addEventListener('load', function() {
    document.querySelectorAll('.autopermalink').forEach(function(permLink) {
      const anchor = permLink.querySelector('a');
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute('href');
      const fullURL = window.location.origin + window.location.pathname + href;
      const reviewURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfAA_s8qvXifbo0mTMl7MzqUnOA7leqKSa1yFg_e0EwaazJ9w/viewform?usp=pp_url&entry.1041095250=' + encodeURIComponent(fullURL);
      console.log('Found permalink:', reviewURL);

      anchor.href = reviewURL;
      anchor.title = 'Submit a review';
      anchor.innerHTML = `<span class="material-symbols-outlined">rate_review</span>`;
      anchor.onclick = function() {
        window.open(reviewURL, '_blank');
        return false;
      }
    });
});