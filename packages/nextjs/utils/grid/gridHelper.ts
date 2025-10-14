/**
 * Grid Helper - Map positions to grid types and ingredients
 * Based on FoodScramble.sol grid initialization
 */

export interface GridInfo {
  position: number;
  gridType: string;
  ingredientType: number;
  ingredientName: string;
}

/**
 * Grid layout (20 grids total - index 0 to 19):
 *
 * Grid 0: Stove (99)
 * Grid 1-4: Bread (0)
 * Grid 5: Rail (98)
 * Grid 6-9: Meat (1)
 * Grid 10: Stove (99)
 * Grid 11-14: Lettuce (2)
 * Grid 15: Rail (98)
 * Grid 16-19: Tomato (3)
 */
export const GRID_LAYOUT: GridInfo[] = [
  // Grid 0: Stove
  { position: 0, gridType: "Stove", ingredientType: 99, ingredientName: "Stove" },

  // Grid 1-4: Bread
  { position: 1, gridType: "Bread", ingredientType: 0, ingredientName: "Bread" },
  { position: 2, gridType: "Bread", ingredientType: 0, ingredientName: "Bread" },
  { position: 3, gridType: "Bread", ingredientType: 0, ingredientName: "Bread" },
  { position: 4, gridType: "Bread", ingredientType: 0, ingredientName: "Bread" },

  // Grid 5: Rail
  { position: 5, gridType: "Rail", ingredientType: 98, ingredientName: "Rail" },

  // Grid 6-9: Meat
  { position: 6, gridType: "Meat", ingredientType: 1, ingredientName: "Meat" },
  { position: 7, gridType: "Meat", ingredientType: 1, ingredientName: "Meat" },
  { position: 8, gridType: "Meat", ingredientType: 1, ingredientName: "Meat" },
  { position: 9, gridType: "Meat", ingredientType: 1, ingredientName: "Meat" },

  // Grid 10: Stove
  { position: 10, gridType: "Stove", ingredientType: 99, ingredientName: "Stove" },

  // Grid 11-14: Lettuce
  { position: 11, gridType: "Lettuce", ingredientType: 2, ingredientName: "Lettuce" },
  { position: 12, gridType: "Lettuce", ingredientType: 2, ingredientName: "Lettuce" },
  { position: 13, gridType: "Lettuce", ingredientType: 2, ingredientName: "Lettuce" },
  { position: 14, gridType: "Lettuce", ingredientType: 2, ingredientName: "Lettuce" },

  // Grid 15: Rail
  { position: 15, gridType: "Rail", ingredientType: 98, ingredientName: "Rail" },

  // Grid 16-19: Tomato
  { position: 16, gridType: "Tomato", ingredientType: 3, ingredientName: "Tomato" },
  { position: 17, gridType: "Tomato", ingredientType: 3, ingredientName: "Tomato" },
  { position: 18, gridType: "Tomato", ingredientType: 3, ingredientName: "Tomato" },
  { position: 19, gridType: "Tomato", ingredientType: 3, ingredientName: "Tomato" },
];

/**
 * Get grid info by position (handles wrap-around for positions >= 20)
 */
export const getGridInfo = (position: number): GridInfo => {
  // Handle wrap-around (positions >= 20 wrap back to 0)
  const normalizedPosition = position % 20;

  return (
    GRID_LAYOUT[normalizedPosition] || {
      position: normalizedPosition,
      gridType: "Unknown",
      ingredientType: 999,
      ingredientName: "Unknown",
    }
  );
};

/**
 * Get ingredient name by type
 */
export const getIngredientNameByType = (ingredientType: number): string => {
  switch (ingredientType) {
    case 0:
      return "Bread";
    case 1:
      return "Meat";
    case 2:
      return "Lettuce";
    case 3:
      return "Tomato";
    case 98:
      return "Rail";
    case 99:
      return "Stove";
    default:
      return "Unknown";
  }
};

/**
 * Get grid type by position
 */
export const getGridTypeByPosition = (position: number): string => {
  return getGridInfo(position).gridType;
};

/**
 * Check if position allows buying ingredients
 */
export const canBuyAtPosition = (position: number): boolean => {
  const gridInfo = getGridInfo(position);
  return gridInfo.ingredientType <= 3; // Only Bread, Meat, Lettuce, Tomato
};

/**
 * Check if position is Stove
 */
export const isStovePosition = (position: number): boolean => {
  const gridInfo = getGridInfo(position);
  return gridInfo.ingredientType === 99;
};

/**
 * Check if position is Rail
 */
export const isRailPosition = (position: number): boolean => {
  const gridInfo = getGridInfo(position);
  return gridInfo.ingredientType === 98;
};

/**
 * Format position for display with grid info
 */
export const formatPositionWithGrid = (position: number): string => {
  const gridInfo = getGridInfo(position);
  return `Grid ${gridInfo.position} (${gridInfo.gridType})`;
};
