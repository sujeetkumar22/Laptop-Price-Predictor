document.addEventListener('DOMContentLoaded', async () => {
    const loadingState = document.getElementById('loading-state');
    const form = document.getElementById('prediction-form');
    const predictedPriceEl = document.getElementById('predicted-price');
    const predictBtn = document.getElementById('predict-btn');
    const btnSpinner = predictBtn.querySelector('.btn-spinner');
    const btnText = predictBtn.querySelector('span');
    const specChipsContainer = document.getElementById('spec-chips');

    // Fetch initial options to populate dropdowns
    try {
        const response = await fetch('/api/options');
        if (!response.ok) throw new Error('Network response was not ok');
        const options = await response.json();

        populateSelect('Company', options.Company);
        populateSelect('TypeName', options.TypeName);
        populateSelect('RAM', options.RAM);
        populateSelect('Touchscreen', options.Touchscreen);
        populateSelect('IPS', options.IPS);
        populateSelect('Resolution', options.Resolution);
        populateSelect('Cpu_brand', options.Cpu_brand);
        populateSelect('HDD', options.HDD);
        populateSelect('SSD', options.SSD);
        populateSelect('Gpu_brand', options.Gpu_brand);
        populateSelect('os', options.os);

        // Set default text for specs based on first elements
        updateSpecChips();

        // Hide loading, show form
        loadingState.classList.add('hidden');
        form.classList.remove('hidden');

    } catch (error) {
        console.error('Error fetching options:', error);
        loadingState.innerHTML = '<p style="color: #ef4444;">Error initializing models. Make sure the API is running.</p>';
    }

    // Update spec chips when form changes
    form.addEventListener('change', updateSpecChips);

    function updateSpecChips() {
        const cpu = document.getElementById('Cpu_brand').value;
        const ram = document.getElementById('RAM').value;
        const ssd = document.getElementById('SSD').value;
        const gpu = document.getElementById('Gpu_brand').value;

        if (!cpu) return;

        specChipsContainer.innerHTML = `
            <span class="chip">${cpu}</span>
            <span class="chip">${ram}GB RAM</span>
            <span class="chip">${ssd}GB SSD</span>
            <span class="chip">${gpu}</span>
        `;
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Loading state
        predictBtn.disabled = true;
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');

        // Gather data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Prediction failed');
            
            const result = await response.json();

            // Format price with Rupee symbol
            const formattedPrice = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(result.predicted_price);

            // Update UI
            predictedPriceEl.textContent = formattedPrice;

            // Flash effect for the price update
            predictedPriceEl.style.opacity = '0.5';
            setTimeout(() => {
                predictedPriceEl.style.opacity = '1';
                predictedPriceEl.style.transition = 'opacity 0.3s ease';
            }, 50);

        } catch (error) {
            console.error('Error during prediction:', error);
            alert('An error occurred while calculating the price. Please try again.');
        } finally {
            predictBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    });

    // Helper to populate select elements
    function populateSelect(id, optionsArray) {
        const select = document.getElementById(id);
        if (!select) return;
        
        optionsArray.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            select.appendChild(el);
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
