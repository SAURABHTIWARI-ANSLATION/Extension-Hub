document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const modeGradientBtn = document.getElementById('mode-gradient');
    const modeImageBtn = document.getElementById('mode-image');
    const gradientUi = document.getElementById('gradient-ui');
    const imageUi = document.getElementById('image-ui');

    const gradientTypeSelect = document.getElementById('gradient-type');
    const gradientDirectionSelect = document.getElementById('gradient-direction');
    const generateGradientBtn = document.getElementById('generate-gradient');
    const gradientPreview = document.getElementById('gradient-preview');
    const cssOutput = document.getElementById('css-output');
    const colorInputsContainer = document.getElementById('color-inputs');

    const imageCategorySelect = document.getElementById('image-category');
    const generateImageBtn = document.getElementById('generate-image');
    const imagePreview = document.getElementById('image-preview');
    const imageOutput = document.getElementById('image-output');
    const openImageBtn = document.getElementById('open-image');

    const toast = document.getElementById('toast');
    const copyBtns = document.querySelectorAll('.copy-btn');

    // State
    let currentColors = ['#8A2387', '#E94057', '#F27121']; // Default
    let currentGradient = '';

    // --- Mode Switching ---
    function switchMode(mode) {
        if (mode === 'gradient') {
            modeGradientBtn.classList.add('active');
            modeImageBtn.classList.remove('active');
            gradientUi.classList.remove('hidden-section');
            gradientUi.classList.add('active-section');
            imageUi.classList.add('hidden-section');
            imageUi.classList.remove('active-section');
        } else {
            modeImageBtn.classList.add('active');
            modeGradientBtn.classList.remove('active');
            imageUi.classList.remove('hidden-section');
            imageUi.classList.add('active-section');
            gradientUi.classList.add('hidden-section');
            gradientUi.classList.remove('active-section');
        }
    }

    modeGradientBtn.addEventListener('click', () => switchMode('gradient'));
    modeImageBtn.addEventListener('click', () => switchMode('image'));

    // --- Gradient Logic ---

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Controls
    const addColorBtn = document.getElementById('add-color');
    const removeColorBtn = document.getElementById('remove-color');

    // Logic
    function updateColorInputs() {
        colorInputsContainer.innerHTML = '';
        currentColors.forEach((color, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'color-stop';
            const input = document.createElement('input');
            input.type = 'color';
            input.value = color;
            input.addEventListener('input', (e) => {
                currentColors[index] = e.target.value;
                updateGradient();
            });
            wrapper.appendChild(input);
            colorInputsContainer.appendChild(wrapper);
        });

        // Update button states
        removeColorBtn.disabled = currentColors.length <= 2;
        addColorBtn.disabled = currentColors.length >= 4;
    }

    function addColor() {
        if (currentColors.length < 4) {
            currentColors.push(getRandomColor());
            updateColorInputs();
            updateGradient();
        }
    }

    function removeColor() {
        if (currentColors.length > 2) {
            currentColors.pop();
            updateColorInputs();
            updateGradient();
        }
    }

    addColorBtn.addEventListener('click', addColor);
    removeColorBtn.addEventListener('click', removeColor);

    function updateGradient() {
        const type = gradientTypeSelect.value;
        const direction = gradientDirectionSelect.value;

        let gradientString = '';
        if (type === 'linear') {
            gradientString = `linear-gradient(${direction}, ${currentColors.join(', ')})`;
        } else if (type === 'radial') {
            gradientString = `radial-gradient(circle, ${currentColors.join(', ')})`;
        } else if (type === 'conic') {
            gradientString = `conic-gradient(from 0deg, ${currentColors.join(', ')})`;
        }

        currentGradient = gradientString;
        gradientPreview.style.background = gradientString;
        cssOutput.textContent = gradientString;
    }

    function randomizeGradient() {
        // Keep current count but randomize colors
        currentColors = currentColors.map(() => getRandomColor());
        updateColorInputs();
        updateGradient();
    }

    generateGradientBtn.addEventListener('click', randomizeGradient);

    gradientTypeSelect.addEventListener('change', updateGradient);
    gradientDirectionSelect.addEventListener('change', updateGradient);

    // --- Image Logic ---
    function generateImage() {
        const category = imageCategorySelect.value;
        let keyword = category === 'random' ? 'wallpaper' : category;

        // Add timestamp to force preventing cache
        const url = `https://loremflickr.com/640/480/${keyword}?lock=${Math.floor(Math.random() * 1000)}`;

        // Show loader
        const loader = document.querySelector('.loader');
        if (loader) loader.classList.remove('hidden');

        imageOutput.textContent = 'Generating...';

        const img = new Image();
        img.onload = () => {
            imagePreview.style.backgroundImage = `url('${url}')`;
            imageOutput.textContent = url;
            if (loader) loader.classList.add('hidden');
        };
        img.onerror = () => {
            imageOutput.textContent = 'Error loading image';
            if (loader) loader.classList.add('hidden');
        }
        img.src = url;

        openImageBtn.onclick = () => window.open(url, '_blank');
    }

    generateImageBtn.addEventListener('click', generateImage);


    // --- Toast & Copy ---
    function showToast() {
        toast.classList.remove('hidden');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hidden');
        }, 2000);
    }

    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const text = document.getElementById(targetId).innerText;
            navigator.clipboard.writeText(text).then(() => {
                showToast();
            });
        });
    });

    // Init
    updateColorInputs();
    updateGradient();

});
