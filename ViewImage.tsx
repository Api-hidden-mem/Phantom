import React, { useState, useEffect } from "react"

function ViewImage() {
    const [provider, setProvider] = useState<any>(null)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null)

    const [status, setStatus] = useState<string>("")
    const [panelData, setPanelData] = useState<{
        sceneDescription: string
        dialogue: string
    } | null>(null)

    const API_KEY = ""

    // Add function to request next panel
    const requestNextPanel = async () => {
        if (!publicKey) return

        try {
            const response = await fetch(
                ``,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": API_KEY,
                    },
                    body: JSON.stringify({ needNewPanel: true }),
                }
            )

            if (response.ok) {
                setStatus(
                    "Next panel requested! Please wait about 10 minutes then disconnect and reconnect to view."
                )
            } else {
                setStatus("Failed to request next panel. Please try again.")
            }
        } catch (error) {
            setStatus("Error requesting next panel. Please try again.")
        }
    }

    // Get Phantom Wallet provider
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

    // Connect to Phantom Wallet
    const connect = async () => {
        try {
            const phantomProvider = getProvider()
            if (!phantomProvider) {
                return
            }

            const response = await phantomProvider.connect()
            setPublicKey(response.publicKey.toString())
            setProvider(phantomProvider)
        } catch (error: any) {
            console.error("Connection failed:", error.message)
        }
    }

    // Disconnect from Phantom Wallet
    const disconnect = () => {
        if (provider) {
            provider.disconnect()
            setPublicKey(null)
            setFetchedImageUrl(null)
        }
    }

    // Fetch image associated with the public key
    useEffect(() => {
        if (publicKey) {
            const imageUrl = ``
            fetch(imageUrl, {
                headers: { "X-API-Key": API_KEY },
            })
                .then((response) => {
                    if (!response.ok) {
                        return response.blob() // Ignore errors silently
                    }
                    return response.blob()
                })
                .then((blob) => {
                    if (blob) {
                        const localUrl = URL.createObjectURL(blob)
                        setFetchedImageUrl(localUrl)
                    }
                })
                .catch(() => {
                    // Ignore fetch errors silently
                })
            fetch("", {
                headers: { "X-API-Key": API_KEY },
            })
                .then((response) => response.json())
                .then((data) => {
                    const walletData = data.data.find(
                        (entry: any) => entry.walletId === publicKey
                    )
                    if (walletData) {
                        setPanelData({
                            sceneDescription: walletData.sceneDescription,
                            dialogue: walletData.dialogue,
                        })
                    }
                })
                .catch((error) => {
                    console.error("Error fetching panel data:", error)
                })
        }
    }, [publicKey])

    const renderPanelData = () => {
        if (!panelData) return null

        return (
            <div style={textBoxContainerStyle}>
                <div style={textBoxStyle}>
                    <div style={textSectionStyle}>
                        <h3 style={textHeaderStyle}>Scene Description</h3>
                        <p style={textContentStyle}>
                            {panelData.sceneDescription}
                        </p>
                    </div>
                    <div style={textSectionStyle}>
                        <h3 style={textHeaderStyle}>Dialogue</h3>
                        <p style={textContentStyle}>{panelData.dialogue}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <div style={mainContentStyle}>
                {" "}
                {/* New wrapper div */}
                <div style={leftColumnStyle}>
                    {" "}
                    {/* New left column */}
                    {publicKey ? (
                        <div style={infoContainerStyle}>
                            <p>
                                <strong>Connected Wallet:</strong> {publicKey}
                            </p>
                            <div style={buttonContainerStyle}>
                                <button
                                    style={nextPanelButtonStyle}
                                    onClick={requestNextPanel}
                                >
                                    Get Next Panel
                                </button>
                                <button
                                    style={disconnectButtonStyle}
                                    onClick={disconnect}
                                >
                                    Disconnect
                                </button>
                            </div>
                            {status && <p style={statusStyle}>{status}</p>}
                        </div>
                    ) : (
                        <button style={connectButtonStyle} onClick={connect}>
                            Connect to Phantom Wallet
                        </button>
                    )}
                    {fetchedImageUrl ? (
                        <div style={contentStyle}>
                            <img
                                src={fetchedImageUrl}
                                alt="Fetched File"
                                style={imageStyle}
                            />
                            <a
                                href={fetchedImageUrl}
                                download={`memga_image_${publicKey}.png`}
                                style={downloadButtonStyle}
                            >
                                Download Image
                            </a>
                        </div>
                    ) : publicKey ? (
                        <p>
                            (May take 10 Minutes to Generate, you need to
                            disconect and reconect your wallet to view image
                            sometimes)
                        </p>
                    ) : (
                        <p>Connect your wallet to fetch your image.</p>
                    )}
                </div>
                {/* Text box on the right */}
                {panelData && (
                    <div style={textBoxContainerStyle}>
                        <div style={textBoxStyle}>
                            <div style={textSectionStyle}>
                                <h3 style={textHeaderStyle}>
                                    Scene Description
                                </h3>
                                <p style={textContentStyle}>
                                    {panelData.sceneDescription}
                                </p>
                            </div>
                            <div style={textSectionStyle}>
                                <h3 style={textHeaderStyle}>Dialogue</h3>
                                <p style={textContentStyle}>
                                    {panelData.dialogue}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
// Add new styles
const buttonContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginTop: "10px",
}

const nextPanelButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    textDecoration: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
}

const statusStyle: React.CSSProperties = {
    marginTop: "10px",
    color: "#666",
    fontSize: "0.9em",
}

const containerStyle: React.CSSProperties = {
    width: "100%",
    padding: "20px",
    boxSizing: "border-box",
}

const infoContainerStyle: React.CSSProperties = {
    marginBottom: "20px",
    textAlign: "center",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "400px",
}

const contentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    marginTop: "20px",
    width: "100%",
}

// Modify imageStyle to have a fixed width
const imageStyle: React.CSSProperties = {
    width: "400px", // Fixed width
    height: "auto",
    borderRadius: "8px",
}

const downloadButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "darkred",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
}

const connectButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
}

const disconnectButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "darkred",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
}
// Add these new styles
const textBoxContainerStyle: React.CSSProperties = {
    width: "400px",
    alignSelf: "center", // Centers the text box vertically
    position: "sticky", // Makes it stay in position while scrolling
    top: "20px", // Adds some space from the top
}

const textBoxStyle: React.CSSProperties = {
    height: "400px",
    overflowY: "auto",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    position: "relative", // Helps with positioning
}

const textSectionStyle: React.CSSProperties = {
    marginBottom: "15px",
}

const textHeaderStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
}

const textContentStyle: React.CSSProperties = {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#666",
    margin: 0,
}
const mainContentStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    alignItems: "center", // Centers items vertically
}
const leftColumnStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "500px",
    minHeight: "600px", // Add minimum height to ensure consistent layout
}

export default ViewImage
