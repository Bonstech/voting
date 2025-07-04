document.addEventListener('DOMContentLoaded', function() {
    // Sample data - replace with your actual executive nominees
    let executives = [
        {
            id: 1,
            name: "Paul Asuma Sumbanso",
            position: "President",
            image: "https://randomuser.me/api/portraits/men/32.jpg",
            yesVotes: 0,
            noVotes: 0
        },
        {
            id: 2,
            name: "Zainabu Farouk",
            position: "Vice President",
            image: "https://randomuser.me/api/portraits/women/44.jpg",
            yesVotes: 0,
            noVotes: 0
        },
        {
            id: 3,
            name: "Gregory Sondon Samwine",
            position: "General Secretary",
            image: "https://randomuser.me/api/portraits/men/67.jpg",
            yesVotes: 0,
            noVotes: 0
        },
        {
            id: 4,
            name: "Noah Bayeliyei",
            position: "Financial Secretary",
            image: "https://randomuser.me/api/portraits/women/63.jpg",
            yesVotes: 0,
            noVotes: 0
        },
        {
            id: 5,
            name: "Yussif Seidu",
            position: "Organizer",
            image: "https://randomuser.me/api/portraits/men/85.jpg",
            yesVotes: 0,
            noVotes: 0
        },
        
    ];

    // Initialize local storage for voting
    if (!localStorage.getItem('hasVoted')) {
        localStorage.setItem('hasVoted', 'false');
        localStorage.setItem('votes', JSON.stringify({}));
    }

    const executivesContainer = document.getElementById('executivesContainer');
    const submitVotesBtn = document.getElementById('submitVotesBtn');
    const resultsSummary = document.getElementById('resultsSummary');
    const summaryContent = document.getElementById('summaryContent');
    const editVotesBtn = document.getElementById('editVotesBtn');
    const votesCastElement = document.getElementById('votesCast');
    const totalCandidatesElement = document.getElementById('totalCandidates');
    const votingStatus = document.getElementById('votingStatus');
    const statusMessage = document.getElementById('statusMessage');

    let userVotes = JSON.parse(localStorage.getItem('votes'));
    let hasSubmitted = localStorage.getItem('hasVoted') === 'true';

    // Set total candidates count
    totalCandidatesElement.textContent = executives.length;

    // Render executive cards
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

        updateVoteCount();
    }

    // Update the vote count display
    function updateVoteCount() {
        const votesCast = Object.keys(userVotes).length;
        votesCastElement.textContent = votesCast;
        
        // Update submit button state
        if (hasSubmitted) {
            submitVotesBtn.textContent = 'Votes Submitted';
            submitVotesBtn.className = 'px-8 py-3 bg-gray-400 text-white rounded-full font-medium cursor-not-allowed shadow';
            submitVotesBtn.disabled = true;
            resultsSummary.classList.remove('hidden');
            renderSummary();
        } else {
            submitVotesBtn.disabled = votesCast === 0;
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

    // Vote for an executive
    window.voteForExecutive = function(id, vote) {
        if (hasSubmitted) return;
        
        userVotes[id] = vote;
        localStorage.setItem('votes', JSON.stringify(userVotes));
        
        showStatusMessage(`Vote recorded for ${executives.find(e => e.id === id).name}`, 'success');
        renderExecutives();
    };

    // Submit all votes
    submitVotesBtn.addEventListener('click', function() {
        if (Object.keys(userVotes).length === 0) return;
        
        showStatusMessage('Submitting your votes...', 'info');
        
        // Simulate API call to submit votes
        submitVotesToServer()
            .then(updatedCounts => {
                // Update the local counts with the server response
                executives = executives.map(exec => {
                    return {
                        ...exec,
                        yesVotes: updatedCounts[exec.id].yesVotes,
                        noVotes: updatedCounts[exec.id].noVotes
                    };
                });
                
                localStorage.setItem('hasVoted', 'true');
                hasSubmitted = true;
                
                showStatusMessage('Your votes have been submitted successfully!', 'success');
                renderExecutives();
                
                // Scroll to results
                setTimeout(() => {
                    resultsSummary.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            })
            .catch(error => {
                showStatusMessage('Failed to submit votes. Please try again.', 'error');
                console.error('Vote submission error:', error);
            });
    });

    // Simulate server submission - replace with actual API call
    function submitVotesToServer() {
        return new Promise((resolve) => {
            // In a real app, this would be a fetch() call to your backend
            setTimeout(() => {
                // Calculate what the new counts would be
                const updatedCounts = {};
                
                executives.forEach(exec => {
                    if (userVotes[exec.id] !== undefined) {
                        updatedCounts[exec.id] = {
                            yesVotes: userVotes[exec.id] ? exec.yesVotes + 1 : exec.yesVotes,
                            noVotes: userVotes[exec.id] ? exec.noVotes : exec.noVotes + 1
                        };
                    } else {
                        updatedCounts[exec.id] = {
                            yesVotes: exec.yesVotes,
                            noVotes: exec.noVotes
                        };
                    }
                });
                
                resolve(updatedCounts);
            }, 1500);
        });
    }

    // Show status message
    function showStatusMessage(message, type) {
        statusMessage.textContent = message;
        
        // Set color based on type
        const colors = {
            success: 'green',
            error: 'red',
            info: 'blue'
        };
        
        votingStatus.className = `fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border-l-4 border-${colors[type]}-500`;
        votingStatus.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            votingStatus.classList.add('hidden');
        }, 3000);
    }

    // Initialize the page
    renderExecutives();
    
    
    if (hasSubmitted) {
        resultsSummary.classList.remove('hidden');
        renderSummary();
    }
});