import "./shims.ts"
import { useState, useEffect } from "react"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getMint,
} from "@solana/spl-token"

export default function CombinedWalletStory() {
    const [provider, setProvider] = useState<any>(null)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const [status, setStatus] = useState("Not connected.")
    const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])

    // Fixed recipient address and amount
    const RECIPIENT_ADDRESS = ""
    const FIXED_AMOUNT = 100000

    // Token mint address
    const TOKEN_MINT = new PublicKey(
        ""
    )

    // API details for story creation
    const API_URL = ""
    const API_KEY = ""

    const connection = new Connection(
        "",
        "confirmed"
    )

    const characters = [
        "Dogwifhat",
        "Fred",
        "Giga Chad",
        "Kabosu the Shiba Inu",
        "Luce",
        "Maxwell the Tiktok Cat",
        "Moodeng",
        "Peanut the Squirrel",
        "Pesto",
        "Chill guy",
    ]

    const toggleCharacter = (char: string) => {
        setSelectedCharacters((prev) => {
            if (prev.includes(char)) {
                return prev.filter((c) => c !== char)
            } else {
                if (prev.length < 6) {
                    return [...prev, char]
                } else {
                    return prev
                }
            }
        })
    }

    // Modified createStory function to include wallet address
    const createStory = async () => {
        if (!publicKey) {
            setStatus("Wallet not connected!")
            return
        }

        setStatus("Creating story...")
        try {
            // First, make the original API call to store characters
            const payload = {
                value: selectedCharacters,
                walletId: publicKey,
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": API_KEY,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const json = await response.json()
                setStatus(`Error creating story: ${json.error}`)
                return
            }

            // Then, set the needNewPanel status to true
            const panelResponse = await fetch(
                `${API_URL.replace("/data", "")}/panel-status/${publicKey}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": API_KEY,
                    },
                    body: JSON.stringify({
                        needNewPanel: true,
                    }),
                }
            )

            if (panelResponse.ok) {
                setStatus(
                    "Image will be generated, click the button to view and download image."
                )
            } else {
                const json = await panelResponse.json()
                setStatus(`Error updating panel status: ${json.error}`)
            }
        } catch (error: any) {
            setStatus(`Network Error: ${error.message}`)
        }
    }

    // Rest of the wallet connection functions remain the same
    function getProvider() {
        if ("phantom" in window) {
            const provider = (window as any).phantom?.solana
            if (provider?.isPhantom) {
                return provider
            }
        }
        window.open("https://phantom.app/", "_blank")
        return null
    }

    const connect = async () => {
        try {
            const phantomProvider = getProvider()
            if (!phantomProvider) {
                setStatus("Phantom wallet is not installed!")
                return
            }

            const response = await phantomProvider.connect()
            setPublicKey(response.publicKey.toString())
            setProvider(phantomProvider)
            setStatus("Connected successfully!")
        } catch (error: any) {
            setStatus(`Connection failed: ${error.message}`)
        }
    }

    const disconnect = () => {
        if (provider) {
            provider.disconnect()
            setPublicKey(null)
            setStatus("Disconnected from wallet.")
        }
    }

    // Combined function remains largely the same, just using the modified createStory
    const initiateTransferAndCreateStory = async () => {
        if (selectedCharacters.length === 0) {
            setStatus("Please select at least one character first.")
            return
        }

        try {
            if (!provider || !publicKey) {
                setStatus("Please connect your wallet first")
                return
            }

            setStatus("Preparing token transfer...")

            const mintInfo = await getMint(connection, TOKEN_MINT)
            const adjustedAmount =
                FIXED_AMOUNT * Math.pow(10, mintInfo.decimals)

            const senderPublicKey = new PublicKey(publicKey)
            const recipientPublicKey = new PublicKey(RECIPIENT_ADDRESS)

            const senderTokenAccount = await getAssociatedTokenAddress(
                TOKEN_MINT,
                senderPublicKey
            )

            const recipientTokenAccount = await getAssociatedTokenAddress(
                TOKEN_MINT,
                recipientPublicKey
            )

            const senderAccountInfo =
                await connection.getAccountInfo(senderTokenAccount)
            if (!senderAccountInfo) {
                setStatus(
                    "Error: You don't have a token account for this token"
                )
                return
            }

            const transaction = new Transaction()

            const recipientAccountInfo = await connection.getAccountInfo(
                recipientTokenAccount
            )

            if (!recipientAccountInfo) {
                setStatus("Creating recipient token account...")
                const createATAInstruction =
                    createAssociatedTokenAccountInstruction(
                        senderPublicKey,
                        recipientTokenAccount,
                        recipientPublicKey,
                        TOKEN_MINT
                    )
                transaction.add(createATAInstruction)
            }

            setStatus("Creating transfer instruction...")

            const transferInstruction = createTransferInstruction(
                senderTokenAccount,
                recipientTokenAccount,
                senderPublicKey,
                adjustedAmount,
                [],
                TOKEN_PROGRAM_ID
            )

            transaction.add(transferInstruction)

            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash()
            transaction.recentBlockhash = blockhash
            transaction.feePayer = senderPublicKey

            setStatus("Requesting signature...")

            const signed = await provider.signAndSendTransaction(transaction)
            setStatus(`Transaction sent! Signature: ${signed.signature}`)

            setStatus("Confirming transaction...")

            const confirmation = await connection.confirmTransaction({
                signature: signed.signature,
                blockhash: blockhash,
                lastValidBlockHeight: lastValidBlockHeight,
            })

            if (confirmation.value.err) {
                throw new Error("Transaction failed to confirm")
            }

            setStatus("Transfer successful! Creating story...")
            await createStory()
        } catch (error: any) {
            setStatus(`Transaction failed: ${error.message}`)
            console.error("Transaction error:", error)
        }
    }

    useEffect(() => {
        const phantomProvider = getProvider()
        if (phantomProvider) {
            setProvider(phantomProvider)
            phantomProvider
                .connect({ onlyIfTrusted: true })
                .then((response: any) => {
                    setPublicKey(response.publicKey.toString())
                })
                .catch(() => {
                    setStatus("Not connected.")
                })

            phantomProvider.on("connect", (publicKey: any) => {
                setPublicKey(publicKey.toString())
                setStatus("Wallet connected!")
            })

            phantomProvider.on("disconnect", () => {
                setPublicKey(null)
                setStatus("Wallet disconnected.")
            })

            phantomProvider.on("accountChanged", (newPublicKey: any) => {
                if (newPublicKey) {
                    setPublicKey(newPublicKey.toBase58())
                    setStatus(`Switched to account ${newPublicKey.toBase58()}`)
                } else {
                    phantomProvider.connect().catch((error: any) => {
                        setStatus(`Reconnection failed: ${error.message}`)
                    })
                }
            })
        }

        return () => {
            if (phantomProvider) {
                phantomProvider.removeAllListeners("connect")
                phantomProvider.removeAllListeners("disconnect")
                phantomProvider.removeAllListeners("accountChanged")
            }
        }
    }, [])

    // Rest of the component remains the same...
    return (
        <div style={containerStyle}>
            <h1>Select up to 6 characters</h1>

            <div style={innerStyle}>
                <div style={listStyle}>
                    {characters.map((char) => {
                        const selected = selectedCharacters.includes(char)
                        const disabled =
                            !selected && selectedCharacters.length >= 6
                        return (
                            <div
                                key={char}
                                style={{
                                    ...characterItemStyle,
                                    backgroundColor: selected
                                        ? "darkred"
                                        : disabled
                                          ? "#ddd"
                                          : "#f0f0f0",
                                    color: selected ? "#fff" : "#000",
                                    cursor: disabled
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                                onClick={() =>
                                    !disabled && toggleCharacter(char)
                                }
                            >
                                {char}
                            </div>
                        )
                    })}
                </div>

                {publicKey ? (
                    <div style={contentStyle}>
                        <p>Connected Wallet: {publicKey}</p>
                        <p>Fixed Amount: {FIXED_AMOUNT} $Memga</p>
                        <button
                            onClick={initiateTransferAndCreateStory}
                            style={{
                                ...buttonStyle,
                                ...(selectedCharacters.length === 0 &&
                                    disabledButtonStyle),
                            }}
                            disabled={selectedCharacters.length === 0}
                        >
                            Transfer Tokens and Create Story
                        </button>
                        <button
                            onClick={disconnect}
                            style={disconnectButtonStyle}
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button onClick={connect} style={buttonStyle}>
                        Connect to Phantom
                    </button>
                )}
                <p style={statusStyle}>{status}</p>
            </div>
        </div>
    )
}

// Styles remain exactly the same...
const containerStyle = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "25px",
    boxSizing: "border-box" as const,
    fontFamily: "Arial, sans-serif",
}

const innerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
    alignItems: "center",
    width: "100%",
    maxWidth: "600px",
}

const listStyle = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    justifyContent: "center",
    width: "100%",
    padding: "15px",
}

const characterItemStyle = {
    padding: "12px 20px",
    borderRadius: "6px",
    backgroundColor: "#f0f0f0",
    transition: "background-color 0.3s",
    fontSize: "16px",
    fontWeight: 500,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
}

const contentStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
    width: "100%",
    alignItems: "center",
}

const buttonStyle = {
    fontSize: "18px",
    padding: "12px 24px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "darkred",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    transition: "background-color 0.3s",
}

const disconnectButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
}

const statusStyle = {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "5px",
    fontSize: "16px",
    color: "#333",
    textAlign: "center" as const,
    width: "100%",
}

const disabledButtonStyle = {
    backgroundColor: "#ddd",
    color: "#aaa",
    cursor: "not-allowed",
}
