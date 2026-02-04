document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const ageInput = document.getElementById('age');
    const genderInput = document.getElementById('gender');

    const resultCard = document.getElementById('result-card');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const errorMessage = document.getElementById('error-message');

    calculateBtn.addEventListener('click', calculateBMI);

    // Allow Enter key to trigger calculation
    [heightInput, weightInput, ageInput].forEach(input => {
        input.addEventListener('keypress', handleEnter);
    });

    function handleEnter(e) {
        if (e.key === 'Enter') {
            calculateBMI();
        }
    }

    function calculateBMI() {
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);
        const age = parseInt(ageInput.value, 10);
        const gender = genderInput.value;

        // Reset UI
        errorMessage.classList.add('hidden');
        resultCard.classList.add('hidden');

        // Validation
        if (!height || !weight || height <= 0 || weight <= 0) {
            errorMessage.textContent = 'Please enter valid height and weight.';
            errorMessage.classList.remove('hidden');
            return;
        }

        if (!age || age < 5 || age > 120) {
            errorMessage.textContent = 'Please enter a valid age (5–120).';
            errorMessage.classList.remove('hidden');
            return;
        }

        if (!gender) {
            errorMessage.textContent = 'Please select your gender.';
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
        } else if (bmi < 24.9) {
            category = 'Normal Weight';
        } else if (bmi < 29.9) {
            category = 'Overweight';
        } else {
            category = 'Obesity';
        }

        // Informational note (BMI formula remains same)
        let note = age < 18
            ? 'BMI for children & teens is age-dependent.'
            : `Standard BMI interpretation applied (${gender}).`;

        // Update UI
        bmiValue.textContent = bmi;
        bmiCategory.textContent = `${category} • ${note}`;
        resultCard.classList.remove('hidden');
    }
});
