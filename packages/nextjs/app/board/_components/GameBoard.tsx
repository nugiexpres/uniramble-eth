import Image from "next/image";
import { BOARD_STYLES } from "./style";

interface GridItem {
  id: string | number;
  typeGrid: string;
}

interface GameBoardProps {
  gridData: any[];
  playerPositionData: any;
  isMobile?: boolean;
}

export const GameBoard = ({ gridData, playerPositionData, isMobile = false }: GameBoardProps) => {
  const boardSize = isMobile ? "425px" : "445px";
  const gridOffset = isMobile ? "translate(-16px, -16px)" : "translate(-4px, -4px)";

  // Debug logging
  console.log("GameBoard props:", { gridData, playerPositionData, isMobile });

  return (
    <div
      className="relative bg-gradient-to-br from-green-300 to-green-400 rounded-xl shadow-xl border-4 border-green-500 mb-6"
      style={{ width: boardSize, height: boardSize }}
    >
      {/* Grid Container with precise position adjustment */}
      <div className="absolute inset-0" style={{ transform: gridOffset }}>
        {gridData &&
          gridData.length > 0 &&
          gridData.map((item, index: number) => {
            const gridItem: GridItem = {
              id: item.id.toString(),
              typeGrid: item.typeGrid,
            };
            return (
              <div
                key={index}
                className={`absolute w-[70px] h-[70px] border-2 border-gray-400 rounded-lg font-bold bg-stone-200 relative z-10 shadow-sm hover:shadow-md transition-shadow ${
                  BOARD_STYLES[index] || "grid-1"
                }`}
              >
                {/* Grid Type Label */}
                <span className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600 z-20 pointer-events-none bg-white/80 px-1 rounded">
                  {gridItem.typeGrid}
                </span>

                {/* Player Position */}
                {playerPositionData?.toString() === gridItem.id.toString() && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                    <Image
                      src="/assets/chog.png"
                      width={isMobile ? 50 : 45}
                      height={isMobile ? 50 : 45}
                      alt="Chog"
                      className="drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Stove Image */}
                {gridItem.typeGrid === "Stove" && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
                    <Image src="/assets/stove-m.png" width={50} height={50} alt="Stove" className="drop-shadow-md" />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Track Image */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-5">
        <Image src="/assets/track-a.png" width={35} height={170} alt="Track" className="opacity-80 rotate-45" />
      </div>
    </div>
  );
};
