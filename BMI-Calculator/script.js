document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const resultCard = document.getElementById('result-card');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const errorMessage = document.getElementById('error-message');

    calculateBtn.addEventListener('click', calculateBMI);

    // Allow Enter key to trigger calculation
    heightInput.addEventListener('keypress', handleEnter);
    weightInput.addEventListener('keypress', handleEnter);

    function handleEnter(e) {
        if (e.key === 'Enter') {
            calculateBMI();
        }
    }

    function calculateBMI() {
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);

        // Reset UI
        errorMessage.classList.add('hidden');
        resultCard.classList.add('hidden');

        // Validation
        if (!height || !weight || height <= 0 || weight <= 0) {
            errorMessage.classList.remove('hidden');
            return;
        }

        // Calculate BMI
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

        // Determine Category
        let category = '';
        if (bmi < 18.5) {
            category = 'Underweight';
        } else if (bmi >= 18.5 && bmi < 24.9) {
            category = 'Normal Weight';
        } else if (bmi >= 25 && bmi < 29.9) {
            category = 'Overweight';
        } else {
            category = 'Obesity';
        }

        // Update UI
        bmiValue.textContent = bmi;
        bmiCategory.textContent = category;
        resultCard.classList.remove('hidden');
    }
});