// Open all born-hidden knowls so that solutions/answers are visible
// without clicking, enabling browser "Save as PDF" to capture everything.
//
// In PreTeXt HTML output, exercise solutions and answers are rendered as
// <details class="born-hidden-knowl"> elements which are closed by default.
// There is no publication-file option to change this, so we open them with JS.

// Also includes review button (copied from permalink-review-links.js). Could not find a way to include two different files as stringparams.

window.addEventListener("load", function () {
    // Open every born-hidden-knowl <details> element
    document.querySelectorAll("details.born-hidden-knowl").forEach(function (d) {
        d.setAttribute("open", "");
    });

    // --- Print button ---
    // Inject print-specific CSS to hide UI chrome and the button itself
    var style = document.createElement("style");
    style.textContent =
        "@media print {" +
        "  #ptx-masthead, #ptx-navbar, #ptx-sidebar," +
        "  #ptx-content-footer, .ptx-page-footer," +
        "  .searchbox, .toc-toggle," +
        "  #plans-print-btn { display: none !important; }" +
        "  .ptx-page { margin-left: 0 !important; padding: 0 !important; }" +
        "  .ptx-main { margin-left: 0 !important; }" +
        "  .ptx-content { max-width: 100% !important; }" +
        "}";
    document.head.appendChild(style);

    // Create the print button
    var btn = document.createElement("button");
    btn.id = "plans-print-btn";
    btn.textContent = "🖨 Print";
    btn.title = "Print this page";
    btn.style.cssText =
        "position: fixed; top: 40px; right: 10px; z-index: 1000;" +
        "padding: 2px 4px; font-size: 14px; font-weight: bold;" +
        "background-color: White; color: #000; border: 1px solid #999;" +
        "border-radius: 4px; cursor: pointer; box-shadow: 2px 2px 4px rgba(0,0,0,0.2);";

    btn.addEventListener("click", function () {
        window.print();
    });

    document.body.appendChild(btn);
});

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
