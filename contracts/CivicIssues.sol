// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.2 <0.9.0;

contract CivicIssues {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    enum IssueStatus {
        Reported,
        UnderReview,
        InProgress,
        Resolved,
        Rejected,
        Confirmed
    }

    struct Issue {
        uint256 id;
        address reporter;
        string location;
        string description;
        string imageHash;
        uint256 timestamp;
        uint256 resolvedTimestamp;
        uint256 totalFunding;
        uint256 fundsUsed;
        uint256 confirmationCount;
        IssueStatus status;
        mapping(address => bool) confirmations;
        mapping(address => uint256) funders;
    }

    struct IssueView {
        uint256 id;
        address reporter;
        string location;
        string description;
        string imageHash;
        IssueStatus status;
        uint256 timestamp;
        uint256 resolvedTimestamp;
        uint256 totalFunding;
        uint256 fundsUsed;
        uint256 confirmationCount;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    address public admin;
    mapping(uint256 => Issue) private issues;
    uint256 public issueCount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event IssueReported(
        uint256 indexed issueId,
        address indexed reporter,
        string location,
        string description,
        string imageHash,
        uint256 timestamp
    );

    event IssueStatusUpdated(
        uint256 indexed issueId,
        address indexed updatedBy,
        uint8 newStatus,
        uint256 timestamp
    );

    event IssueConfirmed(
        uint256 indexed issueId,
        address indexed confirmedBy,
        uint256 confirmationCount,
        uint256 timestamp
    );

    event IssueFunded(
        uint256 indexed issueId,
        address indexed funder,
        uint256 amount,
        uint256 totalfunding,
        uint256 timestamp
    );

    event FundsWithdrawn(
        uint256 indexed issueId,
        address indexed admin,
        uint256 amount,
        uint256 remainingFunds,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier issueExists(uint256 _issueId) {
        require(_issueId > 0 && _issueId <= issueCount, "Issue does not exist");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                                CORE
    //////////////////////////////////////////////////////////////*/

    function reportIssue(
        string memory _location,
        string memory _description,
        string memory _imageHash
    ) external returns (uint256) {
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_imageHash).length > 0, "Image hash cannot be empty");

        issueCount++;

        Issue storage newIssue = issues[issueCount];
        newIssue.id = issueCount;
        newIssue.reporter = msg.sender;
        newIssue.location = _location;
        newIssue.description = _description;
        newIssue.imageHash = _imageHash;
        newIssue.status = IssueStatus.Reported;
        newIssue.timestamp = block.timestamp;
        newIssue.resolvedTimestamp = 0;
        newIssue.confirmationCount = 0;
        newIssue.totalFunding = 0;
        newIssue.fundsUsed = 0;

        emit IssueReported(
            issueCount,
            msg.sender,
            _location,
            _description,
            _imageHash,
            block.timestamp
        );

        return issueCount;
    }

    /*//////////////////////////////////////////////////////////////
                        CONFIRMATION
    //////////////////////////////////////////////////////////////*/

    function confirmIssue(uint256 _issueId) external issueExists(_issueId) {
        Issue storage issue = issues[_issueId];
        require(
            issue.status == IssueStatus.Resolved,
            "Only resolved issues can be confirmed"
        );
        require(
            !issue.confirmations[msg.sender],
            "You have already confirmed this issue"
        );

        issue.confirmations[msg.sender] = true;
        issue.confirmationCount++;

        if (
            issue.confirmationCount >= 3 &&
            issue.status != IssueStatus.Confirmed
        ) {
            issue.status = IssueStatus.Confirmed;
        }

        emit IssueConfirmed(
            _issueId,
            msg.sender,
            issue.confirmationCount,
            block.timestamp
        );
    }

    function getConfirmationCount(
        uint256 _issueId
    ) external view issueExists(_issueId) returns (uint256) {
        return issues[_issueId].confirmationCount;
    }

    function hasUserConfirmed(
        uint256 _issueId,
        address _user
    ) external view issueExists(_issueId) returns (bool) {
        return issues[_issueId].confirmations[_user];
    }

    /*//////////////////////////////////////////////////////////////
                            STATUS
    //////////////////////////////////////////////////////////////*/

    function updateIssueStatus(
        uint256 _issueId,
        uint8 _newStatus
    ) external issueExists(_issueId) {
        require(_newStatus <= 5, "Invalid status");

        Issue storage issue = issues[_issueId];
        IssueStatus status = IssueStatus(_newStatus);

        if (
            status == IssueStatus.Resolved ||
            status == IssueStatus.Rejected ||
            status == IssueStatus.Confirmed
        ) {
            issue.resolvedTimestamp = block.timestamp;
        }

        issue.status = status;

        emit IssueStatusUpdated(
            _issueId,
            msg.sender,
            _newStatus,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                            FUNDING
    //////////////////////////////////////////////////////////////*/

    function fundIssue(
        uint256 _issueId,
        uint256 _amount
    ) external issueExists(_issueId) {
        require(_amount > 0, "Funding amount must be greater than 0");
        Issue storage issue = issues[_issueId];
        require(
            issue.status != IssueStatus.Rejected,
            "Cannot fund rejected issues"
        );

        issue.funders[msg.sender] += _amount;
        issue.totalFunding += _amount;

        emit IssueFunded(
            _issueId,
            msg.sender,
            _amount,
            issue.totalFunding,
            block.timestamp
        );
    }

    function withdrawFunds(
        uint256 _issueId,
        uint256 _amount
    ) external issueExists(_issueId) {
        Issue storage issue = issues[_issueId];
        uint256 availableFunds = issue.totalFunding - issue.fundsUsed;

        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(_amount <= availableFunds, "Insufficient funds available");
        require(
            issue.status == IssueStatus.InProgress ||
                issue.status == IssueStatus.Resolved ||
                issue.status == IssueStatus.Confirmed,
            "Can only withdraw from in-progress, resolved, or confirmed issues"
        );

        issue.fundsUsed += _amount;

        emit FundsWithdrawn(
            _issueId,
            msg.sender,
            _amount,
            availableFunds - _amount,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                            GETTERS
    //////////////////////////////////////////////////////////////*/

    function getIssueFunding(
        uint256 _issueId
    )
        external
        view
        issueExists(_issueId)
        returns (uint256 totalFunding, uint256 fundsUsed, uint256 available)
    {
        Issue storage issue = issues[_issueId];
        return (
            issue.totalFunding,
            issue.fundsUsed,
            issue.totalFunding - issue.fundsUsed
        );
    }

    function getUserFunding(
        uint256 _issueId,
        address _user
    ) external view issueExists(_issueId) returns (uint256) {
        return issues[_issueId].funders[_user];
    }

    function getAllIssues() external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](issueCount);

        for (uint256 i = 0; i < issueCount; i++) {
            result[i] = issues[i + 1].id;
        }

        return result;
    }

    function getIssue(
        uint256 _issueId
    )
        external
        view
        issueExists(_issueId)
        returns (
            uint256 id,
            address reporter,
            string memory location,
            string memory description,
            string memory imageHash,
            uint8 status,
            uint256 timestamp
        )
    {
        Issue storage issue = issues[_issueId];
        return (
            issue.id,
            issue.reporter,
            issue.location,
            issue.description,
            issue.imageHash,
            uint8(issue.status),
            issue.timestamp
        );
    }

    function getIssueCount() external view returns (uint256) {
        return issueCount;
    }
}
