const emptyConfig = Object.freeze({});

async function handleViewerConfigurationRequest({
    viewer,
    state,
    displays,
    boards
}) {

    const [accountId, displayId] = Buffer.from(viewer, "base64").toString().split("_");

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

            const boardRef = boards.doc(accountId).collection("data").doc(config.board);
            const boardSnapshot = await boardRef.get();
            config.data = boardSnapshot.exists && boardSnapshot.data();
            config.version = boardSnapshot.exists && boardSnapshot.updateTime.valueOf();

        } else {

            config.data = null;

        }

    }
    return config;

}


async function handleBoardChange({ accountId, boardId, change, boards, displays, logger }) {

    const displaysRef = displays.doc(accountId);
    const displaysSnapshot = await displaysRef.get();

    const beforeName = change.before.data()?.name;
    const afterName = change.after.data()?.name;
    if (beforeName !== afterName) {

        await boards.doc(accountId).collection("metadata").doc(boardId).set({
            id: boardId,
            name: afterName
        });

    }
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