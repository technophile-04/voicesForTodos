"use client";

import { useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useMiniapp } from "~~/components/MiniappProvider";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const MiniappPage: NextPage = () => {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get Farcaster context
  const { context, isMiniApp, composeCast } = useMiniapp();
  const farcasterUser = context.user;

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

  // Share to Farcaster
  const handleShare = async () => {
    const appUrl = typeof window !== "undefined" ? window.location.origin + "/miniapp" : "";
    await composeCast({
      text: `Just claimed a spot on the Message Vault! 💬\n\nCheck it out and leave your message on-chain!`,
      embeds: [appUrl],
    });
  };

  return (
    <div className="celo-page relative overflow-hidden">
      <div className="celo-sheen" />
      <div className="celo-blur top-[-10%] left-[-10%] w-80 h-80 bg-primary/25" />
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
                <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Celo Farcaster Miniapp</p>
                <h1 className="text-4xl md:text-5xl font-bold text-base-content">Message Vault Grid</h1>
                <p className="text-base md:text-lg text-base-content/70">
                  Drop a message into the shared Celo grid. Each new post raises the floor, rewarding early movers and
                  boosting the story you want to highlight onchain.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="badge badge-lg badge-primary gap-2 shadow-md">
                    <span>💰</span>
                    <span>Vault: {vaultBalance ? formatEther(vaultBalance) : "0"} CELO</span>
                  </div>
                  <div className="badge badge-lg badge-secondary gap-2 shadow-md">
                    <span>📊</span>
                    <span>Total: {totalVaultValue ? formatEther(totalVaultValue) : "0"} CELO</span>
                  </div>
                  <div className="badge badge-lg badge-accent gap-2 shadow-md">
                    <span>🟩</span>
                    <span>Claimed: {claimedCells}/100</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-col gap-3 md:text-right">
                {isMiniApp && farcasterUser && (
                  <div className="flex items-center gap-3 justify-end bg-base-100/70 border border-base-300 rounded-2xl px-4 py-3 shadow-lg">
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        {farcasterUser.pfpUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={farcasterUser.pfpUrl} alt={farcasterUser.username || "User"} />
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-base-content/60">Posting as</p>
                      <p className="font-semibold">
                        {farcasterUser.displayName || farcasterUser.username || `FID ${farcasterUser.fid}`}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-end flex-wrap">
                  <button className="btn btn-primary btn-wide shadow-lg" onClick={handleCreateNewCell}>
                    Claim a tile
                  </button>
                  {isMiniApp && (
                    <button className="btn btn-ghost border border-base-300" onClick={handleShare}>
                      Share to Farcaster
                    </button>
                  )}
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
                  <h2 className="text-2xl font-semibold text-base-content">Celo-powered, Farcaster-ready</h2>
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
                          <div className="space-y-1">
                            <div className="font-mono text-[10px] truncate font-semibold text-base-content">
                              {cell.message}
                            </div>
                            <div className="text-[9px] text-base-content/60 truncate">{formatEther(price)} CELO</div>
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
                <h3 className="card-title text-base-content">Post onchain</h3>
                <p className="text-base-content/70">
                  Tap any tile, add your message, and set your CELO bid. Each overwrite requires a 10% bump.
                </p>
              </div>
            </div>
            <div className="card bg-base-100/70 border border-base-300 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base-content">Amplify on Farcaster</h3>
                <p className="text-base-content/70">
                  Share directly from the miniapp to bring friends into the grid and spark new takeovers.
                </p>
              </div>
            </div>
            <div className="card bg-base-100/70 border border-base-300 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-base-content">Green by default</h3>
                <p className="text-base-content/70">
                  Built on Celo: mobile-first, climate-positive, and fast. Your message travels light.
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
              <div className="bg-base-200 p-4 rounded-lg mb-4 border border-base-300">
                <p className="text-sm font-bold mb-2 text-base-content/70">Current Message:</p>
                <p className="text-lg mb-3 font-semibold">&quot;{allCells[selectedCell].message}&quot;</p>
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

export default MiniappPage;
