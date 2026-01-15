document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    // DOM Elements
    const spinBtn = document.getElementById('spinBtn');
    const closeBtn = document.getElementById('closeWheel');
    const speedControl = document.getElementById('speedControl');
    const resultDisplay = document.getElementById('result');
    const currentOptions = document.getElementById('currentOptions');
    
    // Wheel state
    let options = [];
    let colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2'];
    let currentRotation = 0;
    let isSpinning = false;
    let spinVelocity = 0;
    let friction = 0.98;
    let spinDuration = 5;
    
    // Load options from storage
    loadOptions();
    
    // Event Listeners
    spinBtn.addEventListener('click', startSpin);
    closeBtn.addEventListener('click', closeWindow);
    speedControl.addEventListener('input', updateSpeed);
    
    // Functions
    function loadOptions() {
        chrome.storage.local.get(['wheelOptions', 'spinDuration', 'wheelColors'], (data) => {
            options = data.wheelOptions || ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'];
            spinDuration = data.spinDuration || 5;
            if (data.wheelColors) colors = data.wheelColors;
            drawWheel();
            displayOptions();
        });
    }
    
    function drawWheel() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (options.length === 0) {
            // Draw empty wheel
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add text
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Add options in popup', centerX, centerY);
            return;
        }
        
        const sliceAngle = (2 * Math.PI) / options.length;
        
        // Draw wheel slices
        for (let i = 0; i < options.length; i++) {
            const startAngle = i * sliceAngle + currentRotation;
            const endAngle = (i + 1) * sliceAngle + currentRotation;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            // Alternate colors
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            // Draw slice border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 5;
            
            // Shorten text if too long
            let text = options[i];
            if (text.length > 15) {
                text = text.substring(0, 12) + '...';
            }
            
            ctx.fillText(text, radius - 40, 5);
            ctx.restore();
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw decorative ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 10;
        ctx.stroke();
    }
    
    function displayOptions() {
        currentOptions.innerHTML = '';
        options.forEach(option => {
            const tag = document.createElement('div');
            tag.className = 'option-tag';
            tag.textContent = option;
            currentOptions.appendChild(tag);
        });
    }
    
    function startSpin() {
        if (isSpinning || options.length < 2) return;
        
        isSpinning = true;
        spinBtn.classList.add('spinning');
        spinBtn.disabled = true;
        resultDisplay.textContent = 'Spinning...';
        resultDisplay.classList.remove('winner');
        
        // Calculate spin power based on speed control
        const spinPower = (parseInt(speedControl.value) / 10) * 0.3 + 0.1;
        spinVelocity = spinPower;
        
        // Animate
        animateSpin();
    }
    
    function animateSpin() {
        if (!isSpinning && spinVelocity < 0.001) {
            spinComplete();
            return;
        }
        
        // Update rotation
        currentRotation += spinVelocity;
        spinVelocity *= friction;
        
        // Stop spinning after duration
        if (spinVelocity < 0.001) {
            isSpinning = false;
        }
        
        drawWheel();
        requestAnimationFrame(animateSpin);
    }
    
    function spinComplete() {
        isSpinning = false;
        spinBtn.classList.remove('spinning');
        spinBtn.disabled = false;
        
        // Calculate winning option
        const normalizedRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const sliceAngle = (2 * Math.PI) / options.length;
        let winningIndex = Math.floor((Math.PI * 2 - normalizedRotation) / sliceAngle) % options.length;
        
        // Adjust for pointer position (pointer is at top)
        winningIndex = (options.length - winningIndex) % options.length;
        
        const winningOption = options[winningIndex];
        
        // Display result
        resultDisplay.textContent = winningOption;
        resultDisplay.classList.add('winner');
        
        // Save to history
        saveToHistory(winningOption);
        
        // Show confetti effect
        showConfetti();
    }
    
    function saveToHistory(winner) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        chrome.storage.local.get(['history'], (data) => {
            const history = data.history || [];
            history.push({
                result: winner,
                time: timeString,
                timestamp: now.getTime()
            });
            
            // Keep only last 50 entries
            const trimmedHistory = history.slice(-50);
            
            chrome.storage.local.set({ history: trimmedHistory }, () => {
                // Notify popup to update history
                chrome.runtime.sendMessage({
                    action: 'updateHistory'
                });
            });
        });
    }
    
    function showConfetti() {
        // Simple confetti effect using emojis
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(confettiContainer);
        
        const emojis = ['🎉', '🎊', '🏆', '⭐', '✨', '🔥', '💫', '🎯'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 20 + 20}px;
                left: ${Math.random() * 100}%;
                top: -50px;
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            confettiContainer.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Remove container after animation
        setTimeout(() => {
            confettiContainer.remove();
            style.remove();
        }, 5000);
    }
    
    function updateSpeed() {
        // Speed control affects spin power
        drawWheel();
    }
    
    function closeWindow() {
        window.close();
    }
    
    // Initial draw
    drawWheel();
    
    // Animation loop for idle rotation
    function idleAnimation() {
        if (!isSpinning && options.length > 0) {
            currentRotation += 0.002;
            drawWheel();
        }
        requestAnimationFrame(idleAnimation);
    }
    
    idleAnimation();
});