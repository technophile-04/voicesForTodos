"use client";

import { useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Read all cells
  const { data: allCells, refetch: refetchCells } = useScaffoldReadContract({
    contractName: "MessageVault",
    functionName: "getAllCells",
  });

  // Read vault stats
  const { data: vaultBalance } = useScaffoldReadContract({
    contractName: "MessageVault",
    functionName: "getVaultBalance",
  });

  const { data: totalVaultValue } = useScaffoldReadContract({
    contractName: "MessageVault",
    functionName: "totalVaultValue",
  });

  // Get minimum price for selected cell
  const { data: minimumPrice } = useScaffoldReadContract({
    contractName: "MessageVault",
    functionName: "getMinimumPrice",
    args: [selectedCell !== null ? BigInt(selectedCell) : undefined],
  });

  // Write contract hook
  const { writeContractAsync: writeMessageVault, isMining } = useScaffoldWriteContract({
    contractName: "MessageVault",
  });

  // Handle cell click
  const handleCellClick = (cellId: number) => {
    setSelectedCell(cellId);
    setIsModalOpen(true);
    setNewMessage("");
    // Set default bid to minimum price
    if (allCells && allCells[cellId]) {
      const currentPrice = allCells[cellId].price;
      if (currentPrice === BigInt(0)) {
        setBidAmount("0.001");
      } else {
        const minPrice = (currentPrice * BigInt(110)) / BigInt(100);
        setBidAmount(formatEther(minPrice));
      }
    } else {
      setBidAmount("0.001");
    }
  };

  // Handle buy cell
  const handleBuyCell = async () => {
    if (selectedCell === null || !newMessage.trim() || !bidAmount) {
      return;
    }

    try {
      await writeMessageVault({
        functionName: "buyCell",
        args: [BigInt(selectedCell), newMessage],
        value: parseEther(bidAmount),
      });
      setIsModalOpen(false);
      setNewMessage("");
      setBidAmount("");
      setSelectedCell(null);
      // Refetch cells after transaction
      setTimeout(() => refetchCells(), 2000);
    } catch (error) {
      console.error("Error buying cell:", error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10 pb-10">
        <div className="px-5 w-full max-w-7xl">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">💬 Message Vault Grid</h1>
              <p className="text-lg opacity-70">Buy a spot on the grid and leave your message!</p>
              <div className="mt-4 flex justify-center gap-6 text-sm">
                <div className="badge badge-lg badge-primary">
                  💰 Vault Balance: {vaultBalance ? formatEther(vaultBalance) : "0"} ETH
                </div>
                <div className="badge badge-lg badge-secondary">
                  📊 Total Value: {totalVaultValue ? formatEther(totalVaultValue) : "0"} ETH
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="grid grid-cols-10 gap-2">
                  {Array.from({ length: 100 }).map((_, index) => {
                    const cell = allCells?.[index];
                    const hasMessage = cell && cell.message && cell.message.length > 0;
                    const price = cell?.price || BigInt(0);

                    return (
                      <div
                        key={index}
                        onClick={() => handleCellClick(index)}
                        className={`
                          aspect-square relative cursor-pointer
                          border-2 rounded-lg p-2 transition-all hover:scale-105 hover:shadow-lg
                          ${hasMessage ? "border-primary bg-primary/10" : "border-base-300 bg-base-100"}
                        `}
                        title={`Cell ${index}${hasMessage ? `\nMessage: ${cell.message}\nPrice: ${formatEther(price)} ETH` : "\nEmpty - Click to claim!"}`}
                      >
                        {/* Cell content */}
                        <div className="flex flex-col h-full justify-between text-xs">
                          {hasMessage ? (
                            <>
                              <div className="font-mono text-[10px] truncate font-bold">{cell.message}</div>
                              <div className="text-[8px] opacity-60 truncate">{formatEther(price)} ETH</div>
                            </>
                          ) : (
                            <div className="text-center text-[10px] opacity-40 font-bold">#{index}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                <strong>How it works:</strong> Click any cell to buy it with your message. To overwrite someone
                else&apos;s message, you must pay at least 10% more than they did. The higher the price, the harder it
                is to overwrite!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for buying cell */}
      {isModalOpen && selectedCell !== null && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">
              Buy Cell #{selectedCell}
              {allCells?.[selectedCell]?.message && " (Overwrite)"}
            </h3>

            {/* Current cell info */}
            {allCells?.[selectedCell] && allCells[selectedCell].message && (
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <p className="text-sm font-bold mb-2">Current Message:</p>
                <p className="text-lg mb-2">&quot;{allCells[selectedCell].message}&quot;</p>
                <p className="text-sm opacity-70 mb-1">
                  Current Price: {formatEther(allCells[selectedCell].price)} ETH
                </p>
                <div className="text-sm opacity-70">
                  Owner: <Address address={allCells[selectedCell].owner} />
                </div>
              </div>
            )}

            {/* Input form */}
            <div className="form-control gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-bold">Your Message (max 100 chars)</span>
                  <span className="label-text-alt">{newMessage.length}/100</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="Enter your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value.slice(0, 100))}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-bold">Your Bid (ETH)</span>
                  {minimumPrice && (
                    <span className="label-text-alt text-warning">Min: {formatEther(minimumPrice)} ETH</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input input-bordered w-full"
                  placeholder="0.001"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewMessage("");
                  setBidAmount("");
                  setSelectedCell(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBuyCell}
                disabled={isMining || !newMessage.trim() || !bidAmount}
              >
                {isMining ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Buying...
                  </>
                ) : (
                  <>Buy Cell for {bidAmount} ETH</>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </>
  );
};

export default Home;
