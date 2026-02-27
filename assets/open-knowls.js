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
});
