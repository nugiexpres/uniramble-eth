//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "./ERC6551Registry.sol";
import "./BreadToken.sol";
import "./MeatToken.sol";
import "./LettuceToken.sol";
import "./TomatoToken.sol";
import "./ChefNFT.sol";
import "./FoodNFT.sol";
import "./FaucetMon.sol";
import "./interfaces/IPaymentGateway.sol";

contract FoodScramble {
    ERC6551Registry public registry;
    BreadToken public bread;
    MeatToken public meat;
    LettuceToken public lettuce;
    TomatoToken public tomato;
    ChefNFT public chefNFT;
    FoodNFT public hamburger;
    FaucetMon public faucetMon;
    IPaymentGateway public paymentGateway;

    address public immutable owner;

    Box[] public grid;
    mapping(address => address) public tbaList;
    mapping(address => uint256) public player;
    mapping(address => bool) public canBuy;
    mapping(address => uint256) public rollCount;
    mapping(address => uint256) public faucetUsageCount;
    mapping(address => uint256) public lastFaucetUsage;
    mapping(address => uint256) public lastMintedSpecialBox;
    mapping(address => PlayerStats) public stats;
    mapping(address => mapping(IngredientType => uint256)) public inventory;
    mapping(address => string) public usernames;
    mapping(string => address) public nameToAddress;
    mapping(address => uint256[]) public travelHistory;
    mapping(address => bool) public isPlayerCreated;

    struct Box {
        uint256 id;
        string typeGrid;
        uint256 ingredientType;
        uint256 numberOfPlayers;
    }

    struct PlayerStats {
        uint256 totalRolls;
        uint256 ingredientsCollected;
        uint256 foodsMinted;
        uint256 lastActive;
        bool hasSpecialAccess;
    }

    enum IngredientType {
        Bread,
        Meat,
        Lettuce,
        Tomato
    }

    event PlayerMoved(address indexed player, uint256 newPosition, uint256 roll);
    event PlayerCreated(address indexed tba, uint256 gridIndex);
    event TokenBoundAccountCreated(address indexed eoa, address indexed tba, uint256 startPosition);
    event IngredientPurchased(address indexed player, uint256 ingredientType, uint256 position);
    event RailTraveled(address indexed player, uint256 fromPosition, uint256 toPosition);
    event HamburgerMinted(address indexed player, uint256 tokenId);
    event FaucetAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event FaucetCooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    uint256 public faucetAmount;
    uint256 public faucetCooldown;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        address _owner,
        address _registryAddress,
        address _breadAddress,
        address _meatAddress,
        address _lettuceAddress,
        address _tomatoAddress,
        address _chefNFTAddress,
        address _hamburgerAddress,
        address payable _faucetMonAddress,
        address payable _paymentGatewayAddress
    ) {
        owner = _owner;
        registry = ERC6551Registry(_registryAddress);
        bread = BreadToken(_breadAddress);
        meat = MeatToken(_meatAddress);
        lettuce = LettuceToken(_lettuceAddress);
        tomato = TomatoToken(_tomatoAddress);
        chefNFT = ChefNFT(_chefNFTAddress);
        hamburger = FoodNFT(_hamburgerAddress);
        faucetMon = FaucetMon(payable(_faucetMonAddress));
        paymentGateway = IPaymentGateway(payable(_paymentGatewayAddress));

        string[] memory gridTypes = new string[](20);
        uint256[] memory ingredientTypes = new uint256[](20);

        gridTypes[0] = "Stove";
        ingredientTypes[0] = 99;

        for (uint256 id = 1; id < 5; id++) {
            gridTypes[id] = "Bread";
            ingredientTypes[id] = 0;
        }

        gridTypes[5] = "Rail";
        ingredientTypes[5] = 98;

        for (uint256 id = 6; id < 10; id++) {
            gridTypes[id] = "Meat";
            ingredientTypes[id] = 1;
        }

        gridTypes[10] = "Stove";
        ingredientTypes[10] = 99;

        for (uint256 id = 11; id < 15; id++) {
            gridTypes[id] = "Lettuce";
            ingredientTypes[id] = 2;
        }

        gridTypes[15] = "Rail";
        ingredientTypes[15] = 98;

        for (uint256 id = 16; id < 20; id++) {
            gridTypes[id] = "Tomato";
            ingredientTypes[id] = 3;
        }

        for (uint256 i = 0; i < 20; i++) {
            grid.push(Box(i, gridTypes[i], ingredientTypes[i], 0));
        }
    }

    function getGrid() public view returns (Box[] memory) {
        return grid;
    }

    function getMyFoods(address _owner) public view returns (uint256[] memory) {
        address tba = tbaList[_owner];
        return hamburger.getMyFoods(tba);
    }


    function createPlayer(address tba) internal {
        require(!isPlayerCreated[tba], "Already registered");

        for (uint256 i = 0; i < grid.length; i++) {
            if (keccak256(abi.encodePacked(grid[i].typeGrid)) == keccak256(abi.encodePacked("Stove"))) {
                player[tba] = i;
                grid[i].numberOfPlayers += 1;
                isPlayerCreated[tba] = true;

                emit PlayerCreated(tba, i);
                return;
            }
        }

        revert("No Stove grid found");
    }

    function createTokenBoundAccount(
        address _implementation,
        uint256 _chainId,
        address _tokenContract,
        uint256 _tokenId,
        uint256 _salt,
        bytes calldata _initData
    ) external {
        // Validate token contract is ChefNFT
        require(_tokenContract == address(chefNFT), "Must use ChefNFT contract");
        
        // Check if ChefNFT exists and get owner
        address tokenOwner;
        try chefNFT.ownerOf(_tokenId) returns (address nftOwner) {
            tokenOwner = nftOwner;
        } catch {
            revert("ChefNFT does not exist");
        }
        
        // Validate token owner is not zero address
        require(tokenOwner != address(0), "Invalid ChefNFT owner");
        
        // Check if user already has a TBA
        require(tbaList[msg.sender] == address(0), "TBA already exists for this user");

        address newTBA = registry.createAccount(_implementation, _chainId, _tokenContract, _tokenId, _salt, _initData);
        tbaList[msg.sender] = newTBA;

        createPlayer(newTBA);
        emit TokenBoundAccountCreated(msg.sender, newTBA, player[newTBA]);
    }

    function movePlayer() external {
        address tba = tbaList[msg.sender];
        require(tba != address(0), "TBA not found");

        uint256 nonce = rollCount[tba];
        uint8 roll = getRandomRoll(tba, nonce);
        rollCount[tba] = nonce + 1;

        uint256 currentPos = player[tba];
        require(grid[currentPos].numberOfPlayers > 0, "Invalid player count");
        grid[currentPos].numberOfPlayers -= 1;

        uint256 nextPos = currentPos + roll;
        if (nextPos >= 20) {
            nextPos = 0;
            grid[0].numberOfPlayers += 1;
        } else {
            grid[nextPos].numberOfPlayers += 1;
        }

        player[tba] = nextPos;

        if (grid[nextPos].ingredientType <= 3) {
            canBuy[tba] = true;
        }

        emit PlayerMoved(tba, nextPos, roll);
    }

    // Internal RNG function
    function getRandomRoll(address playerAddr, uint256 nonce) internal view returns (uint8) {
        bytes32 hash = keccak256(abi.encodePacked(blockhash(block.number - 1), playerAddr, nonce));
        return uint8(uint256(hash) % 6) + 1; // 1-6
    }

    // Public function to get random roll for UI
    function getRandomRollForUI(address playerAddr, uint256 nonce) external view returns (uint8) {
        return getRandomRoll(playerAddr, nonce);
    }

    /// @notice Owner bisa set biaya payment amount manual
    function setFaucetAmount(uint256 _newAmount) external onlyOwner {
        uint256 oldAmount = faucetAmount;
        faucetAmount = _newAmount;
        emit FaucetAmountUpdated(oldAmount, faucetAmount);
    }

    function setFaucetCooldown(uint256 _newCooldown) external onlyOwner {
        uint256 oldCooldown = faucetCooldown;
        faucetCooldown = _newCooldown;
        emit FaucetCooldownUpdated(oldCooldown, faucetCooldown);
    }

    function getFaucetAmount() external view returns (uint256) {
        return faucetAmount;
    }

    function getFaucetCooldown() external view returns (uint256) {
        return faucetCooldown;
    }

    /// @notice Baca saldo native token (ETH/MON) milik TBA user
    function getTbaBalance(address user) external view returns (uint256) {
        address tba = tbaList[user];
        require(tba != address(0), "User has no TBA");
        return tba.balance;
    }

    /// @notice Baca saldo ERC20 milik TBA user
    function getTbaTokenBalance(address user, address token) external view returns (uint256) {
        address tba = tbaList[user];
        require(tba != address(0), "User has no TBA");
        return IERC20(token).balanceOf(tba);
    }

    function buyIngredient() public {
        address tba = tbaList[msg.sender];
        require(tba != address(0), "TBA not found");
        require(canBuy[tba], "already brought ingredient");

        uint256 currentPosition = player[tba];
        Box memory currentSpot = grid[currentPosition];
        require(currentSpot.ingredientType <= 3, "Not an ingredient grid");

        // For gasless transactions, we don't process payment since Smart Account handles gas
        if (currentSpot.ingredientType == 0) bread.mint(tba, 1 * 10 ** 18);
        else if (currentSpot.ingredientType == 1) meat.mint(tba, 1 * 10 ** 18);
        else if (currentSpot.ingredientType == 2) lettuce.mint(tba, 1 * 10 ** 18);
        else if (currentSpot.ingredientType == 3) tomato.mint(tba, 1 * 10 ** 18);

        canBuy[tba] = false;

        // Update stats
        stats[tba].ingredientsCollected += 1;
        stats[tba].lastActive = block.timestamp;

        emit IngredientPurchased(tba, currentSpot.ingredientType, currentPosition);
    }

    function travelRail() public {
        address tba = tbaList[msg.sender];
        Box memory currentSpot = grid[player[tba]];
        require(currentSpot.ingredientType == 98, "Go to Rail Grid");

        uint256 fromPosition = player[tba];
        uint256 toPosition;

        grid[player[tba]].numberOfPlayers -= 1;

        if (player[tba] == 5) {
            player[tba] = 15;
            toPosition = 15;
            grid[15].numberOfPlayers += 1;
        } else {
            player[tba] = 5;
            toPosition = 5;
            grid[5].numberOfPlayers += 1;
        }

        emit RailTraveled(tba, fromPosition, toPosition);
    }

    // Add helper function to check if position allows buying
    function canBuyAtPosition(uint256 position) public view returns (bool) {
        if (position >= grid.length) return false;
        return grid[position].ingredientType <= 3;
    }

    // Add function to get ingredient type at position
    function getIngredientTypeAtPosition(uint256 position) public view returns (uint256) {
        require(position < grid.length, "Invalid position");
        return grid[position].ingredientType;
    }

    function mintFoodNFT() public {
        address tba = tbaList[msg.sender];
        // require(bread.balanceOf[tba] > 0, "You need more bread");
        // require(meat.balanceOf[tba] > 0, "You need more meat");
        // require(lettuce.balanceOf[tba] > 0, "You need more lettuce");
        // require(tomato.balanceOf[tba] > 0, "You need more tomato");

        bread.burn(tba, 1 * 10 ** 18);
        meat.burn(tba, 1 * 10 ** 18);
        lettuce.burn(tba, 1 * 10 ** 18);
        tomato.burn(tba, 1 * 10 ** 18);

        uint256 tokenId = hamburger.mintFood(tba, "hamburger");

        emit HamburgerMinted(tba, tokenId);
    }

    function useFaucetMon() public {
        address tba = tbaList[msg.sender];
        uint256 playerPosition = player[tba];
        require(
            keccak256(abi.encodePacked(grid[playerPosition].typeGrid)) == keccak256(abi.encodePacked("Stove")),
            "must on stove to use faucet."
        );

        uint256 currentTime = block.timestamp;
        require(currentTime >= lastFaucetUsage[msg.sender] + faucetCooldown, "Faucet already used. Please wait.");

        lastFaucetUsage[msg.sender] = currentTime;

        // Panggil kontrak FaucetMon untuk kirim ETH
        faucetMon.faucet(msg.sender, faucetAmount);
    }

    // menyimpan TBA user
    function setTBA(address user, address tba) external {
        // validasi
        tbaList[user] = tba;
    }

    function accountReady(address user) public view returns (bool) {
        return tbaList[user] != address(0);
    }

    function logTravel(uint256 index) internal {
        travelHistory[msg.sender].push(index);
        stats[msg.sender].lastActive = block.timestamp;
    }

    function setUsername(string calldata name) public {
        require(bytes(usernames[msg.sender]).length == 0, "Username already set");
        usernames[msg.sender] = name;
        nameToAddress[name] = msg.sender;
    }

    function burnOldIngredients() public {
        address tba = tbaList[msg.sender];
        bread.burn(tba, 1 ether);
        meat.burn(tba, 1 ether);
        lettuce.burn(tba, 1 ether);
        tomato.burn(tba, 1 ether);
    }

    function resetPlayerProgress(address playerAddr) public {
        require(msg.sender == owner, "Only owner can reset");
        delete stats[playerAddr];
        delete travelHistory[playerAddr];

        // Determine the number of IngredientType values
        uint256 ingredientCount = uint256(IngredientType.Tomato) + 1;

        for (uint256 i = 0; i < ingredientCount; i++) {
            inventory[playerAddr][IngredientType(i)] = 0;
        }
    }

    // ================== onlyOwner ==================
    function faucets() public onlyOwner {
        address tba = tbaList[msg.sender];

        // for testing
        bread.mint(tba, 1 * 10 ** 18);
        meat.mint(tba, 1 * 10 ** 18);
        lettuce.mint(tba, 1 * 10 ** 18);
        tomato.mint(tba, 1 * 10 ** 18);
    }
}
