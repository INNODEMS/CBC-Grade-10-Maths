// Open all born-hidden knowls so that solutions/answers are visible
// without clicking, enabling browser "Save as PDF" to capture everything.
//
// In PreTeXt HTML output, exercise solutions and answers are rendered as
// <details class="born-hidden-knowl"> elements which are closed by default.
// There is no publication-file option to change this, so we open them with JS.

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
        "position: fixed; top: 40px; right: 20px; z-index: 1000;" +
        "padding: 8px 16px; font-size: 14px; font-weight: bold;" +
        "background-color: White; color: #000; border: 1px solid #999;" +
        "border-radius: 4px; cursor: pointer; box-shadow: 2px 2px 4px rgba(0,0,0,0.2);";

    btn.addEventListener("click", function () {
        window.print();
    });

    document.body.appendChild(btn);
});
