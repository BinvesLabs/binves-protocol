// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract BinGov {
    // The name of this contract
    string public constant name = "Binves Protocol Governor";

    // Details of a proposal
    struct Proposal {
    }

    // Possible states that a proposal may be in
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    // An event emitted when a new proposal is created
    event ProposalCreated(uint id, address proposer, string description);

    // An event emitted when a proposal has been canceled
    event ProposalCanceled(uint id);

    // An event emitted when a proposal has been queued in the BinExecutor
    event ProposalQueued(uint id, uint eta);

    // An event emitted when a proposal has been executed in the Timelock
    event ProposalExecuted(uint id);

    // propose a new proposal
    function propose(string description) public returns (uint) {
        emit ProposalCreated(newProposal.id, msg.sender, description);
        return newProposal.id;
    }

    function queue(uint proposalId) public {
        emit ProposalQueued(proposalId);
    }

    function execute(uint proposalId) public payable {
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint proposalId) public {
        emit ProposalCanceled(proposalId);
    }

    function castVote(address voter, uint proposalId, bool support) public {
    }
}