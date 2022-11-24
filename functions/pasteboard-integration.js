const emptyConfig = Object.freeze({});

async function handleViewerConfigurationRequest({
    viewer,
    state,
    displays,
    boards
}) {

    const [accountId, displayId] = viewer.split("_");
    const ref = displays.doc(accountId);
    const snapshot = await ref.get();

    // no displays configured?
    if (!snapshot.exists) return emptyConfig;

    // freshen?
    const data = snapshot.data();
    const config = (data && data[displayId]) || emptyConfig;
    if (!(config.board === state.board && config.version === state.version)) {

        // board or empty?
        if (config.board) {

            const boardRef = boards.doc(config.board || "unknown");
            const boardSnapshot = await boardRef.get();
            config.data = boardSnapshot.exists && boardSnapshot.data();
            config.v = boardSnapshot.exists && boardSnapshot.updateTime.valueOf();

        } else {

            config.data = null;

        }

    }
    return config;

}


async function handleBoardChange({ boardId, displays, logger }) {

    const [accountId] = boardId.split("_");
    const displaysRef = displays.doc(accountId);
    const displaysSnapshot = await displaysRef.get();
    if (displaysSnapshot.exists) {

        const displayPatch = {
            board: boardId,
            version: displaysSnapshot.updateTime.valueOf()
        };

        const displayIdsToUpdate = Object
            .entries(displaysSnapshot.data() || {})
            .filter(([, displayConfig]) => displayConfig.board === boardId)
            .map(([displayId]) => displayId);

        const patch = Object.fromEntries(displayIdsToUpdate.map(id => [id, displayPatch]));

        logger.debug("Updating displays for board", { boardId, patch });
        await displaysRef.set(patch, { merge: true });

    }

}


async function fetchUserMetadata({ uid, users }) {

    const usersRef = users.doc(uid);
    const usersSnapshot = await usersRef.get();
    const data = usersSnapshot.exists && usersSnapshot.data() || {};
    if (!data.entitlements) {
        data.entitlements = { boards: {}, displays: {} };
        await usersRef.set({ entitlements: data.entitlements }, { merge: true });
    }
    return data;
}

exports.handleViewerConfigurationRequest = handleViewerConfigurationRequest;
exports.handleBoardChange = handleBoardChange;
exports.fetchUserMetadata = fetchUserMetadata;