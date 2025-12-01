// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Voting is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ELECTION_MANAGER_ROLE = keccak256("ELECTION_MANAGER_ROLE");

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public voters;
    mapping(address => bool) public registeredVoters;

    uint256 public votingStart;
    uint256 public votingEnd;
    uint256 public totalVotes;
    bool public voterRegistrationRequired;

    // Events for audit trail
    event VoteCast(address indexed voter, uint256 indexed candidateIndex, uint256 timestamp);
    event CandidateAdded(string name, uint256 candidateIndex, uint256 timestamp);
    event VoterRegistered(address indexed voter, uint256 timestamp);
    event VoterUnregistered(address indexed voter, uint256 timestamp);
    event VotingPaused(address indexed admin, uint256 timestamp);
    event VotingUnpaused(address indexed admin, uint256 timestamp);
    event VotingTimesUpdated(uint256 newStart, uint256 newEnd, uint256 timestamp);

    constructor(string[] memory _candidateNames, uint256 _durationInMinutes) {
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name: _candidateNames[i],
                voteCount: 0
            }));
            emit CandidateAdded(_candidateNames[i], i, block.timestamp);
        }
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ELECTION_MANAGER_ROLE, msg.sender);
        
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
        voterRegistrationRequired = false;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyElectionManager() {
        require(hasRole(ELECTION_MANAGER_ROLE, msg.sender), "Caller is not an election manager");
        _;
    }

    // Voter registration functions
    function enableVoterRegistration(bool _required) public onlyAdmin {
        voterRegistrationRequired = _required;
    }

    function registerVoter(address _voter) public onlyElectionManager {
        require(!registeredVoters[_voter], "Voter already registered");
        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter, block.timestamp);
    }

    function registerVotersBatch(address[] memory _voters) public onlyElectionManager {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!registeredVoters[_voters[i]]) {
                registeredVoters[_voters[i]] = true;
                emit VoterRegistered(_voters[i], block.timestamp);
            }
        }
    }

    function unregisterVoter(address _voter) public onlyElectionManager {
        require(registeredVoters[_voter], "Voter not registered");
        registeredVoters[_voter] = false;
        emit VoterUnregistered(_voter, block.timestamp);
    }

    function addCandidate(string memory _name) public onlyElectionManager whenNotPaused {
        require(block.timestamp < votingStart || block.timestamp >= votingEnd, "Cannot add candidates during active voting");
        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));
        emit CandidateAdded(_name, candidates.length - 1, block.timestamp);
    }

    function vote(uint256 _candidateIndex) public whenNotPaused nonReentrant {
        require(!voters[msg.sender], "You have already voted");
        require(_candidateIndex < candidates.length, "Invalid candidate index");
        require(block.timestamp >= votingStart && block.timestamp < votingEnd, "Voting is not active");
        
        if (voterRegistrationRequired) {
            require(registeredVoters[msg.sender], "You are not registered to vote");
        }

        candidates[_candidateIndex].voteCount++;
        voters[msg.sender] = true;
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateIndex, block.timestamp);
    }

    // Pause/Unpause functions for emergency situations
    function pauseVoting() public onlyAdmin {
        _pause();
        emit VotingPaused(msg.sender, block.timestamp);
    }

    function unpauseVoting() public onlyAdmin {
        _unpause();
        emit VotingUnpaused(msg.sender, block.timestamp);
    }

    // Time management functions
    function extendVoting(uint256 _additionalMinutes) public onlyElectionManager {
        require(block.timestamp < votingEnd, "Voting has already ended");
        votingEnd += (_additionalMinutes * 1 minutes);
        emit VotingTimesUpdated(votingStart, votingEnd, block.timestamp);
    }

    function updateVotingPeriod(uint256 _newStart, uint256 _newEnd) public onlyElectionManager {
        require(_newStart < _newEnd, "Invalid time period");
        require(block.timestamp < votingStart || totalVotes == 0, "Cannot modify after voting starts");
        votingStart = _newStart;
        votingEnd = _newEnd;
        emit VotingTimesUpdated(_newStart, _newEnd, block.timestamp);
    }

    // View functions
    function getAllVotesOfCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd && !paused());
    }

    function getRemainingTime() public view returns (uint256) {
        require(block.timestamp >= votingStart, "Voting has not started yet");
        if (block.timestamp >= votingEnd) {
            return 0;
        }
        return votingEnd - block.timestamp;
    }

    function getTotalVotes() public view returns (uint256) {
        return totalVotes;
    }

    function getVoterRegistrationStatus(address _voter) public view returns (bool) {
        return registeredVoters[_voter];
    }

    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter];
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getWinningCandidate() public view returns (string memory winnerName, uint256 winnerVoteCount) {
        require(block.timestamp >= votingEnd, "Voting is still active");
        require(candidates.length > 0, "No candidates available");
        
        uint256 winningVoteCount = 0;
        uint256 winningIndex = 0;
        
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningIndex = i;
            }
        }
        
        return (candidates[winningIndex].name, candidates[winningIndex].voteCount);
    }
}