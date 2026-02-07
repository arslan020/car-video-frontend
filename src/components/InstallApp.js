import { useState, useEffect } from 'react';
import { FaDownload, FaDesktop, FaMobileAlt, FaTimes } from 'react-icons/fa';

const InstallApp = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
        } else {
            // If prompt is not available, provide a simple alert as fallback
            alert("App is likely already installed or your browser is blocking the install prompt. Please check your address bar for the install icon.");
        }
    };

    if (isInstalled) return null; // Don't show if running as installed app

    return (
        <div className="bg-white rounded-xl shadow-md p-6 animate-fadeIn transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Install App</h3>
            <p className="text-sm text-gray-500 mb-4">
                Install this application on your device for a better experience.
            </p>

            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
                <FaDownload />
                Install App
            </button>
        </div>
    );
};

export default InstallApp;
