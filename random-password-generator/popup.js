document.addEventListener('DOMContentLoaded', function() {
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('length-value');
    const uppercaseCheck = document.getElementById('uppercase');
    const lowercaseCheck = document.getElementById('lowercase');
    const numbersCheck = document.getElementById('numbers');
    const symbolsCheck = document.getElementById('symbols');
    const generateBtn = document.getElementById('generate-btn');
    const passwordOutput = document.getElementById('password-output');
    const copyBtn = document.getElementById('copy-btn');

    // Update length display
    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });

    // Generate password
    generateBtn.addEventListener('click', function() {
        const length = +lengthSlider.value;
        const includeUpper = uppercaseCheck.checked;
        const includeLower = lowercaseCheck.checked;
        const includeNumbers = numbersCheck.checked;
        const includeSymbols = symbolsCheck.checked;

        const password = generatePassword(length, includeUpper, includeLower, includeNumbers, includeSymbols);
        passwordOutput.value = password;
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', function() {
        if (!passwordOutput.value) return;
        navigator.clipboard.writeText(passwordOutput.value).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 1500);
        });
    });

    // Password generator logic
    function generatePassword(length, upper, lower, numbers, symbols) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let chars = '';
        if (upper) chars += uppercase;
        if (lower) chars += lowercase;
        if (numbers) chars += numberChars;
        if (symbols) chars += symbolChars;

        if (!chars) {
            alert('Please select at least one character type.');
            return '';
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars[randomIndex];
        }
        return password;
    }

    // Generate on load
    generateBtn.click();
});