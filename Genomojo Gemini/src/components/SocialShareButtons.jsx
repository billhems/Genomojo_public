import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, MessageCircle, Link } from 'lucide-react';
import { MessageOverlay } from './MessageOverlay';

export const SocialShareButtons = ({ shareUrl, shareMessage, imageUrl, onCopySuccess, onCopyError }) => {
    const [messageOverlay, setMessageOverlay] = useState({ isOpen: false, title: '', message: '' });
    const [isCopyingImage, setIsCopyingImage] = useState(false);

    const url = shareUrl || window.location.origin;
    const text = shareMessage || "Check out the Human Mojo Project!";

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(text + " " + url);
            if (onCopySuccess) {
                onCopySuccess();
            } else {
                setMessageOverlay({
                    isOpen: true,
                    title: 'Copied!',
                    message: "Share message copied to clipboard!"
                });
            }
        } catch (err) {
            console.error('Could not copy text: ', err);
            if (onCopyError) {
                onCopyError(err);
            } else {
                setMessageOverlay({
                    isOpen: true,
                    title: 'Copy Failed',
                    message: "Failed to copy. Please manually copy the message.",
                    buttonColor: "red"
                });
            }
        }
    };

    const copyImageToClipboard = async () => {
        if (!imageUrl) return;
        setIsCopyingImage(true);
        try {
            // Use the Promise-based ClipboardItem constructor which is better supported in Safari
            // for maintaining the user gesture context.
            const item = new ClipboardItem({
                'image/png': new Promise(async (resolve, reject) => {
                    try {
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();

                        // Convert to PNG if needed (Safari is strict about types)
                        const img = new Image();
                        const url = URL.createObjectURL(blob);

                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);

                            canvas.toBlob((pngBlob) => {
                                URL.revokeObjectURL(url);
                                if (pngBlob) {
                                    resolve(pngBlob);
                                } else {
                                    reject(new Error("Canvas to Blob failed"));
                                }
                            }, 'image/png');
                        };

                        img.onerror = (e) => {
                            URL.revokeObjectURL(url);
                            reject(e);
                        };

                        img.src = url;
                    } catch (e) {
                        reject(e);
                    }
                })
            });

            await navigator.clipboard.write([item]);

            setMessageOverlay({
                isOpen: true,
                title: 'Image Copied!',
                message: "Image copied to clipboard. You can now paste it into your message."
            });
        } catch (err) {
            console.error('Could not copy image: ', err);
            setMessageOverlay({
                isOpen: true,
                title: 'Copy Failed',
                message: "Failed to copy image. Your browser might not support this action.",
                buttonColor: "red"
            });
        } finally {
            setIsCopyingImage(false);
        }
    };

    const shareToSocial = (platform) => {
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text);
        let finalShareUrl = "";

        switch (platform) {
            case 'facebook':
                finalShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                finalShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
                break;
            case 'linkedin':
                finalShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case 'whatsapp':
                finalShareUrl = `https://api.whatsapp.com/send?text=${encodedText} ${encodedUrl}`;
                break;
            case 'threads':
                finalShareUrl = `https://www.threads.net/intent/post?text=${encodedText} ${encodedUrl}`;
                break;
            default:
                return;
        }
        window.open(finalShareUrl, '_blank');
    };

    return (
        <>
            <div className="flex justify-center flex-wrap gap-2">
                <button onClick={() => shareToSocial('facebook')} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" aria-label="Share on Facebook">
                    <Facebook size={24} />
                </button>
                <button onClick={() => shareToSocial('twitter')} className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors" aria-label="Share on Twitter">
                    <Twitter size={24} />
                </button>
                <button onClick={() => shareToSocial('linkedin')} className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors" aria-label="Share on LinkedIn">
                    <Linkedin size={24} />
                </button>
                <button onClick={() => shareToSocial('whatsapp')} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors" aria-label="Share on WhatsApp">
                    <MessageCircle size={24} />
                </button>
                <button onClick={() => shareToSocial('threads')} className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors" aria-label="Share on Threads">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12c0-3.87-3.13-7-7-7s-7 3.13-7 7 0 7 7 7 1.75 0 3.35-.5 4.7-1.4" />
                        <path d="M21.5 17.5v-5.5" />
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                    </svg>
                </button>
                <button onClick={copyToClipboard} className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors" aria-label="Copy Link">
                    <Link size={24} />
                </button>

                {imageUrl && (
                    <>
                        <button
                            onClick={copyImageToClipboard}
                            disabled={isCopyingImage}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            aria-label="Copy Image"
                            title="Copy Image to Clipboard"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = imageUrl;
                                link.download = 'genomojo-identity.jpg';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition-colors"
                            aria-label="Download Image"
                            title="Download Image"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                    </>
                )}
            </div>
            <MessageOverlay
                isOpen={messageOverlay.isOpen}
                onClose={() => setMessageOverlay({ ...messageOverlay, isOpen: false })}
                title={messageOverlay.title}
                message={messageOverlay.message}
                buttonColor={messageOverlay.buttonColor}
            />
        </>
    );
};
