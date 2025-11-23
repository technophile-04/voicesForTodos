// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MessageVault
 * @dev A contract where users can buy grid cells with messages
 * Each cell can be overwritten by paying more than the previous price
 * All funds are stored in the contract vault
 */
contract MessageVault {
    struct GridCell {
        string message;
        address owner;
        uint256 price;
        uint256 timestamp;
    }

    // Grid dimensions
    uint256 public constant GRID_WIDTH = 10;
    uint256 public constant GRID_HEIGHT = 10;
    uint256 public constant TOTAL_CELLS = GRID_WIDTH * GRID_HEIGHT;

    // Minimum price increment (10% more than current price)
    uint256 public constant MIN_PRICE_INCREMENT = 110; // 110% = 10% increase
    uint256 public constant PRICE_DENOMINATOR = 100;

    // Minimum initial price (0.001 CELO)
    uint256 public constant MIN_INITIAL_PRICE = 0.001 ether;

    // Grid storage: cellId => GridCell
    mapping(uint256 => GridCell) public grid;

    // Total value locked in vault
    uint256 public totalVaultValue;

    // Events
    event CellPurchased(
        uint256 indexed cellId,
        address indexed buyer,
        address indexed previousOwner,
        string message,
        uint256 price,
        uint256 timestamp
    );

    event MessageUpdated(uint256 indexed cellId, address indexed owner, string newMessage, uint256 timestamp);

    /**
     * @dev Buy or overwrite a grid cell with a message
     * @param cellId The ID of the cell (0 to TOTAL_CELLS-1)
     * @param message The message to display in the cell
     */
    function buyCell(uint256 cellId, string memory message) external payable {
        require(cellId < TOTAL_CELLS, "Invalid cell ID");
        require(bytes(message).length > 0, "Message cannot be empty");
        require(bytes(message).length <= 100, "Message too long (max 100 chars)");

        GridCell storage cell = grid[cellId];
        uint256 currentPrice = cell.price;

        if (currentPrice == 0) {
            // First purchase of this cell
            require(msg.value >= MIN_INITIAL_PRICE, "Price too low for initial purchase");
        } else {
            // Cell already owned, must pay more
            uint256 minPrice = (currentPrice * MIN_PRICE_INCREMENT) / PRICE_DENOMINATOR;
            require(msg.value >= minPrice, "Must pay at least 10% more than current price");
        }

        address previousOwner = cell.owner;

        // Update cell
        cell.message = message;
        cell.owner = msg.sender;
        cell.price = msg.value;
        cell.timestamp = block.timestamp;

        // Add to vault
        totalVaultValue += msg.value;

        emit CellPurchased(cellId, msg.sender, previousOwner, message, msg.value, block.timestamp);
    }

    /**
     * @dev Update message of a cell you own (free)
     * @param cellId The ID of the cell
     * @param newMessage The new message
     */
    function updateMessage(uint256 cellId, string memory newMessage) external {
        require(cellId < TOTAL_CELLS, "Invalid cell ID");
        require(bytes(newMessage).length > 0, "Message cannot be empty");
        require(bytes(newMessage).length <= 100, "Message too long (max 100 chars)");

        GridCell storage cell = grid[cellId];
        require(cell.owner == msg.sender, "You don't own this cell");

        cell.message = newMessage;
        cell.timestamp = block.timestamp;

        emit MessageUpdated(cellId, msg.sender, newMessage, block.timestamp);
    }

    /**
     * @dev Get all cell data for the entire grid
     * @return An array of all grid cells
     */
    function getAllCells() external view returns (GridCell[] memory) {
        GridCell[] memory cells = new GridCell[](TOTAL_CELLS);
        for (uint256 i = 0; i < TOTAL_CELLS; i++) {
            cells[i] = grid[i];
        }
        return cells;
    }

    /**
     * @dev Get cell data
     * @param cellId The ID of the cell
     * @return The cell data
     */
    function getCell(uint256 cellId) external view returns (GridCell memory) {
        require(cellId < TOTAL_CELLS, "Invalid cell ID");
        return grid[cellId];
    }

    /**
     * @dev Calculate minimum price to buy a cell
     * @param cellId The ID of the cell
     * @return The minimum price required
     */
    function getMinimumPrice(uint256 cellId) external view returns (uint256) {
        require(cellId < TOTAL_CELLS, "Invalid cell ID");

        GridCell storage cell = grid[cellId];
        if (cell.price == 0) {
            return MIN_INITIAL_PRICE;
        }
        return (cell.price * MIN_PRICE_INCREMENT) / PRICE_DENOMINATOR;
    }

    /**
     * @dev Get total vault balance
     * @return The total CELO stored in the vault
     */
    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Convert x,y coordinates to cell ID
     * @param x The x coordinate (0 to GRID_WIDTH-1)
     * @param y The y coordinate (0 to GRID_HEIGHT-1)
     * @return The cell ID
     */
    function coordinatesToCellId(uint256 x, uint256 y) public pure returns (uint256) {
        require(x < GRID_WIDTH, "Invalid x coordinate");
        require(y < GRID_HEIGHT, "Invalid y coordinate");
        return y * GRID_WIDTH + x;
    }

    /**
     * @dev Convert cell ID to x,y coordinates
     * @param cellId The cell ID
     * @return x and y coordinates
     */
    function cellIdToCoordinates(uint256 cellId) public pure returns (uint256 x, uint256 y) {
        require(cellId < TOTAL_CELLS, "Invalid cell ID");
        x = cellId % GRID_WIDTH;
        y = cellId / GRID_WIDTH;
    }
}
