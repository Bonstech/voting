document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    const executivesContainer = document.getElementById('executivesContainer');
    const submitVotesBtn = document.getElementById('submitVotesBtn');
    const resultsSummary = document.getElementById('resultsSummary');
    const summaryContent = document.getElementById('summaryContent');
    const editVotesBtn = document.getElementById('editVotesBtn');
    const votesCastElement = document.getElementById('votesCast');
    const totalCandidatesElement = document.getElementById('totalCandidates');
    const votingStatus = document.getElementById('votingStatus');
    const statusMessage = document.getElementById('statusMessage');

    // State variables
    let executives = [];
    let userVotes = {};
    let hasSubmitted = false;

    // Initialize the application
    async function initializeApp() {
        // Load initial data
        await loadExecutives();
        
        // Initialize voting state
        initializeVotingState();
        
        // Render the UI
        renderExecutives();
        updateVoteCount();
        
        // Show summary if already voted
        if (hasSubmitted) {
            resultsSummary.classList.remove('hidden');
            renderSummary();
        }
    }

    // Load executives data from server
    async function loadExecutives() {
        try {
            showStatusMessage('Loading candidates...', 'info');
            
            // Fetch both executives data and current vote counts
            const [execsData, countsData] = await Promise.all([
                fetch('/api/executives').then(res => res.json()),
                fetch('/api/votes/counts').then(res => res.json())
            ]);
            
            // Merge the data
            executives = execsData.map(exec => ({
                ...exec,
                yesVotes: countsData[exec.id]?.yesVotes || 0,
                noVotes: countsData[exec.id]?.noVotes || 0
            }));
            
            showStatusMessage('Candidates loaded', 'success');
        } catch (error) {
            console.error('Failed to load executives:', error);
            showStatusMessage('Failed to load candidates', 'error');
            
            // Fallback to empty data
            executives = [];
        }
    }

    // Initialize voting state from localStorage
    function initializeVotingState() {
        userVotes = JSON.parse(localStorage.getItem('votes') || '{}');
        hasSubmitted = localStorage.getItem('hasVoted') === 'true';
    }

    // Render all executive cards
    function renderExecutives() {
        executivesContainer.innerHTML = '';
        
        executives.forEach(exec => {
            const hasVotedFor = userVotes[exec.id] !== undefined;
            const card = document.createElement('div');
            card.className = `bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${hasSubmitted ? 'opacity-80' : ''}`;
            card.innerHTML = `
                <div class="relative">
                    <img class="w-full h-48 object-cover" src="${exec.image}" alt="${exec.name}">
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-16"></div>
                    <div class="absolute bottom-3 left-3 right-3 text-white">
                        <h3 class="font-bold text-lg">${exec.name}</h3>
                        <p class="text-sm opacity-90">${exec.position}</p>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center">
                            <span class="text-green-500 font-medium" id="yes-count-${exec.id}">${exec.yesVotes}</span>
                            <span class="text-gray-400 mx-1">•</span>
                            <span class="text-red-500 font-medium" id="no-count-${exec.id}">${exec.noVotes}</span>
                        </div>
                        ${hasVotedFor ? `
                            <span class="text-xs bg-${userVotes[exec.id] ? 'green' : 'red'}-100 text-${userVotes[exec.id] ? 'green' : 'red'}-800 px-2 py-1 rounded-full">
                                You voted ${userVotes[exec.id] ? 'Yes' : 'No'}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="flex space-x-3 ${hasSubmitted || hasVotedFor ? 'opacity-50 pointer-events-none' : ''}">
                        <button onclick="voteForExecutive(${exec.id}, true)" class="flex-1 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition flex items-center justify-center">
                            <i class="fas fa-thumbs-up mr-2"></i> Yes
                        </button>
                        <button onclick="voteForExecutive(${exec.id}, false)" class="flex-1 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition flex items-center justify-center">
                            <i class="fas fa-thumbs-down mr-2"></i> No
                        </button>
                    </div>
                </div>
            `;
            executivesContainer.appendChild(card);
        });
        
        // Update total candidates count
        totalCandidatesElement.textContent = executives.length;
    }

    // Global vote function (attached to window)
    window.voteForExecutive = function(id, vote) {
        if (hasSubmitted) return;
        
        userVotes[id] = vote;
        localStorage.setItem('votes', JSON.stringify(userVotes));
        
        showStatusMessage(`Vote recorded for ${executives.find(e => e.id === id).name}`, 'success');
        renderExecutives();
        updateVoteCount();
    };

    // Submit all votes to server
    async function submitVotes() {
        if (Object.keys(userVotes).length === 0) {
            showStatusMessage('No votes to submit', 'error');
            return;
        }
        
        try {
            showStatusMessage('Submitting your votes...', 'info');
            
            const response = await fetch('/api/votes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    votes: userVotes,
                    deviceId: getDeviceId()
                })
            });
            
            if (!response.ok) throw new Error('Server rejected votes');
            
            const result = await response.json();
            
            // Update local counts with server response
            executives.forEach(exec => {
                if (result.updatedCounts[exec.id]) {
                    exec.yesVotes = result.updatedCounts[exec.id].yesVotes;
                    exec.noVotes = result.updatedCounts[exec.id].noVotes;
                }
            });
            
            // Mark as submitted
            localStorage.setItem('hasVoted', 'true');
            hasSubmitted = true;
            
            showStatusMessage('Your votes have been submitted!', 'success');
            renderExecutives();
            updateVoteCount();
            
            // Show summary
            resultsSummary.classList.remove('hidden');
            renderSummary();
            
        } catch (error) {
            console.error('Vote submission failed:', error);
            showStatusMessage('Failed to submit votes. Please try again.', 'error');
        }
    }

    // Render the summary section
    function renderSummary() {
        summaryContent.innerHTML = '';
        
        executives.forEach(exec => {
            if (userVotes[exec.id] !== undefined) {
                const summaryItem = document.createElement('div');
                summaryItem.className = 'flex justify-between items-center py-2 border-b border-gray-100';
                summaryItem.innerHTML = `
                    <div>
                        <h4 class="font-medium">${exec.name}</h4>
                        <p class="text-sm text-gray-500">${exec.position}</p>
                    </div>
                    <span class="text-sm font-medium ${userVotes[exec.id] ? 'text-green-600' : 'text-red-600'}">
                        ${userVotes[exec.id] ? 'Approved' : 'Rejected'}
                    </span>
                `;
                summaryContent.appendChild(summaryItem);
            }
        });
    }

    // Update the vote count display
    function updateVoteCount() {
        const votesCast = Object.keys(userVotes).length;
        votesCastElement.textContent = votesCast;
        
        if (hasSubmitted) {
            submitVotesBtn.textContent = 'Votes Submitted';
            submitVotesBtn.className = 'px-8 py-3 bg-gray-400 text-white rounded-full font-medium cursor-not-allowed shadow';
            submitVotesBtn.disabled = true;
        } else {
            submitVotesBtn.disabled = votesCast === 0;
            submitVotesBtn.className = 'px-8 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition shadow-lg hover:shadow-xl';
            submitVotesBtn.textContent = 'Submit Your Votes';
        }
    }

    // Edit votes button handler
    function editVotes() {
        localStorage.setItem('hasVoted', 'false');
        hasSubmitted = false;
        resultsSummary.classList.add('hidden');
        renderExecutives();
        updateVoteCount();
    }

    // Generate a device ID (simplified version)
    function getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'dev-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // Show status message
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        const colors = { success: 'green', error: 'red', info: 'blue' };
        votingStatus.className = `fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border-l-4 border-${colors[type]}-500`;
        votingStatus.classList.remove('hidden');
        
        setTimeout(() => {
            votingStatus.classList.add('hidden');
        }, 3000);
    }

    // Event listeners
    submitVotesBtn.addEventListener('click', submitVotes);
    editVotesBtn.addEventListener('click', editVotes);

    // Initialize the app
    initializeApp();
});

// Make the vote function available globally
function voteForExecutive(id, vote) {
    window.voteForExecutive(id, vote);
}
