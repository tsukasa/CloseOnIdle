(() => {
    const setupIdleDetection = async () => {
        console.log("Setting up...");
        setDetectionInterval();

        chrome.idle.onStateChanged.addListener(onStateChangedHandler);

        chrome.storage.onChanged.addListener(onStorageChangedHandler);

        chrome.runtime.onStartup.addListener(keepAlive);
    };

    const getInterval = async () => {
        const data = await chrome.storage.sync.get("interval");
        return Number.parseInt(data.interval) || 3600;
    };

    const setDetectionInterval = async (interval) => {
        // No value was given, try to get it from the sync storage.
        if(!interval) {
            interval = await getInterval();
        }

        // If the interval is lower than 15, that is no bueno.
        if(interval < 15) {
            interval = 15;
        }

        chrome.idle.setDetectionInterval(Number.parseInt(interval));
        console.log(`Setting max idle time to ${interval} seconds.`);
    };

    const keepAlive = () => {
        setInterval(chrome.runtime.getPlatformInfo, 20e3)
    };

    const onStorageChangedHandler = (changes, areaName) => {
        if (!areaName == "sync")
            return;

        if(!changes.interval)
            return;

        setDetectionInterval(changes.interval.newValue);
    };

    const onStateChangedHandler = (newState) => {
        console.log(`State changed to "${newState}"`);

        if (newState == "idle") {
            chrome.tabs.query({}, (tabs) => {
                for (let i = 0; i < tabs.length; i++) {
                    chrome.tabs.remove(tabs[i].id);
                }
            });
        }
    };

    console.log("Close on Idle initialzing...");
    setupIdleDetection();
    keepAlive();
})();
