import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function OdometerScanner({ onResult, referenceValue, className = '' }) {
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);
    const [ocrResult, setOcrResult] = useState(null); // { value, allMatches, bestMatch }
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);

    /**
     * Preprocess the image for better OCR:
     * - Convert to grayscale
     * - Increase contrast
     */
    const preprocessImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Use a reasonable size for OCR (not too large, not too small)
                const maxWidth = 1200;
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // Draw original
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Get image data for processing
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Convert to grayscale and increase contrast
                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                    // Contrast enhancement (factor 1.5)
                    const factor = 1.5;
                    const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

                    data[i] = adjusted;     // R
                    data[i + 1] = adjusted; // G
                    data[i + 2] = adjusted; // B
                }

                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            };
            img.src = URL.createObjectURL(file);
        });
    };

    /**
     * Extract the most likely odometer reading from OCR text.
     */
    const extractOdometerValue = (text) => {
        console.log('OCR Raw Output:', text);

        // Clean up common OCR misreads for digits
        const cleaned = text
            .replace(/[oO]/g, '0')  // O -> 0
            .replace(/[lI|]/g, '1') // l, I, | -> 1
            .replace(/[sS]/g, '5') // S -> 5
            .replace(/[bB]/g, '6') // b -> 6
            .replace(/\s+/g, ' ');  // normalize whitespace

        // Find all number sequences (at least 3 digits, typical for odometers)
        const matches = cleaned.match(/\d{3,7}/g);

        if (!matches || matches.length === 0) {
            // Fallback: try any number sequence
            const fallback = cleaned.match(/(\d+[.,]?\d*)/g);
            if (fallback) {
                return {
                    allMatches: fallback.map(m => parseFloat(m.replace(',', '.'))),
                    bestMatch: parseFloat(fallback[0].replace(',', '.'))
                };
            }
            return null;
        }

        const numericMatches = matches.map(m => parseInt(m, 10)).filter(n => !isNaN(n));

        if (numericMatches.length === 0) return null;

        // Heuristic: prefer numbers in typical odometer range (1000 - 999999)
        const odometerCandidates = numericMatches.filter(n => n >= 1000 && n <= 999999);

        let bestMatch;
        if (odometerCandidates.length > 0) {
            // If we have a reference value (e.g. previous KM), pick the closest reasonable one
            const currentStart = parseFloat(referenceValue) || 0;
            if (currentStart > 0) {
                // Pick the one closest to but >= referenceValue
                // Allow a small margin of error (e.g. sometimes previous input was wrong)
                // But usually odometer only goes up.

                // Filter candidates that are not impossibly far (e.g. +2000km in a day is rare)
                // But let's just use proximity for now.
                const validCandidates = odometerCandidates.filter(n => n >= currentStart);

                if (validCandidates.length > 0) {
                    // Find smallest valid candidate that is >= reference
                    // Sort ascending
                    validCandidates.sort((a, b) => a - b);
                    bestMatch = validCandidates[0];
                } else {
                    // If all are smaller, maybe the reference was wrong or we misread a digit?
                    // Just pick the largest candidate found (likely the odometer)
                    bestMatch = Math.max(...odometerCandidates);
                }
            } else {
                // No reference — pick the largest number (safest bet for odometer usually)
                bestMatch = Math.max(...odometerCandidates);
            }
        } else {
            bestMatch = Math.max(...numericMatches); // Fallback to whatever number we found
        }

        return {
            allMatches: numericMatches,
            bestMatch
        };
    };

    const handleCameraClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleImageCapture = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Show preview
        const imageUrl = URL.createObjectURL(file);
        setPreviewImage(imageUrl);
        setIsScanning(true);
        setScanProgress(0);

        try {
            // Preprocess image for better OCR
            const processedBlob = await preprocessImage(file);

            const { data: { text } } = await Tesseract.recognize(
                processedBlob,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setScanProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const result = extractOdometerValue(text);

            if (result && result.bestMatch) {
                setOcrResult(result);
                setShowConfirmDialog(true);
            } else {
                alert("Geen kilometerstand gevonden in de foto. Probeer opnieuw of vul handmatig in.");
                closePreview();
            }
        } catch (err) {
            console.error('OCR Error:', err);
            alert("Fout bij het scannen van de foto. Probeer het opnieuw.");
            closePreview();
        }

        setIsScanning(false);
    };

    const confirmResult = (value) => {
        onResult(value);
        closePreview();
    };

    const closePreview = () => {
        setPreviewImage(null);
        setShowConfirmDialog(false);
        setOcrResult(null);
        setScanProgress(0);
    };

    return (
        <>
            <button
                type="button"
                className={`camera-btn ${className}`}
                onClick={handleCameraClick}
                disabled={isScanning}
                title="Foto nemen van kilometerstand"
            >
                📷
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                style={{ display: 'none' }}
            />

            {/* Hidden canvas for image preprocessing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Scanning overlay / confirmation dialog */}
            {(previewImage || isScanning) && (
                <div className="scan-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isScanning) closePreview(); }}>
                    <div className="scan-modal">
                        <div className="scan-modal-header">
                            <h3>{isScanning ? 'Foto analyseren...' : 'Kilometerstand gevonden'}</h3>
                            {!isScanning && (
                                <button className="scan-close-btn" onClick={closePreview}>✕</button>
                            )}
                        </div>

                        {previewImage && (
                            <div className="scan-preview-container">
                                <img src={previewImage} alt="Captured odometer" className="scan-preview-img" />
                            </div>
                        )}

                        {isScanning && (
                            <div className="scan-progress-container">
                                <div className="scan-progress-bar">
                                    <div
                                        className="scan-progress-fill"
                                        style={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                                <span className="scan-progress-text">{scanProgress}% — Cijfers herkennen...</span>
                            </div>
                        )}

                        {showConfirmDialog && ocrResult && (
                            <div className="scan-result">
                                <div className="scan-result-value">
                                    <span className="scan-result-label">Herkende stand:</span>
                                    <span className="scan-result-number">{ocrResult.bestMatch}</span>
                                    <span className="scan-result-unit">km</span>
                                </div>

                                <div className="scan-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => confirmResult(ocrResult.bestMatch)}
                                    >
                                        ✓ Overnemen
                                    </button>
                                    <button
                                        className="btn"
                                        onClick={closePreview}
                                    >
                                        ✗ Annuleren
                                    </button>
                                </div>

                                {ocrResult.allMatches.length > 1 && (
                                    <div className="scan-alternatives">
                                        <span className="text-muted text-sm">Andere gevonden waarden:</span>
                                        <div className="scan-alt-chips">
                                            {ocrResult.allMatches
                                                .filter(v => v !== ocrResult.bestMatch)
                                                .slice(0, 5)
                                                .map((val, i) => (
                                                    <button
                                                        key={i}
                                                        className="scan-alt-chip"
                                                        onClick={() => confirmResult(val)}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
        .camera-btn {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
          border-radius: var(--radius-md);
          padding: 0 0.7rem;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          min-width: 44px;
        }
        .camera-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
        }
        .camera-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        .camera-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Scan overlay */
        .scan-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .scan-modal {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          max-width: 400px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .scan-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.2rem;
          border-bottom: 1px solid var(--border-color);
        }
        .scan-modal-header h3 {
          margin: 0;
          font-size: 1rem;
        }
        .scan-close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 50%;
          line-height: 1;
          transition: color 0.2s;
        }
        .scan-close-btn:hover {
          color: var(--text-color);
        }

        .scan-preview-container {
          padding: 0.8rem;
        }
        .scan-preview-img {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
          background: #000;
        }

        .scan-progress-container {
          padding: 0.8rem 1.2rem 1.2rem;
        }
        .scan-progress-bar {
          width: 100%;
          height: 6px;
          background: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        .scan-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .scan-progress-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .scan-result {
          padding: 1rem 1.2rem 1.2rem;
        }
        .scan-result-value {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .scan-result-label {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .scan-result-number {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        .scan-result-unit {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .scan-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.8rem;
        }
        .scan-actions .btn {
          flex: 1;
          text-align: center;
        }

        .scan-alternatives {
          border-top: 1px solid var(--border-color);
          padding-top: 0.8rem;
        }
        .scan-alt-chips {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-top: 0.4rem;
        }
        .scan-alt-chip {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: var(--primary-color);
          border-radius: 20px;
          padding: 0.3rem 0.8rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .scan-alt-chip:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: var(--primary-color);
        }
      `}</style>
        </>
    );
}
