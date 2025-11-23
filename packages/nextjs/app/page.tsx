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
  const claimedCells = allCells?.filter(cell => cell && cell.message && cell.message.length > 0).length ?? 0;

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
  const handleCreateNewCell = () => {
    const firstOpenIndex = allCells?.findIndex(cell => !cell || !cell.message || cell.message.length === 0) ?? 0;
    handleCellClick(firstOpenIndex === -1 ? 0 : firstOpenIndex);
  };
  const scrollToGrid = () => {
    const el = document.getElementById("vault-grid");
    el?.scrollIntoView({ behavior: "smooth" });
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
    <div className="celo-page relative overflow-hidden">
      <div className="celo-sheen" />
      <div className="celo-blur top-[-10%] left-[-10%] w-80 h-80 bg-primary/30" />
      <div className="celo-blur bottom-[-5%] right-[-10%] w-96 h-96 bg-secondary/25" />

      <div className="relative z-10 flex items-center flex-col grow pt-12 pb-14">
        <div className="px-5 w-full max-w-6xl flex flex-col gap-10">
          {/* Header */}
          <div className="celo-panel rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <div className="absolute -left-10 -top-20 w-56 h-56 rounded-full bg-primary blur-3xl" />
              <div className="absolute -right-10 -bottom-20 w-56 h-56 rounded-full bg-secondary blur-3xl" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Celo Onchain Canvas</p>
                <h1 className="text-4xl md:text-5xl font-bold text-base-content">Message Vault Grid</h1>
                <p className="text-base md:text-lg text-base-content/70">
                  Claim a tile, drop a message, and lock your story into the Celo network. Each overwrite requires a 10%
                  higher bid, making every square more valuable over time.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="badge badge-lg badge-primary gap-2 shadow-md">
                    <span>💰</span>
                    <span>Vault Balance: {vaultBalance ? formatEther(vaultBalance) : "0"} CELO</span>
                  </div>
                  <div className="badge badge-lg badge-secondary gap-2 shadow-md">
                    <span>📊</span>
                    <span>Total Value: {totalVaultValue ? formatEther(totalVaultValue) : "0"} CELO</span>
                  </div>
                  <div className="badge badge-lg badge-accent gap-2 shadow-md">
                    <span>🟩</span>
                    <span>Claimed: {claimedCells}/100</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-col gap-3 md:text-right">
                <div className="stats shadow-lg bg-base-100/70 border border-base-300">
                  <div className="stat">
                    <div className="stat-title">Live on Celo</div>
                    <div className="stat-value text-primary">CELO</div>
                    <div className="stat-desc">Fast, secure, regenerative finance</div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button className="btn btn-primary btn-wide shadow-lg" onClick={handleCreateNewCell}>
                    Mint a tile
                  </button>
                  <button className="btn btn-ghost border border-base-300" onClick={scrollToGrid}>
                    View activity
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div id="vault-grid" className="celo-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute -left-16 top-1/4 h-48 w-48 bg-primary blur-3xl" />
              <div className="absolute right-0 bottom-0 h-48 w-48 bg-secondary blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">The Grid</p>
                  <h2 className="text-2xl font-semibold text-base-content">100 onchain squares</h2>
                </div>
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="px-3 py-1 rounded-full border border-base-300 bg-base-100/70">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
                    Claimed
                  </span>
                  <span className="px-3 py-1 rounded-full border border-base-300 bg-base-100/70">
                    <span className="inline-block w-2 h-2 rounded-full bg-base-300 mr-2" />
                    Available
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: 100 }).map((_, index) => {
                  const cell = allCells?.[index];
                  const hasMessage = cell && cell.message && cell.message.length > 0;
                  const price = cell?.price || BigInt(0);

                  return (
                    <div
                      key={index}
                      onClick={() => handleCellClick(index)}
                      className={`
                        celo-grid-tile aspect-square relative cursor-pointer
                        rounded-xl p-2 transition-all duration-200
                        hover:-translate-y-1 hover:shadow-xl hover:z-10
                        active:scale-95 backdrop-blur
                        ${hasMessage ? "border-primary/60 bg-primary/15" : "bg-base-100/70"}
                      `}
                      title={`Cell ${index}${hasMessage ? `\nMessage: ${cell.message}\nPrice: ${formatEther(price)} CELO` : "\nEmpty - Click to claim!"}`}
                    >
                      <div className="flex flex-col h-full justify-between text-[11px]">
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-base-content/60">#{index}</span>
                          {hasMessage && <span className="badge badge-ghost badge-xs">Owned</span>}
                        </div>
                        {hasMessage ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="font-bold text-3xl md:text-4xl uppercase leading-none text-primary">
                              {cell.message}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-[10px] opacity-50 font-semibold">Tap to claim</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card bg-base-100/70 border border-base-300 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base-content">Claim your space</h3>
                <p className="text-base-content/70">
                  Tap any tile, write your message, and set a bid in CELO. The higher the bid, the harder it is to be
                  overwritten.
                </p>
              </div>
            </div>
            <div className="card bg-base-100/70 border border-base-300 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base-content">Onchain permanence</h3>
                <p className="text-base-content/70">
                  Messages live on the Message Vault contract. Overwrites require a minimum 10% premium over the
                  previous price.
                </p>
              </div>
            </div>
            <div className="card bg-base-100/70 border border-base-300 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base-content">Built for Celo</h3>
                <p className="text-base-content/70">
                  Low-fee, carbon-negative by design. Showcase your idea with the Celo community and watch the grid
                  evolve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for buying cell */}
      {isModalOpen && selectedCell !== null && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md shadow-2xl">
            <h3 className="font-bold text-xl mb-4">
              Buy Cell #{selectedCell}
              {allCells?.[selectedCell]?.message && (
                <span className="badge badge-warning badge-sm ml-2">Overwrite</span>
              )}
            </h3>

            {/* Current cell info */}
            {allCells?.[selectedCell] && allCells[selectedCell].message && (
              <div className="bg-base-200 p-6 rounded-lg mb-4 border border-base-300">
                <p className="text-sm font-bold mb-3 text-base-content/70">Current Character:</p>
                <div className="flex items-center justify-center py-4">
                  <div className="font-bold text-6xl uppercase text-primary">{allCells[selectedCell].message}</div>
                </div>
                <div className="divider my-2"></div>
                <p className="text-sm opacity-70 mb-1">
                  Current Price: <span className="font-semibold">{formatEther(allCells[selectedCell].price)} CELO</span>
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
                  <span className="label-text font-bold">Your Character (1 letter, number, or symbol)</span>
                </label>
                <input
                  type="text"
                  maxLength={1}
                  className="input input-bordered w-full text-center text-6xl font-bold uppercase h-32"
                  placeholder="A"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value.toUpperCase().slice(0, 1))}
                />
                <p className="text-xs text-base-content/60 mt-2">💡 Tip: Buy multiple cells in a row to spell words!</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-bold">Your Bid (CELO)</span>
                  {minimumPrice && (
                    <span className="label-text-alt text-warning">Min: {formatEther(minimumPrice)} CELO</span>
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
            <div className="modal-action gap-2">
              <button
                className="btn btn-ghost"
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
                className="btn btn-primary shadow-md"
                onClick={handleBuyCell}
                disabled={isMining || !newMessage.trim() || !bidAmount}
              >
                {isMining ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Buying...
                  </>
                ) : (
                  <>Buy Cell for {bidAmount} CELO</>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
};

export default Home;
