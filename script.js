let chart; // Global variable for Chart.js instance

// Toggle direction input visibility based on algorithm selection
function toggleDirection() {
    const algorithm = document.getElementById('algorithm').value;
    const directionContainer = document.getElementById('direction-container');
    directionContainer.style.display = (['scan', 'cscan', 'look', 'clook'].includes(algorithm)) ? 'block' : 'none';
}

// Schedule function with added chart update
function schedule() {
    const algorithm = document.getElementById('algorithm').value;
    const queue = document.getElementById('queue').value.split(',').map(Number);
    const initial = parseInt(document.getElementById('initial').value);
    const cylinders = parseInt(document.getElementById('cylinders').value);
    const direction = document.getElementById('direction').value;
    let seekTime = 0;
    let seekPath = [initial];

    // Calculate seek time and path based on selected algorithm
    switch (algorithm) {
        case 'fcfs':
            seekTime = fcfs(queue, initial, seekPath);
            break;
        case 'sstf':
            seekTime = sstf(queue, initial, seekPath);
            break;
        case 'scan':
            seekTime = scan(queue, initial, cylinders, direction, seekPath);
            break;
        case 'cscan':
            seekTime = cscan(queue, initial, cylinders, seekPath);
            break;
        case 'look':
            seekTime = look(queue, initial, direction, seekPath);
            break;
        case 'clook':
            seekTime = clook(queue, initial, seekPath);
            break;
        default:
            document.getElementById('results').innerHTML = 'Invalid algorithm selected!';
            return;
    }

    // Display result
    document.getElementById('results').innerHTML = `Total Seek Time: ${seekTime}`;
    drawChart(seekPath);
}

// Function to draw/update the chart
function drawChart(seekPath) {
    const labels = seekPath.map((_, index) => `Step ${index + 1}`);
    const data = {
        labels: labels,
        datasets: [{
            label: 'Head Movement',
            data: seekPath,
            borderColor: '#2980b9',
            backgroundColor: 'rgba(41, 128, 185, 0.2)',
            fill: false,
            tension: 0.1,
            pointRadius: 5
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                x: { title: { display: true, text: 'Seek Steps' } },
                y: { title: { display: true, text: 'Track Position' }, beginAtZero: true }
            }
        }
    };

    if (chart) {
        chart.destroy();
    }
    chart = new Chart(document.getElementById('seekChart'), config);
}

// FCFS algorithm
function fcfs(queue, initial, seekPath) {
    let seekTime = 0;
    let current = initial;
    queue.forEach(request => {
        seekTime += Math.abs(current - request);
        current = request;
        seekPath.push(current);
    });
    return seekTime;
}

// SSTF algorithm
function sstf(queue, initial, seekPath) {
    let seekTime = 0;
    let current = initial;
    let remaining = [...queue];
    while (remaining.length > 0) {
        remaining.sort((a, b) => Math.abs(a - current) - Math.abs(b - current));
        seekTime += Math.abs(current - remaining[0]);
        current = remaining.shift();
        seekPath.push(current);
    }
    return seekTime;
}

// SCAN algorithm
function scan(queue, initial, cylinders, direction, seekPath) {
    let seekTime = 0;
    let current = initial;
    const sortedQueue = queue.sort((a, b) => a - b);
    const maxCylinder = cylinders - 1; // Adjust for SCAN to treat max cylinder as maxCylinder - 1

    if (direction === 'up') {
        sortedQueue.forEach(request => {
            if (request >= current) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
        seekTime += Math.abs(maxCylinder - current); // Move to the highest cylinder (cylinders - 1)
        seekPath.push(maxCylinder);
        current = maxCylinder;
        sortedQueue.reverse().forEach(request => {
            if (request < initial) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
    } else {
        sortedQueue.reverse().forEach(request => {
            if (request <= current) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
        seekTime += Math.abs(current); // Move to the lowest cylinder (0)
        seekPath.push(0);
        current = 0;
        sortedQueue.reverse().forEach(request => {
            if (request > initial) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
    }

    return seekTime;
}

// C-SCAN algorithm
function cscan(queue, initial, cylinders, seekPath) {
    let seekTime = 0;
    let current = initial;
    const sortedQueue = queue.sort((a, b) => a - b);
    const maxCylinder = cylinders - 1; // Consider cylinder range as 0 to maxCylinder

    // Move towards the highest end
    sortedQueue.forEach(request => {
        if (request >= current) {
            seekTime += Math.abs(current - request);
            current = request;
            seekPath.push(current);
        }
    });

    // Move to the max cylinder if needed and add to seek time
    if (current < maxCylinder) {
        seekTime += Math.abs(maxCylinder - current);
        seekPath.push(maxCylinder);
        current = maxCylinder;
    }

    // Jump from max cylinder back to 0 and add that to the seek time
    seekTime += maxCylinder; // Adding the return movement from max cylinder to 0
    current = 0;
    seekPath.push(current);

    // Continue serving remaining requests from the start (0) upwards
    sortedQueue.forEach(request => {
        if (request < initial) {
            seekTime += Math.abs(current - request);
            current = request;
            seekPath.push(current);
        }
    });
    return seekTime;
}

// LOOK algorithm
function look(queue, initial, direction, seekPath) {
    let seekTime = 0;
    let current = initial;
    const sortedQueue = queue.sort((a, b) => a - b);

    if (direction === 'up') {
        sortedQueue.forEach(request => {
            if (request >= current) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
        sortedQueue.reverse().forEach(request => {
            if (request < initial) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
    } else {
        sortedQueue.reverse().forEach(request => {
            if (request <= current) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
        sortedQueue.forEach(request => {
            if (request > initial) {
                seekTime += Math.abs(current - request);
                current = request;
                seekPath.push(current);
            }
        });
    }

    return seekTime;
}
// C-LOOK algorithm
function clook(queue, initial, seekPath) {
    let seekTime = 0;
    let current = initial;
    const sortedQueue = queue.sort((a, b) => a - b);

    // Move towards the highest request
    sortedQueue.forEach(request => {
        if (request >= current) {
            seekTime += Math.abs(current - request);
            current = request;
            seekPath.push(current);
        }
    });

    // Jump back to the lowest request and add to the seek time
    if (current !== sortedQueue[0]) {
        seekTime += Math.abs(current - sortedQueue[0]); // Adding the return movement
        current = sortedQueue[0];
        seekPath.push(current);
    }

    // Continue servicing remaining requests from the lowest end upwards
    sortedQueue.forEach(request => {
        if (request < initial) {
            seekTime += Math.abs(current - request);
            current = request;
            seekPath.push(current);
        }
    });
    return seekTime;
}