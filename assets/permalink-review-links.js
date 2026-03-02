window.addEventListener('load', function() {
    // state to track whether review icons should be persistently visible
    let reviewMode = false;

    // --- Review toggle button ---
    var reviewBtn = document.createElement('button');
    reviewBtn.id = 'review-toggle-btn';
    // use same material icon as review link
    reviewBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">rate_review</span> Review`;
    reviewBtn.title = 'Show/hide review links';
    reviewBtn.style.cssText =
        "position: fixed; top: 10px; right: 10px; z-index: 1000;" +
        "padding: 2px 4px; font-size: 14px; font-weight: bold;" +
        "background-color: White; color: #000; border: 1px solid #999;" +
        "border-radius: 4px; cursor: pointer; box-shadow: 2px 2px 4px rgba(0,0,0,0.2);";

    reviewBtn.addEventListener('click', function () {
        reviewMode = !reviewMode;
        // toggle background to give visual feedback
        reviewBtn.style.backgroundColor = reviewMode ? '#ddd' : 'White';
        updateReviewVisibility();
    });
    document.body.appendChild(reviewBtn);

    // helper used by both the button and hover handlers
    function updateReviewVisibility() {
        document.querySelectorAll('.autopermalink .review-anchor').forEach(function(a) {
            if (reviewMode) {
                a.style.opacity = '0.5';
            } else {
                a.style.opacity = '0';
            }
        });
    }

    document.querySelectorAll('.autopermalink').forEach(function(permLink) {
        // make sure review icons start in correct state after elements exist
        updateReviewVisibility();
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
        reviewAnchor.className = 'review-anchor';
        reviewAnchor.style.display = 'inline-block';
        reviewAnchor.style.marginRight = '8px'; 
        reviewAnchor.style.marginLeft = '3px'; // Adjust this number if it's too far left
        reviewAnchor.style.verticalAlign = 'middle';
        reviewAnchor.style.textDecoration = 'none';
        // start hidden; will show on hover or when reviewMode is active
        reviewAnchor.style.opacity = '0';

        reviewAnchor.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;">rate_review</span>`;

        // Make permalink container visible at half opacity so the original
        // anchor is not too intrusive; the icon itself is controlled separately
        permLink.style.opacity = '0.5';
        permLink.style.visibility = 'visible';

        // Move the original anchor further left but now hide it until hovered over
        originalAnchor.style.marginLeft = '-80px';
        originalAnchor.style.opacity = '0';
        permLink.addEventListener('mouseenter', () => {
            originalAnchor.style.opacity = '1';
            if (!reviewMode) {
                reviewAnchor.style.opacity = '1';
            }
        });
        permLink.addEventListener('mouseleave', () => {
            originalAnchor.style.opacity = '0';
            if (!reviewMode) {
                reviewAnchor.style.opacity = '0';
            }
        });

        // 4. Insert BEFORE the original link
        // This keeps the original link in its "native" position
        permLink.insertBefore(reviewAnchor, originalAnchor);
        
        // 5. Ensure the container doesn't wrap
        permLink.style.whiteSpace = 'nowrap';
        permLink.style.width = 'auto';
    });
});