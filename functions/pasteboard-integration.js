const emptyConfig = Object.freeze({});

async function handleViewerConfigurationRequest({
    viewer,
    state,
    displays,
    boards
}) {

    const [accountId, displayId] = Buffer.from(viewer, "base64").toString().split("_");

    const ref = displays.doc(accountId).collection("data").doc(displayId);
    ref.set({ ping: Date.now() }, { merge: true });
    const snapshot = await ref.get();

    // freshen?
    const display = snapshot.data();
    if (!display) return null;

    if (JSON.stringify(state) !== JSON.stringify(display.state)) {

        ref.set({ state }, { merge: true });

    }
    if (!(display.board === state.board && display.version === state.version)) {

        if (display.board) {

            const boardRef = boards.doc(accountId).collection("data").doc(display.board);
            const boardSnapshot = await boardRef.get();
            display.data = boardSnapshot.exists && boardSnapshot.data();
            display.version = boardSnapshot.exists && boardSnapshot.updateTime.valueOf();

        } else {

            display.data = null;

        }

    }
    return display;

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

async function refreshDisplaysEntitlement({ displays, accountId, entitlements }) {
    const countSnapshot = await displays.doc(accountId).collection("data").count().get();
    const actual = countSnapshot.data()?.count || 0;
    await entitlements.doc(accountId).set({ displays: { actual } }, { merge: true });
}

exports.handleViewerConfigurationRequest = handleViewerConfigurationRequest;
exports.handleBoardChange = handleBoardChange;
exports.refreshDisplaysEntitlement = refreshDisplaysEntitlement;