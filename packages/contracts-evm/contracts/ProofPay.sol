// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ProofPay
 * @dev Multi-chain P2P payment system with proof verification
 */
contract ProofPay is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Payment status enum
    enum PaymentStatus { Pending, Completed, Disputed, Cancelled }
    
    // Proof type enum  
    enum ProofType { None, Text, Photo, zkTLS, Hybrid }

    // User struct
    struct User {
        string username;
        bool isRegistered;
        mapping(address => bool) authorizedAddresses;
        uint256 createdAt;
    }

    // Payment struct
    struct Payment {
        bytes32 id;
        address sender;
        address recipient;
        uint256 amount;
        address token;
        PaymentStatus status;
        ProofType proofType;
        bytes proofData;
        string description;
        uint256 createdAt;
        uint256 completedAt;
        uint256 disputeDeadline;
    }

    // Rate limiting struct
    struct RateLimit {
        uint256 dailyLimit;      // Daily limit in wei
        uint256 dailyUsed;       // Daily used amount
        uint256 lastResetTime;   // Last daily reset time
    }

    // State variables
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;
    mapping(bytes32 => Payment) public payments;
    mapping(address => RateLimit) public rateLimits;
    
    // Rate limiting constants
    uint256 public constant DEFAULT_DAILY_LIMIT = 10000 ether; // $10k equivalent
    uint256 public constant DISPUTE_PERIOD = 7 days;
    
    // Events
    event UserRegistered(address indexed user, string username);
    event PaymentCreated(bytes32 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount);
    event ProofSubmitted(bytes32 indexed paymentId, ProofType proofType, bytes proofData);
    event PaymentCompleted(bytes32 indexed paymentId);
    event PaymentDisputed(bytes32 indexed paymentId, string reason);
    event PaymentCancelled(bytes32 indexed paymentId);
    event RateLimitUpdated(address indexed user, uint256 newLimit);

    // Modifiers
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier validPayment(bytes32 paymentId) {
        require(payments[paymentId].id != bytes32(0), "Payment does not exist");
        _;
    }

    modifier onlyPaymentParties(bytes32 paymentId) {
        require(
            payments[paymentId].sender == msg.sender || 
            payments[paymentId].recipient == msg.sender,
            "Not authorized for this payment"
        );
        _;
    }

    /**
     * @dev Register a new user with username
     * @param _username Unique username for the user
     */
    function registerUser(string calldata _username) external whenNotPaused {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(usernameToAddress[_username] == address(0), "Username already taken");
        require(bytes(_username).length > 0 && bytes(_username).length <= 50, "Invalid username length");

        users[msg.sender] = User({
            username: _username,
            isRegistered: true,
            createdAt: block.timestamp
        });
        
        usernameToAddress[_username] = msg.sender;
        
        // Set default rate limit
        rateLimits[msg.sender] = RateLimit({
            dailyLimit: DEFAULT_DAILY_LIMIT,
            dailyUsed: 0,
            lastResetTime: block.timestamp
        });

        emit UserRegistered(msg.sender, _username);
    }

    /**
     * @dev Add authorized address to user account
     * @param _address Address to authorize
     */
    function addAuthorizedAddress(address _address) external onlyRegistered {
        require(_address != address(0), "Invalid address");
        users[msg.sender].authorizedAddresses[_address] = true;
    }

    /**
     * @dev Create a new payment
     * @param _recipient Recipient address or username
     * @param _amount Payment amount
     * @param _token Token address (address(0) for native)
     * @param _description Payment description
     * @param _proofType Required proof type
     */
    function createPayment(
        string calldata _recipient,
        uint256 _amount,
        address _token,
        string calldata _description,
        ProofType _proofType
    ) external payable nonReentrant onlyRegistered whenNotPaused returns (bytes32 paymentId) {
        require(_amount > 0, "Amount must be greater than 0");
        
        // Resolve recipient address
        address recipientAddr = _resolveRecipient(_recipient);
        require(recipientAddr != address(0), "Invalid recipient");
        require(recipientAddr != msg.sender, "Cannot send to self");

        // Check rate limiting
        _checkRateLimit(msg.sender, _amount);

        // Generate payment ID
        paymentId = keccak256(abi.encodePacked(msg.sender, recipientAddr, _amount, block.timestamp));

        // Handle token transfer
        if (_token == address(0)) {
            // Native token payment
            require(msg.value == _amount, "Incorrect native amount sent");
        } else {
            // ERC20 token payment
            require(msg.value == 0, "No native token should be sent for ERC20");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        // Create payment
        payments[paymentId] = Payment({
            id: paymentId,
            sender: msg.sender,
            recipient: recipientAddr,
            amount: _amount,
            token: _token,
            status: PaymentStatus.Pending,
            proofType: _proofType,
            proofData: "",
            description: _description,
            createdAt: block.timestamp,
            completedAt: 0,
            disputeDeadline: block.timestamp + DISPUTE_PERIOD
        });

        // Update rate limit
        _updateRateLimit(msg.sender, _amount);

        emit PaymentCreated(paymentId, msg.sender, recipientAddr, _amount);

        // Auto-complete if no proof required
        if (_proofType == ProofType.None) {
            _completePayment(paymentId);
        }
    }

    /**
     * @dev Submit proof for a payment
     * @param _paymentId Payment ID
     * @param _proofData Proof data
     */
    function submitProof(
        bytes32 _paymentId,
        bytes calldata _proofData
    ) external validPayment(_paymentId) onlyPaymentParties(_paymentId) whenNotPaused {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(payment.proofType != ProofType.None, "No proof required");
        require(_proofData.length > 0, "Empty proof data");

        payment.proofData = _proofData;

        emit ProofSubmitted(_paymentId, payment.proofType, _proofData);

        // Auto-complete simple proofs
        if (payment.proofType == ProofType.Text || payment.proofType == ProofType.Photo) {
            _completePayment(_paymentId);
        }
    }

    /**
     * @dev Complete a payment (release funds)
     * @param _paymentId Payment ID
     */
    function completePayment(bytes32 _paymentId) external validPayment(_paymentId) whenNotPaused {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        
        // Only recipient can complete, or sender if no proof required
        if (payment.proofType == ProofType.None) {
            require(msg.sender == payment.sender, "Only sender can complete");
        } else {
            require(msg.sender == payment.recipient, "Only recipient can complete");
            require(payment.proofData.length > 0, "Proof not submitted");
        }

        _completePayment(_paymentId);
    }

    /**
     * @dev Dispute a payment
     * @param _paymentId Payment ID
     * @param _reason Dispute reason
     */
    function disputePayment(
        bytes32 _paymentId,
        string calldata _reason
    ) external validPayment(_paymentId) onlyPaymentParties(_paymentId) whenNotPaused {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(block.timestamp <= payment.disputeDeadline, "Dispute period expired");
        require(bytes(_reason).length > 0, "Dispute reason required");

        payment.status = PaymentStatus.Disputed;

        emit PaymentDisputed(_paymentId, _reason);
    }

    /**
     * @dev Cancel a payment (only sender, before proof submission)
     * @param _paymentId Payment ID
     */
    function cancelPayment(bytes32 _paymentId) external validPayment(_paymentId) whenNotPaused {
        Payment storage payment = payments[_paymentId];
        require(payment.sender == msg.sender, "Only sender can cancel");
        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(payment.proofData.length == 0, "Cannot cancel after proof submission");

        payment.status = PaymentStatus.Cancelled;
        payment.completedAt = block.timestamp;

        // Refund funds
        _transferFunds(payment.token, payment.amount, payment.sender);

        emit PaymentCancelled(_paymentId);
    }

    /**
     * @dev Update user's rate limit (only owner)
     * @param _user User address
     * @param _newLimit New daily limit
     */
    function updateRateLimit(address _user, uint256 _newLimit) external onlyOwner {
        rateLimits[_user].dailyLimit = _newLimit;
        emit RateLimitUpdated(_user, _newLimit);
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // Internal functions
    function _completePayment(bytes32 _paymentId) internal {
        Payment storage payment = payments[_paymentId];
        payment.status = PaymentStatus.Completed;
        payment.completedAt = block.timestamp;

        // Transfer funds to recipient
        _transferFunds(payment.token, payment.amount, payment.recipient);

        emit PaymentCompleted(_paymentId);
    }

    function _transferFunds(address _token, uint256 _amount, address _to) internal {
        if (_token == address(0)) {
            // Native token
            (bool success, ) = payable(_to).call{value: _amount}("");
            require(success, "Native transfer failed");
        } else {
            // ERC20 token
            IERC20(_token).safeTransfer(_to, _amount);
        }
    }

    function _resolveRecipient(string calldata _recipient) internal view returns (address) {
        // Try to parse as address first
        if (bytes(_recipient).length == 42 && bytes(_recipient)[0] == '0' && bytes(_recipient)[1] == 'x') {
            return _parseAddress(_recipient);
        }
        
        // Otherwise treat as username
        return usernameToAddress[_recipient];
    }

    function _parseAddress(string calldata _addressString) internal pure returns (address) {
        bytes memory stringBytes = bytes(_addressString);
        require(stringBytes.length == 42, "Invalid address format");
        
        uint256 result = 0;
        for (uint256 i = 2; i < 42; i++) {
            uint256 digit;
            uint8 c = uint8(stringBytes[i]);
            
            if (c >= 48 && c <= 57) {
                digit = c - 48;
            } else if (c >= 65 && c <= 70) {
                digit = c - 55;
            } else if (c >= 97 && c <= 102) {
                digit = c - 87;
            } else {
                revert("Invalid hex character");
            }
            
            result = result * 16 + digit;
        }
        
        return address(uint160(result));
    }

    function _checkRateLimit(address _user, uint256 _amount) internal view {
        RateLimit memory limit = rateLimits[_user];
        
        // Reset if day has passed
        uint256 currentDay = block.timestamp / 1 days;
        uint256 limitDay = limit.lastResetTime / 1 days;
        
        uint256 usedAmount = (currentDay > limitDay) ? 0 : limit.dailyUsed;
        
        require(usedAmount + _amount <= limit.dailyLimit, "Daily rate limit exceeded");
    }

    function _updateRateLimit(address _user, uint256 _amount) internal {
        RateLimit storage limit = rateLimits[_user];
        
        // Reset if day has passed
        uint256 currentDay = block.timestamp / 1 days;
        uint256 limitDay = limit.lastResetTime / 1 days;
        
        if (currentDay > limitDay) {
            limit.dailyUsed = _amount;
            limit.lastResetTime = block.timestamp;
        } else {
            limit.dailyUsed += _amount;
        }
    }

    // View functions
    function getPayment(bytes32 _paymentId) external view returns (
        bytes32 id,
        address sender,
        address recipient,
        uint256 amount,
        address token,
        PaymentStatus status,
        ProofType proofType,
        string memory description,
        uint256 createdAt,
        uint256 completedAt
    ) {
        Payment memory payment = payments[_paymentId];
        return (
            payment.id,
            payment.sender,
            payment.recipient,
            payment.amount,
            payment.token,
            payment.status,
            payment.proofType,
            payment.description,
            payment.createdAt,
            payment.completedAt
        );
    }

    function getUserInfo(address _user) external view returns (
        string memory username,
        bool isRegistered,
        uint256 createdAt,
        uint256 dailyLimit,
        uint256 dailyUsed
    ) {
        User storage user = users[_user];
        RateLimit memory limit = rateLimits[_user];
        
        return (
            user.username,
            user.isRegistered,
            user.createdAt,
            limit.dailyLimit,
            limit.dailyUsed
        );
    }
}