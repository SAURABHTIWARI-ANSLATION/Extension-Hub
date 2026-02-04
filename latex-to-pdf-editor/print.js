document.addEventListener('DOMContentLoaded', () => {
    // Retrieve content from localStorage (shared extension storage)
    const content = localStorage.getItem('latex_print_content');

    if (content) {
        document.getElementById('content').innerHTML = content;

        // Brief delay to ensure styles render, then print
        setTimeout(() => {
            document.title = "Resume.pdf"; // Suggest filename
            window.print();
        }, 500);
    } else {
        document.getElementById('content').innerHTML = '<p style="color:red; text-align:center;">Error: No content to print.</p>';
    }

    // Cleanup? Maybe keep it so user can reprint.
});
