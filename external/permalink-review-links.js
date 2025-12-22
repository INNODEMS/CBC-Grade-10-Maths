window.addEventListener('load', function() {
    document.querySelectorAll('.autopermalink').forEach(function(permLink) {
        const originalAnchor = permLink.querySelector('a');
        if (!originalAnchor) return;

        // 1. Construct the Review URL
        const href = originalAnchor.getAttribute('href');
        const fullURL = window.location.origin + window.location.pathname + href;
        const reviewURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfAA_s8qvXifbo0mTMl7MzqUnOA7leqKSa1yFg_e0EwaazJ9w/viewform?usp=pp_url&entry.1041095250=' + encodeURIComponent(fullURL);

        // 2. Create the new Review Link element
        const reviewAnchor = document.createElement('a');
        reviewAnchor.href = reviewURL;
        reviewAnchor.target = '_blank';
        reviewAnchor.title = 'Submit a review';
        
        // 3. JS-Only Styling to prevent overlap
        // We use a negative margin-left to pull the icon into the margin
        // and inline-block to ensure it respects that spacing.
        reviewAnchor.style.display = 'inline-block';
        reviewAnchor.style.marginRight = '8px'; 
        reviewAnchor.style.marginLeft = '-30px'; // Adjust this number if it's too far left
        reviewAnchor.style.verticalAlign = 'middle';
        reviewAnchor.style.textDecoration = 'none';

        reviewAnchor.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">rate_review</span>`;

        // 4. Insert BEFORE the original link
        // This keeps the original link in its "native" position
        permLink.insertBefore(reviewAnchor, originalAnchor);
        
        // 5. Ensure the container doesn't wrap
        permLink.style.whiteSpace = 'nowrap';
        permLink.style.width = 'auto';
    });
});